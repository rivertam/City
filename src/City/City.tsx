import * as React from "react";

import { Park } from "./Park";
import { Road } from "./Road";
import { Space } from "./Space";
import { Building } from "./Building";
import { CityState } from "../state/CityState";
import { StreetGraphVisualization } from "./StreetGraphVisualization";
import { DisplayState } from "../state/DisplayState";
import { observer } from "mobx-react-lite";
import { Street } from "../state/Street";

const GroundHeights = {
  BaseGround: 0,
  Park: 0.01,
  Water: 0.02,
  Beach: 0.03,
  Block: 0.04,
  MinorRoad: 0.05,
  MajorRoad: 0.06,
  CoastlineRoad: 0.07,
  MainRoad: 0.08,
  Foundation: 0.09,
};

export const City = observer(
  ({ children }: { children?: React.ReactNode; size?: number }) => {
    const cityState = CityState.use();
    const displayState = DisplayState.use();
    const focusedItem = displayState.useFocusedItem();

    const HIGHLIGHTED_STREET_COLOR = "hsl(120, 100%, 50%)";

    return (
      <>
        {children}
        <group position={[0, 0, GroundHeights.BaseGround]}>
          <Space
            polygon={[
              [-900, -900],
              [-900, 900],
              [900, 900],
              [900, -900],
            ]}
            color="tan"
          />
        </group>

        <group position={[0, 0, GroundHeights.Water]}>
          <Space polygon={cityState.sea.polygon} color="blue" />
        </group>

        <group position={[0, 0, GroundHeights.Beach]}>
          <Space polygon={cityState.coastline.polygon} color="tan" />
        </group>
        <group position={[0, 0, GroundHeights.Water]}>
          <Space polygon={cityState.river.polygon} color="blue" />
        </group>
        <group position={[0, 0, GroundHeights.Water]}>
          <Space polygon={cityState.secondaryRiver.polygon} color="blue" />
        </group>

        {cityState.roads.coastline.map((road) => (
          <Road
            key={road.name}
            line={road.line.map((vector) => [
              vector.x,
              vector.y,
              GroundHeights.CoastlineRoad,
            ])}
            color={focusedItem === road ? HIGHLIGHTED_STREET_COLOR : "orange"}
            size={5}
          />
        ))}

        {cityState.roads.main.map((road) => (
          <Road
            key={road.name}
            line={road.line.map((vector) => [
              vector.x,
              vector.y,
              GroundHeights.MainRoad,
            ])}
            color={focusedItem === road ? HIGHLIGHTED_STREET_COLOR : "yellow"}
            size={4}
          />
        ))}

        {cityState.roads.major.map((road) => (
          <Road
            key={road.name}
            line={road.line.map((vector) => [
              vector.x,
              vector.y,
              GroundHeights.MajorRoad,
            ])}
            color={focusedItem === road ? HIGHLIGHTED_STREET_COLOR : "white"}
            size={3}
          />
        ))}

        {cityState.roads.minor.map((road) => (
          <Road
            key={road.name}
            line={road.line.map((vector) => [
              vector.x,
              vector.y,
              GroundHeights.MinorRoad,
            ])}
            color={focusedItem === road ? HIGHLIGHTED_STREET_COLOR : "grey"}
            size={2}
          />
        ))}

        <group position={[0, 0, GroundHeights.Park]}>
          {cityState.parks.map((park) => (
            <Park key={park.name} park={park} />
          ))}
        </group>

        <group position={[0, 0, GroundHeights.Block]}>
          {cityState.blocks.map((block) => (
            <Space
              key={block.shape.name}
              polygon={block.shape.polygon}
              color="#afa"
            />
          ))}
        </group>

        <group position={[0, 0, GroundHeights.Foundation]}>
          {cityState.lots.map((lot) => {
            return (
              <Building
                key={lot.address}
                polygon={lot.shape}
                height={(lot.address.length - 6) * 2}
                lot={lot}
              />
            );
          })}
        </group>
        <group position={[0, 0, GroundHeights.Foundation]}>
          <StreetGraphVisualization />
        </group>
      </>
    );
  }
);
