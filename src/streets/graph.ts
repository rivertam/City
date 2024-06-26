import * as d3 from "d3-quadtree";
import * as isect from "isect";

import Vector from "../generation/vector";
import { StreetNode } from "./node";
import { StreetSegment } from "./segment";
import { LotEntryPoint } from ".";
import { Polygon } from "../generation/impl/polygon_finder";

type NamedStreamline = {
  name: string;
  points: Vector[];
};

export class StreetGraph {
  public nodes: StreetNode[];
  public intersections: Vector[];

  /**
   * Create a graph from a set of streamlines
   * Finds all intersections, and creates a list of Nodes
   */
  public constructor(
    public name: string,
    streamlines: NamedStreamline[],
    dstep: number,
    deleteDangling = false,
    debugCanvasSelector?: string
  ) {
    const quadtree = (d3.quadtree() as d3.Quadtree<StreetNode>)
      .x((n) => n.value.x)
      .y((n) => n.value.y);
    const nodeAddRadius = 1;

    const debugCanvasContext = (() => {
      if (debugCanvasSelector) {
        const canvas =
          document.querySelector<HTMLCanvasElement>(debugCanvasSelector);

        if (canvas === null) return null;

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        return canvas.getContext("2d");
      }

      return null;
    })();

    const debugScaleX = (x: number) =>
      (x / 750) * debugCanvasContext!.canvas.width + 50;
    const debugScaleY = (y: number) =>
      (y / 750) * debugCanvasContext!.canvas.height + 50;

    // Add all segment start and endpoints
    for (const streamline of streamlines) {
      const { points, name } = streamline;
      let lastNode: StreetNode | null = null;
      for (let i = 0; i < points.length; i++) {
        const node = new StreetNode(points[i]);
        node.graph = this;

        if (lastNode !== null) {
          node.addTemporaryNeighbor(lastNode);
          lastNode.addTemporaryNeighbor(node);
        }
        lastNode = node;

        if (debugCanvasContext) {
          // draw green x at streamline endpoints
          const location = {
            x: debugScaleX(node.value.x),
            y: debugScaleY(node.value.y),
          };

          debugCanvasContext.strokeStyle = "green";
          debugCanvasContext.lineWidth = 1;
          debugCanvasContext.beginPath();
          debugCanvasContext.moveTo(location.x - 2, location.y - 2);
          debugCanvasContext.lineTo(location.x + 2, location.y + 2);
          debugCanvasContext.stroke();

          debugCanvasContext.beginPath();
          debugCanvasContext.moveTo(location.x + 2, location.y - 2);
          debugCanvasContext.lineTo(location.x - 2, location.y + 2);
          debugCanvasContext.stroke();
        }
        this.fuzzyAddToQuadtree(quadtree, node, 0.1);
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
      node.graph = this;

      if (debugCanvasContext) {
        // draw red x at intersections
        const location = {
          x: debugScaleX(node.value.x),
          y: debugScaleY(node.value.y),
        };

        debugCanvasContext.strokeStyle = "red";
        debugCanvasContext.lineWidth = 1;
        debugCanvasContext.beginPath();
        debugCanvasContext.moveTo(location.x - 2, location.y - 2);
        debugCanvasContext.lineTo(location.x + 2, location.y + 2);
        debugCanvasContext.stroke();

        debugCanvasContext.beginPath();
        debugCanvasContext.moveTo(location.x + 2, location.y - 2);
        debugCanvasContext.lineTo(location.x - 2, location.y + 2);
        debugCanvasContext.stroke();
      }

      this.fuzzyAddToQuadtree(quadtree, node, nodeAddRadius);
    }

    for (const intersection of intersections) {
      const fromNode = quadtree.find(
        intersection.point.x,
        intersection.point.y,
        nodeAddRadius
      );

      if (fromNode === undefined) {
        throw new Error(
          "could not find fromNode from isect intersection point"
        );
      }

      let index = 0;
      for (const segment of intersection.segments) {
        let toPoint = segment.to;
        if (toPoint.equals(intersection.point)) {
          toPoint = segment.from;
        }

        const toNode = quadtree.find(toPoint.x, toPoint.y, nodeAddRadius);

        if (toNode === undefined) {
          throw new Error("could not find toNode from isect segments");
        }

        fromNode.addTemporaryNeighbor(toNode);
        toNode.addTemporaryNeighbor(fromNode);

        if (debugCanvasContext) {
          // draw blue line at intersection segments
          debugCanvasContext.strokeStyle = "blue";
          debugCanvasContext.lineWidth = 2;
          debugCanvasContext.beginPath();
          debugCanvasContext.moveTo(
            debugScaleX(segment.from.x),
            debugScaleY(segment.from.y)
          );
          debugCanvasContext.lineTo(
            debugScaleX(segment.to.x),
            debugScaleY(segment.to.y)
          );
          debugCanvasContext.stroke();
        }
      }
    }

    // For each simplified streamline, find nodes along it and connect them
    // This mostly affects intersections
    for (const streamline of streamlines) {
      const { name, points } = streamline;
      for (let i = 0; i < points.length - 1; i++) {
        const nodesAlongSegment = this.visitNodesAlongSegment(
          new StreetSegment(name, points[i], points[i + 1]),
          name,
          quadtree,
          nodeAddRadius,
          dstep
        );

        if (nodesAlongSegment.length > 1) {
          for (let j = 0; j < nodesAlongSegment.length - 1; j++) {
            nodesAlongSegment[j].addNeighbor(name, nodesAlongSegment[j + 1]);

            if (debugCanvasContext) {
              // draw yellow line between nodes along segment
              debugCanvasContext.strokeStyle = "yellow";
              debugCanvasContext.lineWidth = 1;
              debugCanvasContext.beginPath();
              debugCanvasContext.moveTo(
                debugScaleX(nodesAlongSegment[j].value.x),
                debugScaleY(nodesAlongSegment[j].value.y)
              );
              debugCanvasContext.lineTo(
                debugScaleX(nodesAlongSegment[j + 1].value.x),
                debugScaleY(nodesAlongSegment[j + 1].value.y)
              );
              debugCanvasContext.stroke();
            }
          }
        }
      }
    }

    for (const n of quadtree.data()) {
      if (deleteDangling) {
        n.deleteDanglingNodes(quadtree);
      }

      n.deleteTemporaryNeighbors();
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

    let lastNode: StreetNode | undefined;

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

        if (lastNode !== undefined) {
          closestNode.addNeighbor(segmentName, lastNode);
          lastNode.addNeighbor(segmentName, closestNode);

          nodesToAdd.push(closestNode);
        }

        lastNode = closestNode;
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

    existingNode.merge(node);

    return false;
  }

  private streamlinesToSegment(
    streamlines: Vector[][]
  ): Array<{ from: Vector; to: Vector }> {
    const out = [];
    for (const s of streamlines) {
      for (let i = 0; i < s.length - 1; i++) {
        out.push({ from: s[i], to: s[i + 1] });
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
  public getEntryPoint(lot: Polygon): LotEntryPoint {
    const best = {
      distance: Infinity,
      fromNode: this.nodes[0],
      toNode: this.nodes[1],
      streetPoint: new Vector(0, 0),
      door: new Vector(0, 0),
      streetName: "",
    };

    for (const node of this.nodes) {
      for (const { neighbor, streetName } of node.edges()) {
        const segment = node.segmentTo(neighbor);
        for (const point of lot.polygon) {
          const distance = segment.distanceFromPoint(point);

          if (distance < best.distance) {
            best.distance = distance;

            const entryPoint = segment.findEntryPoint(lot);

            best.door = entryPoint.door;
            best.fromNode = node;
            best.toNode = neighbor;
            best.streetName = streetName;
            best.streetPoint = entryPoint.streetPoint;
          }
        }
      }
    }

    delete best.distance;

    const streetNode = new StreetNode(best.streetPoint);

    streetNode.addNeighbor(best.streetName, best.fromNode);
    streetNode.addNeighbor(best.streetName, best.toNode);

    return {
      door: best.door,
      streetNode,
      streetName: best.streetName,
    };
  }
}
