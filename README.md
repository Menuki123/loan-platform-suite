
# Loan Platform Suite

This folder contains all three projects requested:

- `api-server/` — Express API for customers, loans, underwriting, workflow validation, payments, groups, users, and application forms
- `agent-server/` — decoupled agentic QA service that loads Swagger, selects relevant endpoints, generates dummy inputs, invokes APIs, and evaluates pass/fail
- `frontend/` — React + Tailwind presentation layer for the whole approach

## Run order

### 1) API server
```bash
cd api-server
npm install
node app.js
```

Open:
- `http://localhost:3000/health`
- `http://localhost:3000/api-docs`

### 2) Agent server
```bash
cd ../agent-server
npm install
node server.js
```

Open:
- `http://localhost:4000/`
- `http://localhost:4000/health`

### 3) Frontend
```bash
cd ../frontend
npm install
npm run dev
```

Open:
- `http://localhost:5173`

## Notes
- Delete `api-server/loan.db` if you need the database schema recreated from scratch.
- The agent server defaults to `../api-server/openapi.yaml` in this three-project structure.
- The frontend defaults to talking to `http://localhost:3000` and `http://localhost:4000`.

## Suggested GitLab push
```bash
git init
git add .
git commit -m "Add API server, agent server, and React frontend suite"
git branch -M main
git remote add origin <your-gitlab-repository-url>
git push -u origin main
```
