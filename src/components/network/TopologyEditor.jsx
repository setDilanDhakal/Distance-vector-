import React, { useState, useCallback } from 'react';
import { NetworkGraph } from './NetworkGraph.jsx';
import { Button } from '../ui/Button.jsx';
import { Card, CardContent } from '../ui/Card.jsx';
import { Plus, MousePointer2, Network, Trash2 } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext.jsx';
import { PacketSender } from '../controls/PacketSender.jsx';

export const TopologyEditor = () => {
  const [mode, setMode] = useState('view');
  const { state, dispatch } = useSimulation();
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedLinkId, setSelectedLinkId] = useState(null);

  const handleNodeClick = useCallback((nodeId) => {
    setSelectedNodeId(nodeId);
    setSelectedLinkId(null);
  }, []);

  const handleLinkClick = useCallback((linkId) => {
    setSelectedLinkId(linkId);
    setSelectedNodeId(null);
  }, []);

  const handleDelete = () => {
    if (selectedNodeId) {
      dispatch({ type: 'DELETE_NODE', payload: selectedNodeId });
      setSelectedNodeId(null);
    } else if (selectedLinkId) {
      dispatch({ type: 'DELETE_LINK', payload: selectedLinkId });
      setSelectedLinkId(null);
    }
  };

  const handleUpdateCost = (value) => {
    if (selectedLinkId) {
      const cost = parseInt(value);
      if (!isNaN(cost)) {
        dispatch({ type: 'UPDATE_LINK_COST', payload: { id: selectedLinkId, cost } });
      }
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex flex-wrap gap-4">
        <Card className="flex-none">
          <CardContent className="p-2 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 border-r pr-2 mr-2">
              <Button
                variant={mode === 'view' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setMode('view')}
                title="Select / Move"
              >
                <MousePointer2 className="w-4 h-4 mr-1" />
                Select
              </Button>
              <Button
                variant={mode === 'add-node' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setMode('add-node')}
                title="Add Node"
              >
                <Plus className="w-4 h-4 mr-1" />
                Node
              </Button>
              <Button
                variant={mode === 'add-link' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setMode('add-link')}
                title="Add Link"
              >
                <Network className="w-4 h-4 mr-1" />
                Link
              </Button>
            </div>

            <div className="flex items-center gap-2 flex-1">
              {(selectedNodeId || selectedLinkId) && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                  <span className="text-sm font-medium text-gray-500">
                    Selected: {selectedNodeId ? 'Node' : 'Link'}
                  </span>

                  {selectedLinkId && (
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-600">Cost:</span>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        className="w-16 px-2 py-1 text-sm border rounded"
                        value={state.topology.links.find(l => l.id === selectedLinkId)?.cost?.toString() || ''}
                        onChange={(e) => handleUpdateCost(e.target.value)}
                      />
                    </div>
                  )}

                  <Button variant="danger" size="sm" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              )}
            </div>

            <div className="text-sm text-gray-400">
              {state.topology.nodes.length} Nodes, {state.topology.links.length} Links
            </div>
          </CardContent>
        </Card>

        <PacketSender />
      </div>

      <div className="flex-1 min-h-[400px]">
        <NetworkGraph
          mode={mode}
          onNodeClick={handleNodeClick}
          onLinkClick={handleLinkClick}
        />
      </div>
    </div>
  );
};
