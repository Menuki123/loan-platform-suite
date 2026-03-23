
loan-platform-suite/
├── api-server/
├── agent-server/
├── frontend/
├── README.md


---

## Tech Stack

- **Frontend:** React, Tailwind CSS, Vite
- **Backend:** Node.js, Express
- **Agent Logic:** LLM-style evaluation + Swagger-driven execution
- **API Definition:** OpenAPI / Swagger
- **Deployment:** GitHub, GitHub Pages (Frontend)

---

## How to Run the Project

### 1. API Server

```bash
cd api-server
npm install
node app.js

Runs on:

http://localhost:3000
2. Agent Server
cd agent-server
npm install
node server.js

Runs on:

http://localhost:4000
3. Frontend
cd frontend
npm install
npm run dev

Runs on:

http://localhost:5173
How It Works
User enters a prompt in the frontend
System configuration is applied (API base URL, Swagger source)
Agent:
Loads Swagger definition
Selects relevant endpoints
Generates test inputs
Executes API calls
Results are evaluated and returned
Frontend displays:
Summary
Decision
Reasoning
Test inputs
Execution results
