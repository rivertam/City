import * as d3 from "d3-quadtree";
import Vector from "../generation/vector";
import { StreetGraph } from "./graph";
import { StreetSegment } from "./segment";
import { NavigationPath, navigateBetweenStreetNodes } from "./navigate";

/**
 * Node located along any intersection or point along the simplified road polylines
 */
export class StreetNode {
  public graph: StreetGraph | null = null;

  private neighbors = new Map<
    StreetNode,
    // temporary neighbors are just used by the graph algorithm and polygon finder
    // and are deleted after generation
    { streetName: string; temporary: boolean }
  >();

  public constructor(public value: Vector) {}

  /**
   * Adds a neighboring street node.
   * Returns true if the neighbor was added, false if it already existed.
   *
   * @param streetName the street to travel on to get to the neighbor
   * @param node the neighbor node
   */
  public addNeighbor(streetName: string, node: StreetNode): boolean {
    if (node === this) {
      return false;
    }

    const existing = this.neighbors.get(node);

    if (existing) {
      existing.temporary = false;
      existing.streetName = streetName;

      return false;
    }

    this.neighbors.set(node, { streetName, temporary: false });

    return true;
  }

  public addTemporaryNeighbor(node: StreetNode) {
    const existing = this.neighbors.get(node);
    if (existing) {
      return;
    }

    this.neighbors.set(node, { streetName: "temporary", temporary: true });
  }

  public removeNeighbor(node: StreetNode): string | null {
    const { streetName } = this.neighbors.get(node);

    if (streetName === undefined) {
      return null;
    }

    this.neighbors.delete(node);

    return streetName;
  }

  public streamlineNames(): Array<string> {
    return Array.from(
      new Set(Array.from(this.neighbors.values()).map((n) => n.streetName))
    );
  }

  /**
   * Remove dangling edges from graph to facilitate polygon finding
   *
   * Unused?
   */
  public deleteDanglingNodes(quadtree: d3.Quadtree<StreetNode>) {
    if (this.neighbors.size === 1) {
      quadtree.remove(this);
      for (const neighbor of this.neighbors.keys()) {
        neighbor.neighbors.delete(this);
        neighbor.deleteDanglingNodes(quadtree);
      }
    }
  }

  public deleteTemporaryNeighbors() {
    for (const [
      neighbor,
      { temporary, streetName },
    ] of this.neighbors.entries()) {
      if (temporary) {
        this.neighbors.delete(neighbor);
      }
    }
  }

  public merge(other: StreetNode) {
    for (const [node, { streetName, temporary }] of other.neighbors) {
      if (temporary) {
        this.addTemporaryNeighbor(node);
      } else {
        this.addNeighbor(streetName, node);
      }

      other.removeNeighbor(node);
      if (node.removeNeighbor(other)) {
        if (temporary) {
          node.addTemporaryNeighbor(this);
        } else {
          node.addNeighbor(streetName, this);
        }
      }
    }
  }

  public edges(): Array<{
    neighbor: StreetNode;
    streetName: string;
  }> {
    const edges = [];
    for (const [neighbor, { streetName }] of this.neighbors.entries()) {
      edges.push({
        neighbor,
        streetName,
      });
    }

    return edges;
  }

  public segmentTo(other: StreetNode): StreetSegment {
    return new StreetSegment(
      this.neighbors.get(other).streetName,
      this.value,
      other.value
    );
  }

  /**
   * Use A* to find the shortest path between two nodes on the already
   * existing graph.
   */
  public navigateTo(
    startDirection: Vector,
    other: StreetNode,
    endDirection?: Vector
  ): NavigationPath {
    return navigateBetweenStreetNodes(
      this,
      startDirection,
      other,
      endDirection
    );
  }
}
