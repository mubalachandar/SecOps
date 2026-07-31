# System Architecture

## Overview
SecOps AI Copilot is a modular, event-driven security platform designed to automatically ingest, evaluate, and triage AWS CloudTrail logs. It combines a high-performance Node.js detection engine with Gemini 1.5 Pro LLM capabilities to deliver actionable intelligence. The architecture prioritizes horizontal scalability, statelessness, and strict separation of concerns.

---

## System Components

### Frontend SPA (React + Vite)
A Single Page Application built with React 18 and Tailwind CSS. It communicates securely with the backend over HTTPS using Axios interceptors to attach JWTs. State management is handled via `zustand`, minimizing re-renders and abstracting complex logic away from UI components.

### Backend API (Node.js + Express)
The core orchestration layer. It exposes RESTful endpoints, handles RBAC authentication, limits request rates using Redis, and routes requests to corresponding micro-services (Authentication, Alerts, CloudTrail, Rules, Analytics).

### Detection Engine
A custom in-memory JSON pattern matcher. It loads rules from the database into Redis cache to eliminate database I/O during event processing. It supports nested JSON path traversal, regex execution, and threshold-based sliding windows for alert generation.

### AI Analysis (Gemini 1.5 Pro)
An asynchronous worker service that fetches the raw CloudTrail event JSON, contextualizes it against MITRE ATT&CK definitions, and sends a specialized prompt to the Google Gemini API to generate risk scores and tactical remediations.

### Database (PostgreSQL - Docker)
A containerized PostgreSQL instance ensuring ACID compliance for user accounts, detection rules, and alert states. Raw JSON events are stored using PostgreSQL's `JSONB` data type, allowing for complex indexing and retrieval without enforcing rigid schemas.

### Cache (Redis - Docker)
A containerized Redis cluster used for rate limiting (via `express-rate-limit`), caching the active detection rule set (TTL based), and managing JWT blocklists upon user logout.

### CloudTrail Integration
A scheduled Node-Cron job that polls an AWS S3 bucket for newly delivered CloudTrail `.json.gz` logs, decompresses them in memory, and pipes the raw objects directly into the Detection Engine.

---

## Data Flow

1. **Ingestion**: The CloudTrail Poller downloads a compressed log file from S3.
2. **Decompression**: The log is extracted and split into individual JSON event objects.
3. **Normalization**: Events are standardized to extract `eventName`, `sourceIPAddress`, `userIdentity`, and timestamp.
4. **Evaluation**: The Detection Engine loops over all active, cached rules and applies the JSON pattern matching.
5. **Alert Creation**: If an event matches a rule (and bypasses the threshold window), an Alert record is created in PostgreSQL.
6. **AI Dispatch**: The system emits an asynchronous event to the AI service.
7. **AI Analysis**: Gemini evaluates the event, and the response is parsed and stored in the `alert_analysis` table.
8. **UI Update**: Analysts refresh the dashboard or view the alert list to see the triaged incident.

---

## Detection Engine Deep Dive

The core engine relies on a robust schema definition for evaluating patterns.

* **`exact_match`**: Strictly compares strings.
  * *Example*: `{"type": "exact_match", "field": "eventName", "value": "ConsoleLogin"}`
* **`contains`**: Checks if a substring exists within a field.
  * *Example*: `{"type": "contains", "field": "userAgent", "value": "Kali Linux"}`
* **`in_list`**: Validates if a field matches any item in an array.
  * *Example*: `{"type": "in_list", "field": "awsRegion", "values": ["us-east-1", "eu-west-1"]}`
* **`regex`**: Executes a regular expression against the field value.
  * *Example*: `{"type": "regex", "field": "sourceIPAddress", "value": "^10\\."}`
* **`json_path`**: Traverses nested JSON objects.
  * *Example*: `{"type": "json_path", "path": "userIdentity.type", "value": "Root"}`
* **`composite`**: Combines multiple rules with AND/OR logic.
  * *Example*: `{"type": "composite", "operator": "AND", "patterns": [...]}`

---

## Database Schema

```text
+-------------------+      +-------------------+      +-------------------+
|       users       |      | detection_rules   |      | cloudtrail_events |
+-------------------+      +-------------------+      +-------------------+
| id (UUID) PK      |      | id (UUID) PK      |      | id (UUID) PK      |
| email (VARCHAR)   |      | name (VARCHAR)    |      | event_id (VARCHAR)|
| password_hash     |      | description (TEXT)|      | event_name (VAR)  |
| full_name (VAR)   |      | severity (ENUM)   |      | event_time (TS)   |
| role (ENUM)       |      | event_patterns    |      | raw_event (JSONB) |
| is_active (BOOL)  |      | mitre_tactic      |      | alert_id (UUID) FK|
+-------------------+      | is_active (BOOL)  |      +-------------------+
                           +-------------------+               |
                                                               |
+-------------------+      +-------------------+               |
|      alerts       | <----+ alert_analysis    | <-------------+
+-------------------+      +-------------------+
| id (UUID) PK      |      | id (UUID) PK      |
| alert_id (VAR)    |      | alert_id (UUID) FK|
| severity (ENUM)   |      | risk_score (INT)  |
| status (ENUM)     |      | summary (TEXT)    |
| title (VARCHAR)   |      | technical_details |
| raw_event (JSONB) |      | remediation_steps |
+-------------------+      +-------------------+

+-------------------+      +-------------------+
|   engine_stats    |      |    audit_logs     |
+-------------------+      +-------------------+
| id (UUID) PK      |      | id (UUID) PK      |
| metric_name (VAR) |      | user_id (UUID) FK |
| metric_value (INT)|      | action (VARCHAR)  |
| timestamp (TS)    |      | details (JSONB)   |
+-------------------+      +-------------------+
```

---

## Security Architecture

1. **Authentication**: JWT tokens signed with a 256-bit secret, stored in local storage, passed via `Authorization: Bearer` headers. Passwords hashed using bcrypt (12 rounds).
2. **Authorization (RBAC)**: 
   - `admin`: Full access (simulate attacks, modify rules).
   - `analyst`: Read/write alerts, trigger AI, view rules.
   - `viewer`: Read-only access to dashboards.
3. **Rate Limiting**: IP-based rate limiting via Redis. Authentication routes are strictly limited to 10 attempts per 15 minutes to prevent brute-force attacks.
4. **Security Headers**: Helmet.js applied enforcing `X-Frame-Options: DENY`, strict `Content-Security-Policy`, and removing `X-Powered-By`.

---

## Scalability Considerations

- **Stateless Backend**: The Node.js application maintains no local state. It can scale horizontally behind an Application Load Balancer.
- **Database Connection Pooling**: Built-in Pg pool prevents connection exhaustion during high-volume CloudTrail ingestion.
- **Queue-Based AI Processing**: (Future enhancement) Moving the `_triggerAnalysis` call from an asynchronous `setImmediate` loop to an SQS or BullMQ queue to prevent memory spikes if thousands of alerts are generated simultaneously.

---

## Technology Decision Records (TDRs)

1. **Why Custom Detection Engine over AWS GuardDuty?**
   - *Reason*: GuardDuty is a black-box machine learning system that lacks transparency. Our engine provides deterministic, instantly configurable rules mapped directly to MITRE, giving SOC teams complete control over false positives.
2. **Why Local Docker for PostgreSQL and Redis?**
   - *Reason*: Running databases locally via Docker Compose avoids the need for external cloud accounts for local development, reducing friction, latency, and potential costs while standardizing the stack.
