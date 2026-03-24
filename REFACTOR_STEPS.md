# AI Agents Refactor - Run Steps

## What changed
- AI Agents is now the main concept in the UI.
- The frontend now has:
  - Agents directory view
  - Agent builder view
  - Conversation mode view
- The agent server now has:
  - MCP-inspired tool registry
  - Prompt template endpoints
  - Agent catalog endpoint
  - Bootstrap config component endpoint
  - Postman collection endpoint
- Swagger loading now supports either a local path or a public URL.

## Run steps

### 1. API server
```bash
cd api-server
npm install
npm start
```

### 2. Agent server
```bash
cd agent-server
npm install
npm start
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

Open:
```text
http://localhost:5173
```

## Suggested demo flow
1. Open the **Agents** page.
2. Click **Application Form Validation Agent - LOS** or **Create New Agent**.
3. Review tools and MCP-ready registry in **Builder**.
4. Switch to **Conversation Mode**.
5. Enter:
   - API Base URL: `http://localhost:3000`
   - Swagger URL: `http://localhost:3000/openapi.yaml`
   - Max Routes: `4`
6. Choose a prompt template.
7. Click **Run AI agent**.
8. Review the human-friendly execution summary.

## Key endpoints
- `GET /agents/catalog`
- `GET /mcp/tools`
- `GET /prompts/templates`
- `GET /qa/bootstrap`
- `POST /qa/run`
- `GET /qa/postman-collection`

## Notes
- In a fresh environment, always run `npm install` inside each project before starting.
- If Vite build errors appear because of missing optional Rollup dependencies, delete `frontend/node_modules` and run `npm install` again.
