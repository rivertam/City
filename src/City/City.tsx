import React, { useEffect, useRef, useState } from "react";
import { CityGenerator } from "./CityGenerator";
import { CityState } from "./CityState";
import { Park } from "./Park";
import { Road } from "./Road";
import { Space } from "./Space";
import { Building } from "./Building";
import { Cylinder, Sphere } from "@react-three/drei";

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
  size,
}: {
  children?: React.ReactNode;
  size?: number;
}) => {
  const [cityState, setCityState] = useState<CityState | null>(null);
  const hasGenerated = useRef(false);

  useEffect(() => {
    if (hasGenerated.current) {
      console.warn(
        "City generation props changed after generation. The prop change will be ignored."
      );

      return;
    }

    hasGenerated.current = true;

    (async () => {
      const generator = new CityGenerator({ size });

      const generatedCity = await generator.generate();

      setCityState(new CityState(generatedCity));
    })();
  }, [size]);

  if (!cityState) {
    return <></>;
  }

  return (
    <CityState.Context.Provider value={cityState}>
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
          return (
            <Sphere
              position={[node.value.x, node.value.y, 2]}
              rotation={[Math.PI / 2, 0, 0]}
              key={`${node.value.x},${node.value.y}`}
              onClick={() => {
                console.log(node.segments.keys());
              }}
            >
              <meshPhongMaterial attach="material" color="white" />
            </Sphere>
          );
        })}
      </group>
    </CityState.Context.Provider>
  );
};
