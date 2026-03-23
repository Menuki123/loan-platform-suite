const db = require("../database/db");
const { evaluateCustomerEligibility } = require("../services/underwritingService");

function registryReference() {
    return `LVR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function buildReasonSummary(eligibility) {
    if (!eligibility || !Array.isArray(eligibility.reasons) || eligibility.reasons.length === 0) {
        return "No validation notes available";
    }
    return eligibility.reasons.join("; ");
}

function insertValidationRegistry({ loanId, customerId, productType, stage, decision, reasonSummary, debtToIncome, creditScore, ref }) {
    db.run(
        `INSERT INTO validation_registry
         (loan_id, customer_id, product_type, validation_stage, decision, reason_summary, debt_to_income_ratio, credit_score_snapshot, registry_reference)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [loanId, customerId, productType, stage, decision, reasonSummary, debtToIncome, creditScore, ref]
    );
}

function findLoan(loanId) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM loans WHERE id = ?`, [loanId], (err, loan) => {
            if (err) return reject(err);
            resolve(loan || null);
        });
    });
}

function runUpdate(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve(this);
        });
    });
}


function workflowIsEnabled(loan) {
    return Number(loan.workflow_enabled ?? 1) === 1;
}

exports.createLoan = async (req, res) => {
    try {
        const {
            customer_id,
            product_type,
            loan_amount,
            interest_rate,
            loan_term_months,
            workflow_enabled
        } = req.body;

        if (
            customer_id == null ||
            !product_type ||
            loan_amount == null ||
            interest_rate == null ||
            loan_term_months == null
        ) {
            return res.status(400).json({
                status: "error",
                message: "customer_id, product_type, loan_amount, interest_rate and loan_term_months are required"
            });
        }

        const allowedProducts = ["PRODUCT_A", "PRODUCT_B"];
        if (!allowedProducts.includes(product_type)) {
            return res.status(400).json({
                status: "error",
                message: "product_type must be PRODUCT_A or PRODUCT_B"
            });
        }

        if (Number(loan_amount) <= 0 || Number(interest_rate) < 0 || Number(loan_term_months) <= 0) {
            return res.status(400).json({ status: "error", message: "Invalid loan values" });
        }

        db.get(`SELECT id FROM customers WHERE id = ?`, [customer_id], (findErr, customer) => {
            if (findErr) {
                return res.status(500).json({ status: "error", message: findErr.message });
            }
            if (!customer) {
                return res.status(404).json({ status: "error", message: "Customer not found" });
            }

            const ref = registryReference();
            const workflowEnabled = workflow_enabled == null ? 1 : Number(Boolean(workflow_enabled));
            const total_payable = Number(
                (Number(loan_amount) + (Number(loan_amount) * Number(interest_rate) / 100)).toFixed(2)
            );
            const balance_remaining = total_payable;

            db.run(
                `INSERT INTO loans
                 (customer_id, product_type, loan_amount, interest_rate, loan_term_months, total_payable, total_paid, balance_remaining, status, workflow_enabled, registry_reference)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    customer_id,
                    product_type,
                    Number(loan_amount),
                    Number(interest_rate),
                    Number(loan_term_months),
                    total_payable,
                    0,
                    balance_remaining,
                    "PENDING",
                    workflowEnabled,
                    ref
                ],
                function (err) {
                    if (err) {
                        return res.status(500).json({ status: "error", message: err.message });
                    }

                    const loanId = this.lastID;

                    db.run(
                        `INSERT INTO audit_logs (entity_name, entity_id, action, description)
                         VALUES (?, ?, ?, ?)`,
                        ["loan", loanId, "CREATE", `Loan draft created for customer ${customer_id} under ${product_type}`]
                    );

                    res.status(201).json({
                        status: "success",
                        message: "Loan draft created",
                        loan_id: loanId,
                        product_type,
                        total_payable,
                        balance_remaining,
                        loan_status: "PENDING",
                        workflow_enabled: workflowEnabled === 1,
                        registry_reference: ref
                    });
                }
            );
        });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

exports.validateSubmission = async (req, res) => {
    try {
        const loan = await findLoan(req.params.id);
        if (!loan) {
            return res.status(404).json({ status: "error", message: "Loan not found" });
        }
        if (!workflowIsEnabled(loan)) {
            return res.status(400).json({ status: "error", message: "Application workflow is disabled for this loan" });
        }
        if (loan.status !== "PENDING") {
            return res.status(400).json({ status: "error", message: "Only PENDING loans can be validated for submission" });
        }

        const eligibility = await evaluateCustomerEligibility(loan.customer_id, loan.product_type);
        if (!eligibility) {
            return res.status(404).json({ status: "error", message: "Customer not found" });
        }

        const reasonSummary = buildReasonSummary(eligibility);
        const decision = eligibility.eligible ? "PASSED" : "FAILED";
        const debtToIncome = eligibility.customer_snapshot?.income_to_expense_ratio ?? null;
        const creditScore = eligibility.customer_snapshot?.credit_score ?? null;
        const ref = loan.registry_reference || registryReference();

        insertValidationRegistry({
            loanId: loan.id,
            customerId: loan.customer_id,
            productType: loan.product_type,
            stage: "submission",
            decision,
            reasonSummary,
            debtToIncome,
            creditScore,
            ref
        });

        if (!eligibility.eligible) {
            return res.status(400).json({
                status: "error",
                message: "Submission validation failed",
                loan_id: loan.id,
                current_status: loan.status,
                registry_reference: ref,
                underwriting: eligibility
            });
        }

        await runUpdate(
            `UPDATE loans SET status = 'SUBMITTED', submitted_at = CURRENT_TIMESTAMP, registry_reference = ? WHERE id = ?`,
            [ref, loan.id]
        );
        await runUpdate(
            `INSERT INTO audit_logs (entity_name, entity_id, action, description) VALUES (?, ?, ?, ?)`,
            ["loan", loan.id, "VALIDATE_SUBMISSION", `Loan ${loan.id} passed submission validation`]
        );

        return res.json({
            status: "success",
            message: "Submission validation passed",
            loan_id: loan.id,
            loan_status: "SUBMITTED",
            registry_reference: ref,
            underwriting: eligibility
        });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

exports.validateApproval = async (req, res) => {
    try {
        const { approved_by } = req.body;
        const loan = await findLoan(req.params.id);
        if (!loan) {
            return res.status(404).json({ status: "error", message: "Loan not found" });
        }
        if (!workflowIsEnabled(loan)) {
            return res.status(400).json({ status: "error", message: "Application workflow is disabled for this loan" });
        }
        if (loan.status !== "SUBMITTED") {
            return res.status(400).json({ status: "error", message: "Only SUBMITTED loans can be validated for approval" });
        }

        const reasons = [];
        if (!loan.registry_reference) reasons.push("Loan is missing a submission registry reference");
        if (!loan.redirected_group_id) reasons.push("Loan must be redirected to a processing group before approval");
        if (loan.total_payable <= 0 || loan.balance_remaining <= 0) reasons.push("Loan totals must be valid before approval");

        const decision = reasons.length === 0 ? "PASSED" : "FAILED";
        insertValidationRegistry({
            loanId: loan.id,
            customerId: loan.customer_id,
            productType: loan.product_type,
            stage: "approval",
            decision,
            reasonSummary: reasons.length ? reasons.join("; ") : "Approval validation passed",
            debtToIncome: null,
            creditScore: null,
            ref: loan.registry_reference || registryReference()
        });

        if (reasons.length) {
            return res.status(400).json({
                status: "error",
                message: "Approval validation failed",
                loan_id: loan.id,
                current_status: loan.status,
                reasons
            });
        }

        await runUpdate(
            `UPDATE loans SET status = 'APPROVED', approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [approved_by || null, loan.id]
        );
        await runUpdate(
            `INSERT INTO audit_logs (entity_name, entity_id, action, description) VALUES (?, ?, ?, ?)`,
            ["loan", loan.id, "VALIDATE_APPROVAL", `Loan ${loan.id} passed approval validation`]
        );

        return res.json({
            status: "success",
            message: "Approval validation passed",
            loan_id: loan.id,
            loan_status: "APPROVED"
        });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

exports.validateDisburse = async (req, res) => {
    try {
        const loan = await findLoan(req.params.id);
        if (!loan) {
            return res.status(404).json({ status: "error", message: "Loan not found" });
        }
        if (!workflowIsEnabled(loan)) {
            return res.status(400).json({ status: "error", message: "Application workflow is disabled for this loan" });
        }
        if (loan.status !== "APPROVED") {
            return res.status(400).json({ status: "error", message: "Only APPROVED loans can be validated for disbursement" });
        }

        const reasons = [];
        if (!loan.approved_at) reasons.push("Loan approval timestamp is missing");
        if (loan.balance_remaining <= 0) reasons.push("Loan balance must be greater than 0 for disbursement");
        if (loan.total_payable <= 0) reasons.push("Loan total payable must be valid before disbursement");

        const decision = reasons.length === 0 ? "PASSED" : "FAILED";
        insertValidationRegistry({
            loanId: loan.id,
            customerId: loan.customer_id,
            productType: loan.product_type,
            stage: "disburse",
            decision,
            reasonSummary: reasons.length ? reasons.join("; ") : "Disbursement validation passed",
            debtToIncome: null,
            creditScore: null,
            ref: loan.registry_reference || registryReference()
        });

        if (reasons.length) {
            return res.status(400).json({
                status: "error",
                message: "Disbursement validation failed",
                loan_id: loan.id,
                current_status: loan.status,
                reasons
            });
        }

        await runUpdate(
            `UPDATE loans SET status = 'DISBURSED', disbursed_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [loan.id]
        );
        await runUpdate(
            `INSERT INTO audit_logs (entity_name, entity_id, action, description) VALUES (?, ?, ?, ?)`,
            ["loan", loan.id, "VALIDATE_DISBURSE", `Loan ${loan.id} passed disbursement validation`]
        );

        return res.json({
            status: "success",
            message: "Disbursement validation passed",
            loan_id: loan.id,
            loan_status: "DISBURSED"
        });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};

exports.getLoans = (req, res) => {
    db.all(
        `SELECT l.*, c.first_name, c.last_name, g.name AS redirected_group_name, u.full_name AS approved_by_name
         FROM loans l
         JOIN customers c ON l.customer_id = c.id
         LEFT JOIN groups g ON l.redirected_group_id = g.id
         LEFT JOIN users u ON l.approved_by = u.id
         ORDER BY l.id DESC`,
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            res.json({ status: "success", data: rows });
        }
    );
};

exports.getLoanById = (req, res) => {
    db.get(
        `SELECT l.*, c.first_name, c.last_name, g.name AS redirected_group_name, u.full_name AS approved_by_name
         FROM loans l
         JOIN customers c ON l.customer_id = c.id
         LEFT JOIN groups g ON l.redirected_group_id = g.id
         LEFT JOIN users u ON l.approved_by = u.id
         WHERE l.id = ?`,
        [req.params.id],
        (err, row) => {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            if (!row) {
                return res.status(404).json({ status: "error", message: "Loan not found" });
            }
            res.json({ status: "success", data: row });
        }
    );
};

exports.updateLoan = (req, res) => {
    const { product_type, interest_rate, loan_term_months } = req.body;

    if (!product_type || interest_rate == null || loan_term_months == null) {
        return res.status(400).json({
            status: "error",
            message: "product_type, interest_rate and loan_term_months are required"
        });
    }

    db.get(`SELECT * FROM loans WHERE id = ?`, [req.params.id], (findErr, loan) => {
        if (findErr) {
            return res.status(500).json({ status: "error", message: findErr.message });
        }
        if (!loan) {
            return res.status(404).json({ status: "error", message: "Loan not found" });
        }
        if (!["PENDING", "SUBMITTED"].includes(loan.status)) {
            return res.status(400).json({ status: "error", message: "Only PENDING or SUBMITTED loans can be edited" });
        }

        db.run(
            `UPDATE loans
             SET product_type = ?, interest_rate = ?, loan_term_months = ?
             WHERE id = ?`,
            [product_type, Number(interest_rate), Number(loan_term_months), req.params.id],
            function (err) {
                if (err) {
                    return res.status(500).json({ status: "error", message: err.message });
                }
                res.json({ status: "success", message: "Loan updated", id: Number(req.params.id) });
            }
        );
    });
};

exports.approveLoan = (req, res) => {
    return exports.validateApproval(req, res);
};

exports.disburseLoan = (req, res) => {
    return exports.validateDisburse(req, res);
};

exports.redirectLoan = (req, res) => {
    const { group_id } = req.body;

    if (!group_id) {
        return res.status(400).json({ status: "error", message: "group_id is required" });
    }

    db.get(`SELECT * FROM groups WHERE id = ?`, [group_id], (groupErr, group) => {
        if (groupErr) {
            return res.status(500).json({ status: "error", message: groupErr.message });
        }
        if (!group) {
            return res.status(404).json({ status: "error", message: "Group not found" });
        }

        db.run(
            `UPDATE loans SET redirected_group_id = ? WHERE id = ?`,
            [group_id, req.params.id],
            function (err) {
                if (err) {
                    return res.status(500).json({ status: "error", message: err.message });
                }
                if (this.changes === 0) {
                    return res.status(404).json({ status: "error", message: "Loan not found" });
                }

                db.run(
                    `INSERT INTO audit_logs (entity_name, entity_id, action, description)
                     VALUES (?, ?, ?, ?)`,
                    ["loan", req.params.id, "REDIRECT", `Loan ${req.params.id} redirected to group ${group.name}`]
                );

                res.json({
                    status: "success",
                    message: "Loan redirected",
                    loan_id: Number(req.params.id),
                    redirected_group_id: Number(group_id),
                    redirected_group_name: group.name
                });
            }
        );
    });
};

exports.getLoanRegistry = (req, res) => {
    db.all(
        `SELECT * FROM validation_registry WHERE loan_id = ? OR registry_reference = (SELECT registry_reference FROM loans WHERE id = ?)
         ORDER BY id DESC`,
        [req.params.id, req.params.id],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            res.json({ status: "success", data: rows });
        }
    );
};

exports.deleteLoan = (req, res) => {
    db.run(`DELETE FROM loans WHERE id = ?`, [req.params.id], function (err) {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ status: "error", message: "Loan not found" });
        }
        res.json({ status: "success", message: "Loan deleted", id: Number(req.params.id) });
    });
};
