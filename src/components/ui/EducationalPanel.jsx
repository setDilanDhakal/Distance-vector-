import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from './Card.jsx';
import { Button } from './Button.jsx';
import { useSimulation } from '../../context/SimulationContext.jsx';
import { createNode, createLink } from '../../utils/graphUtils.js';

export const EducationalPanel = () => {
  const [activeTab, setActiveTab] = useState('theory');
  const { state, dispatch } = useSimulation();
  const mode = state.simulation.routingMode || 'dv';

  const loadCountToInfinityDemo = () => {
    const nodeA = createNode('A', 100, 200);
    const nodeB = createNode('B', 300, 200);
    const nodeC = createNode('C', 500, 200);
    const nodes = [nodeA, nodeB, nodeC];
    const links = [
      createLink(nodeA.id, nodeB.id, 1),
      createLink(nodeB.id, nodeC.id, 1)
    ];
    dispatch({ type: 'LOAD_TOPOLOGY', payload: { nodes, links } });
    dispatch({ type: 'RESET_SIMULATION' });
  };

  const loadOspfDemo = () => {
    const nodeA = createNode('A', 120, 180);
    const nodeB = createNode('B', 320, 120);
    const nodeC = createNode('C', 520, 180);
    const nodeD = createNode('D', 320, 300);
    const nodes = [nodeA, nodeB, nodeC, nodeD];
    const links = [
      createLink(nodeA.id, nodeB.id, 2),
      createLink(nodeB.id, nodeC.id, 2),
      createLink(nodeA.id, nodeD.id, 5),
      createLink(nodeD.id, nodeC.id, 1),
      createLink(nodeB.id, nodeD.id, 3)
    ];
    dispatch({ type: 'LOAD_TOPOLOGY', payload: { nodes, links } });
    dispatch({ type: 'RESET_SIMULATION' });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-2 border-b bg-slate-50">
        <div className="flex items-center gap-2">
          <button
            className={`px-3 py-1 text-sm font-medium rounded-md ${activeTab === 'theory' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('theory')}
          >
            Theory
          </button>
          <button
            className={`px-3 py-1 text-sm font-medium rounded-md ${activeTab === 'code' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('code')}
          >
            Pseudocode
          </button>
          <button
            className={`px-3 py-1 text-sm font-medium rounded-md ${activeTab === 'demo' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('demo')}
          >
            Scenarios
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 text-sm leading-relaxed text-gray-700">
        {activeTab === 'theory' && mode === 'dv' && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">Distance Vector Routing</h3>
            <p>
              Distance Vector routing protocols determine the best path for data packets based on distance.
              They use the <strong>Bellman-Ford algorithm</strong> to calculate paths.
            </p>
            <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
              <h4 className="font-semibold text-blue-800 mb-1">Key Concepts:</h4>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Each router maintains a table (vector) of minimum distances to every destination.</li>
                <li>Routers periodically share their tables with immediate neighbors.</li>
                <li>"I tell my neighbors what I know about the world."</li>
              </ul>
            </div>
            <p>
              <strong>Update Rule:</strong> If a neighbor offers a path to a destination that is shorter than the current path,
              update the routing table to use that neighbor as the next hop.
            </p>
            <p className="font-mono text-xs bg-gray-100 p-2 rounded">
              Dx(y) = min &#123; c(x,v) + Dv(y) &#125; for each neighbor v
            </p>
          </div>
        )}

        {activeTab === 'theory' && mode === 'ospf' && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">OSPF (Open Shortest Path First)</h3>
            <p>
              OSPF is a <strong>link-state</strong> routing protocol. Each router learns the full topology by exchanging
              <strong> Link-State Advertisements (LSAs)</strong> with neighbors and builds a <strong>Link-State Database (LSDB)</strong>.
              Shortest paths are computed using the <strong>Dijkstra (SPF)</strong> algorithm.
            </p>
            <div className="bg-indigo-50 p-3 rounded-md border border-indigo-100">
              <h4 className="font-semibold text-indigo-800 mb-1">Key Concepts:</h4>
              <ul className="list-disc list-inside space-y-1 text-indigo-700">
                <li>Routers flood LSAs so all nodes learn the same topology.</li>
                <li>The LSDB represents the graph of routers and weighted links.</li>
                <li>Each router runs SPF to compute next hops and costs to all destinations.</li>
              </ul>
            </div>
            <p>
              <strong>Update Rule:</strong> On receiving a newer LSA, update the LSDB, flood it to neighbors, and rerun SPF to refresh routes.
            </p>
          </div>
        )}

        {activeTab === 'code' && mode === 'dv' && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">Bellman-Ford Logic</h3>
            <pre className="bg-slate-900 text-slate-300 p-3 rounded-md text-xs font-mono overflow-x-auto">
{`// For each node x:
Initialization:
  for all destinations y in N:
    Dx(y) = c(x,y)  // if y is neighbor
    Dx(y) = ∞       // otherwise
    Dx(x) = 0

Loop:
  wait (until link cost change or neighbor update)
  
  for each neighbor v:
    // If neighbor v sent new distance vector Dv
    for each destination y:
      new_cost = c(x,v) + Dv(y)
      if new_cost < Dx(y):
        Dx(y) = new_cost
        next_hop(y) = v
        notify_neighbors()
`}
            </pre>
          </div>
        )}

        {activeTab === 'code' && mode === 'ospf' && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">OSPF SPF (Dijkstra)</h3>
            <pre className="bg-slate-900 text-slate-300 p-3 rounded-md text-xs font-mono overflow-x-auto">
{`// On LSA reception:
if is_newer(LSA):
  LSDB.update(LSA)
  flood_to_neighbors(LSA)
  SPF()

// SPF for router s:
for all nodes u:
  dist[u] = ∞; prev[u] = null
dist[s] = 0
while exists unvisited u:
  u = argmin_unvisited(dist)
  mark_visited(u)
  for each neighbor v of u:
    alt = dist[u] + cost(u,v)
    if alt < dist[v]:
      dist[v] = alt
      prev[v] = u
// next_hop(d) = first hop on path s→...→d from prev[]`}
            </pre>
          </div>
        )}

        {activeTab === 'demo' && mode === 'dv' && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">Interactive Demonstrations</h3>
            <div className="border rounded-md p-3">
              <h4 className="font-semibold text-gray-800">Count-to-Infinity Problem</h4>
              <p className="mb-3 text-xs text-gray-600">
                Demonstrates how routing loops form when a link breaks.
                A and B act as if they can reach C through each other, incrementally increasing cost to infinity.
              </p>
              <Button size="sm" onClick={loadCountToInfinityDemo}>
                Load Scenario (A-B-C)
              </Button>
              <div className="mt-2 text-xs bg-yellow-50 p-2 text-yellow-800 rounded">
                <strong>Steps to reproduce:</strong>
                <ol className="list-decimal list-inside mt-1">
                  <li>Run simulation until convergence (tables stable).</li>
                  <li>Select the link between B and C.</li>
                  <li>Click "Delete" or set cost to 99 (infinity).</li>
                  <li>Step through slowly to see A and B bouncing updates.</li>
                </ol>
              </div>
            </div>
            
          </div>
        )}

        {activeTab === 'demo' && mode === 'ospf' && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">Interactive Demonstrations</h3>
            <div className="border rounded-md p-3">
              <h4 className="font-semibold text-gray-800">LSA Flood and SPF Recompute</h4>
              <p className="mb-3 text-xs text-gray-600">
                Shows how a new link or cost change triggers LSAs, updates the LSDB, and recomputes shortest paths.
              </p>
              <Button size="sm" onClick={loadOspfDemo}>
                Load Sample Topology (A-B-C-D)
              </Button>
              <div className="mt-2 text-xs bg-indigo-50 p-2 text-indigo-800 rounded">
                <strong>Try:</strong>
                <ol className="list-decimal list-inside mt-1">
                  <li>Run step or auto to compute SPF.</li>
                  <li>Select a link and change its cost.</li>
                  <li>Step again to see tables and next hops update immediately.</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
