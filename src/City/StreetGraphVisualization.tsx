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
  const [highlightNodes, setHighlightNodes] = React.useState<Vector[]>([]);

  globalThis.toggleHighlightNode = (vector: Vector) => {
    setHighlightNodes((prev) => {
      for (let i = 0; i < prev.length; i++) {
        if (prev[i].x === vector.x && prev[i].y === vector.y) {
          prev.splice(i, 1);
          return [...prev];
        }
      }

      return [...prev, vector];
    });
  };

  globalThis.iterateThroughFailedPolygons = async () => {
    if (globalThis.failedPolygons) {
      for (const polygon of globalThis.failedPolygons) {
        for (const node of polygon) {
          globalThis.toggleHighlightNode(node);
        }

        await wait(1000);

        for (const node of polygon) {
          globalThis.toggleHighlightNode(node);
        }
      }
    }
  };

  console.log(highlightNodes);
  return (
    <>
      {highlightNodes.map((vector) => {
        return (
          <Sphere
            args={[2, 32, 32]}
            position={[
              vector.x + globalThis.globalCityTranslation.x,
              vector.y + globalThis.globalCityTranslation.y,
              0.5,
            ]}
            rotation={[Math.PI / 2, 0, 0]}
            key={`${vector.x},${vector.y}`}
          >
            <meshPhongMaterial attach="material" color="purple" />
          </Sphere>
        );
      })}
      {streetGraph.nodes.map((node) => {
        const isFocused =
          displayState.focusedItem?.kind === "streetNode" &&
          displayState.focusedItem.node === node;

        const color = (() => {
          const includesIntersection = Array.from(node.segments.keys()).some(
            (streetName) => {
              return streetName.includes("intersection");
            }
          );

          if (isFocused) {
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
          <>
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
            {isFocused && (
              <>
                {Array.from(node.neighbors).map((neighbor) => {
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
          </>
        );
      })}
    </>
  );
});
