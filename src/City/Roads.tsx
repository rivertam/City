import * as React from "react";
import { observer } from "mobx-react-lite";

import { GroundHeights } from "./constants";
import { CityState } from "../state/CityState";
import { DisplayState } from "../state/DisplayState";
import { Road } from "./Road";

export const Roads = observer(function Roads() {
  const cityState = CityState.use();
  const displayState = DisplayState.use();
  const focusedItem = displayState.focusedItem;

  const HIGHLIGHTED_STREET_COLOR = "hsl(120, 100%, 50%)";

  console.count("Rendering roads...");

  return (
    <>
      <group position={[0, 0, GroundHeights.CoastlineRoad]}>
        {cityState.roads.coastline.map((road) => (
          <Road
            key={road.name}
            road={road}
            color={focusedItem === road ? HIGHLIGHTED_STREET_COLOR : "orange"}
            size={5}
          />
        ))}
      </group>

      <group position={[0, 0, GroundHeights.MainRoad]}>
        {cityState.roads.main.map((road) => (
          <Road
            key={road.name}
            road={road}
            color={focusedItem === road ? HIGHLIGHTED_STREET_COLOR : "yellow"}
            size={4}
          />
        ))}
      </group>

      <group position={[0, 0, GroundHeights.MajorRoad]}>
        {cityState.roads.major.map((road) => (
          <Road
            road={road}
            key={road.name}
            color={focusedItem === road ? HIGHLIGHTED_STREET_COLOR : "white"}
            size={3}
          />
        ))}
      </group>

      <group position={[0, 0, GroundHeights.MinorRoad]}>
        {cityState.roads.minor.map((road) => (
          <Road
            key={road.name}
            road={road}
            color={focusedItem === road ? HIGHLIGHTED_STREET_COLOR : "grey"}
            size={2}
          />
        ))}
      </group>
    </>
  );
});
