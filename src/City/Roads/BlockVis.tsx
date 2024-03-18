import * as React from "react";
import { Cylinder, Sphere } from "@react-three/drei";
import { StreetNode } from "../../streets";

export const BlockVis = ({
  from,
  to,
}: {
  from: StreetNode;
  to: StreetNode;
}) => {
  const distance = to.value.distanceTo(from.value);
  return (
    <>
      <Cylinder
        args={[0.5, 0.5, distance, 9]}
        position={[
          (from.value.x + to.value.x) / 2,
          (from.value.y + to.value.y) / 2,
          5,
        ]}
        rotation={[
          0,
          0,
          Math.atan2(from.value.y - to.value.y, from.value.x - to.value.x) +
            Math.PI / 2,
        ]}
      >
        <meshPhongMaterial attach="material" color="green" />
      </Cylinder>
      <Sphere
        args={[2, 32, 32]}
        position={[to.value.x, to.value.y, 2]}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </>
  );
};
