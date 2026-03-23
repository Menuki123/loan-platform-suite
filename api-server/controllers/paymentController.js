const db = require("../database/db");

exports.createPayment = (req, res) => {
    const { loan_id, payment_amount, payment_method, reference_number } = req.body;

    if (!loan_id || !payment_amount || !payment_method) {
        return res.status(400).json({
            status: "error",
            message: "loan_id, payment_amount and payment_method are required"
        });
    }

    if (payment_amount <= 0) {
        return res.status(400).json({ status: "error", message: "Payment amount must be greater than 0" });
    }

    db.get("SELECT * FROM loans WHERE id = ?", [loan_id], (err, loan) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (!loan) {
            return res.status(404).json({ status: "error", message: "Loan not found" });
        }
        if (loan.status !== "DISBURSED") {
            return res.status(400).json({ status: "error", message: "Only DISBURSED loans can receive payments" });
        }
        if (payment_amount > loan.balance_remaining) {
            return res.status(400).json({ status: "error", message: "Payment exceeds remaining loan balance" });
        }

        db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            db.run(
                `INSERT INTO payments (loan_id, payment_amount, payment_method, reference_number)
                 VALUES (?, ?, ?, ?)`,
                [loan_id, payment_amount, payment_method, reference_number || null],
                function (insertErr) {
                    if (insertErr) {
                        db.run("ROLLBACK");
                        return res.status(500).json({ status: "error", message: insertErr.message });
                    }

                    const newTotalPaid = loan.total_paid + payment_amount;
                    const newBalance = loan.balance_remaining - payment_amount;

                    db.run(
                        `UPDATE loans SET total_paid = ?, balance_remaining = ? WHERE id = ?`,
                        [newTotalPaid, newBalance, loan_id],
                        function (updateErr) {
                            if (updateErr) {
                                db.run("ROLLBACK");
                                return res.status(500).json({ status: "error", message: updateErr.message });
                            }

                            db.run(
                                `INSERT INTO audit_logs (entity_name, entity_id, action, description)
                                 VALUES (?, ?, ?, ?)`,
                                ["payment", loan_id, "CREATE", `Payment of ${payment_amount} recorded for loan ${loan_id}`]
                            );

                            db.run("COMMIT");

                            res.status(201).json({
                                status: "success",
                                message: "Payment recorded",
                                loan_id,
                                total_paid: newTotalPaid,
                                balance_remaining: newBalance,
                                loan_status: loan.status
                            });
                        }
                    );
                }
            );
        });
    });
};

exports.getPayments = (req, res) => {
    db.all(
        `SELECT p.*, l.customer_id
         FROM payments p
         JOIN loans l ON p.loan_id = l.id
         ORDER BY p.id DESC`,
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            res.json({ status: "success", data: rows });
        }
    );
};

exports.getPaymentById = (req, res) => {
    db.get(`SELECT * FROM payments WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (!row) {
            return res.status(404).json({ status: "error", message: "Payment not found" });
        }
        res.json({ status: "success", data: row });
    });
};

exports.updatePayment = (req, res) => {
    const { payment_method, reference_number } = req.body;

    if (!payment_method) {
        return res.status(400).json({ status: "error", message: "payment_method is required" });
    }

    db.run(
        `UPDATE payments SET payment_method = ?, reference_number = ? WHERE id = ?`,
        [payment_method, reference_number || null, req.params.id],
        function (err) {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ status: "error", message: "Payment not found" });
            }
            res.json({ status: "success", message: "Payment updated", id: Number(req.params.id) });
        }
    );
};

exports.deletePayment = (req, res) => {
    db.run(`DELETE FROM payments WHERE id = ?`, [req.params.id], function (err) {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ status: "error", message: "Payment not found" });
        }
        res.json({ status: "success", message: "Payment deleted", id: Number(req.params.id) });
    });
};
