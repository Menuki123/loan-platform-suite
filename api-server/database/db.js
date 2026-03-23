const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./loan.db", (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
    } else {
        console.log("Connected to database");
    }
});

db.serialize(() => {
    db.run("PRAGMA foreign_keys = ON");

    db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      nic TEXT UNIQUE,
      password_hash TEXT,
      phone TEXT,
      date_of_birth TEXT,
      employment_type TEXT,
      monthly_income REAL DEFAULT 0,
      monthly_expenses REAL DEFAULT 0,
      credit_score INTEGER DEFAULT 0,
      residency_status TEXT,
      business_turnover REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      product_type TEXT NOT NULL,
      loan_amount REAL NOT NULL,
      interest_rate REAL NOT NULL,
      loan_term_months INTEGER NOT NULL,
      total_payable REAL NOT NULL,
      total_paid REAL DEFAULT 0,
      balance_remaining REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUBMITTED', 'APPROVED', 'DISBURSED')),
      workflow_enabled INTEGER NOT NULL DEFAULT 1 CHECK (workflow_enabled IN (0, 1)),
      registry_reference TEXT,
      redirected_group_id INTEGER,
      approved_by INTEGER,
      approved_at TEXT,
      disbursed_at TEXT,
      submitted_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(customer_id) REFERENCES customers(id),
      FOREIGN KEY(redirected_group_id) REFERENCES groups(id),
      FOREIGN KEY(approved_by) REFERENCES users(id)
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL,
      payment_amount REAL NOT NULL,
      payment_date TEXT DEFAULT CURRENT_TIMESTAMP,
      payment_method TEXT NOT NULL,
      reference_number TEXT,
      FOREIGN KEY(loan_id) REFERENCES loans(id)
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_name TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS user_group_memberships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(group_id, user_id),
      FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);


    db.run(`
    CREATE TABLE IF NOT EXISTS application_forms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL UNIQUE,
      customer_id INTEGER NOT NULL,
      personal TEXT,
      address TEXT,
      contact TEXT,
      education TEXT,
      income TEXT,
      expense TEXT,
      obligations TEXT,
      assets TEXT,
      insurance TEXT,
      business TEXT,
      guarantors TEXT,
      joint_borrowers TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(loan_id) REFERENCES loans(id) ON DELETE CASCADE,
      FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS validation_registry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER,
      customer_id INTEGER NOT NULL,
      product_type TEXT NOT NULL,
      validation_stage TEXT DEFAULT 'submission',
      decision TEXT NOT NULL,
      reason_summary TEXT,
      debt_to_income_ratio REAL,
      credit_score_snapshot INTEGER,
      registry_reference TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(loan_id) REFERENCES loans(id) ON DELETE SET NULL,
      FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )
  `);

    const customerColumns = [
        ["nic", "TEXT"],
        ["password_hash", "TEXT"]
    ];

    customerColumns.forEach(([name, type]) => {
        db.run(`ALTER TABLE customers ADD COLUMN ${name} ${type}`, () => {});
    });

    const loanColumns = [
        ["workflow_enabled", "INTEGER NOT NULL DEFAULT 1 CHECK (workflow_enabled IN (0, 1))"],
        ["registry_reference", "TEXT"],
        ["redirected_group_id", "INTEGER"],
        ["approved_by", "INTEGER"],
        ["approved_at", "TEXT"],
        ["disbursed_at", "TEXT"],
        ["submitted_at", "TEXT"]
    ];

    loanColumns.forEach(([name, type]) => {
        db.run(`ALTER TABLE loans ADD COLUMN ${name} ${type}`, () => {});
    });

    db.run(`ALTER TABLE validation_registry ADD COLUMN validation_stage TEXT DEFAULT 'submission'`, () => {});
});

module.exports = db;
