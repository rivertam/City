import { Polygon } from "../generation/impl/polygon_finder";
import Vector from "../generation/vector";

export class StreetSegment {
  public from: Vector;
  public to: Vector;

  constructor(public streetName: string, from: Vector, to: Vector) {
    this.from = from;
    this.to = to;
  }

  public distanceFromPoint(point: Vector): number {
    const l2 = this.from.distanceToSquared(this.to);
    if (l2 === 0) return point.distanceTo(this.from);

    const t = Math.max(
      0,
      Math.min(
        1,
        point.clone().sub(this.from).dot(this.to.clone().sub(this.from)) / l2
      )
    );
    const projection = this.from
      .clone()
      .add(this.to.clone().sub(this.from).multiplyScalar(t));
    return point.distanceTo(projection);
  }

  public findEntryPoint(lot: Polygon): { door: Vector; streetPoint: Vector } {
    // the index of the left point of the wall on the polygon that is closest to the segment
    let entryLeftIndex = -1;
    let closestScore = Infinity;

    for (let leftIndex = 0; leftIndex < lot.polygon.length; leftIndex++) {
      const rightIndex = (leftIndex + 1) % lot.polygon.length;
      const left = lot.polygon[leftIndex];
      const right = lot.polygon[rightIndex];
      const score =
        this.distanceFromPoint(left) + this.distanceFromPoint(right);
      if (score < closestScore) {
        closestScore = score;
        entryLeftIndex = leftIndex;
      }
    }

    const entryRightIndex = (entryLeftIndex + 1) % lot.polygon.length;

    const left = lot.polygon[entryLeftIndex];
    const right = lot.polygon[entryRightIndex];

    const door = left.clone().add(right).multiplyScalar(0.5);
    const streetPoint = this.orthogonalProjectionFromPoint(door);

    return { door, streetPoint };
  }

  public orthogonalProjectionFromPoint(point: Vector): Vector {
    const dotProduct = point
      .clone()
      .sub(this.from)
      .dot(this.to.clone().sub(this.from));

    const lengthSquared = this.to.clone().sub(this.from).lengthSq();

    const t = Math.max(0, Math.min(1, dotProduct / lengthSquared));

    return this.from
      .clone()
      .add(this.to.clone().sub(this.from).multiplyScalar(t));
  }
}
