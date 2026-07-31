# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-27

### Added
- **Real-Time CloudTrail Ingestion**: Automated S3 polling mechanism reading compressed `.json.gz` files securely into the database.
- **Detection Engine**: Custom JSON pattern matching system supporting `exact_match`, `contains`, `in_list`, `regex`, and `json_path`.
- **MITRE ATT&CK Rules**: 10 pre-configured, production-ready rules mapping directly to AWS CloudTrail attack vectors.
- **Gemini 1.5 Pro AI Integration**: Autonomous alert triage generating 0-100 risk scores and remediation steps.
- **Interactive React Dashboard**: Live metrics, severity distribution, top source IPs, and alert trends.
- **Attack Simulator**: 5 distinct simulation scenarios to safely test engine response without live infrastructure changes.
- **RBAC Authentication**: Secure JWT flow with `admin`, `analyst`, and `viewer` roles.
- **Docker & CI/CD**: Full containerization via Docker Compose and automated GitHub Actions pipelines (CI, CD, Security Scans).

### Architecture
- Selected **Local PostgreSQL** via Docker for native JSONB querying support and seamless local development.
- Selected **Local Redis** via Docker for high-speed rate limiting and detection rule caching.
- Enforced **CommonJS** across the Node.js backend for maximum ecosystem stability, while utilizing **ESM** for the React frontend via Vite.

### Known Issues
- Large CloudTrail logs (>100MB compressed) may cause temporary memory spikes during extraction before garbage collection triggers. (Planned fix: Stream processing).
- Nginx logs are not currently aggregated to a centralized logging server.
