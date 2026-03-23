function buildDependencyGraph(routes) {
  const routeMap = new Map(routes.map(route => [`${route.method} ${route.path}`, route]));
  return routes.map(route => {
    const deps = [];
    if (route.path.includes('{id}')) {
      const collectionPath = route.path.replace(/\/\{[^/]+\}/g, '');
      const candidate = routeMap.get(`POST ${collectionPath}`);
      if (candidate) deps.push(`${candidate.method} ${candidate.path}`);
    }
    return { key: `${route.method} ${route.path}`, dependencies: deps };
  });
}
module.exports = { buildDependencyGraph };
