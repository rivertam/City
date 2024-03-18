import * as React from "react";
import { observer } from "mobx-react-lite";

import { StreetNode } from "../../streets";
import { DisplayState } from "../../state/DisplayState";
import { action, computed } from "mobx";
import { Sphere } from "@react-three/drei";
import { BlockVis } from "./BlockVis";

export const StreetNodeVis = observer(function StreetNode({
  node,
}: {
  node: StreetNode;
}) {
  const displayState = DisplayState.use();
  const isFocused = computed(() => displayState.focusedItem === node).get();
  const isInFocusedPath = computed(() =>
    displayState.focusedPath?.nodes.find((pathPart) => pathPart.node === node)
  ).get();

  // color indicates how many streets intersect at this node or whether it's focused
  const color = (() => {
    const streamlineNames = node.streamlineNames();
    if (isFocused || isInFocusedPath) {
      return "rgba(100, 255, 100)";
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
});
