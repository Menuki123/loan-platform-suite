const db = require("../database/db");

exports.createGroup = (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ status: "error", message: "name is required" });
    }

    db.run(
        `INSERT INTO groups (name, description) VALUES (?, ?)`,
        [name, description || null],
        function (err) {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            res.status(201).json({ status: "success", message: "Group created", id: this.lastID });
        }
    );
};

exports.getGroups = (req, res) => {
    db.all(
        `SELECT g.*, COUNT(ugm.user_id) AS member_count
         FROM groups g
         LEFT JOIN user_group_memberships ugm ON ugm.group_id = g.id
         GROUP BY g.id
         ORDER BY g.id DESC`,
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            res.json({ status: "success", data: rows });
        }
    );
};

exports.getGroupById = (req, res) => {
    db.get(`SELECT * FROM groups WHERE id = ?`, [req.params.id], (err, group) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (!group) {
            return res.status(404).json({ status: "error", message: "Group not found" });
        }

        db.all(
            `SELECT u.id, u.full_name, u.email, u.role, ugm.created_at AS added_at
             FROM user_group_memberships ugm
             JOIN users u ON u.id = ugm.user_id
             WHERE ugm.group_id = ?
             ORDER BY u.id ASC`,
            [req.params.id],
            (memberErr, members) => {
                if (memberErr) {
                    return res.status(500).json({ status: "error", message: memberErr.message });
                }
                res.json({ status: "success", data: { ...group, members } });
            }
        );
    });
};

exports.updateGroup = (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ status: "error", message: "name is required" });
    }

    db.run(
        `UPDATE groups SET name = ?, description = ? WHERE id = ?`,
        [name, description || null, req.params.id],
        function (err) {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ status: "error", message: "Group not found" });
            }
            res.json({ status: "success", message: "Group updated", id: Number(req.params.id) });
        }
    );
};

exports.deleteGroup = (req, res) => {
    db.run(`DELETE FROM groups WHERE id = ?`, [req.params.id], function (err) {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ status: "error", message: "Group not found" });
        }
        res.json({ status: "success", message: "Group deleted", id: Number(req.params.id) });
    });
};

exports.addUserToGroup = (req, res) => {
    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({ status: "error", message: "user_id is required" });
    }

    db.get(`SELECT * FROM groups WHERE id = ?`, [req.params.id], (groupErr, group) => {
        if (groupErr) {
            return res.status(500).json({ status: "error", message: groupErr.message });
        }
        if (!group) {
            return res.status(404).json({ status: "error", message: "Group not found" });
        }

        db.get(`SELECT * FROM users WHERE id = ?`, [user_id], (userErr, user) => {
            if (userErr) {
                return res.status(500).json({ status: "error", message: userErr.message });
            }
            if (!user) {
                return res.status(404).json({ status: "error", message: "User not found" });
            }

            db.run(
                `INSERT INTO user_group_memberships (group_id, user_id) VALUES (?, ?)`,
                [req.params.id, user_id],
                function (membershipErr) {
                    if (membershipErr) {
                        const message = membershipErr.message.includes("UNIQUE")
                            ? "User is already in this group"
                            : membershipErr.message;
                        return res.status(500).json({ status: "error", message });
                    }

                    res.status(201).json({
                        status: "success",
                        message: "User added to group",
                        group_id: Number(req.params.id),
                        user_id: Number(user_id),
                        membership_id: this.lastID
                    });
                }
            );
        });
    });
};

exports.removeUserFromGroup = (req, res) => {
    db.run(
        `DELETE FROM user_group_memberships WHERE group_id = ? AND user_id = ?`,
        [req.params.id, req.params.userId],
        function (err) {
            if (err) {
                return res.status(500).json({ status: "error", message: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ status: "error", message: "Group membership not found" });
            }
            res.json({
                status: "success",
                message: "User removed from group",
                group_id: Number(req.params.id),
                user_id: Number(req.params.userId)
            });
        }
    );
};

exports.getGroupUsers = (req, res) => {
    db.get(`SELECT * FROM groups WHERE id = ?`, [req.params.id], (groupErr, group) => {
        if (groupErr) {
            return res.status(500).json({ status: "error", message: groupErr.message });
        }
        if (!group) {
            return res.status(404).json({ status: "error", message: "Group not found" });
        }

        db.all(
            `SELECT u.id, u.full_name, u.email, u.role, ugm.created_at AS added_at
             FROM user_group_memberships ugm
             JOIN users u ON u.id = ugm.user_id
             WHERE ugm.group_id = ?
             ORDER BY u.id ASC`,
            [req.params.id],
            (err, rows) => {
                if (err) {
                    return res.status(500).json({ status: "error", message: err.message });
                }
                res.json({
                    status: "success",
                    group: {
                        id: group.id,
                        name: group.name,
                        description: group.description
                    },
                    data: rows
                });
            }
        );
    });
};
