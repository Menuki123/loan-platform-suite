# Agent Server

Separate Node.js service for the agentic QA solution.

## Why separate?
- keeps core loan API stable
- allows independent scaling for agent workloads
- makes it easier to add Gemini, vector search, and self-healing without impacting transaction APIs

## Run
```bash
cd agent-server
npm install
npm start
```

Server starts on `http://localhost:4000`.

## Endpoint
`POST /qa/run`

Example body:
```json
{
  "prompt": "Test loan validation and underwriting APIs",
  "apiBaseUrl": "http://localhost:3000"
}
```

## Current design
- parses Swagger/OpenAPI from the API server project
- selects relevant APIs from the prompt
- generates dummy payloads
- invokes APIs
- evaluates responses
- returns a QA summary

## Planned next upgrades
- vector DB semantic API retrieval
- self-healing retries
- workflow dependency output mapping
- HTML QA dashboard

## Bulk dataset loop mode

Upload one dataset with multiple rows and call `POST /qa/run` from the frontend. When the agent detects more than one record, it switches to bulk mode automatically. Each row is processed in a loop, matched to a route using the row `action`, and returned in `caseResults`.
