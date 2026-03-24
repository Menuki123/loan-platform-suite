const promptTemplates = [
  {
    id: 'workflow-validation',
    title: 'Full workflow validation',
    prompt: 'Validate the full loan application workflow from customer onboarding to loan disbursement. Explain failures in simple business language.'
  },
  {
    id: 'required-fields',
    title: 'Required fields and validation',
    prompt: 'Check whether required fields and business validations are enforced when creating customers and loans. Summarize the result clearly.'
  },
  {
    id: 'large-json-form',
    title: 'Large JSON application form',
    prompt: 'Test whether the application form and related endpoints can accept large JSON sections and explain the outcome for a non-technical audience.'
  },
  {
    id: 'duplicate-loan-rules',
    title: 'Duplicate loan policy',
    prompt: 'Verify that the system blocks duplicate active loans for the same product and explain the decision path.'
  }
];

module.exports = { promptTemplates };
