import * as PriorityQueue from "fastpriorityqueue";

import { StreetNode } from "./node";

export type Direction = {
  node: StreetNode;

  message: string;
};

export class NavigationPath {
  public nodes: Array<StreetNode> = [];

  public constructor() {}

  public getDirections(): Array<Direction> {
    const directions: Array<Direction> = [];

    // TODO: take out "straight" directions, figure out sides, etc.
    for (const node of this.nodes) {
      directions.push({
        node,
        message: "dunno",
      });
    }

    return directions;
  }
}

export function navigateBetweenStreetNodes(
  from: StreetNode,
  to: StreetNode
): NavigationPath {
  // Implements A* algorithm

  // because the target street node might not be in the graph itself, we accept its neighbors as well
  const targets = new Set<StreetNode>([
    to,
    ...to.edges().map(({ neighbor }) => neighbor),
  ]);

  const heuristic = (node: StreetNode) => {
    // use manhattan distance to `to`
    return (
      Math.abs(node.value.x - to.value.x) + Math.abs(node.value.y - to.value.y)
    );
  };

  const cameFrom = new Map<StreetNode, StreetNode>();
  const fromStartScore = new Map<StreetNode, number>([[from, 0]]);
  const bestGuessScore = new PriorityQueue<[StreetNode, number]>(
    (a, b) => a[1] > b[1]
  );

  bestGuessScore.add([from, heuristic(from)]);

  let iterations = 0;
  while (bestGuessScore.size > 0) {
    iterations++;
    const current = bestGuessScore.poll();

    if (targets.has(current[0])) {
      const path = new NavigationPath();

      let node = current[0];

      while (node !== from) {
        path.nodes.unshift(node);
        node = cameFrom.get(node) ?? from;
      }

      path.nodes.unshift(from);
      path.nodes.reverse();

      return path;
    }

    for (const { neighbor, streetName } of current[0].edges()) {
      // TODO: consider things like left turns
      const newScore = current[1] + neighbor.value.distanceTo(current[0].value);

      const oldScore = fromStartScore.get(neighbor) ?? Infinity;
      if (newScore < oldScore) {
        fromStartScore.set(neighbor, newScore);
        cameFrom.set(neighbor, current[0]);
        // re-set the priority of the node in the best guess priority queue.
        // there doesn't seem to be a way to do this atomically but I don't
        // think it matters.
        bestGuessScore.removeOne(([node, _score]) => {
          return node === neighbor;
        });

        bestGuessScore.add([neighbor, newScore + heuristic(neighbor)]);
      }
    }
  }

  throw new Error(`Could not find path after ${iterations} iterations`);
}
