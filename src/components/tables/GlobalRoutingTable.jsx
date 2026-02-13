import React from 'react';
import { useSimulation } from '../../context/SimulationContext.jsx';
import { INFINITY } from '../../utils/algorithm.js';

export const GlobalRoutingTable = () => {
  const { state } = useSimulation();
  const { topology, simulation } = state;
  const sortedNodes = [...topology.nodes].sort((a, b) => a.label.localeCompare(b.label));
  const modeLabel = simulation.routingMode === 'ospf' ? 'OSPF' : 'Distance Vector';

  return (
    <div className="p-4 h-full overflow-auto bg-white">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">Global Routing Matrix</span>
        <span className={`text-[10px] px-2 py-0.5 rounded ${simulation.routingMode === 'ospf' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
          {modeLabel}
        </span>
      </div>
      <table className="w-full text-sm border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border border-gray-300 bg-gray-50 text-left min-w-[60px]">From \ To</th>
            {sortedNodes.map(node => (
              <th key={node.id} className="p-2 border border-gray-300 bg-gray-50 font-semibold text-center min-w-[50px]">
                {node.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedNodes.map(sourceNode => (
            <tr key={sourceNode.id} className="hover:bg-gray-50">
              <td className="p-2 border border-gray-300 font-semibold bg-gray-50">
                {sourceNode.label}
              </td>
              {sortedNodes.map(targetNode => {
                const nodeState = simulation.nodeStates[sourceNode.id];
                if (!nodeState) {
                  return <td key={targetNode.id} className="p-2 border border-gray-300 text-center text-gray-400">-</td>;
                }
                const entry = nodeState.routingTable[targetNode.id];
                if (!entry) {
                  return <td key={targetNode.id} className="p-2 border border-gray-300 text-center text-gray-400">?</td>;
                }
                const isInfinite = entry.cost >= INFINITY;
                const nextHopId = entry.nextHop;
                const nextHopLabel = nextHopId ? topology.nodes.find(n => n.id === nextHopId)?.label : '';
                return (
                  <td key={targetNode.id} className="p-2 border border-gray-300 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <span className={`font-medium ${isInfinite ? 'text-gray-400' : 'text-gray-900'}`}>
                        {isInfinite ? '∞' : entry.cost}
                      </span>
                      {!isInfinite && sourceNode.id !== targetNode.id && (
                        <span className="text-[10px] text-gray-500">
                          via {nextHopLabel || '-'}
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
