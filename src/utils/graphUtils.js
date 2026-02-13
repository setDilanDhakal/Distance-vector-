import { v4 as uuidv4 } from 'uuid';

export const createNode = (label, x, y) => {
  return {
    id: uuidv4(),
    label,
    x,
    y,
  };
};

export const createLink = (sourceId, targetId, cost) => {
  return {
    id: uuidv4(),
    source: sourceId,
    target: targetId,
    cost,
  };
};

export const getNeighbors = (nodeId, links) => {
  const neighbors = [];
  links.forEach((link) => {
    if (link.source === nodeId) {
      neighbors.push({ nodeId: link.target, cost: link.cost });
    } else if (link.target === nodeId) {
      neighbors.push({ nodeId: link.source, cost: link.cost });
    }
  });
  return neighbors;
};

export const findLink = (sourceId, targetId, links) => {
  return links.find(
    (l) => (l.source === sourceId && l.target === targetId) || (l.source === targetId && l.target === sourceId)
  );
};
