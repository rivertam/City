import * as log from "loglevel";
import * as d3 from "d3-quadtree";
import * as isect from "isect";

import Vector from "../vector";
import { Polygon } from "./polygon_finder";

class StreetSegment {
  public from: Vector;
  public to: Vector;

  constructor(from: Vector, to: Vector) {
    this.from = from;
    this.to = to;
  }

  static create({ from, to }: { from: Vector; to: Vector }): StreetSegment {
    return new StreetSegment(from, to);
  }
}

type NamedStreamline = {
  name: string;
  points: Vector[];
};

/**
 * Node located along any intersection or point along the simplified road polylines
 */
export class StreetNode {
  public segments = new Map<string, StreetSegment>();

  constructor(public value: Vector, public neighbors = new Set<StreetNode>()) {}

  addSegment(streamlineName: string, segment: StreetSegment): void {
    this.segments.set(streamlineName, segment);
  }

  addNeighbor(node: StreetNode): void {
    if (node !== this) {
      this.neighbors.add(node);
      node.neighbors.add(this);
    }
  }

  streamlineNames(): Array<string> {
    return Array.from(this.segments.keys());
  }
}

export default class StreetGraph {
  public nodes: StreetNode[];
  public intersections: Vector[];

  /**
   * Create a graph from a set of streamlines
   * Finds all intersections, and creates a list of Nodes
   */
  constructor(
    streamlines: NamedStreamline[],
    dstep: number,
    deleteDangling = false
  ) {
    const quadtree = (d3.quadtree() as d3.Quadtree<StreetNode>)
      .x((n) => n.value.x)
      .y((n) => n.value.y);
    const nodeAddRadius = 1;

    // Add all segment start and endpoints
    for (const streamline of streamlines) {
      const { points, name } = streamline;
      for (let i = 0; i < points.length; i++) {
        const node = new StreetNode(points[i]);
        if (i > 0) {
          node.addSegment(name, new StreetSegment(points[i - 1], points[i]));
        }

        if (i < points.length - 1) {
          node.addSegment(name, new StreetSegment(points[i], points[i + 1]));
        }

        this.fuzzyAddToQuadtree(quadtree, node, nodeAddRadius);
      }
    }

    const intersections = isect
      .bush(this.streamlinesToSegment(streamlines.map((s) => s.points)), {})
      .run();

    // Add all intersections
    for (const intersection of intersections) {
      const node = new StreetNode(
        new Vector(intersection.point.x, intersection.point.y)
      );

      let index = 0;
      for (const s of intersection.segments) {
        node.addSegment(`intersection segment ${index++}`, s);
      }

      this.fuzzyAddToQuadtree(quadtree, node, nodeAddRadius);
    }

    // For each simplified streamline, find nodes along it and connect them
    // This mostly affects intersections
    for (const streamline of streamlines) {
      const { name, points } = streamline;
      for (let i = 0; i < points.length - 1; i++) {
        const nodesAlongSegment = this.visitNodesAlongSegment(
          new StreetSegment(points[i], points[i + 1]),
          name,
          quadtree,
          nodeAddRadius,
          dstep
        );

        if (nodesAlongSegment.length > 1) {
          for (let j = 0; j < nodesAlongSegment.length - 1; j++) {
            nodesAlongSegment[j].addNeighbor(nodesAlongSegment[j + 1]);
          }
        }
      }
    }

    for (const n of quadtree.data()) {
      if (deleteDangling) {
        this.deleteDanglingNodes(n, quadtree);
      }
    }

    this.nodes = quadtree.data();
    this.intersections = [];
    for (const i of intersections)
      this.intersections.push(new Vector(i.point.x, i.point.y));
  }

  /**
   * Translate all data (nodes, intersections) by vector v
   */
  public translate(translation: Vector): void {
    for (const n of this.nodes) n.value.add(translation);
    for (const i of this.intersections) i.add(translation);
  }

  public flipX() {
    for (const n of this.nodes) n.value.x *= -1;
    for (const i of this.intersections) i.x *= -1;
  }

  public flipY() {
    for (const n of this.nodes) n.value.y *= -1;
    for (const i of this.intersections) i.y *= -1;
  }

  /**
   * Remove dangling edges from graph to facilitate polygon finding
   */
  private deleteDanglingNodes(
    n: StreetNode,
    quadtree: d3.Quadtree<StreetNode>
  ) {
    if (n.neighbors.size === 1) {
      quadtree.remove(n);
      for (const neighbor of n.neighbors.values()) {
        neighbor.neighbors.delete(n);
        this.deleteDanglingNodes(neighbor, quadtree);
      }
    }
  }

  /**
   * Given a segment, step along segment and find all nodes along it
   *
   * Also modifies the node's copy of the segment to match the segment.
   */
  private visitNodesAlongSegment(
    segment: StreetSegment,
    segmentName: string,
    quadtree: d3.Quadtree<StreetNode>,
    radius: number,
    step: number
  ): StreetNode[] {
    // Walk dstep along each streamline, adding nodes within dstep/2
    // and connected to this streamline (fuzzy - nodeAddRadius) to list, removing from
    // quadtree and adding them all back at the end

    const foundNodes = [];
    const nodesAlongSegment: StreetNode[] = [];

    const start = new Vector(segment.from.x, segment.from.y);
    const end = new Vector(segment.to.x, segment.to.y);

    const differenceVector = end.clone().sub(start);
    step = Math.min(step, differenceVector.length() / 2); // Min of 2 step along vector
    const steps = Math.ceil(differenceVector.length() / step);

    for (let i = 0; i <= steps; i++) {
      const currentPoint = start
        .clone()
        .add(differenceVector.clone().multiplyScalar(i / steps));

      const nodesToAdd = [];
      let closestNode = quadtree.find(
        currentPoint.x,
        currentPoint.y,
        radius + step / 2
      );

      while (closestNode !== undefined) {
        quadtree.remove(closestNode);
        foundNodes.push(closestNode);

        const duplicateSegmentNames = new Array<string>();
        for (const [
          segmentName,
          nodeSegment,
        ] of closestNode.segments.entries()) {
          if (this.fuzzySegmentsEqual(nodeSegment, segment)) {
            duplicateSegmentNames.push(segmentName);
          }
        }

        if (duplicateSegmentNames.length > 0) {
          nodesToAdd.push(closestNode);

          for (const name of duplicateSegmentNames) {
            closestNode.segments.delete(name);
          }
          closestNode.segments.set(segmentName, segment);
        }

        closestNode = quadtree.find(
          currentPoint.x,
          currentPoint.y,
          radius + step / 2
        );
      }

      // Order nodes, not by 'closeness', but by dot product
      nodesToAdd.sort(
        (first: StreetNode, second: StreetNode) =>
          this.dotProductToSegment(first, start, differenceVector) -
          this.dotProductToSegment(second, start, differenceVector)
      );
      nodesAlongSegment.push(...nodesToAdd);
    }

    quadtree.addAll(foundNodes);
    return nodesAlongSegment;
  }

  private fuzzySegmentsEqual(
    s1: StreetSegment,
    s2: StreetSegment,
    tolerance = 0.0001
  ): boolean {
    // From
    if (s1.from.x - s2.from.x > tolerance) {
      return false;
    }

    if (s1.from.y - s2.from.y > tolerance) {
      return false;
    }

    // To

    if (s1.to.x - s2.to.x > tolerance) {
      return false;
    }

    if (s1.to.y - s2.to.y > tolerance) {
      return false;
    }

    return true;
  }

  private dotProductToSegment(
    node: StreetNode,
    start: Vector,
    differenceVector: Vector
  ): number {
    const dotVector = node.value.clone().sub(start);
    return differenceVector.dot(dotVector);
  }

  private fuzzyAddToQuadtree(
    quadtree: d3.Quadtree<StreetNode>,
    node: StreetNode,
    radius: number
  ): boolean {
    // Only add if there isn't a node within radius
    // Remember to check for double radius when querying tree, or point might be missed
    const existingNode = quadtree.find(node.value.x, node.value.y, radius);
    if (existingNode === undefined) {
      quadtree.add(node);

      return true;
    }

    for (const neighbor of node.neighbors) existingNode.addNeighbor(neighbor);
    for (const [name, segment] of node.segments.entries()) {
      existingNode.addSegment(name, segment);
    }

    return false;
  }

  private streamlinesToSegment(streamlines: Vector[][]): StreetSegment[] {
    const out: StreetSegment[] = [];
    for (const s of streamlines) {
      for (let i = 0; i < s.length - 1; i++) {
        out.push(new StreetSegment(s[i], s[i + 1]));
      }
    }

    return out;
  }

  /**
   * Computes the entrypoint for a lot (i.e. the street segment where people enter and exit
   * a building onto the street)
   *
   * @param lot the polygon describing the lot
   * @returns the entry point segment nodes on the street graph
   */
  public getEntryPoint(lot: Polygon): {
    segment: StreetSegment;
    street: string;
  } {
    // console.count(`nodes ${lot.nodes.length}`);
    let closestSegment = this.nodes[0].segments.values().next().value;
    let closestSegmentStreet = this.nodes[0].segments.keys().next().value;
    let closestDistance = Infinity;

    for (const node of this.nodes) {
      for (const [streetName, segment] of node.segments.entries()) {
        for (const point of lot.polygon) {
          const distance = pointToSegment(point, segment.from, segment.to);

          if (distance < closestDistance) {
            closestDistance = distance;
            closestSegment = segment;
            closestSegmentStreet = streetName;
          }
        }
      }
    }

    return { segment: closestSegment, street: closestSegmentStreet };
  }
}

function pointToSegment(point: Vector, from: Vector, to: Vector): number {
  const l2 = from.distanceToSquared(to);
  if (l2 === 0) return point.distanceTo(from);

  const t = Math.max(
    0,
    Math.min(1, point.clone().sub(from).dot(to.clone().sub(from)) / l2)
  );
  const projection = from.clone().add(to.clone().sub(from).multiplyScalar(t));
  return point.distanceTo(projection);
}
