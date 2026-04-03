const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'chat-history.db');
const db = new sqlite3.Database(dbPath);

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

async function ensureColumn(tableName, columnName, definition) {
  const columns = await allAsync(`PRAGMA table_info(${tableName})`);
  const exists = columns.some((column) => column.name === columnName);
  if (!exists) {
    await runAsync(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

const initPromise = (async () => {
  await runAsync(`
    CREATE TABLE IF NOT EXISTS session_configs (
      session_id TEXT PRIMARY KEY,
      swagger_url TEXT,
      api_base_url TEXT,
      max_routes INTEGER,
      workflow_status TEXT DEFAULT 'DRAFT',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      message_type TEXT NOT NULL,
      content TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await ensureColumn('session_configs', 'swagger_url', 'TEXT');
  await ensureColumn('session_configs', 'api_base_url', 'TEXT');
  await ensureColumn('session_configs', 'max_routes', 'INTEGER');
  await ensureColumn('session_configs', 'workflow_status', `TEXT DEFAULT 'DRAFT'`);
  await ensureColumn('session_configs', 'created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
  await ensureColumn('session_configs', 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');
})();

async function ensureSession(sessionId, defaults = {}) {
  await initPromise;

  const existing = await getAsync(`SELECT session_id FROM session_configs WHERE session_id = ?`, [sessionId]);
  if (existing) return existing;

  await runAsync(
    `
      INSERT INTO session_configs (session_id, swagger_url, api_base_url, max_routes, workflow_status, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `,
    [
      sessionId,
      defaults.swaggerUrl || null,
      defaults.apiBaseUrl || null,
      defaults.maxRoutes ?? null,
      defaults.workflowStatus || 'DRAFT'
    ]
  );

  return { session_id: sessionId };
}

async function saveMessage({ sessionId, role, messageType, content = '', metadata = null }) {
  await initPromise;
  await ensureSession(sessionId);
  const result = await runAsync(
    `INSERT INTO conversations (session_id, role, message_type, content, metadata) VALUES (?, ?, ?, ?, ?)`,
    [sessionId, role, messageType, content, metadata ? JSON.stringify(metadata) : null]
  );
  return { id: result.lastID };
}

async function saveSessionConfig({ sessionId, swaggerUrl, apiBaseUrl = null, maxRoutes = null, workflowStatus = 'DRAFT' }) {
  await initPromise;
  await runAsync(
    `
      INSERT INTO session_configs (session_id, swagger_url, api_base_url, max_routes, workflow_status, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(session_id) DO UPDATE SET
        swagger_url=excluded.swagger_url,
        api_base_url=excluded.api_base_url,
        max_routes=excluded.max_routes,
        workflow_status=COALESCE(session_configs.workflow_status, excluded.workflow_status),
        updated_at=CURRENT_TIMESTAMP
    `,
    [sessionId, swaggerUrl, apiBaseUrl, maxRoutes, workflowStatus]
  );
}

async function getSessionConfig(sessionId) {
  await initPromise;
  return getAsync(
    `SELECT session_id, swagger_url, api_base_url, max_routes, workflow_status, created_at, updated_at FROM session_configs WHERE session_id = ?`,
    [sessionId]
  );
}

async function updateWorkflowStatus(sessionId, workflowStatus) {
  await initPromise;
  await ensureSession(sessionId, { workflowStatus });
  await runAsync(
    `UPDATE session_configs SET workflow_status = ?, updated_at = CURRENT_TIMESTAMP WHERE session_id = ?`,
    [workflowStatus, sessionId]
  );
  return getSessionConfig(sessionId);
}

async function getConversation(sessionId) {
  await initPromise;
  const rows = await allAsync(
    `SELECT id, session_id, role, message_type, content, metadata, created_at FROM conversations WHERE session_id = ? ORDER BY id ASC`,
    [sessionId]
  );
  return rows.map((row) => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : null
  }));
}

module.exports = {
  ensureSession,
  saveMessage,
  saveSessionConfig,
  getSessionConfig,
  updateWorkflowStatus,
  getConversation
};
