# Contributing to SecOps AI Copilot

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:
- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features

## Code of Conduct
We expect all contributors to adhere to a standard Code of Conduct. Please be respectful, inclusive, and professional in all interactions. 

## Getting Started

1. Fork the repo and create your branch from `main`.
2. Follow the Quick Start guide in `README.md` to set up your environment, Postgres, and Redis.
3. Ensure you have Node.js 18+ installed.

## Project Structure
- `backend/`: Node.js Express API.
  - `src/controllers/`: Route request handlers.
  - `src/services/`: Core business logic (AI, detection engine).
  - `src/tests/`: Jest test suites.
- `frontend/`: React SPA built with Vite.
  - `src/components/`: Reusable UI elements.
  - `src/pages/`: Main route views.
  - `src/hooks/`: Custom React hooks (React Query).

## Branch Naming Convention
Please prefix your branch names to denote the intent:
- `feature/add-new-dashboard`
- `bugfix/fix-login-crash`
- `hotfix/critical-security-patch`
- `docs/update-readme`

## Commit Message Format
We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat: added AI analysis retry button`
- `fix: resolved race condition in cloudtrail poller`
- `docs: updated API documentation`
- `test: added unit tests for detection engine`

## Pull Request Process
1. Ensure your code builds locally (`npm run build`).
2. Run tests (`npm test`) and ensure coverage does not drop below 60%.
3. Fill out the provided Pull Request Template completely.
4. Pass all automated GitHub Actions checks (CI, Security Scan).
5. Obtain approval from at least one core maintainer before merging.

## Code Style
- **Backend**: CommonJS `require()` / `module.exports`. Use ESLint standard rules. Use async/await over raw Promises.
- **Frontend**: ECMAScript Modules (`import` / `export`). Functional components with Hooks. Use Tailwind CSS classes; avoid inline styles.

## Testing Requirements
- The backend enforces a strict 60% coverage threshold across statements, branches, functions, and lines.
- Write unit tests for all new services and API endpoints using `jest` and `supertest`.

## Security Guidelines
- **NEVER** commit secrets, API keys, or `.env` files.
- Always use `pg` parameterized queries (`$1`, `$2`) to prevent SQL injection.
- Ensure proper RBAC authorization middleware is applied to new routes.

## How to Add a New Detection Rule
1. Understand the MITRE technique you are targeting.
2. Build the JSON pattern logic.
3. Add the rule via the UI or by inserting it into the `database/seed.js` script.
4. Test thoroughly using the `/api/v1/rules/test` endpoint.

## How to Add a New API Endpoint
1. Create a controller function in `backend/src/controllers/`.
2. Map it to an Express route in `backend/src/routes/`.
3. Add JWT authentication `authenticate` and `authorizeRole` middleware if needed.
4. Document the new endpoint in `docs/API.md`.
5. Write a corresponding unit test in `backend/src/tests/`.
