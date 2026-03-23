async function evaluateResponse(route, response) {
    const statusCode = response?.status || response?.statusCode || 500;
    const message = response?.data?.message || response?.message || null;

    if (statusCode >= 200 && statusCode < 300) {
        return {
            result: 'PASS',
            reason: `Endpoint ${route.method} ${route.path} responded with success status ${statusCode}${message ? ` and message: ${message}` : ''}.`
        };
    }

    if (statusCode >= 400 && statusCode < 500) {
        return {
            result: 'FAIL',
            reason: `Endpoint ${route.method} ${route.path} returned client error ${statusCode}${message ? ` with message: ${message}` : ''}. This usually means validation or business-rule checks rejected the payload.`
        };
    }

    return {
        result: 'REVIEW',
        reason: `Endpoint ${route.method} ${route.path} returned unexpected status ${statusCode}${message ? ` with message: ${message}` : ''}. Further review is needed.`
    };
}

module.exports = { evaluateResponse };
