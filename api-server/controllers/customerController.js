const db = require("../database/db");

exports.createCustomer = (req, res) => {
    const {
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        employment_type,
        monthly_income,
        monthly_expenses,
        credit_score,
        residency_status,
        business_turnover
    } = req.body;

    if (!first_name || !last_name || !email) {
        return res.status(400).json({
            status: "error",
            message: "first_name, last_name and email are required"
        });
    }

    const sql = `
    INSERT INTO customers (
      first_name, last_name, email, phone, date_of_birth,
      employment_type, monthly_income, monthly_expenses,
      credit_score, residency_status, business_turnover
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    db.run(
        sql,
        [
            first_name,
            last_name,
            email,
            phone || null,
            date_of_birth || null,
            employment_type || null,
            monthly_income || 0,
            monthly_expenses || 0,
            credit_score || 0,
            residency_status || null,
            business_turnover || 0
        ],
        function (err) {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }

            res.status(201).json({
                status: "success",
                message: "Customer created",
                id: this.lastID
            });
        }
    );
};

exports.getCustomers = (req, res) => {
    db.all("SELECT * FROM customers ORDER BY id DESC", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }

        res.json({ status: "success", data: rows });
    });
};

exports.getCustomerById = (req, res) => {
    db.get("SELECT * FROM customers WHERE id = ?", [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (!row) {
            return res.status(404).json({ status: "error", message: "Customer not found" });
        }
        res.json({ status: "success", data: row });
    });
};

exports.updateCustomer = (req, res) => {
    const {
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        employment_type,
        monthly_income,
        monthly_expenses,
        credit_score,
        residency_status,
        business_turnover
    } = req.body;

    if (!first_name || !last_name || !email) {
        return res.status(400).json({
            status: "error",
            message: "first_name, last_name and email are required"
        });
    }

    db.run(
        `UPDATE customers
         SET first_name = ?, last_name = ?, email = ?, phone = ?, date_of_birth = ?,
             employment_type = ?, monthly_income = ?, monthly_expenses = ?, credit_score = ?,
             residency_status = ?, business_turnover = ?
         WHERE id = ?`,
        [
            first_name,
            last_name,
            email,
            phone || null,
            date_of_birth || null,
            employment_type || null,
            monthly_income || 0,
            monthly_expenses || 0,
            credit_score || 0,
            residency_status || null,
            business_turnover || 0,
            req.params.id
        ],
        function (err) {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ status: "error", message: "Customer not found" });
            }
            res.json({ status: "success", message: "Customer updated", id: Number(req.params.id) });
        }
    );
};

exports.deleteCustomer = (req, res) => {
    db.run("DELETE FROM customers WHERE id = ?", [req.params.id], function (err) {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ status: "error", message: "Customer not found" });
        }
        res.json({ status: "success", message: "Customer deleted", id: Number(req.params.id) });
    });
};
