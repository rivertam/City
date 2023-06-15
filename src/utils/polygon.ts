export type Point = [number, number];
export type Polygon = Array<Point>;

export function center(points: Polygon): Point {
  const x = points.map((p) => p[0]).reduce((a, b) => a + b, 0) / points.length;
  const y = points.map((p) => p[1]).reduce((a, b) => a + b, 0) / points.length;

  return [x, y];
}
