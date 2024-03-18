import * as React from "react";
import { observer } from "mobx-react-lite";

import { CityState } from "../../state/CityState";
import { StreetNodeVis } from "./StreetNodeVis";
import { DisplayState } from "../../state/DisplayState";

export const StreetGraphVisualization = observer(
  function StreetGraphVisualization() {
    const { streetGraph } = CityState.use();
    const displayState = DisplayState.use();

    const path = displayState.focusedPath;

    return (
      <>
        {streetGraph.nodes.map((node) => (
          <StreetNodeVis key={`${node.value.x}-${node.value.y}`} node={node} />
        ))}
      </>
    );
  }
);
