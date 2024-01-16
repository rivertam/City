import React, { useContext, useEffect, useMemo } from "react";
import { Sphere } from "@react-three/drei";

import { Park } from "./Park";
import { Road } from "./Road";
import { Space } from "./Space";
import { Building } from "./Building";
import { CityState } from "./CityState";
import { DisplayState } from "./DisplayState";
import { FocusedItemContext } from "../ui/FocusedItem";

const GroundHeights = {
  BaseGround: 0,
  Water: 0.01,
  Beach: 0.02,
  MinorRoad: 0.03,
  MajorRoad: 0.04,
  CoastlineRoad: 0.05,
  MainRoad: 0.06,
  Park: 0.07,
  Block: 0.08,
  Foundation: 0.09,
};

export const City = ({
  children,
}: {
  children?: React.ReactNode;
  size?: number;
}) => {
  const cityState = CityState.use();
  const displayState = DisplayState.use();

  const focusedItem = useContext(FocusedItemContext);

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
        {cityState.lots.map((lot) => (
          <Building
            key={lot.address}
            polygon={lot.shape}
            color="white"
            height={(lot.address.length - 6) * 2}
            entryPoint={{
              x: lot.entryPoint.value.x,
              y: lot.entryPoint.value.y,
            }}
          />
        ))}
      </group>

      <group position={[0, 0, GroundHeights.Foundation]}>
        {cityState.streetGraph.nodes.map((node) => {
          const color = (() => {
            if (
              displayState.focusedStreet &&
              node.segments.has(displayState.focusedStreet)
            ) {
              return "green";
            }

            const includesIntersection = Array.from(node.segments.keys()).some(
              (streetName) => {
                return streetName.includes("intersection");
              }
            );

            if (includesIntersection) {
              return "red";
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
            <Sphere
              position={[node.value.x, node.value.y, 2]}
              rotation={[Math.PI / 2, 0, 0]}
              key={`${node.value.x},${node.value.y}`}
              onClick={() => {
                focusedItem.setItem({
                  kind: "streetNode",
                  node,
                });
              }}
            >
              <meshPhongMaterial attach="material" color={color} />
            </Sphere>
          );
        })}
      </group>
    </>
  );
};
