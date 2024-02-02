import { Edges } from "@react-three/drei";
import * as React from "react";
import * as THREE from "three";

type Props = {
  polygon: Array<[number, number]>;
  color: string;
  border?: boolean;
};

// 2D polygon on the board
export function Space({ color, polygon, border }: Props) {
  const geometryRef = (newGeometry?: any): void => {
    if (!newGeometry) {
      return;
    }
    // construct buffer geometry from polygon by adding the points for
    // each triangular face to the points with corresponding normals, uvs, and faces.
    const positions: Array<number> = [];
    const normals: Array<number> = [];
    const indices: Array<number> = [];

    const vertices = polygon.map(([xx, yy]) => new THREE.Vector2(xx, yy));

    const triangles = THREE.ShapeUtils.triangulateShape(vertices, []);

    for (const triangle of triangles) {
      const p1 = polygon[triangle[0]];
      const p2 = polygon[triangle[1]];
      const p3 = polygon[triangle[2]];

      const p1Index = positions.length / 3;
      positions.push(p1[0], p1[1], 0);
      normals.push(0, 0, 1);
      const p2Index = p1Index + 1;
      positions.push(p2[0], p2[1], 0);
      normals.push(0, 0, 1);
      const p3Index = p2Index + 1;
      positions.push(p3[0], p3[1], 0);
      normals.push(0, 0, 1);

      indices.push(p1Index, p2Index, p3Index);
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

      {border && <Edges color="black" />}
    </mesh>
  );
}
