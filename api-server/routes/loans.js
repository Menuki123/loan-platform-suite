const express = require("express");
const router = express.Router();
const loanController = require("../controllers/loanController");

router.post("/", loanController.createLoan);
router.get("/", loanController.getLoans);
router.get("/:id", loanController.getLoanById);
router.get("/:id/registry", loanController.getLoanRegistry);
router.post("/:id/validate/submission", loanController.validateSubmission);
router.post("/:id/validate/approval", loanController.validateApproval);
router.post("/:id/validate/disburse", loanController.validateDisburse);
router.put("/:id", loanController.updateLoan);
router.put("/:id/approve", loanController.approveLoan);
router.put("/:id/disburse", loanController.disburseLoan);
router.post("/:id/redirect", loanController.redirectLoan);
router.delete("/:id", loanController.deleteLoan);

module.exports = router;
