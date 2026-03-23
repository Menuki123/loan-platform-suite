# System Functional Evaluation Agent

## Overview

The **System Functional Evaluation Agent** is an intelligent platform that evaluates and validates loan management systems through automated API testing and analysis. It combines an API server, an intelligent agent powered by large language models (LLM), and an intuitive user interface to test complex business workflows without requiring technical expertise.

The system reads your API specifications (Swagger/OpenAPI), understands natural language requests, generates appropriate test data, executes API calls, and provides clear, actionable insights into system functionality and business workflow validation.

## Business Value

This platform enables organizations to:

- **Validate Loan Workflows** - Ensure loan processing, underwriting, and payment workflows function correctly
- **Test Without Code** - Non-technical users can evaluate system functionality using natural language queries
- **Understand System Behavior** - Get clear summaries and reasoning behind system responses
- **Make Informed Decisions** - Receive data-driven evaluations with supporting evidence
- **Reduce Testing Overhead** - Automated intelligent testing reduces manual QA burden

## Key Capabilities

### 🤖 Intelligent API Evaluation
- Parses Swagger/OpenAPI specifications automatically
- Intelligently selects relevant endpoints based on user prompts
- Generates realistic test data for loan management operations
- Executes API calls and evaluates responses for correctness

### 📊 Comprehensive Reporting
- **Decision Summaries** - Clear pass/fail decisions on system functionality
- **Detailed Reasoning** - LLM-generated explanations of evaluation logic
- **Test Artifacts** - Complete visibility into test inputs and execution context
- **Multiple View Modes** - Table, list, and visual representations of results

### 👥 User-Friendly Interface
- ChatGPT-style prompt interface for natural queries
- No coding or API knowledge required
- Health/status monitoring for API and agent services
- Configurable API base URLs and Swagger endpoints
- Support for complex workflow demonstrations

### 🔄 Full Loan Management Coverage
- Loan application processing
- Underwriting evaluation
- Workflow validation
- User and group management
- Payment processing
- Form management

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  - Chat Interface  - Results Display  - Configuration    │
└────────────────────┬────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
    ┌─────▼──────┐      ┌──────▼───────┐
    │  API Server │      │ Agent Server │
    │             │      │              │
    │ - Loan Mgmt │      │ - LLM Logic  │
    │ - Workflows │      │ - API Parser │
    │ - Payments  │      │ - Testing    │
    └─────────────┘      │ - Evaluation │
                         └──────────────┘
```

**System Components:**

1. **API Server** - RESTful backend providing business logic for loan management operations
2. **Agent Server** - Intelligent service that orchestrates API testing and evaluation
3. **Frontend** - React-based UI delivering a business-friendly experience

## Folder Structure

```
loan-platform-suite/
├── api-server/                 # RESTful API backend
│   ├── src/
│   ├── config/
│   └── package.json
├── agent-server/               # LLM-powered evaluation engine
│   ├── src/
│   ├── config/
│   └── package.json
├── frontend/                   # React user interface
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── package.json
├── README.md                   # This file
└── package-lock.json
```

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **API Server** | Node.js/Express | RESTful APIs for loan management |
| **Agent Server** | Node.js, LLM Integration | Intelligent API evaluation and testing |
| **Frontend** | React 18+ | User interface |
| **Styling** | Tailwind CSS | Modern, responsive design |
| **API Documentation** | Swagger/OpenAPI | Automated API specification parsing |

## Setup Instructions

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- Access to an LLM API (OpenAI, Azure OpenAI, or similar)
- Git

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Menuki123/loan-platform-suite.git
   cd loan-platform-suite
   ```

2. **Install dependencies for all components**
   ```bash
   # Install root dependencies
   npm install
   
   # Install API server dependencies
   cd api-server
   npm install
   cd ..
   
   # Install agent server dependencies
   cd agent-server
   npm install
   cd ..
   
   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

3. **Configure environment variables**

   Create a `.env` file in each component directory:

   **api-server/.env**
   ```
   PORT=3001
   NODE_ENV=development
   ```

   **agent-server/.env**
   ```
   PORT=3002
   API_BASE_URL=http://localhost:3001
   LLM_API_KEY=your_llm_api_key_here
   LLM_MODEL=gpt-4
   ```

   **frontend/.env**
   ```
   REACT_APP_API_URL=http://localhost:3001
   REACT_APP_AGENT_URL=http://localhost:3002
   ```

## Running the System

### Option 1: Start Each Service Separately

**Terminal 1 - API Server**
```bash
cd api-server
npm start
```
The API server will be available at `http://localhost:3001`

**Terminal 2 - Agent Server**
```bash
cd agent-server
npm start
```
The agent server will be available at `http://localhost:3002`

**Terminal 3 - Frontend**
```bash
cd frontend
npm start
```
The frontend will open at `http://localhost:3000`

### Option 2: Development Mode with Concurrency

From the root directory:
```bash
npm run dev
```

This will start all three services concurrently (if configured).

## Example Usage

### Scenario: Validating Loan Application Workflow

1. **Open the Frontend** - Navigate to http://localhost:3000
2. **Configure the System** - Set your API base URL and Swagger endpoint if needed
3. **Enter Your Request** - In the chat prompt, type:
   ```
   Test a complete loan application workflow: create an application for a 
   customer, submit it for underwriting, and validate the workflow status.
   ```
4. **Review Results** - The system will:
   - Parse available APIs from your Swagger specification
   - Select relevant endpoints (customer creation, application submission, status checks)
   - Generate realistic test data for a loan applicant
   - Execute the workflow sequence
   - Evaluate responses for correctness and business logic compliance
   - Present a summary with decision, reasoning, and test inputs

5. **View Response** in your preferred format:
   - **Table View** - Structured data representation
   - **List View** - Detailed step-by-step results
   - **Visual Mode** - Charts and visual indicators
   - **Summary Tab** - High-level overview and decision
   - **Reasoning Tab** - LLM explanation of findings
   - **Test Inputs Tab** - Complete test data used

### Scenario: Checking System Health

1. Navigate to the **Health/Status** view
2. Monitor real-time status of API and Agent services
3. Verify Swagger/OpenAPI specification accessibility

## How the Agent Evaluates

1. **Specification Parsing** - Reads your Swagger/OpenAPI file to understand available endpoints
2. **Endpoint Selection** - Uses LLM to intelligently select relevant APIs based on user request
3. **Data Generation** - Creates realistic test data matching API schemas
4. **API Execution** - Invokes selected endpoints with generated data
5. **Response Evaluation** - Analyzes responses using business logic rules
6. **Report Generation** - Produces comprehensive evaluation with:
   - Summary of findings
   - Pass/fail decision
   - LLM reasoning for the decision
   - User-friendly explanation
   - Complete test inputs used
   - Full execution context

## Configuration

### API Base URL Configuration

In the **Frontend Settings**, configure:
- **API Base URL** - Point to your API Server instance
- **Swagger/OpenAPI URL** - Location of your API specification file

### LLM Configuration

The Agent Server supports multiple LLM providers:
- OpenAI (GPT-4, GPT-3.5-turbo)
- Azure OpenAI
- Other compatible LLM APIs

Configure in `agent-server/.env`:
```
LLM_PROVIDER=openai
LLM_API_KEY=your_key
LLM_MODEL=gpt-4
```

## Future Improvements

- **Enhanced Reporting** - PDF export and email delivery of evaluation reports
- **Test Scheduling** - Automated recurring tests on defined schedules
- **Workflow Templates** - Pre-built evaluation templates for common loan scenarios
- **Performance Analytics** - Historical tracking and trend analysis
- **Integration Connectors** - Direct integration with CI/CD pipelines
- **Multi-Language Support** - Evaluation prompts in multiple languages
- **Advanced Filtering** - Endpoint filtering by tag, security, or complexity
- **Audit Logging** - Complete audit trail of all evaluations
- **Custom Rules Engine** - Define custom evaluation rules beyond LLM analysis
- **Mobile Support** - Responsive mobile interface for on-the-go evaluations

## Support & Documentation

For detailed component documentation, see:
- [API Server Documentation](./api-server/README.md)
- [Agent Server Documentation](./agent-server/README.md)
- [Frontend Documentation](./frontend/README.md)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with intelligence and designed for clarity** | System Functional Evaluation Agent
