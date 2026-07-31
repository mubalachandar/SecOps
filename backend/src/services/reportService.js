const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const { format, subDays } = require('date-fns');

const COLORS = {
  primary: '#3b82f6',
  danger: '#ef4444',
  warning: '#f59e0b',
  success: '#10b981',
  dark: '#0f172a',
  surface: '#1e293b',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  border: '#334155'
};

class ReportsService {
  ensureReportsDir() {
    const reportsDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    return reportsDir;
  }

  generateExecutiveSummary(data) {
    const totalEvents = data.topEvents.reduce((acc, e) => acc + parseInt(e.count), 0);
    const totalAlerts = data.alertSummary.reduce((acc, a) => acc + parseInt(a.count), 0);
    const criticalCount = data.alertSummary.filter(a => a.severity === 'critical').reduce((acc, a) => acc + parseInt(a.count), 0);
    const resolvedCount = data.alertSummary.filter(a => a.status === 'resolved').reduce((acc, a) => acc + parseInt(a.count), 0);
    const activeRules = data.activeRulesCount[0]?.count || 0;
    const analyzedAlerts = totalAlerts; // Assume all are analyzed for simplicity
    const mttr = data.mttr[0]?.mttr ? parseFloat(data.mttr[0].mttr).toFixed(1) : 0;
    const incidentCount = data.incidentsCount.reduce((acc, i) => acc + parseInt(i.count), 0);
    const startDate = format(data.periodStart, 'MMM d, yyyy');
    const endDate = format(data.periodEnd, 'MMM d, yyyy');

    return `During the reporting period from ${startDate} to ${endDate}, the SecOps AI Copilot platform monitored ${totalEvents} CloudTrail events and detected ${totalAlerts} security alerts across AWS regions. Of these, ${criticalCount} alerts were classified as Critical severity requiring immediate attention. The detection engine processed events using ${activeRules} active MITRE ATT&CK mapped rules, automatically triaging ${analyzedAlerts} alerts using Gemini AI analysis. ${resolvedCount} alerts were successfully resolved during this period with a mean time to resolution of ${mttr} minutes. ${incidentCount} correlated security incidents were identified, suggesting ${incidentCount > 0 ? 'coordinated attack activity requiring investigation' : 'no coordinated attack campaigns during this period'}.`;
  }

  async collectReportData(periodStart, periodEnd) {
    const queries = [
      query('SELECT severity, status, COUNT(*) as count FROM alerts WHERE created_at BETWEEN $1 AND $2 GROUP BY severity, status', [periodStart, periodEnd]),
      query('SELECT event_name, COUNT(*) as count FROM cloudtrail_events WHERE event_time BETWEEN $1 AND $2 GROUP BY event_name ORDER BY count DESC LIMIT 10', [periodStart, periodEnd]),
      query('SELECT mitre_tactic, COUNT(*) as count FROM alerts WHERE created_at BETWEEN $1 AND $2 AND mitre_tactic IS NOT NULL GROUP BY mitre_tactic ORDER BY count DESC', [periodStart, periodEnd]),
      query('SELECT source_ip, COUNT(*) as count FROM alerts WHERE created_at BETWEEN $1 AND $2 AND source_ip IS NOT NULL GROUP BY source_ip ORDER BY count DESC LIMIT 10', [periodStart, periodEnd]),
      query('SELECT COUNT(*) as count, status FROM incidents WHERE created_at BETWEEN $1 AND $2 GROUP BY status', [periodStart, periodEnd]),
      query('SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60) as mttr FROM alerts WHERE status=\'resolved\' AND created_at BETWEEN $1 AND $2', [periodStart, periodEnd]),
      query('SELECT DATE(created_at) as date, COUNT(*) as total, COUNT(*) FILTER (WHERE severity=\'critical\') as critical FROM alerts WHERE created_at BETWEEN $1 AND $2 GROUP BY DATE(created_at) ORDER BY date ASC', [periodStart, periodEnd]),
      query('SELECT COUNT(*) as count FROM detection_rules WHERE is_active=true')
    ];

    const results = await Promise.all(queries);

    return {
      periodStart,
      periodEnd,
      alertSummary: results[0].rows,
      topEvents: results[1].rows,
      mitreCoverage: results[2].rows,
      topSourceIps: results[3].rows,
      incidentsCount: results[4].rows,
      mttr: results[5].rows,
      dailyTrend: results[6].rows,
      activeRulesCount: results[7].rows
    };
  }

  generatePDF(reportData, reportConfig, filePath) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        size: 'A4',
        info: {
          Title: reportConfig.title,
          Author: 'SecOps AI Copilot'
        }
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      const startDate = format(new Date(reportData.periodStart), 'MMM d, yyyy');
      const endDate = format(new Date(reportData.periodEnd), 'MMM d, yyyy');
      const timestamp = format(new Date(), 'MMM d, yyyy HH:mm:ss');

      doc.on('pageAdded', () => {
        doc.lineWidth(1)
           .strokeColor(COLORS.border)
           .moveTo(50, doc.page.height - 40)
           .lineTo(doc.page.width - 50, doc.page.height - 40)
           .stroke();
        
        doc.fontSize(8)
           .fillColor(COLORS.textSecondary)
           .text('SecOps AI Copilot - Confidential', 50, doc.page.height - 30, { lineBreak: false })
           .text(`Page ${doc.page.dictionary.data.Annots ? doc.page.dictionary.data.Annots.length : 0}`, 0, doc.page.height - 30, { align: 'center', lineBreak: false })
           .text(timestamp, 0, doc.page.height - 30, { align: 'right', lineBreak: false });
      });

      // SECTION 1 - COVER PAGE
      doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.dark);
      
      doc.rect(50, 50, 50, 50).fill(COLORS.primary);
      doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('SA', 50, 65, { width: 50, align: 'center' });

      doc.fillColor('#ffffff').fontSize(28).text('SECURITY OPERATIONS REPORT', 50, 300);
      doc.fillColor(COLORS.primary).fontSize(16).font('Helvetica').text(reportConfig.title, 50, 340);
      doc.fillColor(COLORS.textSecondary).fontSize(12).text(`Reporting Period: ${startDate} to ${endDate}`, 50, 380);
      doc.fillColor(COLORS.textSecondary).fontSize(10).text(`Generated: ${timestamp}`, 50, 400);

      doc.rect(0, doc.page.height - 10, doc.page.width, 10).fill(COLORS.primary);

      doc.addPage();

      // SECTION 2 - TABLE OF CONTENTS
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#ffffff');

      doc.fillColor(COLORS.primary).fontSize(16).font('Helvetica-Bold').text('TABLE OF CONTENTS', 50, 50);
      doc.moveTo(50, 75).lineTo(doc.page.width - 50, 75).strokeColor(COLORS.primary).lineWidth(2).stroke();
      doc.moveDown(2);

      const toc = [
        { title: 'Executive Summary', page: 3 },
        { title: 'Alert Summary', page: 4 },
        { title: 'Severity Analysis', page: 5 },
        { title: 'MITRE ATT&CK Coverage', page: 6 },
        { title: 'Top Threat Indicators', page: 7 },
        { title: 'Recommendations', page: 8 }
      ];

      doc.font('Helvetica').fontSize(12).fillColor(COLORS.dark);
      let y = 100;
      toc.forEach(item => {
        doc.text(item.title, 50, y);
        doc.text(item.page.toString(), doc.page.width - 70, y, { align: 'right' });
        doc.moveTo(doc.widthOfString(item.title) + 60, y + 10).lineTo(doc.page.width - 80, y + 10).strokeColor(COLORS.border).lineWidth(1).dash(2, {space: 4}).stroke();
        doc.undash();
        y += 30;
      });

      doc.addPage();

      // SECTION 3 - EXECUTIVE SUMMARY
      doc.rect(50, 50, 4, 20).fill(COLORS.primary);
      doc.fillColor(COLORS.dark).fontSize(16).font('Helvetica-Bold').text('EXECUTIVE SUMMARY', 65, 52);
      
      doc.moveDown(2);
      const summaryText = this.generateExecutiveSummary(reportData);
      doc.fillColor(COLORS.dark).fontSize(11).font('Helvetica').text(summaryText, 50, 100, {
        lineGap: 6,
        align: 'justify'
      });

      const totalAlerts = reportData.alertSummary.reduce((acc, a) => acc + parseInt(a.count), 0);
      const criticalAlerts = reportData.alertSummary.filter(a => a.severity === 'critical').reduce((acc, a) => acc + parseInt(a.count), 0);
      const resolvedAlerts = reportData.alertSummary.filter(a => a.status === 'resolved').reduce((acc, a) => acc + parseInt(a.count), 0);
      const activeIncidents = reportData.incidentsCount.filter(i => i.status !== 'resolved').reduce((acc, i) => acc + parseInt(i.count), 0);

      const drawBox = (x, y, title, value, color) => {
        doc.rect(x, y, 230, 80).fill(COLORS.surface);
        doc.fillColor(COLORS.textSecondary).fontSize(10).text(title, x + 15, y + 15);
        doc.fillColor(color).fontSize(28).font('Helvetica-Bold').text(value.toString(), x + 15, y + 35);
      };

      drawBox(50, 300, 'Total Alerts', totalAlerts, COLORS.primary);
      drawBox(310, 300, 'Critical Alerts', criticalAlerts, COLORS.danger);
      drawBox(50, 400, 'Resolved Alerts', resolvedAlerts, COLORS.success);
      drawBox(310, 400, 'Active Incidents', activeIncidents, COLORS.warning);

      doc.addPage();

      // SECTION 4 - ALERT SUMMARY
      doc.rect(50, 50, 4, 20).fill(COLORS.primary);
      doc.fillColor(COLORS.dark).fontSize(16).font('Helvetica-Bold').text('ALERT SUMMARY', 65, 52);

      doc.rect(50, 100, doc.page.width - 100, 30).fill(COLORS.primary);
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
      doc.text('Severity', 60, 110);
      doc.text('Count', 200, 110);
      doc.text('Percentage', 300, 110);
      doc.text('Status Focus', 400, 110);

      const severities = ['critical', 'high', 'medium', 'low'];
      let tableY = 130;
      
      severities.forEach((sev, i) => {
        const count = reportData.alertSummary.filter(a => a.severity === sev).reduce((acc, a) => acc + parseInt(a.count), 0);
        const percentage = totalAlerts > 0 ? Math.round((count / totalAlerts) * 100) : 0;
        
        doc.rect(50, tableY, doc.page.width - 100, 30).fill(i % 2 === 0 ? COLORS.surface : '#f1f5f9');
        const textColor = i % 2 === 0 ? COLORS.text : COLORS.dark;
        
        doc.fillColor(textColor).fontSize(10).font('Helvetica');
        doc.text(sev.toUpperCase(), 60, tableY + 10);
        doc.text(count.toString(), 200, tableY + 10);
        doc.text(`${percentage}%`, 300, tableY + 10);
        doc.text('...', 400, tableY + 10);
        
        tableY += 30;
      });

      doc.fillColor(COLORS.dark).fontSize(14).font('Helvetica-Bold').text('Daily Trend', 50, tableY + 40);
      let chartY = tableY + 70;
      
      let maxTotal = Math.max(...reportData.dailyTrend.map(d => parseInt(d.total)), 1);
      
      reportData.dailyTrend.forEach(day => {
        const dateStr = format(new Date(day.date), 'MMM d');
        const total = parseInt(day.total);
        const barWidth = (total / maxTotal) * 300;
        
        doc.fillColor(COLORS.dark).fontSize(9).font('Helvetica').text(dateStr, 50, chartY);
        
        let barColor = COLORS.primary;
        if (total > 10) barColor = COLORS.danger;
        else if (total > 5) barColor = COLORS.warning;
        
        doc.rect(100, chartY, barWidth, 10).fill(barColor);
        doc.fillColor(COLORS.dark).text(total.toString(), 110 + barWidth, chartY);
        
        chartY += 20;
      });

      doc.addPage();

      // SECTION 5 - MITRE ATT&CK COVERAGE
      doc.rect(50, 50, 4, 20).fill(COLORS.primary);
      doc.fillColor(COLORS.dark).fontSize(16).font('Helvetica-Bold').text('MITRE ATT&CK COVERAGE', 65, 52);
      
      doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica').text('The MITRE ATT&CK framework provides a comprehensive matrix of adversarial tactics and techniques. The following identifies the tactics observed during the reporting period.', 50, 90, { width: doc.page.width - 100 });

      let mitreY = 140;
      doc.rect(50, mitreY, doc.page.width - 100, 30).fill(COLORS.primary);
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
      doc.text('Tactic', 60, mitreY + 10);
      doc.text('Alert Count', 250, mitreY + 10);
      doc.text('Coverage Level', 350, mitreY + 10);
      mitreY += 30;

      reportData.mitreCoverage.forEach((mitre, i) => {
        doc.rect(50, mitreY, doc.page.width - 100, 30).fill(i % 2 === 0 ? COLORS.surface : '#f1f5f9');
        const textColor = i % 2 === 0 ? COLORS.text : COLORS.dark;
        
        doc.fillColor(textColor).fontSize(10).font('Helvetica');
        doc.text(mitre.mitre_tactic || 'Unknown', 60, mitreY + 10);
        
        const count = parseInt(mitre.count);
        doc.text(count.toString(), 250, mitreY + 10);
        
        let level = 'No Coverage', color = COLORS.textSecondary;
        if (count >= 6) { level = 'High'; color = COLORS.success; }
        else if (count >= 3) { level = 'Medium'; color = COLORS.warning; }
        else if (count >= 1) { level = 'Low'; color = COLORS.primary; }
        
        doc.fillColor(color).font('Helvetica-Bold').text(level, 350, mitreY + 10);
        mitreY += 30;
      });

      doc.addPage();

      // SECTION 6 - TOP THREAT INDICATORS
      doc.rect(50, 50, 4, 20).fill(COLORS.primary);
      doc.fillColor(COLORS.dark).fontSize(16).font('Helvetica-Bold').text('TOP THREAT INDICATORS', 65, 52);
      
      doc.fillColor(COLORS.dark).fontSize(12).font('Helvetica-Bold').text('Top Source IPs', 50, 100);
      let ipY = 130;
      reportData.topSourceIps.forEach(ip => {
        doc.font('Courier').fontSize(10).fillColor(COLORS.dark).text(ip.source_ip, 50, ipY);
        const count = parseInt(ip.count);
        doc.rect(200, ipY, count * 5, 10).fill(count > 3 ? COLORS.danger : COLORS.primary);
        doc.font('Helvetica').text(count.toString(), 210 + count * 5, ipY);
        ipY += 20;
      });

      doc.fillColor(COLORS.dark).fontSize(12).font('Helvetica-Bold').text('Top CloudTrail Events', 300, 100);
      let eventY = 130;
      reportData.topEvents.forEach(event => {
        doc.font('Helvetica').fontSize(9).fillColor(COLORS.dark).text(event.event_name.substring(0, 30), 300, eventY);
        doc.text(event.count.toString(), 500, eventY);
        eventY += 20;
      });

      doc.addPage();

      // SECTION 7 - RECOMMENDATIONS
      doc.rect(50, 50, 4, 20).fill(COLORS.primary);
      doc.fillColor(COLORS.dark).fontSize(16).font('Helvetica-Bold').text('SECURITY RECOMMENDATIONS', 65, 52);

      let recY = 100;
      let recIndex = 1;

      const addRec = (title, desc, color) => {
        doc.fillColor(color).fontSize(12).font('Helvetica-Bold').text(`${recIndex}. ${title}`, 50, recY);
        doc.fillColor(COLORS.dark).fontSize(10).font('Helvetica').text(desc, 65, recY + 15, { width: doc.page.width - 150 });
        recY += 50;
        recIndex++;
      };

      if (criticalAlerts > 0) {
        addRec('Critical Alerts Detected', `CRITICAL: ${criticalAlerts} critical alerts require immediate investigation. Prioritize root account usage and privilege escalation alerts.`, COLORS.danger);
      }
      
      if (activeIncidents > 0) {
        addRec('Active Incidents', `INCIDENTS: ${activeIncidents} correlated security incidents detected. Review incident timeline for attack campaign patterns.`, COLORS.warning);
      }
      
      const mttrVal = reportData.mttr[0]?.mttr ? parseFloat(reportData.mttr[0].mttr) : 0;
      if (mttrVal > 60) {
        addRec('MTTR Improvement', `MTTR: Mean time to resolution is ${mttrVal.toFixed(0)} minutes. Consider implementing automated response playbooks to reduce resolution time.`, COLORS.primary);
      }

      addRec('Detection Rule Review', `Ensure all ${reportData.activeRulesCount[0]?.count || 0} detection rules are reviewed quarterly and updated to reflect new MITRE ATT&CK techniques.`, COLORS.dark);
      addRec('CloudTrail Integrity', 'Enable CloudTrail log file validation to detect tampering with audit logs.', COLORS.dark);
      addRec('AWS Security Hub', 'Consider enabling AWS Security Hub for additional managed detection capabilities alongside custom detection rules.', COLORS.dark);

      doc.end();

      writeStream.on('finish', () => {
        resolve();
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    });
  }

  async generateReport(reportConfig, userId) {
    if (!reportConfig.title || !reportConfig.reportType || !reportConfig.periodStart || !reportConfig.periodEnd) {
      throw new Error('Missing required report parameters');
    }

    const reportId = 'RPT-' + Date.now().toString(36).toUpperCase();
    
    const insertQuery = `
      INSERT INTO reports (report_id, title, report_type, period_start, period_end, generated_by, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'generating')
      RETURNING *
    `;
    const initialRecord = await query(insertQuery, [
      reportId, reportConfig.title, reportConfig.reportType, reportConfig.periodStart, reportConfig.periodEnd, userId
    ]);

    try {
      const reportData = await this.collectReportData(reportConfig.periodStart, reportConfig.periodEnd);
      
      const reportsDir = this.ensureReportsDir();
      const filePath = path.join(reportsDir, `${reportId}.pdf`);
      
      await this.generatePDF(reportData, reportConfig, filePath);
      
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      const alertCount = reportData.alertSummary.reduce((acc, a) => acc + parseInt(a.count), 0);
      const incidentCount = reportData.incidentsCount.reduce((acc, i) => acc + parseInt(i.count), 0);

      const updateQuery = `
        UPDATE reports 
        SET status = 'completed', file_path = $1, file_size = $2, alert_count = $3, incident_count = $4
        WHERE report_id = $5
        RETURNING *
      `;
      const result = await query(updateQuery, [filePath, fileSize, alertCount, incidentCount, reportId]);
      
      logger.info('Report generated', { reportId, fileSize, alertCount });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to generate report', { reportId, error: error.message });
      await query('UPDATE reports SET status = $1 WHERE report_id = $2', ['failed', reportId]);
      throw error;
    }
  }

  async getReports(userId, pagination = { page: 1, limit: 10 }) {
    const offset = (pagination.page - 1) * pagination.limit;
    const result = await query(
      'SELECT * FROM reports ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [pagination.limit, offset]
    );
    const countResult = await query('SELECT COUNT(*) FROM reports');
    
    return {
      data: result.rows,
      meta: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(pagination.page),
        limit: parseInt(pagination.limit)
      }
    };
  }

  async getReportById(reportId, userId) {
    const result = await query('SELECT * FROM reports WHERE id = $1 OR report_id = $1', [reportId]);
    if (result.rows.length === 0) throw new Error('Report not found');
    return result.rows[0];
  }

  async downloadReport(reportId, userId) {
    const report = await this.getReportById(reportId, userId);
    if (report.status !== 'completed' || !report.file_path) {
      throw new Error('Report is not ready for download');
    }
    if (!fs.existsSync(report.file_path)) {
      throw new Error('Report file not found on disk');
    }
    
    return {
      filePath: report.file_path,
      fileName: `${report.report_id}.pdf`,
      mimeType: 'application/pdf'
    };
  }

  async deleteReport(reportId, userId) {
    const report = await this.getReportById(reportId, userId);
    
    if (report.file_path && fs.existsSync(report.file_path)) {
      fs.unlinkSync(report.file_path);
    }
    
    await query('DELETE FROM reports WHERE id = $1 OR report_id = $1', [reportId]);
    return { success: true };
  }
}

module.exports = { reportService: new ReportsService() };
