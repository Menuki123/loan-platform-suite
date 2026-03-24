const promptTemplates = [
  {
    id: 'workflow-validation',
    name: 'Workflow validation',
    description: 'Checks full loan workflow progression and explains stage failures clearly.',
    prompt: 'Validate the full LOS application workflow from draft to disbursal. Explain any failure in simple business language and highlight which endpoints were involved.'
  },
  {
    id: 'form-validation',
    name: 'Form validation',
    description: 'Focuses on missing required fields and validation feedback.',
    prompt: 'Test the LOS application form and identify required field validations, input mistakes, and user-friendly remediation steps.'
  },
  {
    id: 'large-json',
    name: 'Large JSON structure',
    description: 'Checks how the system handles large application-form section payloads.',
    prompt: 'Test whether the system can accept large JSON application sections without breaking validation or workflow behaviour. Summarize the outcome for business users.'
  },
  {
    id: 'smoke-test',
    name: 'Smoke test',
    description: 'Runs a short essential route check using a small route budget.',
    prompt: 'Run a smoke test on the most important LOS routes and tell me whether the environment is safe for a demo.'
  }
];

module.exports = { promptTemplates };
