import * as React from "react";
import { Cylinder, Sphere } from "@react-three/drei";
import { observer } from "mobx-react-lite";

import { CityState } from "../state/CityState";
import { DisplayState } from "../state/DisplayState";
import Vector from "../generation/vector";
import { StreetNode } from "../generation/impl/graph";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const BlockVis = ({ from, to }: { from: StreetNode; to: StreetNode }) => {
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

export const StreetGraphVisualization = observer(() => {
  const { streetGraph } = CityState.use();
  const displayState = DisplayState.use();

  return (
    <>
      {streetGraph.nodes.map((node) => {
        const isFocused =
          displayState.focusedItem?.kind === "streetNode" &&
          displayState.focusedItem.node === node;

        const color = (() => {
          const streamlineNames = node.streamlineNames();
          const includesIntersection = streamlineNames.some((streetName) => {
            return streetName.includes("intersection");
          });

          if (isFocused) {
            return "rgba(100, 255, 100)";
          }

          if (includesIntersection) {
            return "red";
          }

          if (streamlineNames.length === 0) {
            return "rgb(255, 100, 100)";
          }

          if (streamlineNames.length === 1) {
            return "yellow";
          }

          if (streamlineNames.length === 2) {
            return "white";
          }

          return "blue";
        })();

        if (isFocused) {
          console.log(node);
        }

        return (
          <React.Fragment key={`${node.value.x},${node.value.y}`}>
            <Sphere
              position={[node.value.x, node.value.y, 2]}
              rotation={[Math.PI / 2, 0, 0]}
              onClick={() => {
                displayState.focusItem({
                  kind: "streetNode",
                  node,
                });
              }}
            >
              <meshPhongMaterial attach="material" color={color} />
            </Sphere>
            {isFocused && (
              <>
                {node.edges().map(({ neighbor }) => {
                  return (
                    <BlockVis
                      from={node}
                      to={neighbor}
                      key={`${node.value.x},${node.value.y}-${neighbor.value.x},${neighbor.value.y}`}
                    />
                  );
                })}
              </>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
});
