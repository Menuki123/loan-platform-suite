const db = require('../database/db');

const JSON_FIELDS = [
  'personal','address','contact','education','income','expense','obligations','assets','insurance','business','guarantors','joint_borrowers'
];

function normalizeJsonField(value) {
  if (value == null) return null;
  if (typeof value === 'string') {
    JSON.parse(value);
    return value;
  }
  return JSON.stringify(value);
}

exports.createOrReplaceApplicationForm = (req, res) => {
  const { loan_id, ...sections } = req.body;
  if (!loan_id) {
    return res.status(400).json({ status: 'error', message: 'loan_id is required' });
  }

  db.get('SELECT id, customer_id FROM loans WHERE id = ?', [loan_id], (loanErr, loan) => {
    if (loanErr) return res.status(500).json({ status: 'error', message: loanErr.message });
    if (!loan) return res.status(404).json({ status: 'error', message: 'Loan not found' });

    try {
      const normalized = {};
      for (const field of JSON_FIELDS) normalized[field] = normalizeJsonField(sections[field]);

      db.run(
        `INSERT INTO application_forms
         (loan_id, customer_id, personal, address, contact, education, income, expense, obligations, assets, insurance, business, guarantors, joint_borrowers, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT(loan_id) DO UPDATE SET
           customer_id=excluded.customer_id,
           personal=excluded.personal,
           address=excluded.address,
           contact=excluded.contact,
           education=excluded.education,
           income=excluded.income,
           expense=excluded.expense,
           obligations=excluded.obligations,
           assets=excluded.assets,
           insurance=excluded.insurance,
           business=excluded.business,
           guarantors=excluded.guarantors,
           joint_borrowers=excluded.joint_borrowers,
           updated_at=CURRENT_TIMESTAMP`,
        [loan_id, loan.customer_id, normalized.personal, normalized.address, normalized.contact, normalized.education, normalized.income, normalized.expense, normalized.obligations, normalized.assets, normalized.insurance, normalized.business, normalized.guarantors, normalized.joint_borrowers],
        function (err) {
          if (err) return res.status(500).json({ status: 'error', message: err.message });
          res.status(201).json({ status: 'success', message: 'Application form saved', loan_id: Number(loan_id) });
        }
      );
    } catch (e) {
      return res.status(400).json({ status: 'error', message: `Invalid JSON section: ${e.message}` });
    }
  });
};

exports.getApplicationFormByLoanId = (req, res) => {
  db.get('SELECT * FROM application_forms WHERE loan_id = ?', [req.params.loanId], (err, row) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    if (!row) return res.status(404).json({ status: 'error', message: 'Application form not found' });
    res.json({ status: 'success', data: row });
  });
};

exports.patchApplicationFormSection = (req, res) => {
  const { section } = req.params;
  if (!JSON_FIELDS.includes(section)) {
    return res.status(400).json({ status: 'error', message: 'Unsupported section name' });
  }
  let normalized;
  try { normalized = normalizeJsonField(req.body.value); } catch (e) {
    return res.status(400).json({ status: 'error', message: `Invalid JSON section: ${e.message}` });
  }

  db.run(
    `UPDATE application_forms SET ${section} = ?, updated_at = CURRENT_TIMESTAMP WHERE loan_id = ?`,
    [normalized, req.params.loanId],
    function (err) {
      if (err) return res.status(500).json({ status: 'error', message: err.message });
      if (this.changes === 0) return res.status(404).json({ status: 'error', message: 'Application form not found' });
      res.json({ status: 'success', message: 'Application form section updated', loan_id: Number(req.params.loanId), section });
    }
  );
};
