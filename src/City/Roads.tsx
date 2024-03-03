import * as React from "react";
import { observer } from "mobx-react-lite";

import { GroundHeights } from "./constants";
import { CityState } from "../state/CityState";
import { DisplayState } from "../state/DisplayState";
import { Road } from "./Road";

export const Roads = observer(function Roads() {
  const cityState = CityState.use();
  const displayState = DisplayState.use();

  return (
    <>
      <group position={[0, 0, GroundHeights.CoastlineRoad]}>
        {cityState.roads.coastline.map((road) => (
          <Road key={road.name} road={road} defaultColor={"orange"} size={5} />
        ))}
      </group>

      <group position={[0, 0, GroundHeights.MainRoad]}>
        {cityState.roads.main.map((road) => (
          <Road key={road.name} road={road} defaultColor={"yellow"} size={4} />
        ))}
      </group>

      <group position={[0, 0, GroundHeights.MajorRoad]}>
        {cityState.roads.major.map((road) => (
          <Road road={road} key={road.name} defaultColor={"white"} size={3} />
        ))}
      </group>

      <group position={[0, 0, GroundHeights.MinorRoad]}>
        {cityState.roads.minor.map((road) => (
          <Road key={road.name} road={road} defaultColor={"grey"} size={2} />
        ))}
      </group>
    </>
  );
});
