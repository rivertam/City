import * as React from "react";

import { Park } from "./Park";
import { Space } from "./Space";
import { Building } from "./Building";
import { CityState } from "../state/CityState";
import { StreetGraphVisualization } from "./Roads";
import { observer } from "mobx-react-lite";
import { GroundHeights } from "./constants";
import { Roads } from "./Roads";

const displayVisualization = true;

export const City = observer(function City({
  children,
}: {
  children?: React.ReactNode;
}) {
  const cityState = CityState.use();

  return (
    <>
      {children}

      <Roads />
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
      {displayVisualization && (
        <group position={[0, 0, GroundHeights.Foundation]}>
          <StreetGraphVisualization />
        </group>
      )}
    </>
  );
});
