const db = require("../database/db");

function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    const today = new Date();

    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }

    return age;
}

function determineScoreBand(creditScore) {
    if (creditScore >= 750) return "LOW_RISK";
    if (creditScore >= 650) return "MEDIUM_RISK";
    if (creditScore >= 600) return "HIGH_RISK";
    return "VERY_HIGH_RISK";
}

function checkEligibility(customer, activeLoans, productType) {
    const reasons = [];
    const checks = {};

    const age = calculateAge(customer.date_of_birth);
    const monthlyIncome = Number(customer.monthly_income || 0);
    const monthlyExpenses = Number(customer.monthly_expenses || 0);
    const creditScore = Number(customer.credit_score || 0);
    const businessTurnover = Number(customer.business_turnover || 0);
    const ratio = monthlyExpenses > 0 ? monthlyIncome / monthlyExpenses : monthlyIncome > 0 ? 999 : 0;

    checks.age_check = age !== null && age >= 18;
    if (!checks.age_check) reasons.push("Customer must be at least 18 years old");

    checks.demographic_check = !!customer.residency_status;
    if (!checks.demographic_check) reasons.push("Residency status is required for demographic evaluation");

    checks.credit_score_check = creditScore >= 600;
    if (!checks.credit_score_check) reasons.push("Credit score below minimum underwriting threshold");

    checks.income_expense_ratio_check = ratio >= 1.2;
    if (!checks.income_expense_ratio_check) reasons.push("Income-to-expense ratio is below required threshold");

    checks.disposable_income_check = monthlyIncome > monthlyExpenses;
    if (!checks.disposable_income_check) reasons.push("Monthly income must be greater than monthly expenses");

    const sameProductActiveLoan = activeLoans.find(
        (loan) => loan.product_type === productType
    );
    const activeLoanCount = activeLoans.length;

    checks.multi_loan_policy_check = true;
    if (sameProductActiveLoan) {
        checks.multi_loan_policy_check = false;
        reasons.push(`Customer already has an active loan for ${productType}`);
    }
    if (activeLoanCount >= 2) {
        checks.multi_loan_policy_check = false;
        reasons.push("Customer cannot hold more than 2 active loans");
    }

    checks.product_policy_check = true;
    if (productType === "PRODUCT_A" && customer.employment_type !== "PERMANENT") {
        checks.product_policy_check = false;
        reasons.push("PRODUCT_A requires a permanent income holder");
    }

    if (productType === "PRODUCT_B") {
        if (businessTurnover <= 100000) {
            checks.product_policy_check = false;
            reasons.push("PRODUCT_B requires business turnover above 100000");
        }
        if (!["BUSINESS", "SELF_EMPLOYED"].includes(customer.employment_type)) {
            checks.product_policy_check = false;
            reasons.push("PRODUCT_B is only available for business/self-employed customers");
        }
    }

    const eligible = Object.values(checks).every((value) => value === true);

    return {
        eligible,
        decision: eligible ? "APPROVED_FOR_APPLICATION" : "DECLINED",
        policy_category: "Underwriting Policy",
        product_type: productType,
        score_band: determineScoreBand(creditScore),
        checks,
        reasons,
        customer_snapshot: {
            customer_id: customer.id,
            age,
            credit_score: creditScore,
            income_to_expense_ratio: Number(ratio.toFixed(2)),
            active_loans: activeLoanCount
        }
    };
}

function evaluateCustomerEligibility(customerId, productType) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM customers WHERE id = ?", [customerId], (err, customer) => {
            if (err) return reject(err);
            if (!customer) return resolve(null);

            db.all(
                `SELECT * FROM loans WHERE customer_id = ? AND status IN ('PENDING', 'SUBMITTED', 'APPROVED', 'DISBURSED')`,
                [customerId],
                (loanErr, loans) => {
                    if (loanErr) return reject(loanErr);
                    resolve(checkEligibility(customer, loans, productType));
                }
            );
        });
    });
}

module.exports = {
    evaluateCustomerEligibility
};
