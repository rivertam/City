import React from "react";
import { Sphere } from "@react-three/drei";
import { observer } from "mobx-react-lite";

import { CityState } from "./CityState";
import { DisplayState } from "./DisplayState";

export const StreetGraphVisualization = observer(() => {
  const { streetGraph } = CityState.use();
  const displayState = DisplayState.use();

  return (
    <>
      {streetGraph.nodes.map((node) => {
        const color = (() => {
          const includesIntersection = Array.from(node.segments.keys()).some(
            (streetName) => {
              return streetName.includes("intersection");
            }
          );

          if (
            displayState.focusedItem?.kind === "streetNode" &&
            displayState.focusedItem.node === node
          ) {
            return "rgba(100, 255, 100)";
          }

          if (includesIntersection) {
            return "red";
          }

          if (node.segments.size === 0) {
            return "rgb(255, 100, 100)";
          }

          if (node.segments.size === 1) {
            return "yellow";
          }

          if (node.segments.size === 2) {
            return "white";
          }

          return "blue";
        })();

        return (
          <Sphere
            position={[node.value.x, node.value.y, 2]}
            rotation={[Math.PI / 2, 0, 0]}
            key={`${node.value.x},${node.value.y}`}
            onClick={() => {
              displayState.focusItem({
                kind: "streetNode",
                node,
              });
            }}
          >
            <meshPhongMaterial attach="material" color={color} />
          </Sphere>
        );
      })}
    </>
  );
});
