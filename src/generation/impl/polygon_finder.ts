import * as log from "loglevel";

import { RNG } from "../../utils/random";
import Vector from "../vector";
import { StreetNode } from "./graph";
import PolygonUtil from "./polygon_util";
import TensorField from "./tensor_field";

export interface PolygonParams {
  maxLength: number;
  minArea: number;
  shrinkSpacing: number;
  chanceNoDivide: number;
}

export class Polygon {
  private _polygon: Vector[];

  constructor(polygon: Vector[]) {
    this._polygon = polygon;
  }

  public get polygon(): Vector[] {
    return this._polygon;
  }
}

/**
 * Finds polygons in a graph, used for finding lots and parks
 */
export default class PolygonFinder {
  private _polygons: Array<Polygon> = [];
  private _shrunkPolygons: Array<Polygon> = [];
  private _dividedPolygons: Array<Polygon> = [];
  private toShrink: Array<Polygon> = [];
  private resolveShrink: () => void;
  private toDivide: Array<Polygon> = [];
  private resolveDivide: () => void;

  constructor(
    private rng: RNG,
    private nodes: StreetNode[],
    private params: PolygonParams,
    private tensorField: TensorField
  ) {}

  get polygons(): Array<Polygon> {
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

  private stepShrink(polygon: Polygon): boolean {
    const shrunk = PolygonUtil.resizeGeometry(
      polygon.polygon,
      -this.params.shrinkSpacing
    );
    if (shrunk.length > 0) {
      this._shrunkPolygons.push(new Polygon(shrunk));
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

  private stepDivide(polygon: Polygon): boolean {
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
      this._dividedPolygons.push(new Polygon(subPolygon));
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

    let stashedNeighbors = new Array<[StreetNode, StreetNode]>();

    for (const node of this.nodes) {
      if (node.neighbors.size < 2) continue;
      for (const nextNode of node.neighbors.values()) {
        const polygon = this.recursiveWalk([node, nextNode]);
        if (polygon !== null && polygon.length < this.params.maxLength) {
          // remove the neighbors of the polygon so we don't just find it again
          const newlyStashed = this.stashPolygonNeighbors(polygon);
          stashedNeighbors = stashedNeighbors.concat(newlyStashed);
          polygons.push(new Polygon(polygon.map((n) => n.value.clone())));
        }
      }
    }

    // Add back the neighbors that were removed
    for (const [current, next] of stashedNeighbors) {
      current.neighbors.add(next);
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

  // temporarily remove the neighbors of each polygon in order to continue searching for more.
  // returns a list of the neighbors that were removed so they can be added back later
  private stashPolygonNeighbors(
    polygon: StreetNode[]
  ): Array<[StreetNode, StreetNode]> {
    const stashed = [];

    for (let pointIndex = 0; pointIndex < polygon.length; pointIndex++) {
      const current = polygon[pointIndex];
      const next = polygon[(pointIndex + 1) % polygon.length];

      current.neighbors.delete(next);

      stashed.push([current, next] as [StreetNode, StreetNode]);
    }

    return stashed;
  }

  private recursiveWalk(visited: StreetNode[]): StreetNode[] {
    if (visited.length >= this.params.maxLength) return null;
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
      return this.recursiveWalk(visited);
    }
  }

  private getRightmostNode(
    nodeFrom: StreetNode,
    nodeTo: StreetNode
  ): StreetNode {
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
