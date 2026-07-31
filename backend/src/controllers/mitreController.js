const { query } = require('../config/database');
const { success } = require('../utils/response');

const MITRE_FRAMEWORK = [
  {
    id: 'TA0001',
    name: 'Initial Access',
    techniques: [
      { id: 'T1190', name: 'Exploit Public-Facing Application' },
      { id: 'T1133', name: 'External Remote Services' },
      { id: 'T1078', name: 'Valid Accounts' },
      { id: 'T1566', name: 'Phishing' },
      { id: 'T1195', name: 'Supply Chain Compromise' },
      { id: 'T1189', name: 'Drive-by Compromise' },
    ]
  },
  {
    id: 'TA0002',
    name: 'Execution',
    techniques: [
      { id: 'T1059', name: 'Command and Scripting Interpreter' },
      { id: 'T1203', name: 'Exploitation for Client Execution' },
      { id: 'T1072', name: 'Software Deployment Tools' },
      { id: 'T1569', name: 'System Services' },
      { id: 'T1204', name: 'User Execution' },
    ]
  },
  {
    id: 'TA0003',
    name: 'Persistence',
    techniques: [
      { id: 'T1136', name: 'Create Account' },
      { id: 'T1078', name: 'Valid Accounts' },
      { id: 'T1543', name: 'Create or Modify System Process' },
      { id: 'T1053', name: 'Scheduled Task/Job' },
      { id: 'T1546', name: 'Event Triggered Execution' },
      { id: 'T1505', name: 'Server Software Component' },
    ]
  },
  {
    id: 'TA0004',
    name: 'Privilege Escalation',
    techniques: [
      { id: 'T1078', name: 'Valid Accounts' },
      { id: 'T1068', name: 'Exploitation for Privilege Escalation' },
      { id: 'T1055', name: 'Process Injection' },
      { id: 'T1134', name: 'Access Token Manipulation' },
      { id: 'T1548', name: 'Abuse Elevation Control Mechanism' },
    ]
  },
  {
    id: 'TA0005',
    name: 'Defense Evasion',
    techniques: [
      { id: 'T1562', name: 'Impair Defenses' },
      { id: 'T1070', name: 'Indicator Removal' },
      { id: 'T1036', name: 'Masquerading' },
      { id: 'T1078', name: 'Valid Accounts' },
      { id: 'T1027', name: 'Obfuscated Files or Information' },
      { id: 'T1553', name: 'Subvert Trust Controls' },
    ]
  },
  {
    id: 'TA0006',
    name: 'Credential Access',
    techniques: [
      { id: 'T1110', name: 'Brute Force' },
      { id: 'T1555', name: 'Credentials from Password Stores' },
      { id: 'T1552', name: 'Unsecured Credentials' },
      { id: 'T1558', name: 'Steal or Forge Kerberos Tickets' },
      { id: 'T1003', name: 'OS Credential Dumping' },
    ]
  },
  {
    id: 'TA0007',
    name: 'Discovery',
    techniques: [
      { id: 'T1087', name: 'Account Discovery' },
      { id: 'T1082', name: 'System Information Discovery' },
      { id: 'T1083', name: 'File and Directory Discovery' },
      { id: 'T1046', name: 'Network Service Discovery' },
      { id: 'T1135', name: 'Network Share Discovery' },
    ]
  },
  {
    id: 'TA0008',
    name: 'Lateral Movement',
    techniques: [
      { id: 'T1021', name: 'Remote Services' },
      { id: 'T1550', name: 'Use Alternate Authentication Material' },
      { id: 'T1080', name: 'Taint Shared Content' },
      { id: 'T1534', name: 'Internal Spearphishing' },
      { id: 'T1570', name: 'Lateral Tool Transfer' },
    ]
  },
  {
    id: 'TA0009',
    name: 'Collection',
    techniques: [
      { id: 'T1530', name: 'Data from Cloud Storage' },
      { id: 'T1213', name: 'Data from Information Repositories' },
      { id: 'T1005', name: 'Data from Local System' },
      { id: 'T1074', name: 'Data Staged' },
      { id: 'T1114', name: 'Email Collection' },
    ]
  },
  {
    id: 'TA0010',
    name: 'Exfiltration',
    techniques: [
      { id: 'T1537', name: 'Transfer Data to Cloud Account' },
      { id: 'T1048', name: 'Exfiltration Over Alternative Protocol' },
      { id: 'T1041', name: 'Exfiltration Over C2 Channel' },
      { id: 'T1567', name: 'Exfiltration Over Web Service' },
    ]
  },
  {
    id: 'TA0011',
    name: 'Command and Control',
    techniques: [
      { id: 'T1071', name: 'Application Layer Protocol' },
      { id: 'T1090', name: 'Proxy' },
      { id: 'T1095', name: 'Non-Application Layer Protocol' },
      { id: 'T1572', name: 'Protocol Tunneling' },
      { id: 'T1573', name: 'Encrypted Channel' },
    ]
  },
  {
    id: 'TA0040',
    name: 'Impact',
    techniques: [
      { id: 'T1485', name: 'Data Destruction' },
      { id: 'T1486', name: 'Data Encrypted for Impact' },
      { id: 'T1490', name: 'Inhibit System Recovery' },
      { id: 'T1498', name: 'Network Denial of Service' },
      { id: 'T1489', name: 'Service Stop' },
    ]
  },
  {
    id: 'TA0042',
    name: 'Resource Development',
    techniques: [
      { id: 'T1583', name: 'Acquire Infrastructure' },
      { id: 'T1586', name: 'Compromise Accounts' },
      { id: 'T1584', name: 'Compromise Infrastructure' },
      { id: 'T1588', name: 'Obtain Capabilities' },
    ]
  },
  {
    id: 'TA0043',
    name: 'Reconnaissance',
    techniques: [
      { id: 'T1595', name: 'Active Scanning' },
      { id: 'T1592', name: 'Gather Victim Host Information' },
      { id: 'T1589', name: 'Gather Victim Identity Information' },
      { id: 'T1590', name: 'Gather Victim Network Information' },
    ]
  }
];

const severityWeight = {
  'info': 1,
  'low': 2,
  'medium': 3,
  'high': 4,
  'critical': 5
};

async function getMitreMatrix(req, res, next) {
  try {
    const alertResult = await query(`
      SELECT 
        mitre_tactic, 
        mitre_technique, 
        severity, 
        COUNT(*)::int as alert_count,
        MAX(timestamp) as last_seen
      FROM alerts 
      WHERE mitre_tactic IS NOT NULL AND mitre_technique IS NOT NULL
      GROUP BY mitre_tactic, mitre_technique, severity
    `);

    // Build coverage map
    const coverageMap = {};
    alertResult.rows.forEach(row => {
      const key = `${row.mitre_tactic}:${row.mitre_technique}`;
      if (!coverageMap[key]) {
        coverageMap[key] = { 
          alertCount: 0, 
          maxSeverity: 'info', 
          severities: [],
          lastSeen: row.last_seen
        };
      }
      
      coverageMap[key].alertCount += row.alert_count;
      coverageMap[key].severities.push({
        severity: row.severity,
        count: row.alert_count
      });
      
      if (new Date(row.last_seen) > new Date(coverageMap[key].lastSeen)) {
         coverageMap[key].lastSeen = row.last_seen;
      }

      if (severityWeight[row.severity] > severityWeight[coverageMap[key].maxSeverity]) {
        coverageMap[key].maxSeverity = row.severity;
      }
    });

    const now = new Date();
    let totalTechniques = 0;
    let coveredCount = 0;
    const tacticSummary = [];

    const enrichedFramework = MITRE_FRAMEWORK.map(tactic => {
      let tacticAlertCount = 0;
      let tacticMaxSeverity = 'info';
      let tacticCoveredTechniques = 0;

      const enrichedTechniques = tactic.techniques.map(technique => {
        totalTechniques++;
        const key = `${tactic.id}:${technique.id}`;
        const coverage = coverageMap[key] || { alertCount: 0, maxSeverity: null };
        
        let isActive = false;
        if (coverage.alertCount > 0) {
          coveredCount++;
          tacticAlertCount += coverage.alertCount;
          tacticCoveredTechniques++;
          
          if (severityWeight[coverage.maxSeverity] > severityWeight[tacticMaxSeverity]) {
            tacticMaxSeverity = coverage.maxSeverity;
          }
          
          // Check if critical within last 1 hour for "Active Threat" status
          if (coverage.maxSeverity === 'critical' && coverage.lastSeen) {
             const lastSeenDate = new Date(coverage.lastSeen);
             const hoursDiff = (now - lastSeenDate) / (1000 * 60 * 60);
             if (hoursDiff <= 1) {
                isActive = true;
             }
          }
        }

        return {
          ...technique,
          alertCount: coverage.alertCount,
          maxSeverity: coverage.maxSeverity,
          severities: coverage.severities || [],
          isActive
        };
      });

      tacticSummary.push({
        tacticId: tactic.id,
        tacticName: tactic.name,
        techniqueCount: tactic.techniques.length,
        coveredTechniques: tacticCoveredTechniques,
        alertCount: tacticAlertCount,
        maxSeverity: tacticAlertCount > 0 ? tacticMaxSeverity : null
      });

      return {
        ...tactic,
        alertCount: tacticAlertCount,
        maxSeverity: tacticAlertCount > 0 ? tacticMaxSeverity : null,
        techniques: enrichedTechniques
      };
    });

    const totalCoverage = totalTechniques > 0 ? Math.round((coveredCount / totalTechniques) * 100) : 0;

    return success(res, {
      framework: enrichedFramework,
      totalCoverage,
      tacticSummary
    }, 'MITRE ATT&CK Matrix retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

async function getMitreTacticDetail(req, res, next) {
  try {
    const { tacticId } = req.params;
    const tactic = MITRE_FRAMEWORK.find(t => t.id === tacticId);
    
    if (!tactic) {
      const error = new Error('Tactic not found');
      error.statusCode = 404;
      throw error;
    }

    const alertResult = await query(`
      SELECT * FROM alerts 
      WHERE mitre_tactic = $1 
      ORDER BY created_at DESC 
      LIMIT 20
    `, [tacticId]);

    return success(res, {
      tactic,
      recentAlerts: alertResult.rows
    }, 'MITRE Tactic details retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

async function getMitreTechniqueDetail(req, res, next) {
  try {
    const { techniqueId } = req.params;
    
    // Some basic validation
    if (!/^T\d{4}(\.\d{3})?$/.test(techniqueId)) {
      const error = new Error('Invalid technique ID format');
      error.statusCode = 400;
      throw error;
    }

    const alertResult = await query(`
      SELECT * FROM alerts 
      WHERE mitre_technique = $1 
      ORDER BY created_at DESC 
      LIMIT 10
    `, [techniqueId]);
    
    const countResult = await query(`
      SELECT COUNT(*)::int as alert_count, severity 
      FROM alerts 
      WHERE mitre_technique = $1 
      GROUP BY severity
    `, [techniqueId]);

    const severityBreakdown = {};
    let totalAlerts = 0;
    countResult.rows.forEach(row => {
      severityBreakdown[row.severity] = row.alert_count;
      totalAlerts += row.alert_count;
    });

    return success(res, {
      techniqueId,
      alertCount: totalAlerts,
      severityBreakdown,
      recentAlerts: alertResult.rows
    }, 'MITRE Technique details retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

async function getMitreCoverage(req, res, next) {
  try {
    // Basic mock res for internal call
    let payload = null;
    const reqRes = {
      status: () => reqRes,
      json: (data) => { payload = data; return data; }
    };
    
    try {
      await getMitreMatrix(req, reqRes, (err) => { throw err; });
    } catch(err) {
       throw err;
    }
    
    const { framework, totalCoverage, tacticSummary } = payload.data;
    
    let totalTechniques = 0;
    let coveredTechniques = 0;
    const uncoveredTactics = [];
    
    tacticSummary.forEach(t => {
      totalTechniques += t.techniqueCount;
      coveredTechniques += t.coveredTechniques;
      if (t.coveredTechniques === 0) {
        uncoveredTactics.push(t);
      }
    });

    return success(res, {
      totalTechniques,
      coveredTechniques,
      coveragePercentage: totalCoverage,
      byTactic: tacticSummary,
      uncoveredTactics
    }, 'MITRE Coverage stats retrieved successfully');
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getMitreMatrix,
  getMitreTacticDetail,
  getMitreTechniqueDetail,
  getMitreCoverage
};
