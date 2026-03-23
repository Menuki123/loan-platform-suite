const express = require('express');
const router = express.Router();
const controller = require('../controllers/applicationFormController');

router.post('/', controller.createOrReplaceApplicationForm);
router.get('/loan/:loanId', controller.getApplicationFormByLoanId);
router.patch('/loan/:loanId/:section', controller.patchApplicationFormSection);

module.exports = router;
