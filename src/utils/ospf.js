import { INFINITY } from './algorithm.js';

export const buildAdjacency = (topology) => {
  const adj = {};
  topology.nodes.forEach(n => { adj[n.id] = []; });
  topology.links.forEach(l => {
    adj[l.source].push({ nodeId: l.target, cost: l.cost });
    adj[l.target].push({ nodeId: l.source, cost: l.cost });
  });
  return adj;
};

const dijkstra = (startId, adj) => {
  const nodes = Object.keys(adj);
  const dist = {};
  const prev = {};
  const visited = {};
  nodes.forEach(id => { dist[id] = Infinity; prev[id] = null; visited[id] = false; });
  dist[startId] = 0;
  for (let i = 0; i < nodes.length; i++) {
    let u = null;
    let min = Infinity;
    nodes.forEach(id => {
      if (!visited[id] && dist[id] < min) {
        min = dist[id];
        u = id;
      }
    });
    if (u === null) break;
    visited[u] = true;
    adj[u].forEach(({ nodeId, cost }) => {
      const alt = dist[u] + cost;
      if (alt < dist[nodeId]) {
        dist[nodeId] = alt;
        prev[nodeId] = u;
      }
    });
  }
  return { dist, prev };
};

const firstHop = (startId, destId, prev) => {
  if (startId === destId) return startId;
  let current = destId;
  if (prev[current] === null) return null;
  while (prev[current] && prev[current] !== startId) {
    current = prev[current];
  }
  return current || null;
};

export const runOSPFStep = (topology, currentStates) => {
  const adj = buildAdjacency(topology);
  const nextStates = {};
  const messages = [];
  topology.nodes.forEach(router => {
    const { dist, prev } = dijkstra(router.id, adj);
    const routingTable = {};
    Object.keys(adj).forEach(destId => {
      const d = dist[destId];
      const cost = Number.isFinite(d) ? Math.min(d, INFINITY) : INFINITY;
      const nh = cost >= INFINITY ? null : firstHop(router.id, destId, prev);
      const currentEntry = currentStates[router.id]?.routingTable?.[destId];
      const changed = !currentEntry || currentEntry.cost !== cost || currentEntry.nextHop !== nh;
      routingTable[destId] = { destination: destId, cost, nextHop: nh, changed };
      if (changed) {
        messages.push(`Node ${router.label} computed route to ${destId} via ${nh || '-'} (${cost})`);
      }
    });
    nextStates[router.id] = {
      id: router.id,
      routingTable,
      neighbors: adj[router.id].map(x => x.nodeId),
    };
  });
  return { nextStates, messages, lsdb: adj };
};

export const buildPathFromPrev = (startId, destId, prev) => {
  const path = [];
  let current = destId;
  if (current === startId) return [startId];
  if (prev[current] === null) return null;
  while (current) {
    path.unshift(current);
    if (current === startId) break;
    current = prev[current];
    if (current === null) return null;
  }
  return path;
};

const cloneAdjWithoutEdge = (adj, a, b) => {
  const out = {};
  Object.keys(adj).forEach(k => {
    out[k] = adj[k].filter(e => !( (k === a && e.nodeId === b) || (k === b && e.nodeId === a) ));
  });
  return out;
};

const pathCost = (path, adj) => {
  if (!path || path.length < 2) return Infinity;
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const u = path[i];
    const v = path[i + 1];
    const edge = adj[u].find(e => e.nodeId === v);
    if (!edge) return Infinity;
    total += edge.cost;
  }
  return total;
};

export const computeSecondBestPath = (topology, sourceId, destId) => {
  const adj = buildAdjacency(topology);
  const { dist, prev } = dijkstra(sourceId, adj);
  const bestPath = buildPathFromPrev(sourceId, destId, prev);
  if (!bestPath) return null;
  let bestAlt = null;
  let bestAltCost = Infinity;
  for (let i = 0; i < bestPath.length - 1; i++) {
    const a = bestPath[i];
    const b = bestPath[i + 1];
    const adj2 = cloneAdjWithoutEdge(adj, a, b);
    const { prev: prev2 } = dijkstra(sourceId, adj2);
    const altPath = buildPathFromPrev(sourceId, destId, prev2);
    const cost = pathCost(altPath, adj);
    if (altPath && cost < bestAltCost) {
      bestAlt = altPath;
      bestAltCost = cost;
    }
  }
  return bestAlt;
};
