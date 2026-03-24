const toolRegistry = [
  {
    id: 'config_form',
    type: 'frontend_component',
    title: 'Agent Configuration Form',
    description: 'Collects Swagger URL, API base URL, route limit, and execution mode before the prompt is sent.'
  },
  {
    id: 'prompt_capture',
    type: 'conversation_step',
    title: 'Prompt Capture',
    description: 'Collects the human instruction after metadata is captured.'
  },
  {
    id: 'execution_summary',
    type: 'frontend_component',
    title: 'Execution Summary Card',
    description: 'Shows pass or fail, counts, key findings, and expandable technical details.'
  },
  {
    id: 'postman_runner',
    type: 'backend_capability',
    title: 'Postman Testing Support',
    description: 'Provides a Postman collection so the same endpoints can be tested outside the chat flow.'
  },
  {
    id: 'swagger_loader',
    type: 'backend_capability',
    title: 'Swagger Loader',
    description: 'Loads a local Swagger file or a public Swagger URL.'
  }
];

function getToolRegistry() {
  return toolRegistry;
}

module.exports = { getToolRegistry };
