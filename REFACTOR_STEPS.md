# Refactored conversation-mode agent

## What changed

This refactor keeps the same loan platform idea, but restructures it to better match an agent platform:

- conversation-first UI
- predefined config component before prompt entry
- prompt capture after metadata capture
- human-friendly result component after execution
- MCP-inspired tool registry endpoint
- Postman collection for manual testing
- Swagger loader that accepts a public URL or local path

## New agent endpoints

- `GET /qa/bootstrap`
  - returns the predefined config form schema
- `GET /mcp/tools`
  - returns the tool registry used by the frontend
- `POST /qa/run`
  - runs the agent using `swaggerUrl` or `swaggerPath`
- `GET /qa/postman-collection`
  - returns a Postman collection for the agent flow

## Run steps

### 1. Start the API server

```bash
cd api-server
npm install
npm start
```

### 2. Start the agent server

```bash
cd agent-server
npm install
npm start
```

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the UI

```text
http://localhost:5173
```

## Example values

- API Base URL: `http://localhost:3000`
- Swagger URL: `http://localhost:3000/openapi.yaml`
- Max Routes: `4`

## Postman

Open this in the browser or import into Postman:

```text
http://localhost:4000/qa/postman-collection
```

## Note about MCP

This project now uses an MCP-inspired registry pattern, not the full official MCP transport protocol.
That means:

- the frontend discovers tools dynamically from the agent server
- tools are represented as component and backend capability metadata
- the UI can render predefined components based on server metadata

If you later need full MCP compatibility, the next step would be adding a dedicated MCP server transport and tool invocation contract.
