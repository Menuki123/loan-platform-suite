System Functional Evaluation Agent — MCP + Conversation Mode

What was added
- AI Agents style landing page
- System Functional Evaluation Agent as the main agent
- Conversation mode with a predefined configuration component
- MCP-inspired tool registry endpoint
- Prompt template endpoint
- Postman collection endpoint
- Swagger loader that accepts a URL or local path
- Result rendering in table, list, or visual mode

Run
1. API server
   cd api-server
   npm install
   npm start

2. Agent server
   cd agent-server
   npm install
   npm start

3. Frontend
   cd frontend
   npm install
   npm run dev

Useful endpoints
- GET  http://localhost:4000/agents/catalog
- GET  http://localhost:4000/mcp/tools
- GET  http://localhost:4000/prompts/templates
- GET  http://localhost:4000/qa/bootstrap
- POST http://localhost:4000/qa/run
- GET  http://localhost:4000/qa/postman-collection

Example config
- API Base URL: http://localhost:3000
- Swagger URL: http://localhost:3000/openapi.yaml
- Max Routes: 4
- Response Mode: table
