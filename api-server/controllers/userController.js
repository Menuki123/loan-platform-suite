const db = require("../database/db");

exports.createUser = (req, res) => {
    const { full_name, email, role } = req.body;

    if (!full_name || !email) {
        return res.status(400).json({
            status: "error",
            message: "full_name and email are required"
        });
    }

    db.run(
        `INSERT INTO users (full_name, email, role) VALUES (?, ?, ?)`,
        [full_name, email, role || null],
        function (err) {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            res.status(201).json({ status: "success", message: "User created", id: this.lastID });
        }
    );
};

exports.getUsers = (req, res) => {
    db.all(`SELECT * FROM users ORDER BY id DESC`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        res.json({ status: "success", data: rows });
    });
};

exports.getUserById = (req, res) => {
    db.get(`SELECT * FROM users WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (!row) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }
        res.json({ status: "success", data: row });
    });
};

exports.updateUser = (req, res) => {
    const { full_name, email, role } = req.body;

    if (!full_name || !email) {
        return res.status(400).json({
            status: "error",
            message: "full_name and email are required"
        });
    }

    db.run(
        `UPDATE users SET full_name = ?, email = ?, role = ? WHERE id = ?`,
        [full_name, email, role || null, req.params.id],
        function (err) {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ status: "error", message: "User not found" });
            }
            res.json({ status: "success", message: "User updated", id: Number(req.params.id) });
        }
    );
};

exports.deleteUser = (req, res) => {
    db.run(`DELETE FROM users WHERE id = ?`, [req.params.id], function (err) {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }
        res.json({ status: "success", message: "User deleted", id: Number(req.params.id) });
    });
};
