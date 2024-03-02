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
  const path = new NavigationPath();
  path.nodes.push(from);
  path.nodes.push(to);

  return path;
}
