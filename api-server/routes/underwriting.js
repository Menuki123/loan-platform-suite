const express = require("express");
const router = express.Router();
const underwritingController = require("../controllers/underwritingController");

router.post("/check-eligibility", underwritingController.checkEligibility);

module.exports = router;
