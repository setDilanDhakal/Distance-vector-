import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from './Card.jsx';
import { Button } from './Button.jsx';
import { useSimulation } from '../../context/SimulationContext.jsx';
import { createNode, createLink } from '../../utils/graphUtils.js';

export const EducationalPanel = () => {
  const [activeTab, setActiveTab] = useState('theory');
  const { dispatch } = useSimulation();

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
        {activeTab === 'theory' && (
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

        {activeTab === 'code' && (
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

        {activeTab === 'demo' && (
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
      </CardContent>
    </Card>
  );
};
