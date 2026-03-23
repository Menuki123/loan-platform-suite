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

function generatePayload(schema) {
  if (!schema || !schema.properties) return {};
  const payload = {};
  for (const [name, prop] of Object.entries(schema.properties)) payload[name] = exampleValue(name, prop);
  return payload;
}

module.exports = { generatePayload };
