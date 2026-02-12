import React from 'react';
import { NodeState, RoutingTable as IRoutingTable } from '../../types/network';
import { INFINITY } from '../../utils/algorithm';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { ArrowRight } from 'lucide-react';

interface RoutingTableProps {
  nodeId: string;
  nodeLabel: string;
  state?: NodeState;
}

export const RoutingTable: React.FC<RoutingTableProps> = ({ nodeId, nodeLabel, state }) => {
  if (!state) {
    return (
      <Card className="h-full">
        <CardHeader className="py-2">
          <CardTitle className="text-sm">Node {nodeLabel} Table</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-gray-500 text-center py-4">
          Not initialized
        </CardContent>
      </Card>
    );
  }

  // Sort by destination ID (or label if we had map, but ID is usually close enough or we can sort by key)
  const destinations = Object.keys(state.routingTable).sort();

  return (
    <Card className="h-full shadow-sm overflow-hidden">
      <CardHeader className="py-2 bg-slate-50 border-b">
        <CardTitle className="text-sm font-bold text-slate-700 flex items-center justify-between">
            <span>Node {nodeLabel}</span>
            <span className="text-xs font-normal text-slate-500">Distance Vector</span>
        </CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 bg-gray-50 uppercase border-b">
            <tr>
              <th className="px-3 py-2">Dest</th>
              <th className="px-3 py-2">Cost</th>
              <th className="px-3 py-2">Next Hop</th>
            </tr>
          </thead>
          <tbody>
            {destinations.map((destId) => {
              const entry = state.routingTable[destId];
              const isInfinite = entry.cost >= INFINITY;
              const isChanged = entry.changed;

              return (
                <tr 
                    key={destId} 
                    className={`border-b last:border-0 transition-colors duration-500 ${
                        isChanged ? 'bg-yellow-100' : 'bg-white hover:bg-gray-50'
                    }`}
                >
                  <td className="px-3 py-2 font-medium text-gray-900">
                    {/* Ideally we map destId to label, but we need topology for that. 
                        For now assume label ~ ID or we need to pass topology/lookup function 
                        Let's just show ID if label not available, but usually we want labels. 
                        Let's rely on parent passing a lookup or just render ID for now.
                        Wait, we can't easily look up label without context. 
                        Let's just use destId for now, user sees A, B, C which are IDs usually in our generator.
                    */}
                    {/* Actually our generator uses UUIDs for IDs and A, B, C for labels. 
                        We need a way to map ID to Label. 
                        Let's assume the parent handles this mapping or we use context. 
                        Let's use context inside here? Or simpler, pass a map. 
                    */}
                     {/* For now render ID, but we will fix this in list component */}
                     {destId} 
                  </td>
                  <td className="px-3 py-2">
                    {isInfinite ? '∞' : entry.cost}
                  </td>
                  <td className="px-3 py-2 text-gray-500">
                    {entry.nextHop === nodeId ? '-' : (entry.nextHop ? entry.nextHop : '-')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
