const axios = require('axios');
const logger = require('../utils/logger');
const { getJSON, setJSON } = require('../config/redis');
const { query } = require('../config/database');

const NVD_API_BASE = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
const EPSS_API_BASE = 'https://api.first.org/data/v1/epss';
const KEV_API_URL = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';

class ThreatIntelService {
  async searchCVE(keyword, options = {}) {
    const resultsPerPage = options.resultsPerPage || 10;
    const startIndex = options.startIndex || 0;
    const severity = options.severity;
    
    const cacheKey = `cve:search:${keyword}:${JSON.stringify(options)}`;
    const cached = await getJSON(cacheKey);
    if (cached) return cached;

    try {
      let url = `${NVD_API_BASE}?keywordSearch=${encodeURIComponent(keyword)}&resultsPerPage=${resultsPerPage}&startIndex=${startIndex}`;
      if (severity) url += `&cvssV3Severity=${severity}`;
      
      const response = await axios.get(url, { timeout: 15000 });
      const { totalResults, vulnerabilities } = response.data;
      
      const results = (vulnerabilities || []).map(v => {
        const cve = v.cve;
        let cvssV3Score = null, cvssV3Severity = null, cvssV3Vector = null;
        let cvssV2Score = null;
        
        if (cve.metrics) {
          const v3 = cve.metrics.cvssMetricV31?.[0] || cve.metrics.cvssMetricV30?.[0];
          if (v3) {
            cvssV3Score = v3.cvssData.baseScore;
            cvssV3Severity = v3.cvssData.baseSeverity;
            cvssV3Vector = v3.cvssData.vectorString;
          }
          const v2 = cve.metrics.cvssMetricV2?.[0];
          if (v2) cvssV2Score = v2.cvssData.baseScore;
        }

        const descObj = cve.descriptions?.find(d => d.lang === 'en');
        const description = descObj ? descObj.value : 'No description available';
        
        return {
          cveId: cve.id,
          description,
          publishedDate: cve.published,
          lastModifiedDate: cve.lastModified,
          cvssV3Score,
          cvssV3Severity,
          cvssV3Vector,
          cvssV2Score,
          references: cve.references || [],
          cpeList: cve.configurations || [],
          weaknesses: cve.weaknesses || []
        };
      });

      const data = { 
        total: totalResults, 
        results, 
        page: Math.floor(startIndex / resultsPerPage) + 1 
      };
      
      await setJSON(cacheKey, data, 3600);
      return data;
    } catch (error) {
      logger.error('NVD API search failed', { error: error.message, keyword });
      throw error;
    }
  }

  async getCVEById(cveId) {
    if (!/^CVE-\d{4}-\d{4,}$/i.test(cveId)) throw new Error('Invalid CVE ID format');
    
    const cacheKey = `cve:${cveId}`;
    const cached = await getJSON(cacheKey);
    if (cached) return cached;
    
    try {
      const url = `${NVD_API_BASE}?cveId=${cveId}`;
      const response = await axios.get(url, { timeout: 15000 });
      
      if (!response.data.vulnerabilities || response.data.vulnerabilities.length === 0) {
        throw new Error(`CVE not found: ${cveId}`);
      }
      
      const cve = response.data.vulnerabilities[0].cve;
      
      let cvssV3Score = null, cvssV3Severity = null, cvssV3Vector = null, cvssV3Metrics = null;
      let cvssV2Score = null;
      
      if (cve.metrics) {
        const v3 = cve.metrics.cvssMetricV31?.[0] || cve.metrics.cvssMetricV30?.[0];
        if (v3) {
          cvssV3Score = v3.cvssData.baseScore;
          cvssV3Severity = v3.cvssData.baseSeverity;
          cvssV3Vector = v3.cvssData.vectorString;
          cvssV3Metrics = v3.cvssData;
        }
        const v2 = cve.metrics.cvssMetricV2?.[0];
        if (v2) cvssV2Score = v2.cvssData.baseScore;
      }

      const descObj = cve.descriptions?.find(d => d.lang === 'en');
      const description = descObj ? descObj.value : 'No description available';
      
      const cveData = {
        cveId: cve.id,
        description,
        publishedDate: cve.published,
        lastModifiedDate: cve.lastModified,
        cvssV3Score,
        cvssV3Severity,
        cvssV3Vector,
        cvssV3Metrics,
        cvssV2Score,
        references: cve.references || [],
        cpeList: cve.configurations || [],
        weaknesses: cve.weaknesses || []
      };

      const epssData = await this.getEPSSScore(cveId);
      const kevStatus = await this.isInKEV(cveId);
      
      const enriched = {
        ...cveData,
        epssScore: epssData ? epssData.epss : null,
        epssPercentile: epssData ? epssData.percentile : null,
        isInKEV: kevStatus.inKEV,
        kevData: kevStatus.kevData
      };
      
      await setJSON(cacheKey, enriched, 3600);
      return enriched;
    } catch (error) {
      logger.error('NVD API get CVE failed', { error: error.message, cveId });
      throw error;
    }
  }

  async getEPSSScore(cveIds) {
    const isArray = Array.isArray(cveIds);
    const queryIds = isArray ? cveIds.join(',') : cveIds;
    const cacheKey = `epss:${queryIds}`;
    const cached = await getJSON(cacheKey);
    if (cached) return cached;
    
    try {
      const url = `${EPSS_API_BASE}?cve=${queryIds}`;
      const response = await axios.get(url, { timeout: 15000 });
      
      if (!response.data.data || response.data.data.length === 0) return null;
      
      const mapItem = (item) => ({
        cve: item.cve,
        epss: parseFloat(item.epss),
        percentile: parseFloat(item.percentile),
        date: item.date
      });
      
      const result = isArray ? response.data.data.map(mapItem) : mapItem(response.data.data[0]);
      await setJSON(cacheKey, result, 86400);
      return result;
    } catch (error) {
      logger.error('EPSS API failed', { error: error.message, cveIds: queryIds });
      return null;
    }
  }

  async getKEVCatalog(options = {}) {
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    const search = options.search || '';
    
    const cacheKey = `kev:catalog:${JSON.stringify(options)}`;
    const cached = await getJSON(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(KEV_API_URL, { timeout: 15000 });
      const catalog = response.data;
      
      let filtered = catalog.vulnerabilities;
      if (search) {
        const lowerSearch = search.toLowerCase();
        filtered = filtered.filter(v => 
          v.cveID.toLowerCase().includes(lowerSearch) ||
          v.vendorProject.toLowerCase().includes(lowerSearch) ||
          v.product.toLowerCase().includes(lowerSearch) ||
          v.vulnerabilityName.toLowerCase().includes(lowerSearch)
        );
      }
      
      const paginated = filtered.slice(offset, offset + limit);
      const data = {
        total: filtered.length,
        catalogVersion: catalog.catalogVersion,
        dateReleased: catalog.dateReleased,
        vulnerabilities: paginated
      };
      
      await setJSON(cacheKey, data, 3600);
      return data;
    } catch (error) {
      logger.error('CISA KEV API failed', { error: error.message });
      throw error;
    }
  }

  async isInKEV(cveId) {
    try {
      const data = await this.getKEVCatalog({ limit: 100000 });
      const lowerCve = cveId.toLowerCase();
      const kevData = data.vulnerabilities.find(v => v.cveID.toLowerCase() === lowerCve);
      return { inKEV: !!kevData, kevData: kevData || null };
    } catch (error) {
      return { inKEV: false, kevData: null };
    }
  }

  async getLatestCVEs(options = {}) {
    const severity = options.severity;
    const daysBack = options.daysBack || 7;
    
    const cacheKey = `cve:latest:${JSON.stringify(options)}`;
    const cached = await getJSON(cacheKey);
    if (cached) return cached;
    
    try {
      const pubEndDate = new Date();
      const pubStartDate = new Date(pubEndDate.getTime() - (daysBack * 24 * 60 * 60 * 1000));
      
      let url = `${NVD_API_BASE}?pubStartDate=${pubStartDate.toISOString()}&pubEndDate=${pubEndDate.toISOString()}&resultsPerPage=20`;
      if (severity) url += `&cvssV3Severity=${severity}`;
      
      const response = await axios.get(url, { timeout: 15000 });
      const vulnerabilities = response.data.vulnerabilities || [];
      
      let results = vulnerabilities.map(v => {
        const cve = v.cve;
        let cvssV3Score = null, cvssV3Severity = null, cvssV3Vector = null;
        if (cve.metrics) {
          const v3 = cve.metrics.cvssMetricV31?.[0] || cve.metrics.cvssMetricV30?.[0];
          if (v3) {
            cvssV3Score = v3.cvssData.baseScore;
            cvssV3Severity = v3.cvssData.baseSeverity;
            cvssV3Vector = v3.cvssData.vectorString;
          }
        }
        const descObj = cve.descriptions?.find(d => d.lang === 'en');
        return {
          cveId: cve.id,
          description: descObj ? descObj.value : 'No description available',
          publishedDate: cve.published,
          lastModifiedDate: cve.lastModified,
          cvssV3Score,
          cvssV3Severity,
          cvssV3Vector,
          references: cve.references || []
        };
      });

      if (results.length > 0) {
        const cveIds = results.map(r => r.cveId);
        const epssScores = await this.getEPSSScore(cveIds);
        if (epssScores) {
          const epssMap = Array.isArray(epssScores) ? epssScores.reduce((acc, curr) => {
            acc[curr.cve] = curr;
            return acc;
          }, {}) : { [epssScores.cve]: epssScores };
          
          results = results.map(r => {
            const epssData = epssMap[r.cveId];
            return {
              ...r,
              epssScore: epssData ? epssData.epss : null,
              epssPercentile: epssData ? epssData.percentile : null
            };
          });
        }
      }
      
      results.sort((a, b) => (b.cvssV3Score || 0) - (a.cvssV3Score || 0));
      
      await setJSON(cacheKey, results, 1800);
      return results;
    } catch (error) {
      logger.error('NVD API latest CVEs failed', { error: error.message });
      throw error;
    }
  }

  async getCVEStats() {
    const cacheKey = 'cve:stats';
    const cached = await getJSON(cacheKey);
    if (cached) return cached;
    
    try {
      const pubEndDate = new Date();
      const pubStartDate = new Date(pubEndDate.getTime() - (7 * 24 * 60 * 60 * 1000));
      const dateParams = `pubStartDate=${pubStartDate.toISOString()}&pubEndDate=${pubEndDate.toISOString()}`;
      
      const [criticalRes, highRes, kevRes] = await Promise.all([
        axios.get(`${NVD_API_BASE}?${dateParams}&cvssV3Severity=CRITICAL&resultsPerPage=1`, { timeout: 15000 }).catch(() => ({ data: { totalResults: 0 } })),
        axios.get(`${NVD_API_BASE}?${dateParams}&cvssV3Severity=HIGH&resultsPerPage=1`, { timeout: 15000 }).catch(() => ({ data: { totalResults: 0 } })),
        this.getKEVCatalog({ limit: 1 })
      ]);
      
      const stats = {
        criticalLast7Days: criticalRes.data.totalResults,
        highLast7Days: highRes.data.totalResults,
        kevTotal: kevRes.total || 0,
        kevLatestDate: kevRes.dateReleased,
        lastUpdated: new Date().toISOString()
      };
      
      await setJSON(cacheKey, stats, 3600);
      return stats;
    } catch (error) {
      logger.error('CVE Stats failed', { error: error.message });
      throw error;
    }
  }

  async searchByAWSService(serviceName) {
    const map = {
      s3: 'AWS S3 Amazon',
      iam: 'AWS IAM Identity',
      ec2: 'Amazon EC2',
      cloudtrail: 'AWS CloudTrail',
      lambda: 'AWS Lambda',
      rds: 'Amazon RDS'
    };
    const term = map[serviceName.toLowerCase()] || serviceName;
    return this.searchCVE(term, { resultsPerPage: 20 });
  }

  async getCompositeScore(cveId) {
    try {
      const cveData = await this.getCVEById(cveId);
      const cvssScore = cveData.cvssV3Score || cveData.cvssV2Score || 0;
      const epssScore = cveData.epssScore || 0;
      const isInKEV = cveData.isInKEV;
      
      let compositeScore = (cvssScore * 10 * 0.4) + (epssScore * 100 * 0.4) + (isInKEV ? 20 : 0);
      compositeScore = Math.min(Math.round(compositeScore), 100);
      
      let riskLevel = 'LOW';
      if (compositeScore > 75) riskLevel = 'CRITICAL';
      else if (compositeScore > 50) riskLevel = 'HIGH';
      else if (compositeScore > 25) riskLevel = 'MEDIUM';
      
      return {
        cveId,
        cvssScore,
        epssScore,
        epssPercentile: cveData.epssPercentile,
        isInKEV,
        compositeScore,
        riskLevel
      };
    } catch (error) {
      logger.error('Composite score calculation failed', { error: error.message, cveId });
      throw error;
    }
  }
}

module.exports = { threatIntelService: new ThreatIntelService() };
