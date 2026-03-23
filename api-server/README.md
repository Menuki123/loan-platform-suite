# Loan Management API + Agent Server

This project now contains two separate servers:

1. **API Server** — loan management, underwriting workflow, application forms.
2. **Agent Server** — agentic QA solution that reads Swagger, selects relevant APIs, invokes them, and reports results.

## Added table for scale: `application_forms`
The new `application_forms` table references `loans.id` and stores large JSON sections as `TEXT` columns for:
- personal
- address
- contact
- education
- income
- expense
- obligations
- assets
- insurance
- business
- guarantors
- joint_borrowers

This supports richer onboarding data without overloading the base loan table.

## API endpoints added
- `POST /application-forms`
- `GET /application-forms/loan/{loanId}`
- `PATCH /application-forms/loan/{loanId}/{section}`

## Architecture plan
### API Server
Handles operational workflows:
- customers
- loans
- underwriting
- payments
- groups/users
- application workflow validation routes
- application form storage

### Agent Server
Handles agentic QA workflows:
- reads OpenAPI/Swagger
- plans relevant APIs from a prompt
- generates dummy test payloads
- invokes APIs
- evaluates outcomes
- summarizes coverage and issues

## Challenges / considerations
1. **Route relevance** — selecting only the APIs that match the user prompt.
2. **Dependency handling** — some APIs depend on IDs or outputs from earlier calls.
3. **Test payload quality** — generated data must respect validations like NIC, password, and product rules.
4. **Environment safety** — QA runs should not corrupt production data, so this should target test environments.
5. **Workflow-aware testing** — loan validation routes need ordered execution (`submission -> approval -> disburse`).
6. **Scale** — a future vector DB can improve API selection for large specs.
7. **LLM reliability** — Gemini output should be constrained to structured JSON where possible.

## Run API server
```bash
npm install
node app.js
```

## Run agent server
```bash
cd agent-server
npm install
node server.js
```
