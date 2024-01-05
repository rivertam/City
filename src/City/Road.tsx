import * as React from "react";
import * as THREE from "three";
import { Space } from "./Space";
import { windows } from "../utils/windows";
import { useMemo } from "react";

type Props = {
  line: Array<[number, number, number?]>;
  color: string;
  size: number;
  // height off the ground
  height?: number;
  debugLines?: boolean;
};

export function Road({
  color,
  line,
  size,
  height = 0,
  debugLines = false,
}: Props): JSX.Element {
  const debugColor = useMemo(() => {
    return `hsl(${(Math.random() * 360).toFixed(0)}, 50%, 50%)`;
  }, []);

  const [leftCurve, rightCurve] = useMemo(() => {
    // the variable naming convention implies the line is going from the top
    // straight down and we're just trying to create a line segment by creating
    // a rectangle with 4 corners. The math reflects the reality, which is that
    // the line could be going in any direction.
    const leftSide: Array<[number, number, number]> = [];
    const rightSide: Array<[number, number, number]> = [];
    const segments = windows(2, line).map(
      (segment, index) =>
        [segment, index] as [
          [[number, number, number], [number, number, number]],
          number
        ]
    );

    for (const [[top, bottom], index] of segments) {
      const topLeft: [number, number, number] = [0, 0, top[2]];
      const topRight: [number, number, number] = [0, 0, top[2]];
      const bottomLeft: [number, number, number] = [0, 0, bottom[2]];
      const bottomRight: [number, number, number] = [0, 0, bottom[2]];

      // vertical rectangle
      if (top[0] == bottom[0]) {
        const diff = size / 2.0;
        const leftDiff = top[1] < bottom[1] ? -diff : diff;
        topLeft[0] = top[0] + leftDiff;
        topLeft[1] = top[1];

        topRight[0] = top[0] - leftDiff;
        topRight[1] = top[1];

        bottomLeft[0] = bottom[0] + leftDiff;
        bottomLeft[1] = bottom[1];

        bottomRight[0] = bottom[0] - leftDiff;
        bottomRight[1] = bottom[1];
      }
      // horizontal rectangle
      else if (top[1] == bottom[1]) {
        const topDiff = top[0] < bottom[0] ? size / 2 : -size / 2;

        topLeft[1] = top[1] + topDiff;
        topLeft[0] = top[0];

        topRight[1] = top[1] - topDiff;
        topRight[0] = top[0];

        bottomLeft[1] = bottom[1] + topDiff;
        bottomLeft[0] = bottom[0];

        bottomRight[1] = bottom[1] - topDiff;
        bottomRight[0] = bottom[0];
      }
      // slanted rectangle
      else {
        // calculate slope of the side
        const slope = (top[0] - bottom[0]) / (bottom[1] - top[1]);

        // calculate displacements along axes
        let dx = (size / Math.sqrt(1 + slope * slope)) * 0.5;
        let dy = slope * dx;

        if (top[1] > bottom[1]) {
          dx = -dx;
          dy = -dy;
        }

        topLeft[0] = top[0] - dx;
        topLeft[1] = top[1] - dy;

        topRight[0] = top[0] + dx;
        topRight[1] = top[1] + dy;

        bottomLeft[0] = bottom[0] - dx;
        bottomLeft[1] = bottom[1] - dy;

        bottomRight[0] = bottom[0] + dx;
        bottomRight[1] = bottom[1] + dy;
      }

      leftSide.push(topLeft);
      rightSide.push(topRight);
      leftSide.push(bottomLeft);
      rightSide.push(bottomRight);
    }

    const leftCurve = leftSide.map(
      ([xx, yy, zz]) => new THREE.Vector3(xx, yy, zz)
    );
    const rightCurve = rightSide.map(
      ([xx, yy, zz]) => new THREE.Vector3(xx, yy, zz)
    );

    return [leftCurve, rightCurve];
  }, [line]);

  const leftBufferRef = (buffer?: THREE.BufferGeometry) => {
    buffer?.setFromPoints(leftCurve);
  };

  const rightBufferRef = (buffer?: THREE.BufferGeometry) => {
    buffer?.setFromPoints(rightCurve);
  };

  const middleBufferRef = (buffer?: THREE.BufferGeometry) => {
    buffer?.setFromPoints(
      line.map((point) => new THREE.Vector3(point[0], point[1], point[2] ?? 0))
    );
  };

  const geometryRef = (newGeometry?: any): void => {
    if (!newGeometry) return;

    const positions = new Array<number>();
    const normals = new Array<number>();
    const indices = new Array<number>();

    const numPoints = leftCurve.length;

    // left points go first, so point N in the positions array is N, stored at N * 3 (+ 1..2)
    leftCurve.forEach(({ x, y, z }) => {
      positions.push(x, y, z);
      normals.push(0, 0, 1);
    });

    // then right points, so point N in the positions array is numPoints + N
    rightCurve.forEach(({ x, y, z }) => {
      positions.push(x, y, z);
      normals.push(0, 0, 1);
    });

    leftCurve.forEach((_, firstPointIndex) => {
      if (firstPointIndex === leftCurve.length - 1) {
        return;
      }

      const topLeftIndex = firstPointIndex;
      const bottomLeftIndex = firstPointIndex + 1;
      const topRightIndex = firstPointIndex + numPoints;
      const bottomRightIndex = firstPointIndex + numPoints + 1;

      indices.push(bottomLeftIndex, topRightIndex, bottomRightIndex);
      indices.push(topLeftIndex, topRightIndex, bottomLeftIndex);
    });

    newGeometry.setIndex(indices);
    newGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    newGeometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(normals, 3)
    );
  };

  const joinPolygons = line.map((point, index) => {
    const polygon = new Array<[number, number]>();
    const radius = size / 2;

    for (let tick = 0; tick < 12; ++tick) {
      const angle = (2 * Math.PI * tick) / 12;
      const xx = Math.cos(angle) * radius;
      const yy = Math.sin(angle) * radius;

      polygon.push([xx, yy]);
    }

    return (
      <group key={`${index}`} position={[point[0], point[1], point[2]]}>
        <Space color={color} polygon={polygon} />
      </group>
    );
  });

  return (
    <group position={[0, 0, height]}>
      {debugLines && (
        <>
          <line>
            <bufferGeometry attach="geometry" ref={leftBufferRef} />
            <lineBasicMaterial
              attach="material"
              color={"blue"}
              linewidth={10}
              linecap={"round"}
              linejoin={"round"}
            />
          </line>
          <line>
            <bufferGeometry attach="geometry" ref={rightBufferRef} />
            <lineBasicMaterial
              attach="material"
              color={"red"}
              linewidth={10}
              linecap={"round"}
              linejoin={"round"}
            />
          </line>
          <line>
            <bufferGeometry attach="geometry" ref={middleBufferRef} />
            <lineBasicMaterial
              attach="material"
              color={debugColor}
              linewidth={10}
              linecap={"round"}
              linejoin={"round"}
            />
          </line>
        </>
      )}

      <mesh>
        <bufferGeometry ref={geometryRef} attach={"geometry"}></bufferGeometry>
        <meshLambertMaterial attach={"material"} color={color} />
      </mesh>

      {joinPolygons}
    </group>
  );
}
