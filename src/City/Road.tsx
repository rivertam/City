import * as React from "react";
import * as THREE from "three";
import { Space } from "./Space";
import { windows } from "../utils/windows";
import { useMemo } from "react";
import { Street } from "../state/Street";
import Vector from "../generation/vector";
import { observer } from "mobx-react-lite";
import { computed } from "mobx";
import { DisplayState } from "../state/DisplayState";

type Props = {
  road: Street;
  defaultColor: string;
  size: number;
  debugLines?: boolean;
};

const HIGHLIGHTED_STREET_COLOR = "hsl(120, 100%, 50%)";

export const Road = React.memo(
  observer(function Road({
    defaultColor,
    road,
    size,
    debugLines = false,
  }: Props): JSX.Element {
    const displayState = DisplayState.use();

    const debugColor = useMemo(() => {
      return `hsl(${(Math.random() * 360).toFixed(0)}, 50%, 50%)`;
    }, []);

    const focused = computed(() => {
      return road === displayState.focusedItem;
    }).get();

    const color = focused ? HIGHLIGHTED_STREET_COLOR : defaultColor;

    // computes the mesh buffer for the road itself
    const [leftCurve, rightCurve] = useMemo(() => {
      // the variable naming convention implies the line is going from the top
      // straight down and we're just trying to create a line segment by creating
      // a rectangle with 4 corners. The math reflects the reality, which is that
      // the line could be going in any direction.
      const leftSide: Array<THREE.Vector3> = [];
      const rightSide: Array<THREE.Vector3> = [];
      const segments = windows(2, road.line).map(
        (segment, index) => [segment, index] as [[Vector, Vector], number]
      );

      for (const [[top, bottom]] of segments) {
        // I wrote this to be agnostic to height so we could use it for hilly roads,
        // but none exist yet, so I'm just going to set these to 0.
        const topHeight = 0;
        const bottomHeight = 0;
        const topLeft = new THREE.Vector3(0, 0, topHeight);
        const topRight = new THREE.Vector3(0, 0, topHeight);
        const bottomLeft = new THREE.Vector3(0, 0, bottomHeight);
        const bottomRight = new THREE.Vector3(0, 0, bottomHeight);

        // vertical rectangle
        if (top.x == bottom.x) {
          const diff = size / 2.0;
          const leftDiff = top.y < bottom.y ? -diff : diff;
          topLeft.x = top.x + leftDiff;
          topLeft.y = top.y;

          topRight.x = top.x - leftDiff;
          topRight.y = top.y;

          bottomLeft.x = bottom.x + leftDiff;
          bottomLeft.y = bottom.y;

          bottomRight.x = bottom.x - leftDiff;
          bottomRight.y = bottom.y;
        }
        // horizontal rectangle
        else if (top.y == bottom.y) {
          const topDiff = top.x < bottom.x ? size / 2 : -size / 2;

          topLeft.y = top.y + topDiff;
          topLeft.x = top.x;

          topRight.y = top.y - topDiff;
          topRight.x = top.x;

          bottomLeft.y = bottom.y + topDiff;
          bottomLeft.x = bottom.x;

          bottomRight.y = bottom.y - topDiff;
          bottomRight.x = bottom.x;
        }
        // slanted rectangle
        else {
          // calculate slope of the side
          const slope = (top.x - bottom.x) / (bottom.y - top.y);

          // calculate displacements along axes
          let dx = (size / Math.sqrt(1 + slope * slope)) * 0.5;
          let dy = slope * dx;

          if (top.y > bottom.y) {
            dx = -dx;
            dy = -dy;
          }

          topLeft.x = top.x - dx;
          topLeft.y = top.y - dy;

          topRight.x = top.x + dx;
          topRight.y = top.y + dy;

          bottomLeft.x = bottom.x - dx;
          bottomLeft.y = bottom.y - dy;

          bottomRight.x = bottom.x + dx;
          bottomRight.y = bottom.y + dy;
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
    }, [road, road.line]);

    const leftBufferRef = (buffer?: THREE.BufferGeometry) => {
      buffer?.setFromPoints(leftCurve);
    };

    const rightBufferRef = (buffer?: THREE.BufferGeometry) => {
      buffer?.setFromPoints(rightCurve);
    };

    const middleBufferRef = (buffer?: THREE.BufferGeometry) => {
      buffer?.setFromPoints(
        road.line.map((point) => new THREE.Vector3(point.x, point.y, 0))
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

    const joinPolygons = road.line.map((point, index) => {
      const polygon = new Array<[number, number]>();
      const radius = size / 2;

      for (let tick = 0; tick < 12; ++tick) {
        const angle = (2 * Math.PI * tick) / 12;
        const xx = Math.cos(angle) * radius;
        const yy = Math.sin(angle) * radius;

        polygon.push([xx, yy]);
      }

      return (
        <group key={`${index}`} position={[point.x, point.y, 0]}>
          <Space color={color} polygon={polygon} />
        </group>
      );
    });

    return (
      <group position={[0, 0, 0]}>
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
          <bufferGeometry
            ref={geometryRef}
            attach={"geometry"}
          ></bufferGeometry>
          <meshLambertMaterial attach={"material"} color={color} />
        </mesh>

        {joinPolygons}
      </group>
    );
  })
);
