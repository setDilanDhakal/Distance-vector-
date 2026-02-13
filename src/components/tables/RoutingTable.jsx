import React from 'react';
import { INFINITY } from '../../utils/algorithm.js';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card.jsx';

export const RoutingTable = ({ nodeId, nodeLabel, state }) => {
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
                  className={`border-b last:border-0 transition-colors duration-500 ${isChanged ? 'bg-yellow-100' : 'bg-white hover:bg-gray-50'}`}
                >
                  <td className="px-3 py-2 font-medium text-gray-900">
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
