import React from "react";
import * as THREE from "three";
import { windows } from "./utils/windows";

type Props = {
  polygon: Array<[number, number]>;
  color: string;
  height: number;
};

export function Piece({ color, height, polygon }: Props) {
  const geometryRef = (newGeometry?: any): void => {
    if (!newGeometry) {
      return;
    }
    // construct buffer geometry from polygon by adding the points for
    // each triangular face to the points with corresponding normals, uvs, and faces.
    const positions: Array<number> = [];
    const normals: Array<number> = [];
    const indices: Array<number> = [];

    // for each polygon edge (hence window(2)), create a wall
    const edges = windows(2, polygon);
    // include the final edge, connecting back to the beginning
    const start = polygon[0];
    const end = polygon[polygon.length - 1];
    edges.push([end, start]);

    edges.forEach(([[p1X, p1Y], [p2X, p2Y]]) => {
      const dx = p2X - p1X;
      const dy = p2Y - p1Y;
      const normalX = -dy;
      const normalY = dx;

      const p1LowerIndex = positions.length / 3;
      positions.push(p1X, p1Y, 0);
      normals.push(normalX, normalY, 0);
      const p1HigherIndex = p1LowerIndex + 1;
      positions.push(p1X, p1Y, height);
      normals.push(normalX, normalY, 0);
      const p2LowerIndex = p1LowerIndex + 2;
      positions.push(p2X, p2Y, 0);
      normals.push(normalX, normalY, 0);
      const p2HigherIndex = p2LowerIndex + 1;
      positions.push(p2X, p2Y, height);
      normals.push(normalX, normalY, 0);

      indices.push(p1LowerIndex, p1HigherIndex, p2LowerIndex);
      indices.push(p2LowerIndex, p1HigherIndex, p2HigherIndex);
      indices.push(p2LowerIndex, p1HigherIndex, p1LowerIndex);
      indices.push(p2LowerIndex, p2HigherIndex, p1HigherIndex);
    });

    // create and add top and bottoms
    const vertices = polygon.map(([xx, yy]) => new THREE.Vector2(xx, yy));

    const triangles = THREE.ShapeUtils.triangulateShape(vertices, []);

    for (const zz of [0, height]) {
      for (const triangle of triangles) {
        const p1 = polygon[triangle[0]];
        const p2 = polygon[triangle[1]];
        const p3 = polygon[triangle[2]];

        const zNormal = zz === 0 ? -1 : 1;

        const p1Index = positions.length / 3;
        positions.push(p1[0], p1[1], zz);
        normals.push(0, 0, zNormal);
        const p2Index = p1Index + 1;
        positions.push(p2[0], p2[1], zz);
        normals.push(0, 0, zNormal);
        const p3Index = p2Index + 1;
        positions.push(p3[0], p3[1], zz);
        normals.push(0, 0, zNormal);

        indices.push(p1Index, p2Index, p3Index);
        // indices.push(p2Index, p1Index, p3Index);
      }
    }

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

  return (
    <mesh>
      <bufferGeometry ref={geometryRef} attach={"geometry"}></bufferGeometry>
      <meshLambertMaterial attach={"material"} color={color} />
    </mesh>
  );
}
