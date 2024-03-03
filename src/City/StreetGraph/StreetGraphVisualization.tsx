import * as React from "react";
import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { Cylinder, Sphere } from "@react-three/drei";

import { CityState } from "../../state/CityState";
import { DisplayState } from "../../state/DisplayState";
import { BlockVis } from "./BlockVis";

export const StreetGraphVisualization = observer(
  function StreetGraphVisualization() {
    const { streetGraph } = CityState.use();
    const displayState = DisplayState.use();

    const focusedItem = displayState.focusedItem;

    return (
      <>
        {streetGraph.nodes.map((node) => {
          const isFocused = focusedItem === node;

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
                onClick={action(() => {
                  displayState.focusedItem = node;
                })}
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
  }
);
