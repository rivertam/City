import * as log from "loglevel";

import { RNG } from "../../utils/random";
import Vector from "../vector";
import { Node } from "./graph";
import PolygonUtil from "./polygon_util";
import TensorField from "./tensor_field";

export interface PolygonParams {
  maxLength: number;
  minArea: number;
  shrinkSpacing: number;
  chanceNoDivide: number;
}

export class NodeAssociatedPolygon {
  private _polygon: Map<Vector, Node | null>;

  // excess nodes are when there are more street nodes than sides of the geometry.
  // this happens after shrinking (jsts.buffer can reduce the number of points in
  // a polygon when shrinking)
  private _excessNodes = new Set<Node>();

  constructor(polygon: Vector[], nodes: Node[]) {
    // if (polygon.length < nodes.length) {
    //   throw new Error("Polygon must have at least as many points as nodes");
    // }

    this._polygon = new Map<Vector, Node | null>();

    for (let index = 0; index < polygon.length; index++) {
      const point = polygon[index];
      this._polygon.set(point, nodes[index] ?? null);
    }

    for (let index = polygon.length; index < nodes.length; index++) {
      this._excessNodes.add(nodes[index]);
    }
  }

  public get nodes(): Node[] {
    return Array.from(this._polygon.values()).filter((n) => n !== null);
  }

  public get polygon(): Vector[] {
    return Array.from(this._polygon.keys());
  }

  public hasExcessNodes(): boolean {
    return this._excessNodes.size > 0;
  }
}

/**
 * Finds polygons in a graph, used for finding lots and parks
 */
export default class PolygonFinder {
  private _polygons: Array<NodeAssociatedPolygon> = [];
  private _shrunkPolygons: Array<NodeAssociatedPolygon> = [];
  private _dividedPolygons: Array<NodeAssociatedPolygon> = [];
  private toShrink: Array<NodeAssociatedPolygon> = [];
  private resolveShrink: () => void;
  private toDivide: Array<NodeAssociatedPolygon> = [];
  private resolveDivide: () => void;

  constructor(
    private rng: RNG,
    private nodes: Node[],
    private params: PolygonParams,
    private tensorField: TensorField
  ) {}

  get polygons(): Array<NodeAssociatedPolygon> {
    if (this._dividedPolygons.length > 0) {
      return this._dividedPolygons;
    }

    if (this._shrunkPolygons.length > 0) {
      return this._shrunkPolygons;
    }

    return this._polygons;
  }

  reset(): void {
    this.toShrink = [];
    this.toDivide = [];
    this._polygons = [];
    this._shrunkPolygons = [];
    this._dividedPolygons = [];
  }

  update(): boolean {
    let change = false;
    if (this.toShrink.length > 0) {
      const resolve = this.toShrink.length === 1;
      if (this.stepShrink(this.toShrink.pop())) {
        change = true;
      }

      if (resolve) this.resolveShrink();
    }

    if (this.toDivide.length > 0) {
      const resolve = this.toDivide.length === 1;
      if (this.stepDivide(this.toDivide.pop())) {
        change = true;
      }

      if (resolve) this.resolveDivide();
    }
    return change;
  }

  /**
   * Properly shrink polygon so the edges are all the same distance from the road
   */
  shrink() {
    if (this._polygons.length === 0) {
      this.findPolygons();
    }

    this._shrunkPolygons = [];
    for (const p of this._polygons) {
      this.stepShrink(p);
    }
  }

  private stepShrink(polygon: NodeAssociatedPolygon): boolean {
    const shrunk = PolygonUtil.resizeGeometry(
      polygon.polygon,
      -this.params.shrinkSpacing
    );
    if (shrunk.length > 0) {
      this._shrunkPolygons.push(
        new NodeAssociatedPolygon(shrunk, polygon.nodes)
      );
      return true;
    }
    return false;
  }

  divide() {
    if (this._polygons.length === 0) {
      this.findPolygons();
    }

    let polygons = this._polygons;
    if (this._shrunkPolygons.length > 0) {
      polygons = this._shrunkPolygons;
    }

    this._dividedPolygons = [];
    for (const p of polygons) {
      this.stepDivide(p);
    }
  }

  private stepDivide(polygon: NodeAssociatedPolygon): boolean {
    // TODO need to filter shrunk polygons using aspect ratio, area
    // this skips the filter in PolygonUtil.subdividePolygon
    if (
      this.params.chanceNoDivide > 0 &&
      this.rng.random() < this.params.chanceNoDivide
    ) {
      this._dividedPolygons.push(polygon);
      return true;
    }
    const divided = PolygonUtil.subdividePolygon(
      this.rng,
      polygon.polygon,
      this.params.minArea
    );

    for (const subPolygon of divided) {
      const relevantNodes = [];
      for (const point of subPolygon) {
        const node = polygon.nodes.find((n) => n.value.equals(point));
        if (node !== undefined) {
          relevantNodes.push(node);
        }
      }

      this._dividedPolygons.push(
        new NodeAssociatedPolygon(subPolygon, relevantNodes)
      );
    }

    return divided.length > 0;
  }

  findPolygons(): void {
    // Node
    // x, y, value (Vector2), neighbors (list of node refs)
    // Gonna edit adj for now

    // Walk a clockwise path until polygon found or limit reached
    // When we find a polygon, mark all edges as traversed (in particular direction)
    // Each edge separates two polygons
    // If edge already traversed in this direction, this polygon has already been found
    this._shrunkPolygons = [];
    this._dividedPolygons = [];
    const polygons = [];

    for (const node of this.nodes) {
      if (node.neighbors.size < 2) continue;
      for (const nextNode of node.neighbors) {
        const polygon = this.recursiveWalk([node, nextNode]);
        if (polygon !== null && polygon.length < this.params.maxLength) {
          this.removePolygonAdjacencies(polygon);
          polygons.push(
            new NodeAssociatedPolygon(
              polygon.map((n) => n.value.clone()),
              polygon
            )
          );
        }
      }
    }

    this._polygons = polygons;
    this.filterCollidingPolygons();
  }

  /**
   * Removes polygons that are in the water or parks
   */
  private filterCollidingPolygons() {
    this._polygons = this._polygons.filter((p) => {
      const averagePoint = PolygonUtil.averagePoint(p.polygon);
      return (
        this.tensorField.onLand(averagePoint) &&
        !this.tensorField.inParks(averagePoint)
      );
    });
  }

  private removePolygonAdjacencies(polygon: Node[]): void {
    for (let i = 0; i < polygon.length; i++) {
      const current = polygon[i];
      const next = polygon[(i + 1) % polygon.length];

      current.neighbors.delete(next);
    }
  }

  private recursiveWalk(visited: Node[], count = 0): Node[] {
    if (count >= this.params.maxLength) return null;
    // TODO backtracking to find polygons with dead end roads inside them
    const nextNode = this.getRightmostNode(
      visited[visited.length - 2],
      visited[visited.length - 1]
    );
    if (nextNode === null) {
      return null; // Currently ignores polygons with dead end inside
    }

    const visitedIndex = visited.indexOf(nextNode);
    if (visitedIndex >= 0) {
      return visited.slice(visitedIndex);
    } else {
      visited.push(nextNode);
      return this.recursiveWalk(visited, count++);
    }
  }

  private getRightmostNode(nodeFrom: Node, nodeTo: Node): Node {
    // We want to turn right at every junction
    if (nodeTo.neighbors.size === 0) return null;

    const backwardsDifferenceVector = nodeFrom.value.clone().sub(nodeTo.value);
    const transformAngle = Math.atan2(
      backwardsDifferenceVector.y,
      backwardsDifferenceVector.x
    );

    let rightmostNode = null;
    let smallestTheta = Math.PI * 2;

    for (const nextNode of nodeTo.neighbors) {
      if (nextNode !== nodeFrom) {
        const nextVector = nextNode.value.clone().sub(nodeTo.value);
        let nextAngle = Math.atan2(nextVector.y, nextVector.x) - transformAngle;
        if (nextAngle < 0) {
          nextAngle += Math.PI * 2;
        }

        if (nextAngle < smallestTheta) {
          smallestTheta = nextAngle;
          rightmostNode = nextNode;
        }
      }
    }

    return rightmostNode;
  }
}
