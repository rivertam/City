import * as PriorityQueue from "fastpriorityqueue";

import { StreetNode } from "./node";
import Vector from "../generation/vector";

export type Direction = {
  node: StreetNode;

  message: string;
};

export class NavigationPath {
  public nodes: Array<{ node: StreetNode; streetName: string | null }> = [];

  public constructor(
    public startDirection: Vector,
    public endDirection?: Vector
  ) {}

  public getDirections(): Array<Direction> {
    const directions: Array<Direction> = [];

    let currentDirection = this.startDirection;

    for (let index = 1; index < this.nodes.length - 1; index++) {
      const firstSegmentVector = this.nodes[index].node.value
        .clone()
        .sub(this.nodes[index - 1].node.value);
      const secondSegmentVector = this.nodes[index + 1].node.value
        .clone()
        .sub(this.nodes[index].node.value);

      const firstStreetName = this.nodes[index].streetName;
      const secondStreetName = this.nodes[index + 1].streetName;

      const angle = Vector.angleBetween(
        firstSegmentVector,
        secondSegmentVector
      );

      if (angle > Math.PI / 4) {
        directions.push({
          node: this.nodes[index].node,
          message: "turn right on " + secondStreetName,
        });
      } else if (angle < -Math.PI / 4) {
        directions.push({
          node: this.nodes[index].node,
          message: "turn left on " + secondStreetName,
        });
      } else if (firstStreetName !== secondStreetName) {
        directions.push({
          node: this.nodes[index].node,
          message: "continue on " + secondStreetName,
        });
      }
    }

    return directions;
  }
}

export function* navigateBetweenStreetNodes(
  from: StreetNode,
  startDirection: Vector,
  to: StreetNode,
  endDirection: Vector
): Generator<NavigationPath, NavigationPath> {
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

  const cameFrom = new Map<
    StreetNode,
    { streetName: string | null; node: StreetNode }
  >();
  const fromStartScore = new Map<StreetNode, number>([[from, 0]]);
  const bestGuessScore = new PriorityQueue<[StreetNode, number]>(
    (a, b) => a[1] < b[1]
  );

  bestGuessScore.add([from, heuristic(from)]);

  const reconstructPath = (node: StreetNode) => {
    const path = new NavigationPath(startDirection, endDirection);

    let streetName: string | null = null;

    while (node !== from) {
      path.nodes.unshift({
        node,
        streetName,
      });
      ({ node, streetName } = cameFrom.get(node)!);
    }

    path.nodes.unshift({ node: from, streetName });

    return path;
  };

  let iterations = 0;
  while (bestGuessScore.size > 0) {
    iterations++;
    const current = bestGuessScore.poll();

    if (targets.has(current[0])) {
      return reconstructPath(current[0]);
    }

    for (const { neighbor, streetName } of current[0].edges()) {
      // TODO: consider things like left turns
      const newScore = current[1] + neighbor.value.distanceTo(current[0].value);

      const oldScore = fromStartScore.get(neighbor) ?? Infinity;
      if (newScore < oldScore) {
        fromStartScore.set(neighbor, newScore);
        cameFrom.set(neighbor, {
          node: current[0],
          streetName,
        });
        // re-set the priority of the node in the best guess priority queue.
        // there doesn't seem to be a way to do this atomically but I don't
        // think it matters.
        bestGuessScore.removeOne(([node, _score]) => {
          return node === neighbor;
        });

        bestGuessScore.add([neighbor, newScore + heuristic(neighbor)]);
      }
    }

    yield reconstructPath(current[0]);
  }

  throw new Error(`Could not find path after ${iterations} iterations`);
}
