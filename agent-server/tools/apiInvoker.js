const axios = require('axios');

async function invokeApi(baseUrl, route, payload) {
  const finalPath = route.path.replace(/\{id\}/g, '1').replace(/\{loanId\}/g, '1').replace(/\{section\}/g, 'personal');
  try {
    const res = await axios({ method: route.method, url: `${baseUrl}${finalPath}`, data: payload, validateStatus: () => true, timeout: 10000 });
    return { status: res.status, data: res.data };
  } catch (error) {
    return { status: error.response?.status || 500, data: error.response?.data || { message: error.message } };
  }
}

module.exports = { invokeApi };
