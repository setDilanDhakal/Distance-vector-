import { NetworkTopology, NodeState, RoutingTable, AlgorithmType, RouteEntry } from '../types/network';
import { getNeighbors } from './graphUtils';

export const INFINITY = 99; // Using a small infinity for visualization purposes, or typically 16 in RIP

export const initializeNodeState = (nodeId: string, topology: NetworkTopology): NodeState => {
  const neighbors = getNeighbors(nodeId, topology.links);
  const routingTable: RoutingTable = {};

  // Initialize table: 
  // Distance to self = 0
  // Distance to direct neighbors = link cost (Warm Start)
  // Others = Infinity
  
  topology.nodes.forEach((node) => {
    if (node.id === nodeId) {
      routingTable[node.id] = { destination: node.id, cost: 0, nextHop: nodeId };
    } else {
      // Check if neighbor
      const neighbor = neighbors.find(n => n.nodeId === node.id);
      if (neighbor) {
          routingTable[node.id] = { destination: node.id, cost: neighbor.cost, nextHop: node.id };
      } else {
          routingTable[node.id] = { destination: node.id, cost: INFINITY, nextHop: null };
      }
    }
  });

  return {
    id: nodeId,
    routingTable,
    neighbors: neighbors.map(n => n.nodeId),
  };
};

export const runDistanceVectorStep = (
  topology: NetworkTopology,
  currentStates: { [nodeId: string]: NodeState },
  algorithm: AlgorithmType
): { nextStates: { [nodeId: string]: NodeState }; messages: string[] } => {
  const nextStates: { [nodeId: string]: NodeState } = {};
  const messages: string[] = [];
  let hasChanges = false;

  // Clone current states to avoid mutation
  Object.keys(currentStates).forEach((key) => {
    nextStates[key] = JSON.parse(JSON.stringify(currentStates[key]));
    // Reset changed flag
    Object.values(nextStates[key].routingTable).forEach(entry => entry.changed = false);
  });

  // For each node (receiver)
  topology.nodes.forEach((receiver) => {
    const receiverState = nextStates[receiver.id];
    const neighbors = getNeighbors(receiver.id, topology.links);

    // For each neighbor (sender)
    neighbors.forEach(({ nodeId: senderId, cost: linkCost }) => {
      const senderState = currentStates[senderId];
      
      // Iterate through sender's routing table (Distance Vectors)
      Object.keys(senderState.routingTable).forEach((destId) => {
        const senderEntry = senderState.routingTable[destId];
        
        // Split Horizon / Poisoned Reverse Logic
        // If sender uses receiver as next hop to reach dest, sender should not advertise this route back to receiver
        // Or advertise as infinite (Poisoned Reverse)
        
        let advertisedCost = senderEntry.cost;

        if (senderEntry.nextHop === receiver.id && destId !== senderId) { // Don't poison route to self
             if (algorithm === 'split-horizon') {
                 // Do not advertise
                 return; 
             } else if (algorithm === 'poisoned-reverse') {
                 advertisedCost = INFINITY;
             }
        }

        const newCost = Math.min(linkCost + advertisedCost, INFINITY);
        const currentEntry = receiverState.routingTable[destId];

        // Bellman-Ford update rule
        // Update if:
        // 1. Found a shorter path
        // 2. The current next hop reports a change (cost increase/decrease) - strictly follow next hop's update
        
        // Note: In strict Bellman-Ford/RIP, if the update comes from the current nextHop, we MUST adopt it even if it's worse.
        // If it comes from a different neighbor, we only adopt it if it's better.

        let shouldUpdate = false;

        if (currentEntry.nextHop === senderId) {
             // Update from current next hop
             if (currentEntry.cost !== newCost) {
                 shouldUpdate = true;
             }
        } else {
            // Update from a different neighbor (only if better)
            if (newCost < currentEntry.cost) {
                shouldUpdate = true;
            }
        }

        if (shouldUpdate) {
            receiverState.routingTable[destId] = {
                destination: destId,
                cost: newCost,
                nextHop: senderId,
                changed: true
            };
            messages.push(`Node ${receiver.label} updated route to ${destId} via ${senderId} (Cost: ${newCost})`);
            hasChanges = true;
        }
      });
    });
  });

  return { nextStates, messages };
};
