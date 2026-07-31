const ws = require('ws');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map();
  }

  initializeWebSocket(server) {
    this.wss = new ws.Server({ server, path: '/ws' });

    this.wss.on('connection', (socket, req) => {
      const url = new URL(req.url, 'http://localhost');
      const token = url.searchParams.get('token');

      if (!token) {
        socket.close(4001, 'Unauthorized');
        return;
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
          algorithms: ['HS256'],
          issuer: 'secops-ai-copilot',
          audience: 'secops-ai-copilot-api'
        });
        const userId = decoded.userId;  // matches the field set in authService
        if (!userId) {
          socket.close(4001, 'Unauthorized');
          return;
        }

        if (!this.clients.has(userId)) {
          this.clients.set(userId, new Set());
        }
        
        const userConnections = this.clients.get(userId);
        userConnections.add(socket);

        logger.info('WebSocket client connected', { 
          userId, 
          totalClients: this.getTotalClients() 
        });

        socket.send(JSON.stringify({ 
          type: 'CONNECTED', 
          payload: { 
            message: 'Real-time connection established', 
            timestamp: new Date().toISOString() 
          } 
        }));

        socket.on('message', (message) => {
          try {
            const data = JSON.parse(message);
            if (data.type === 'PING') {
              socket.send(JSON.stringify({ 
                type: 'PONG', 
                timestamp: new Date().toISOString() 
              }));
            }
          } catch (err) {
            logger.warn('Invalid WebSocket message received', { error: err.message });
          }
        });

        socket.on('close', () => {
          if (this.clients.has(userId)) {
            const connections = this.clients.get(userId);
            connections.delete(socket);
            if (connections.size === 0) {
              this.clients.delete(userId);
            }
          }
          logger.info('WebSocket client disconnected', { 
            userId, 
            totalClients: this.getTotalClients() 
          });
        });

        socket.on('error', (error) => {
          logger.error('WebSocket connection error', { error: error.message, userId });
          if (this.clients.has(userId)) {
            const connections = this.clients.get(userId);
            connections.delete(socket);
          }
        });

      } catch (err) {
        logger.error('WebSocket authentication failed', { error: err.message });
        socket.close(4001, 'Unauthorized');
      }
    });

    // Heartbeat: ping all clients every 30s, remove dead ones
    this.heartbeatInterval = setInterval(() => this._runHeartbeat(), 30000);
  }

  broadcastToUser(userId, event) {
    if (!this.clients.has(userId)) return false;
    
    const connections = this.clients.get(userId);
    if (connections.size === 0) return false;
    
    const message = JSON.stringify(event);
    let sent = false;
    
    for (const socket of connections) {
      if (socket.readyState === ws.OPEN) {
        socket.send(message);
        sent = true;
      } else {
        connections.delete(socket);
      }
    }
    
    return sent;
  }

  broadcastToAll(event) {
    const message = JSON.stringify(event);
    let recipientCount = 0;
    
    for (const [userId, connections] of this.clients.entries()) {
      for (const socket of connections) {
        if (socket.readyState === ws.OPEN) {
          socket.send(message);
          recipientCount++;
        } else {
          connections.delete(socket);
        }
      }
      if (connections.size === 0) {
        this.clients.delete(userId);
      }
    }
    
    if (recipientCount > 0) {
      logger.info('Broadcasted event to clients', { type: event.type, recipientCount });
    }
  }

  broadcastNewAlert(alert) {
    const event = { 
      type: 'NEW_ALERT', 
      payload: { 
        alert, 
        timestamp: new Date().toISOString() 
      } 
    };
    
    this.broadcastToAll(event);
    logger.info('Broadcasting new alert', { alertId: alert.id, severity: alert.severity });
  }

  broadcastAlertUpdate(alert) {
    const event = { 
      type: 'ALERT_UPDATED', 
      payload: { 
        alert, 
        timestamp: new Date().toISOString() 
      } 
    };
    this.broadcastToAll(event);
  }

  broadcastEngineStats(stats) {
    const event = { 
      type: 'ENGINE_STATS', 
      payload: { 
        stats, 
        timestamp: new Date().toISOString() 
      } 
    };
    this.broadcastToAll(event);
  }

  _runHeartbeat() {
    for (const [userId, connections] of this.clients.entries()) {
      for (const socket of connections) {
        if (socket.readyState === ws.OPEN) {
          try {
            socket.ping();
          } catch (_) {
            connections.delete(socket);
          }
        } else {
          connections.delete(socket);
        }
      }
      if (connections.size === 0) {
        this.clients.delete(userId);
      }
    }
  }

  destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.wss) {
      this.wss.close();
    }
  }

  getTotalClients() {
    let total = 0;
    for (const connections of this.clients.values()) {
      total += connections.size;
    }
    return total;
  }

  getConnectedUsers() {
    return Array.from(this.clients.keys());
  }

  isUserConnected(userId) {
    return this.clients.has(userId) && this.clients.get(userId).size > 0;
  }
}

module.exports = { websocketService: new WebSocketService() };
