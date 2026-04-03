const axios = require('axios');

function replacePathParams(path, context = {}) {
  const replacements = {
    id: context.id ?? context.loanId ?? context.loan_id ?? 1,
    loanId: context.loanId ?? context.loan_id ?? context.id ?? 1,
    customerId: context.customerId ?? context.customer_id ?? 1,
    section: context.section ?? 'personal'
  };

  return path.replace(/\{([^}]+)\}/g, (_match, key) => {
    const value = replacements[key] ?? context[key] ?? 1;
    return encodeURIComponent(String(value));
  });
}

async function invokeApi(baseUrl, route, payload, pathContext = {}) {
  const finalPath = replacePathParams(route.path, pathContext);
  try {
    const res = await axios({
      method: route.method,
      url: `${baseUrl}${finalPath}`,
      data: payload,
      validateStatus: () => true,
      timeout: 10000
    });
    return { status: res.status, data: res.data, finalPath };
  } catch (error) {
    return {
      status: error.response?.status || 500,
      data: error.response?.data || { message: error.message },
      finalPath
    };
  }
}

module.exports = { invokeApi, replacePathParams };
