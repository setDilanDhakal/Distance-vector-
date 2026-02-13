import React from 'react';
import { useSimulation } from '../../context/SimulationContext.jsx';
import { Card } from '../ui/Card.jsx';
import { INFINITY } from '../../utils/algorithm.js';
import { ArrowRight } from 'lucide-react';

export const RoutingTableList = () => {
  const { state } = useSimulation();
  const { topology, simulation } = state;
  const { nodeStates } = simulation;
  const modeLabel = simulation.routingMode === 'ospf' ? 'OSPF' : 'Distance Vector';
  const active = simulation.activePacket;
  const activePath = active?.path || [];
  const activeDestId = activePath.length > 0 ? activePath[activePath.length - 1] : null;
  const activeStep = active?.currentStep ?? -1;

  if (topology.nodes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
        <p>No nodes in the network.</p>
        <p className="text-xs mt-2">Add nodes using the toolbar on the left.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {topology.nodes.map((node) => {
        const nodeState = nodeStates[node.id];

        const buildPathChain = (startId, destId) => {
          const labels = [];
          const visited = new Set();
          let current = startId;
          while (current && !visited.has(current)) {
            visited.add(current);
            const currentLabel = topology.nodes.find(n => n.id === current)?.label || current.substring(0, 4);
            labels.push(currentLabel);
            if (current === destId) break;
            const s = nodeStates[current];
            if (!s) break;
            const entry = s.routingTable[destId];
            if (!entry || entry.cost >= INFINITY) break;
            if (!entry.nextHop) break;
            current = entry.nextHop;
          }
          const destLabel = topology.nodes.find(n => n.id === destId)?.label || destId.substring(0, 4);
          if (labels[labels.length - 1] !== destLabel && current === destId) {
            labels[labels.length - 1] = destLabel;
          }
          return labels.join(' → ');
        };

        return (
          <Card key={node.id} className="overflow-hidden border-slate-200 shadow-sm">
            <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  {node.label}
                </div>
                <span className="font-semibold text-sm text-slate-700">Routing Table</span>
                <span className={`ml-2 text-[10px] px-2 py-0.5 rounded ${simulation.routingMode === 'ospf' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                  {modeLabel}
                </span>
              </div>
              {nodeState && (
                <span className="text-xs text-slate-400">
                  {Object.keys(nodeState.routingTable).length} Routes
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-gray-500 bg-white border-b">
                  <tr>
                    <th className="px-3 py-2 font-medium w-1/3">Dest</th>
                    <th className="px-3 py-2 font-medium w-1/3">Cost</th>
                    <th className="px-3 py-2 font-medium w-1/3">Next Hop</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {nodeState ? (
                    Object.values(nodeState.routingTable).sort((a, b) => a.destination.localeCompare(b.destination)).map((entry) => {
                      const destNode = topology.nodes.find(n => n.id === entry.destination);
                      const nextHopNode = entry.nextHop ? topology.nodes.find(n => n.id === entry.nextHop) : null;
                      const thisNodeIndex = activePath.indexOf(node.id);
                      const isActiveRow = activeDestId && entry.destination === activeDestId && thisNodeIndex >= 0 && thisNodeIndex < activePath.length - 1 && thisNodeIndex === activeStep;
                      const fullChain = buildPathChain(node.id, entry.destination);

                      return (
                        <tr key={entry.destination} className={`${entry.changed ? 'bg-emerald-50 animate-pulse' : ''} ${isActiveRow ? 'bg-blue-50' : ''}`}>
                          <td className="px-3 py-2 font-medium text-gray-900">
                            {destNode?.label || entry.destination.substring(0, 4)}
                          </td>
                          <td className="px-3 py-2">
                            {entry.cost >= INFINITY ? '∞' : entry.cost}
                          </td>
                          <td className="px-3 py-2 text-gray-500">
                            {nextHopNode ? (
                              <div className="flex items-center gap-1">
                                <ArrowRight className="w-3 h-3" />
                                {nextHopNode.label}
                                {fullChain && (
                                  <span className="ml-2 px-2 py-0.5 text-[10px] rounded bg-gray-100 text-gray-700">
                                    {fullChain}
                                  </span>
                                )}
                              </div>
                            ) : (
                              entry.cost === 0 ? '-' : 'Unknown'
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-center text-gray-400 italic">
                        Not initialized
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
