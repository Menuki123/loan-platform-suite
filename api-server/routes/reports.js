const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

router.get("/active-loans", reportController.getActiveLoans);
router.get("/customer-loan-summary", reportController.getCustomerLoanSummary);
router.get("/payment-history", reportController.getPaymentHistory);

module.exports = router;
