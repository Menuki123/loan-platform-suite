function exampleValue(name, schema = {}) {
  if (schema.example !== undefined) return schema.example;
  const type = schema.type || 'string';
  if (/email/i.test(name)) return 'agent@example.com';
  if (/password/i.test(name)) return 'StrongPass1';
  if (/phone/i.test(name)) return '0771234567';
  if (/nic/i.test(name)) return '200012345678';
  if (/date_of_birth/i.test(name)) return '2000-01-01';
  if (/product_type/i.test(name)) return 'PRODUCT_A';
  if (/payment_method/i.test(name)) return 'CARD';
  if (type === 'integer') return 1;
  if (type === 'number') return 1000;
  if (type === 'boolean') return true;
  if (type === 'array') return [];
  if (type === 'object') return {};
  return 'test';
}

function convertValue(value, schema = {}) {
  if (value === undefined || value === null || value === '') return undefined;
  const type = schema.type || 'string';
  if (type === 'integer') {
    const num = Number.parseInt(value, 10);
    return Number.isNaN(num) ? undefined : num;
  }
  if (type === 'number') {
    const num = Number(value);
    return Number.isNaN(num) ? undefined : num;
  }
  if (type === 'boolean') {
    if (typeof value === 'boolean') return value;
    const normalized = String(value).trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n'].includes(normalized)) return false;
    return undefined;
  }
  if (type === 'array') {
    if (Array.isArray(value)) return value;
    return String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (type === 'object') {
    if (typeof value === 'object') return value;
    try {
      return JSON.parse(value);
    } catch (_err) {
      return undefined;
    }
  }
  return value;
}

function generatePayload(schema) {
  if (!schema || !schema.properties) return {};
  const payload = {};
  for (const [name, prop] of Object.entries(schema.properties)) payload[name] = exampleValue(name, prop);
  return payload;
}

function buildPayloadFromRecord(schema, record = {}) {
  if (!schema || !schema.properties || !record || typeof record !== 'object') return {};

  const payload = {};
  for (const [name, prop] of Object.entries(schema.properties)) {
    const recordValue = record[name];
    const converted = convertValue(recordValue, prop);
    if (converted !== undefined) {
      payload[name] = converted;
    }
  }
  return payload;
}

function mergePayloads(basePayload = {}, dataPayload = {}) {
  return { ...basePayload, ...dataPayload };
}

module.exports = { generatePayload, buildPayloadFromRecord, mergePayloads };
