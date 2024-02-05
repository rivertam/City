import * as React from "react";

import { Park } from "./Park";
import { Road } from "./Road";
import { Space } from "./Space";
import { Building } from "./Building";
import { CityState } from "../state/CityState";
import { StreetGraphVisualization } from "./StreetGraphVisualization";
import { DisplayState } from "../state/DisplayState";
import { observer } from "mobx-react-lite";

const GroundHeights = {
  BaseGround: 0,
  Park: 0.01,
  Water: 0.02,
  Beach: 0.03,
  MinorRoad: 0.04,
  MajorRoad: 0.05,
  CoastlineRoad: 0.06,
  MainRoad: 0.07,
  Block: 0.08,
  Foundation: 0.09,
};

export const City = observer(
  ({ children }: { children?: React.ReactNode; size?: number }) => {
    const cityState = CityState.use();
    const displayState = DisplayState.use();

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
            line={road.polygon.map(([xx, yy]) => [
              xx,
              yy,
              GroundHeights.CoastlineRoad,
            ])}
            color="orange"
            size={12}
          />
        ))}

        {cityState.roads.main.map((road) => (
          <Road
            key={road.name}
            line={road.polygon.map(([xx, yy]) => [
              xx,
              yy,
              GroundHeights.MainRoad,
            ])}
            color="yellow"
            size={12}
          />
        ))}

        {cityState.roads.major.map((road) => (
          <Road
            key={road.name}
            line={road.polygon.map(([xx, yy]) => [
              xx,
              yy,
              GroundHeights.MajorRoad,
            ])}
            color="white"
            size={8}
          />
        ))}

        {cityState.roads.minor.map((road) => (
          <Road
            key={road.name}
            line={road.polygon.map(([xx, yy]) => [
              xx,
              yy,
              GroundHeights.MinorRoad,
            ])}
            color="grey"
            size={5}
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
