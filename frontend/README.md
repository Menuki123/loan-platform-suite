# Frontend

React + Tailwind frontend for presenting the three-project loan platform suite.

## Features
- Displays health of API server and agent server
- Runs QA prompts against the agent server
- Shows non-technical summaries, LLM reasoning, execution context, test inputs, and raw results
- Provides quick links to Swagger and the agent landing route

## Setup
```bash
npm install
npm run dev
```

The app uses these environment variables:
- `VITE_API_BASE_URL` (default `http://localhost:3000`)
- `VITE_AGENT_BASE_URL` (default `http://localhost:4000`)
