import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }
    
    if (!error.response) {
      toast.error('Cannot connect to server — check your connection', { id: 'server-error', duration: 5000 })
      return Promise.reject(error)
    }
    
    switch (error.response.status) {
      case 401:
        sessionStorage.removeItem('token')
        window.location.href = '/login'
        break
      case 403:
        toast.error("You don't have permission to perform this action", { id: '403-error', duration: 5000 })
        break
      case 404:
        // Do nothing, just reject
        break
      case 429:
        toast.error("Too many requests — please slow down", { id: '429-error', duration: 5000 })
        break
      case 500:
        toast.error("Server error — please try again", { id: '500-error', duration: 5000 })
        break
    }
    
    return Promise.reject(error)
  }
)

// Analytics API calls
export const analyticsApi = {
  getDashboardStats: () =>
    api.get('/analytics/dashboard').then(r => r.data.data),
  getAlertTrend: (days = 7) =>
    api.get(`/analytics/trend?days=${days}`).then(r => r.data.data),
  getSeverityDistribution: () =>
    api.get('/analytics/severity').then(r => r.data.data),
  getSystemHealth: () =>
    api.get('/analytics/health').then(r => r.data.data),
  getTopAttackVectors: () =>
    api.get('/analytics/attack-vectors').then(r => r.data.data),
  getTopSourceIPs: (limit=10) => 
    api.get('/analytics/top-ips', { params: { limit } }).then(r => r.data.data),
  getMTTR: (days=30) => 
    api.get('/analytics/mttr', { params: { days } }).then(r => r.data.data),
  getGeographicDistribution: () => 
    api.get('/analytics/geographic').then(r => r.data.data),
  getRiskScoreTimeline: () =>
    api.get('/analytics/risk-timeline').then(r => r.data.data),
  getIncidentBurndown: () =>
    api.get('/analytics/incident-burndown').then(r => r.data.data),
}

// Alerts API calls
export const alertsApi = {
  getAlerts: (params = {}) =>
    api.get('/alerts', { params }).then(r => r.data.data),
  getAlertById: (id) =>
    api.get(`/alerts/${id}`).then(r => r.data.data),
  updateStatus: (id, status) =>
    api.put(`/alerts/${id}/status`, { status }).then(r => r.data.data),
  getAnalysis: (id) =>
    api.get(`/alerts/${id}/analysis`).then(r => r.data.data),
  triggerAnalysis: (id) =>
    api.post(`/alerts/${id}/analyze`).then(r => r.data.data),
  bulkUpdateStatus: (alertIds, status) =>
    api.put('/alerts/bulk-status', { alertIds, status }).then(r => r.data.data),
  getStats: () =>
    api.get('/alerts/stats').then(r => r.data.data),
}

// CloudTrail API calls
export const cloudtrailApi = {
  getEvents: (params = {}) =>
    api.get('/cloudtrail/events', { params }).then(r => r.data.data),
  getStats: () =>
    api.get('/cloudtrail/stats').then(r => r.data.data),
  simulateAttack: (scenario) =>
    api.post('/cloudtrail/simulate', { scenarioName: scenario }).then(r => r.data),
  getEngineStats: () =>
    api.get('/cloudtrail/engine-stats').then(r => r.data.data),
}

// Rules API calls
export const rulesApi = {
  getRules: (params = {}) =>
    api.get('/rules', { params }).then(r => r.data.data),
  getRuleById: (id) =>
    api.get(`/rules/${id}`).then(r => r.data.data),
  createRule: (data) =>
    api.post('/rules', data).then(r => r.data.data),
  updateRule: (id, data) =>
    api.put(`/rules/${id}`, data).then(r => r.data.data),
  deleteRule: (id) =>
    api.delete(`/rules/${id}`).then(r => r.data.data),
  toggleRule: (id, isActive) =>
    api.put(`/rules/${id}/toggle`, { isActive }).then(r => r.data.data),
  getStats: () =>
    api.get('/rules/stats').then(r => r.data.data),
  testRule: (data) =>
    api.post('/rules/test', data).then(r => r.data.data),
}

// Chat API calls
export const chatApi = {
  sendMessage: (message, sessionId) =>
    api.post('/chat/send', { message, sessionId }).then(r => r.data.data),
  getHistory: (sessionId) =>
    api.get('/chat/history/' + sessionId).then(r => r.data.data),
  clearSession: (sessionId) =>
    api.delete('/chat/session/' + sessionId).then(r => r.data.data),
  getSuggestedPrompts: (context) =>
    api.get('/chat/suggested-prompts', { params: { context } }).then(r => r.data.data),
}

export const mitreApi = {
  getMatrix: () => api.get('/mitre').then(r => r.data.data),
  getCoverage: () => api.get('/mitre/coverage').then(r => r.data.data),
  getTacticDetail: (tacticId) => api.get('/mitre/tactic/' + tacticId).then(r => r.data.data),
  getTechniqueDetail: (techniqueId) => api.get('/mitre/technique/' + techniqueId).then(r => r.data.data),
}

// Incidents API calls
export const incidentsApi = {
  getIncidents: (params) => api.get('/incidents', { params }).then(r => r.data.data),
  getIncidentById: (id) => api.get('/incidents/' + id).then(r => r.data.data),
  getIncidentStats: () => api.get('/incidents/stats').then(r => r.data.data),
  resolveIncident: (id) => api.put('/incidents/' + id + '/resolve').then(r => r.data.data),
  triggerCorrelation: () => api.post('/incidents/correlate').then(r => r.data.data),
}

export const reportsApi = {
  generateReport: (data) => api.post('/reports', data).then(r => r.data.data),
  getReports: (params) => api.get('/reports', { params }).then(r => r.data.data),
  downloadReport: (reportId) => api.get(`/reports/${reportId}/download`, { responseType: 'blob' }).then(r => r.data),
  deleteReport: (reportId) => api.delete(`/reports/${reportId}`).then(r => r.data.data)
}

export const notificationsApi = {
  getConfig: () => api.get('/notifications/config').then(r => r.data.data),
  updateSlackConfig: (data) => api.put('/notifications/config/slack', data).then(r => r.data.data),
  updateEmailConfig: (data) => api.put('/notifications/config/email', data).then(r => r.data.data),
  testSlack: () => api.post('/notifications/test/slack').then(r => r.data.data),
  testEmail: () => api.post('/notifications/test/email').then(r => r.data.data),
  getLogs: (params) => api.get('/notifications/logs', { params }).then(r => r.data.data),
  getStats: () => api.get('/notifications/stats').then(r => r.data.data)
};

export const geoipApi = {
  getThreatOrigins: (params) => api.get('/geoip/threat-origins', { params }).then(r => r.data.data),
  getCountryStats: (params) => api.get('/geoip/country-stats', { params }).then(r => r.data.data),
  getHeatmapData: (params) => api.get('/geoip/heatmap', { params }).then(r => r.data.data),
  getLiveThreats: () => api.get('/geoip/live').then(r => r.data.data),
  lookupIP: (ip) => api.get('/geoip/lookup/' + ip).then(r => r.data.data)
}

export const threatIntelApi = {
  searchCVE: (params) => api.get('/threat-intel/cve/search', { params }).then(r => r.data.data),
  getLatestCVEs: (params) => api.get('/threat-intel/cve/latest', { params }).then(r => r.data.data),
  getCVEStats: () => api.get('/threat-intel/cve/stats').then(r => r.data.data),
  searchByAWSService: (service) => api.get('/threat-intel/cve/aws/' + service).then(r => r.data.data),
  getCVEById: (cveId) => api.get('/threat-intel/cve/' + cveId).then(r => r.data.data),
  getEPSSScore: (cveId) => api.get('/threat-intel/cve/' + cveId + '/epss').then(r => r.data.data),
  getCompositeScore: (cveId) => api.get('/threat-intel/cve/' + cveId + '/composite').then(r => r.data.data),
  getKEVCatalog: (params) => api.get('/threat-intel/kev', { params }).then(r => r.data.data)
}

export default api
