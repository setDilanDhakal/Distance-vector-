import { getNeighbors } from './graphUtils.js';

export const INFINITY = 99;

export const initializeNodeState = (nodeId, topology) => {
  const neighbors = getNeighbors(nodeId, topology.links);
  const routingTable = {};

  topology.nodes.forEach((node) => {
    if (node.id === nodeId) {
      routingTable[node.id] = { destination: node.id, cost: 0, nextHop: nodeId };
    } else {
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

export const runDistanceVectorStep = (topology, currentStates) => {
  const nextStates = {};
  const messages = [];

  Object.keys(currentStates).forEach((key) => {
    nextStates[key] = JSON.parse(JSON.stringify(currentStates[key]));
    Object.values(nextStates[key].routingTable).forEach(entry => entry.changed = false);
  });

  topology.nodes.forEach((receiver) => {
    const receiverState = nextStates[receiver.id];
    const neighbors = getNeighbors(receiver.id, topology.links);

    neighbors.forEach(({ nodeId: senderId, cost: linkCost }) => {
      const senderState = currentStates[senderId];

      Object.keys(senderState.routingTable).forEach((destId) => {
        const senderEntry = senderState.routingTable[destId];

        const advertisedCost = senderEntry.cost;

        const newCost = Math.min(linkCost + advertisedCost, INFINITY);
        const currentEntry = receiverState.routingTable[destId];

        let shouldUpdate = false;
        if (currentEntry.nextHop === senderId) {
          if (currentEntry.cost !== newCost) {
            shouldUpdate = true;
          }
        } else {
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
        }
      });
    });
  });

  return { nextStates, messages };
};
