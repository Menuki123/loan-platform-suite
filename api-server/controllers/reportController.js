const db = require("../database/db");

exports.getActiveLoans = (req, res) => {
    db.all(
        `SELECT l.id, c.first_name, c.last_name, l.loan_amount, l.total_payable, l.total_paid, l.balance_remaining, l.status
         FROM loans l
         JOIN customers c ON l.customer_id = c.id
         WHERE l.status IN ('IN_PROGRESS', 'APPROVED', 'DISBURSED')
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

exports.getCustomerLoanSummary = (req, res) => {
    db.all(
        `SELECT
           c.id AS customer_id,
           c.first_name,
           c.last_name,
           COUNT(l.id) AS total_loans,
           COALESCE(SUM(l.loan_amount), 0) AS total_borrowed,
           COALESCE(SUM(l.total_paid), 0) AS total_paid,
           COALESCE(SUM(l.balance_remaining), 0) AS total_balance_remaining
         FROM customers c
         LEFT JOIN loans l ON c.id = l.customer_id
         GROUP BY c.id, c.first_name, c.last_name
         ORDER BY c.id DESC`,
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            res.json({ status: "success", data: rows });
        }
    );
};

exports.getPaymentHistory = (req, res) => {
    db.all(
        `SELECT * FROM payments ORDER BY payment_date DESC`,
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            res.json({ status: "success", data: rows });
        }
    );
};
