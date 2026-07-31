# API Reference

## Introduction
Base URL: `/api/v1`

**Authentication**
Most endpoints require a JWT token passed in the `Authorization` header:
```http
Authorization: Bearer <your_jwt_token>
```

---

## Authentication (`/auth`)

### 1. Register User
* **Method & Path**: `POST /api/v1/auth/register`
* **Description**: Register a new user account.
* **Auth Required**: No
* **Roles**: N/A
* **Request Body**:
  * `email` (string, required)
  * `password` (string, required, min 8 chars)
  * `fullName` (string, required)
* **Example Request**:
  ```bash
  curl -X POST http://localhost:5000/api/v1/auth/register -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"Password123!","fullName":"John Doe"}'
  ```
* **Example Success**: `{"success":true,"user":{"id":"...","email":"test@test.com"}}`
* **Error Codes**: 400 (Invalid input), 409 (Email exists)

### 2. Login
* **Method & Path**: `POST /api/v1/auth/login`
* **Description**: Authenticate and receive token.
* **Auth Required**: No
* **Request Body**:
  * `email` (string, required)
  * `password` (string, required)
* **Example Success**: `{"success":true,"token":"eyJ...","user":{...}}`
* **Error Codes**: 400, 401 (Invalid credentials)

### 3. Logout
* **Method & Path**: `POST /api/v1/auth/logout`
* **Description**: Invalidate current token.
* **Auth Required**: Yes

### 4. Get Current User (Me)
* **Method & Path**: `GET /api/v1/auth/me`
* **Description**: Get profile of currently authenticated user.
* **Auth Required**: Yes
* **Example Success**: `{"success":true,"user":{"email":"admin@secops.local","role":"admin"}}`

---

## Alerts (`/alerts`)

### 1. List Alerts
* **Method & Path**: `GET /api/v1/alerts`
* **Description**: Get paginated list of security alerts.
* **Auth Required**: Yes
* **Example Success**: `{"success":true,"data":[{"id":"...","severity":"high","status":"open"}]}`

### 2. Get Alert by ID
* **Method & Path**: `GET /api/v1/alerts/:id`
* **Description**: Get detailed alert including raw event.
* **Auth Required**: Yes

### 3. Update Alert Status
* **Method & Path**: `PUT /api/v1/alerts/:id/status`
* **Description**: Update alert status (open, investigating, resolved, false_positive).
* **Auth Required**: Yes (analyst, admin)
* **Request Body**: `{"status": "resolved"}`

### 4. Get AI Analysis
* **Method & Path**: `GET /api/v1/alerts/:id/analysis`
* **Description**: Retrieve Gemini AI analysis for a specific alert.
* **Auth Required**: Yes

### 5. Trigger AI Analysis
* **Method & Path**: `POST /api/v1/alerts/:id/analyze`
* **Description**: Force a regeneration of the AI analysis.
* **Auth Required**: Yes (analyst, admin)

### 6. Get Alert Stats
* **Method & Path**: `GET /api/v1/alerts/stats/summary`
* **Description**: Get aggregated stats for the dashboard.
* **Auth Required**: Yes

---

## CloudTrail (`/cloudtrail`)

### 1. List Events
* **Method & Path**: `GET /api/v1/cloudtrail/events`
* **Description**: Get raw ingested CloudTrail logs.
* **Auth Required**: Yes

### 2. Simulate Attack
* **Method & Path**: `POST /api/v1/cloudtrail/simulate`
* **Description**: Inject synthetic CloudTrail logs for testing rules.
* **Auth Required**: Yes (admin)
* **Request Body**: `{"scenarioId": "1"}`

### 3. Get Engine Stats
* **Method & Path**: `GET /api/v1/cloudtrail/engine-stats`
* **Description**: Get performance metrics of the detection engine.
* **Auth Required**: Yes

---

## Rules (`/rules`)

### 1. List Rules
* **Method & Path**: `GET /api/v1/rules`
* **Description**: List all detection rules.
* **Auth Required**: Yes

### 2. Create Rule
* **Method & Path**: `POST /api/v1/rules`
* **Description**: Create a new detection rule.
* **Auth Required**: Yes (admin)
* **Request Body**: `{"name": "...", "severity": "high", "event_patterns": {...}}`

### 3. Update Rule
* **Method & Path**: `PUT /api/v1/rules/:id`
* **Description**: Update an existing rule.
* **Auth Required**: Yes (admin)

### 4. Toggle Rule
* **Method & Path**: `PATCH /api/v1/rules/:id/toggle`
* **Description**: Enable or disable a rule.
* **Auth Required**: Yes (admin)

### 5. Delete Rule
* **Method & Path**: `DELETE /api/v1/rules/:id`
* **Description**: Delete a rule.
* **Auth Required**: Yes (admin)

### 6. Test Rule
* **Method & Path**: `POST /api/v1/rules/test`
* **Description**: Test an event payload against a pattern without saving.
* **Auth Required**: Yes (admin)
* **Request Body**: `{"pattern": {...}, "event": {...}}`

---

## Analytics (`/analytics`)

### 1. Dashboard Overview
* **Method & Path**: `GET /api/v1/analytics/dashboard`
* **Auth Required**: Yes

### 2. Alert Trends
* **Method & Path**: `GET /api/v1/analytics/trend?days=7`
* **Auth Required**: Yes

### 3. Severity Distribution
* **Method & Path**: `GET /api/v1/analytics/severity`
* **Auth Required**: Yes

### 4. Attack Vectors
* **Method & Path**: `GET /api/v1/analytics/vectors`
* **Auth Required**: Yes

### 5. Geographic Chart
* **Method & Path**: `GET /api/v1/analytics/geographic`
* **Auth Required**: Yes

### 6. Top IPs
* **Method & Path**: `GET /api/v1/analytics/top-ips`
* **Auth Required**: Yes

### 7. System Health
* **Method & Path**: `GET /api/v1/analytics/health`
* **Auth Required**: Yes

### 8. Mean Time To Resolve (MTTR)
* **Method & Path**: `GET /api/v1/analytics/mttr`
* **Auth Required**: Yes
