# 🛡️ SecOps AI Copilot

> **AI-powered Security Operations Center — Real-time AWS CloudTrail threat detection, MITRE ATT&CK coverage, and Gemini AI-driven alert triage.**

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Gemini](https://img.shields.io/badge/AI-Gemini%20Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![AWS CloudTrail](https://img.shields.io/badge/AWS-CloudTrail-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/cloudtrail/)
[![License](https://img.shields.io/badge/License-MIT-22c55e)](./LICENSE)
[![Build](https://img.shields.io/badge/CI%2FCD-Active-22c55e?logo=github-actions&logoColor=white)](./.github/workflows)
[![Coverage](https://img.shields.io/badge/Coverage-70%25-22c55e?logo=jest&logoColor=white)](./backend/src/tests)

---

## Architecture

```
                          ┌─────────────────────────────────────────────────────────────┐
                          │                   SECOPS AI COPILOT                          │
                          │                                                               │
  ┌──────────┐  HTTPS     │  ┌────────────┐     ┌──────────────────────────────────┐    │
  │          │ ─────────► │  │   Nginx    │────►│     React Frontend (Vite 5)      │    │
  │ Browser  │            │  │ Rev. Proxy │     │  TailwindCSS · Recharts · Zustand│    │
  │          │ ◄──────────│  └────────────┘     └──────────────────────────────────┘    │
  │          │  WebSocket │                                                               │
  │    ↕     │ ══════════►│  ┌──────────────────────────────────────────────────────┐   │
  │  (real-  │            │  │             Node.js Backend API (Express)             │   │
  │  time    │            │  │                                                        │   │
  │  alerts) │            │  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │   │
  └──────────┘            │  │  │  Detection   │  │  Correlation │  │  Gemini AI  │ │   │
                          │  │  │  Engine      │  │  Engine      │  │  Service    │ │   │
                          │  │  │ 10 MITRE     │  │ 6 Rules      │  │ Risk Scoring│ │   │
                          │  │  │ ATT&CK Rules │  │ Incident     │  │ IOC Extract │ │   │
                          │  │  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │   │
                          │  │         │                  │                 │         │   │
                          │  │  ┌──────▼──────────────────▼─────────────────▼──────┐ │   │
                          │  │  │  PostgreSQL 15 (persistent storage)               │ │   │
                          │  │  │  Redis 7 (caching · rate-limit store · locks)     │ │   │
                          │  │  └───────────────────────────────────────────────────┘ │   │
                          │  │                                                        │   │
                          │  │  ┌────────────────────────────────────────────────┐   │   │
                          │  │  │  External Integrations                          │   │   │
                          │  │  │  AWS CloudTrail S3 · NVD CVE · EPSS · CISA KEV │   │   │
                          │  │  │  SendGrid (email) · Slack Webhooks              │   │   │
                          │  │  └────────────────────────────────────────────────┘   │   │
                          │  └──────────────────────────────────────────────────────┘   │
                          └─────────────────────────────────────────────────────────────┘
```

---

## Key Features (Technical Depth)

| Feature | Implementation Detail |
|---|---|
| **Custom CloudTrail Detection Engine** | 10 MITRE ATT&CK-mapped detection rules with 5 pattern types: `exact_match`, `contains`, `in_list`, `regex`, `json_path`, and `composite`. Built intentionally instead of AWS GuardDuty to demonstrate detection engineering depth. |
| **Gemini AI Triage** | Automated risk scoring (0–100), attack chain analysis, IOC extraction, and remediation recommendations using `gemini-flash-latest`. Dual-key architecture separates background analysis from interactive chat to prevent rate limit conflicts. Request queue with exponential backoff and dynamic throttling (10s delay). |
| **Alert Correlation Engine** | Automatic incident grouping using 6 correlation rules: same source IP, privilege escalation chain, defense evasion precursor, data exfiltration pattern, credential-to-lateral-movement, same resource targeted. |
| **Real-time WebSocket Feed** | Live alert streaming to all connected clients via JWT-authenticated WebSocket connections with 30-second heartbeat, dead connection pruning, and automatic client reconnection with exponential backoff. |
| **MITRE ATT&CK Matrix** | Interactive 14-tactic coverage heatmap with real-time threat distribution across the Enterprise ATT&CK framework (v14). |
| **Geo IP Threat Map** | Geographic visualization of attack origins using `geoip-lite` — zero external API dependencies, fully offline-capable. |
| **CVE Intelligence** | NVD + EPSS + CISA KEV integration with composite risk scoring: `CVSS(40%) + EPSS(40%) + KEV bonus(20%)`. All free public APIs. |
| **PDF Report Generation** | Server-side PDF generation using PDFKit with executive summary, severity breakdown, MITRE coverage table, and AI-generated recommendations. Path traversal protection on download. |
| **Production Architecture** | Docker Compose with health checks, graceful SIGTERM shutdown, Redis caching (TTL-aware), connection pool tuning, Redis-backed distributed rate limiting, and structured Winston logging. |

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend** | React | 18 | UI framework |
| **Frontend** | Vite | 5 | Build tool with code splitting |
| **Frontend** | TailwindCSS | 3 | Utility-first styling |
| **Frontend** | Recharts | 2 | Chart visualizations |
| **Frontend** | TanStack Query | 5 | Server state management |
| **Frontend** | Zustand | 4 | Client state (auth, theme) |
| **Frontend** | React Simple Maps | 3 | Geographic threat map |
| **Backend** | Node.js | 20 LTS | Runtime |
| **Backend** | Express | 4 | HTTP framework |
| **Backend** | Winston | 3 | Structured logging |
| **Backend** | Helmet.js | 7 | Security headers (CSP, HSTS, X-Frame) |
| **Database** | PostgreSQL | 15 | Primary data store |
| **Cache** | Redis | 7 | Caching, rate limiting, distributed locks |
| **AI** | Google Gemini Flash | — | Alert triage, chat, threat summaries |
| **Auth** | JWT (HS256) + bcrypt | — | Authentication & password security |
| **Deployment** | Docker + Nginx | — | Container orchestration + reverse proxy |
| **Cloud** | AWS CloudTrail + S3 | — | Real log ingestion |
| **Notifications** | SendGrid + Slack | — | Alerting integrations |
| **Security** | express-validator, zod | — | Input validation |

---

## Quick Start

### Prerequisites

- **Docker** and **Docker Compose** (v2) — *This is the ONLY requirement to run the project!*
- **Node.js 20+** (only needed if you want to develop locally without Docker)
- **AWS account** with CloudTrail enabled *(optional — defaults to simulation mode)*
- **Gemini API key** — free tier available at [Google AI Studio](https://aistudio.google.com/)

### 🚀 Instant Start (Pre-built Docker Hub Images)

The absolute fastest way to run this project is to use the pre-built images from Docker Hub. You don't even need to clone the repository!

**1. Download the Docker Hub compose file and env template**
```bash
curl -O https://raw.githubusercontent.com/mubalachandar/SecOps/main/docker-compose.hub.yml
curl -o .env https://raw.githubusercontent.com/mubalachandar/SecOps/main/.env.example
```

**2. Add your Gemini API Key**
Open `.env` and add your `GEMINI_API_KEY` and `GEMINI_CHAT_API_KEY`.

**3. Start the platform**
```bash
docker compose -f docker-compose.hub.yml up -d
```

That's it! The dashboard will be available at `http://localhost:5173`.

---

### 💻 Developer Start (Build from Source)

**1. Clone the repository**
```bash
git clone https://github.com/mubalachandar/SecOps.git
cd SecOps
```

**2. Configure environment**
```bash
cp .env.example backend/.env
```

Edit `backend/.env` — required variables are marked below.

**3. Start all services**
```bash
docker compose up -d
```

**4. Wait for health check**
```bash
curl http://localhost:5000/health
# Expected: { "status": "ok", ... }
```

**5. Seed the database**
```bash
docker compose exec backend node src/database/seed.js
```

**6. Open the dashboard**
```
http://localhost:5173
```

**Default Login:**
- **Email**: `admin@secops.local`
- **Password**: `Admin@123456`

---

## Environment Variables Reference

### Database
| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string | `postgresql://postgres:pass@postgres:5432/secops` |
| `DATABASE_POOL_MAX` | No | Max DB connections (use 5 for t2.micro) | `10` |

### Cache
| Variable | Required | Description | Example |
|---|---|---|---|
| `REDIS_URL` | ✅ Yes | Redis connection string | `redis://redis:6379` |

### AI / ML
| Variable | Required | Description | Example |
|---|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Primary Gemini key (background analysis) | `AIza...` |
| `GEMINI_CHAT_API_KEY` | No | Separate key for interactive chat (prevents rate limit conflicts) | `AIza...` |
| `GEMINI_MODEL` | No | Model name | `gemini-1.5-flash` |

### Authentication
| Variable | Required | Description | Example |
|---|---|---|---|
| `JWT_SECRET` | ✅ Yes | JWT signing secret (min 32 chars) | `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | No | Token lifetime | `24h` |

### AWS CloudTrail
| Variable | Required | Description | Example |
|---|---|---|---|
| `AWS_REGION` | No | AWS region | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | No | AWS access key (read-only S3 recommended) | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | No | AWS secret | `...` |
| `CLOUDTRAIL_LOG_BUCKET` | No | S3 bucket for CloudTrail logs | `my-cloudtrail-bucket` |
| `CLOUDTRAIL_LOG_PREFIX` | No | Prefix path inside the bucket | `AWSLogs/123456/CloudTrail/` |

### Notifications
| Variable | Required | Description | Example |
|---|---|---|---|
| `SLACK_WEBHOOK_URL` | No | Slack incoming webhook URL | `https://hooks.slack.com/...` |
| `SENDGRID_API_KEY` | No | SendGrid API key for email alerts | `SG.xxx` |
| `SENDGRID_FROM_EMAIL` | No | Sender email address | `secops@company.com` |
| `NOTIFICATION_EMAIL_RECIPIENTS` | No | Comma-separated recipient emails | `analyst@co.com` |
| `NOTIFY_ON_CRITICAL` | No | Send notification on critical alerts | `true` |
| `NOTIFY_ON_HIGH` | No | Send notification on high alerts | `true` |

### Application
| Variable | Required | Description | Example |
|---|---|---|---|
| `NODE_ENV` | ✅ Yes | Execution environment | `production` |
| `PORT` | ✅ Yes | API server port | `5000` |
| `FRONTEND_URL` | ✅ Yes | Allowed CORS origin (comma-separated for multi) | `https://secops.company.com` |
| `LOG_LEVEL` | No | Winston log level | `info` |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window in ms | `900000` |
| `RATE_LIMIT_MAX` | No | Max requests per window | `100` |
| `AUTH_RATE_LIMIT_MAX` | No | Max auth attempts per window | `10` |

---

## API Documentation

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | No | Register new user |
| POST | `/api/v1/auth/login` | No | Login → JWT token |
| POST | `/api/v1/auth/logout` | ✅ | Logout (audit log) |
| GET | `/api/v1/auth/me` | ✅ | Get current user |
| POST | `/api/v1/auth/refresh` | ✅ | Refresh JWT token |
| PUT | `/api/v1/auth/password` | ✅ | Change password |
| PUT | `/api/v1/auth/profile` | ✅ | Update profile |

### Alerts
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/alerts` | ✅ | List alerts (filterable, paginated) |
| GET | `/api/v1/alerts/stats` | ✅ | Alert statistics |
| GET | `/api/v1/alerts/:id` | ✅ | Get alert by ID |
| PUT | `/api/v1/alerts/:id/status` | ✅ | Update alert status |
| GET | `/api/v1/alerts/:id/analysis` | ✅ | Get AI analysis |
| POST | `/api/v1/alerts/:id/analyze` | ✅ | Trigger Gemini AI analysis |
| PUT | `/api/v1/alerts/bulk-status` | ✅ | Bulk status update |

### Analytics
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/analytics/dashboard` | ✅ | Dashboard KPI stats (cached 60s) |
| GET | `/api/v1/analytics/trend` | ✅ | Alert trend over days (cached 5m) |
| GET | `/api/v1/analytics/severity` | ✅ | Severity distribution (cached 2m) |
| GET | `/api/v1/analytics/attack-vectors` | ✅ | Top MITRE tactics (cached 5m) |
| GET | `/api/v1/analytics/top-ips` | ✅ | Top source IPs |
| GET | `/api/v1/analytics/geographic` | ✅ | Regional distribution |
| GET | `/api/v1/analytics/mttr` | ✅ | Mean time to resolution |
| GET | `/api/v1/analytics/risk-timeline` | ✅ | AI risk score over 14 days |
| GET | `/api/v1/analytics/incident-burndown` | ✅ | Created vs resolved over 14 days |
| GET | `/api/v1/analytics/health` | ✅ | System health check |

### Incidents
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/incidents` | ✅ | List correlated incidents |
| GET | `/api/v1/incidents/stats` | ✅ | Incident statistics |
| GET | `/api/v1/incidents/:id` | ✅ | Get incident detail |
| PUT | `/api/v1/incidents/:id/resolve` | ✅ | Resolve incident |
| POST | `/api/v1/incidents/correlate` | ✅ | Trigger correlation run |

### Detection Rules
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/rules` | ✅ | List detection rules |
| GET | `/api/v1/rules/stats` | ✅ | Rule statistics |
| GET | `/api/v1/rules/:id` | ✅ | Get rule detail |
| POST | `/api/v1/rules` | ✅ Admin | Create new rule |
| PUT | `/api/v1/rules/:id` | ✅ Admin | Update rule |
| DELETE | `/api/v1/rules/:id` | ✅ Admin | Delete rule |
| PUT | `/api/v1/rules/:id/toggle` | ✅ Admin | Enable/disable rule |
| POST | `/api/v1/rules/test` | ✅ | Test rule against sample event |

### CloudTrail
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/cloudtrail/events` | ✅ | List CloudTrail events |
| GET | `/api/v1/cloudtrail/stats` | ✅ | Event statistics |
| GET | `/api/v1/cloudtrail/engine-stats` | ✅ | Detection engine stats |
| POST | `/api/v1/cloudtrail/simulate` | ✅ | Simulate attack scenario |

### MITRE ATT&CK
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/mitre` | ✅ | Full MITRE matrix |
| GET | `/api/v1/mitre/coverage` | ✅ | Coverage heatmap data |
| GET | `/api/v1/mitre/tactic/:id` | ✅ | Tactic detail |
| GET | `/api/v1/mitre/technique/:id` | ✅ | Technique detail + AI explanation |

### Threat Intelligence
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/threat-intel/cve/search` | ✅ | Search CVEs |
| GET | `/api/v1/threat-intel/cve/latest` | ✅ | Latest CVEs |
| GET | `/api/v1/threat-intel/cve/stats` | ✅ | CVE statistics |
| GET | `/api/v1/threat-intel/cve/:id` | ✅ | CVE detail |
| GET | `/api/v1/threat-intel/cve/:id/epss` | ✅ | EPSS score |
| GET | `/api/v1/threat-intel/cve/:id/composite` | ✅ | Composite risk score |
| GET | `/api/v1/threat-intel/kev` | ✅ | CISA KEV catalog |

### GeoIP
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/geoip/threat-origins` | ✅ | Attack origin countries |
| GET | `/api/v1/geoip/country-stats` | ✅ | Country statistics |
| GET | `/api/v1/geoip/heatmap` | ✅ | Heatmap data |
| GET | `/api/v1/geoip/live` | ✅ | Live threat feed |
| GET | `/api/v1/geoip/lookup/:ip` | ✅ | Single IP lookup |

### Reports
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/reports` | ✅ | List generated reports |
| POST | `/api/v1/reports` | ✅ | Generate PDF report |
| GET | `/api/v1/reports/:id/download` | ✅ | Download PDF (path-traversal protected) |
| DELETE | `/api/v1/reports/:id` | ✅ | Delete report |

### Notifications
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/notifications/config` | ✅ | Get notification config |
| PUT | `/api/v1/notifications/config/slack` | ✅ | Update Slack config |
| PUT | `/api/v1/notifications/config/email` | ✅ | Update email config |
| POST | `/api/v1/notifications/test/slack` | ✅ | Send Slack test message |
| POST | `/api/v1/notifications/test/email` | ✅ | Send email test |
| GET | `/api/v1/notifications/logs` | ✅ | Notification delivery logs |

### Chat (AI SOC Assistant)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/chat/send` | ✅ | Send message to AI |
| GET | `/api/v1/chat/history/:sessionId` | ✅ | Get conversation history |
| DELETE | `/api/v1/chat/session/:sessionId` | ✅ | Clear session |
| GET | `/api/v1/chat/suggested-prompts` | ✅ | Get context-aware prompt suggestions |

---

## MITRE ATT&CK Coverage

| # | Rule Name | Tactic | Technique | Severity | Description |
|---|---|---|---|---|---|
| 1 | Root Account Login | Initial Access (TA0001) | T1078.004 | Critical | AWS root account console login detected |
| 2 | Brute Force Login | Credential Access (TA0006) | T1110 | High | Multiple failed console login attempts within time window |
| 3 | CloudTrail Disabled | Defense Evasion (TA0005) | T1562.008 | Critical | CloudTrail logging stopped — attacker covering tracks |
| 4 | IAM Privilege Escalation | Privilege Escalation (TA0004) | T1098.003 | High | AttachUserPolicy / PutUserPolicy detected |
| 5 | S3 Public Exposure | Exfiltration (TA0010) | T1537 | High | S3 bucket made public — potential data staging |
| 6 | Lambda Backdoor | Persistence (TA0003) | T1525 | High | Lambda function created/updated — code injection risk |
| 7 | Security Group Modified | Defense Evasion (TA0005) | T1562 | Medium | Inbound rules modified — firewall bypass attempt |
| 8 | Data Exfiltration Pattern | Exfiltration (TA0010) | T1530 | High | Large S3 GetObject volume — bulk data download |
| 9 | Suspicious API Activity | Execution (TA0002) | T1651 | Medium | Unusual API call patterns — discovery or lateral movement |
| 10 | Unauthorized Region Access | Initial Access (TA0001) | T1078 | Medium | API calls from unexpected or blacklisted AWS regions |

---

## Detection Engine Architecture

The custom detection engine evaluates each CloudTrail event against all active rules using five pattern types:

```javascript
// Pattern Type 1: Exact match on a field value
{ "field": "eventName", "type": "exact_match", "value": "ConsoleLogin" }

// Pattern Type 2: Contains substring
{ "field": "userIdentity.type", "type": "contains", "value": "Root" }

// Pattern Type 3: Membership in a list
{ "field": "eventName", "type": "in_list", "values": ["AttachUserPolicy", "PutUserPolicy", "CreateAccessKey"] }

// Pattern Type 4: Regular expression match
{ "field": "sourceIPAddress", "type": "regex", "pattern": "^(?!10\\.|172\\.(1[6-9]|2\\d|3[01])\\.|192\\.168\\.).*" }

// Pattern Type 5: JSONPath into nested request parameters
{ "field": "requestParameters.bucketPolicy", "type": "json_path", "path": "Statement[*].Effect", "value": "Allow" }

// Pattern Type 6: Composite — ALL sub-patterns must match
{
  "type": "composite",
  "operator": "AND",
  "patterns": [
    { "field": "eventName", "type": "exact_match", "value": "GetObject" },
    { "field": "requestParameters.key", "type": "contains", "value": "sensitive" }
  ]
}
```

Rules are stored in PostgreSQL and hot-reloaded — no deployment required to add or modify detection logic.

---

## Project Structure

```
secops-ai-copilot/
├── backend/
│   ├── src/
│   │   ├── app.js                  # Express app entry point, graceful shutdown
│   │   ├── config/
│   │   │   ├── database.js         # PostgreSQL pool with tuned timeouts
│   │   │   └── redis.js            # ioredis client with fallback
│   │   ├── controllers/            # Thin request/response handlers (13 files)
│   │   ├── middleware/
│   │   │   ├── auth.js             # JWT verify + Redis user cache
│   │   │   ├── errorHandler.js     # Unified error → HTTP response mapping
│   │   │   ├── rateLimiter.js      # Redis-backed distributed rate limiting
│   │   │   └── requestLogger.js    # Structured HTTP access logging
│   │   ├── routes/                 # Express router mounts (14 files)
│   │   ├── services/
│   │   │   ├── alertService.js     # Alert CRUD + status machine
│   │   │   ├── analyticsService.js # Dashboard metrics with Redis TTL cache
│   │   │   ├── authService.js      # JWT generation, bcrypt, audit logging
│   │   │   ├── chatService.js      # Gemini chat sessions with LRU eviction
│   │   │   ├── cloudtrailService.js# S3 ingestion + simulation mode
│   │   │   ├── correlationEngine.js# 6-rule alert → incident grouping
│   │   │   ├── detectionEngine.js  # Pattern matching against CloudTrail events
│   │   │   ├── geminiService.js    # AI analysis with request queue + retry
│   │   │   ├── geoipService.js     # Offline IP geolocation
│   │   │   ├── notificationService.js # Slack + SendGrid delivery
│   │   │   ├── reportService.js    # PDFKit report generation
│   │   │   ├── rulesService.js     # Detection rule CRUD
│   │   │   ├── threatIntelService.js # NVD + EPSS + CISA KEV APIs
│   │   │   └── websocketService.js # JWT-authed WS with heartbeat
│   │   ├── jobs/
│   │   │   └── cloudtrailPoller.js # Cron-based polling with Redis lock
│   │   ├── database/
│   │   │   └── seed.js             # Database seeder with demo data
│   │   └── utils/
│   │       ├── logger.js           # Winston logger (JSON in prod, pretty in dev)
│   │       ├── validateEnv.js      # Startup env var validation
│   │       └── validators.js       # Zod schemas, password strength
│   ├── reports/                    # Generated PDFs (excluded from git)
│   ├── .env.example                # Complete env template
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 # Routes + QueryClient + ErrorBoundary wrapping
│   │   ├── components/
│   │   │   ├── ErrorBoundary.jsx   # Class component with reset + Sentry hook point
│   │   │   ├── Sidebar.jsx
│   │   │   ├── TopBar.jsx
│   │   │   └── ...                 # 16 component sub-directories
│   │   ├── pages/                  # 13 page components
│   │   ├── services/
│   │   │   └── api.js              # Axios instance with 401/429/500 interceptors
│   │   ├── store/                  # Zustand stores (auth, theme)
│   │   └── hooks/                  # Custom React hooks
│   ├── vite.config.js              # Code splitting (vendor/charts/query/maps/ui)
│   └── Dockerfile
├── docker-compose.yml              # Full stack with healthchecks + mem limits
├── nginx.conf                      # Reverse proxy + WebSocket upgrade
└── README.md
```

---



## Security Considerations

### Implemented Controls

| Control | Implementation |
|---|---|
| Authentication | JWT HS256 with explicit algorithm pinning, 32-char minimum secret, issuer/audience validation |
| Password Security | bcrypt cost factor 12 (~300ms hash time), strength validation via Zod (8-128 chars, uppercase + number + special) |
| Authorization | RBAC with roles: `admin`, `analyst`, `viewer` — enforced at route level |
| SQL Injection | 100% parameterized queries using `$1 $2` placeholders — zero string concatenation in SQL |
| XSS Prevention | Helmet.js strict CSP — `script-src 'self'`, no eval, no inline scripts |
| Clickjacking | `X-Frame-Options: DENY` + `frame-ancestors 'self'` in CSP |
| CSRF | Stateless JWT + `Content-Type: application/json` requirement |
| Rate Limiting | Separate limiters for auth (10/15min) and general API (100/15min) with Redis store in production |
| CORS | Strict origin allowlist from `FRONTEND_URL` — rejects wildcard |
| Path Traversal | Report downloads validate resolved path is strictly inside `backend/reports/` |
| Sensitive Data | Stack traces hidden in production; `process.env` values never exposed in API responses |
| Transport Security | HSTS max-age 31536000 with includeSubDomains |

### What Would Be Added for True Enterprise Production

> This section demonstrates production maturity and realistic understanding of the gap between portfolio projects and enterprise SOC2-compliant deployments.

- **Multi-Factor Authentication** — TOTP (Google Authenticator) or WebAuthn/FIDO2 hardware keys
- **SAML/OAuth2 SSO** — Active Directory / Okta / Google Workspace federation
- **Secret Rotation** — AWS Secrets Manager or HashiCorp Vault for automatic key rotation
- **WAF** — AWS WAF or Cloudflare for L7 DDoS and injection protection before hitting the API
- **Immutable Audit Log** — Append-only database or AWS CloudWatch Logs for SOC2 compliance
- **mTLS** — Mutual TLS for service-to-service communication in microservices
- **Pod Security Standards** — Non-root containers, read-only filesystems, Kubernetes network policies
- **SIEM Integration** — Forward alerts to Splunk/Elastic/Sentinel via Syslog or Webhook

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for branch naming, commit conventions, and PR guidelines.

---

## License

This project is licensed under the [MIT License](./LICENSE).

---

## Acknowledgments

- [MITRE ATT&CK Framework](https://attack.mitre.org/) — Adversarial tactics and techniques taxonomy
- [NIST NVD](https://nvd.nist.gov/) — National Vulnerability Database
- [FIRST EPSS](https://www.first.org/epss/) — Exploit Prediction Scoring System
- [CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) — Known Exploited Vulnerabilities Catalog
- [Google Gemini](https://ai.google.dev/) — Generative AI for SOC triage
