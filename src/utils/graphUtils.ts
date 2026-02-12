import { Node, Link, NetworkTopology } from '../types/network';
import { v4 as uuidv4 } from 'uuid';

export const createNode = (label: string, x: number, y: number): Node => {
  return {
    id: uuidv4(),
    label,
    x,
    y,
  };
};

export const createLink = (sourceId: string, targetId: string, cost: number): Link => {
  return {
    id: uuidv4(),
    source: sourceId,
    target: targetId,
    cost,
  };
};

export const getNeighbors = (nodeId: string, links: Link[]): { nodeId: string; cost: number }[] => {
  const neighbors: { nodeId: string; cost: number }[] = [];
  links.forEach((link) => {
    if (link.source === nodeId) {
      neighbors.push({ nodeId: link.target, cost: link.cost });
    } else if (link.target === nodeId) {
      neighbors.push({ nodeId: link.source, cost: link.cost });
    }
  });
  return neighbors;
};

export const findLink = (sourceId: string, targetId: string, links: Link[]): Link | undefined => {
  return links.find(
    (l) => (l.source === sourceId && l.target === targetId) || (l.source === targetId && l.target === sourceId)
  );
};
