const geoip = require('geoip-lite');
const { query } = require('../config/database');
const logger = require('../utils/logger');
const { getJSON, setJSON } = require('../config/redis');

class GeoIPService {
  constructor() {
    this.PRIVATE_IP_RANGES = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/
    ];
  }

  isPrivateIP(ip) {
    if (!ip) return false;
    if (ip === 'AWS Internal' || ip.includes('amazonaws')) return true;
    return this.PRIVATE_IP_RANGES.some(regex => regex.test(ip));
  }

  async lookupIP(ip) {
    if (this.isPrivateIP(ip)) {
      return {
        ip,
        country: 'Internal',
        countryCode: 'IN',
        city: 'AWS Network',
        region: 'Internal',
        lat: 0,
        lon: 0,
        isPrivate: true
      };
    }

    const cacheKey = `geoip:${ip}`;
    const cached = await getJSON(cacheKey);
    if (cached) return cached;

    const geo = geoip.lookup(ip);
    
    if (!geo) {
      const notFound = {
        ip,
        country: 'Unknown',
        countryCode: 'XX',
        city: 'Unknown',
        region: 'Unknown',
        lat: 0,
        lon: 0,
        isPrivate: false,
        notFound: true
      };
      await setJSON(cacheKey, notFound, 86400); // cache for 24h
      return notFound;
    }

    const result = {
      ip,
      country: geo.country, // usually geo.country is a code, but we'll stick to it and use the code in countryCode
      countryCode: geo.country,
      city: geo.city,
      region: geo.region,
      lat: geo.ll ? geo.ll[0] : 0,
      lon: geo.ll ? geo.ll[1] : 0,
      timezone: geo.timezone,
      isPrivate: false
    };

    await setJSON(cacheKey, result, 86400);
    return result;
  }

  async enrichAlertsWithGeoIP(alerts) {
    if (!alerts || alerts.length === 0) return [];
    
    return Promise.all(
      alerts.map(async (alert) => {
        if (alert.source_ip) {
          const geoipData = await this.lookupIP(alert.source_ip);
          return { ...alert, geoip: geoipData };
        }
        return alert;
      })
    );
  }

  async getThreatOrigins(startDate, endDate, limit = 100) {
    const cacheKey = `geoip:threat_origins:${startDate}:${endDate}`;
    const cached = await getJSON(cacheKey);
    if (cached) return cached;

    const sql = `
      SELECT 
        source_ip, 
        COUNT(*) as alert_count, 
        MAX(severity) as max_severity, 
        array_agg(DISTINCT mitre_tactic) as tactics 
      FROM alerts 
      WHERE source_ip IS NOT NULL 
        AND created_at BETWEEN $1 AND $2 
      GROUP BY source_ip 
      ORDER BY alert_count DESC 
      LIMIT $3
    `;

    const result = await query(sql, [startDate, endDate, limit]);
    
    const enrichedResults = [];
    
    for (const row of result.rows) {
      const geoipData = await this.lookupIP(row.source_ip);
      
      if (!geoipData.isPrivate && !geoipData.notFound) {
        const flagged = parseInt(row.alert_count, 10) >= 3 || row.max_severity === 'critical';
        enrichedResults.push({
          ...row,
          alert_count: parseInt(row.alert_count, 10),
          geoip: geoipData,
          flagged
        });
      }
    }

    await setJSON(cacheKey, enrichedResults, 300); // 5 mins cache
    return enrichedResults;
  }

  async getCountryStats(startDate, endDate) {
    const origins = await this.getThreatOrigins(startDate, endDate, 1000);
    
    const countryMap = {};
    
    origins.forEach(origin => {
      const c = origin.geoip.countryCode;
      if (!countryMap[c]) {
        countryMap[c] = {
          countryCode: c,
          totalAlerts: 0,
          uniqueIPs: 0,
          maxSeverity: 'low',
          tactics: new Set()
        };
      }
      
      const stat = countryMap[c];
      stat.totalAlerts += origin.alert_count;
      stat.uniqueIPs += 1;
      
      // Update max severity
      const severities = ['low', 'medium', 'high', 'critical'];
      const currentIdx = severities.indexOf(stat.maxSeverity);
      const newIdx = severities.indexOf(origin.max_severity);
      if (newIdx > currentIdx) {
        stat.maxSeverity = origin.max_severity;
      }
      
      if (origin.tactics && Array.isArray(origin.tactics)) {
        origin.tactics.forEach(t => {
          if (t) stat.tactics.add(t);
        });
      }
    });

    const countryStats = Object.values(countryMap).map(stat => ({
      ...stat,
      tactics: Array.from(stat.tactics)
    }));

    countryStats.sort((a, b) => b.totalAlerts - a.totalAlerts);
    return countryStats.slice(0, 20);
  }

  async getHeatmapData(startDate, endDate) {
    const origins = await this.getThreatOrigins(startDate, endDate, 500);
    
    return origins
      .filter(o => o.geoip.lat !== 0 || o.geoip.lon !== 0)
      .map(o => ({
        lat: o.geoip.lat,
        lon: o.geoip.lon,
        intensity: Math.min(o.alert_count / 10, 1),
        ip: o.source_ip,
        alertCount: o.alert_count,
        severity: o.max_severity
      }));
  }

  async getLiveThreats() {
    // past 2 hours
    const sql = `
      SELECT * FROM alerts 
      WHERE source_ip IS NOT NULL 
        AND created_at >= NOW() - INTERVAL '2 hours' 
      ORDER BY created_at DESC 
      LIMIT 20
    `;
    
    const result = await query(sql);
    
    const enriched = await this.enrichAlertsWithGeoIP(result.rows);
    return enriched;
  }
}

module.exports = new GeoIPService();
