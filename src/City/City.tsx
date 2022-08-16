import React, { useEffect, useState } from "react";
import { CityGenerator } from "./CityGenerator";
import { CityState } from "./CityState";
import { Park } from "./Park";
import { Road } from "./Road";
// import { Space } from "./Space";
import { Piece } from "./Piece";
import { ReactStage } from "../Stage";
import { Role } from "../Stage";
import { Space, Spaces } from "./Space";

export const City = ({ children }: { children: React.ReactNode }) => {
  const [stage] = useState(() => new ReactStage());
  const [cityState, setCityState] = useState<CityState | null>(null);

  stage.useSetup(async () => {
    const generator = new CityGenerator();

    const generatedCity = await generator.generate();

    console.log("generated sea", generatedCity.sea.polygon);

    const ground = stage.addActor();
    ground.assignRole(Space, {
      polygon: [
        [-900, -900],
        [-900, 900],
        [900, 900],
        [900, -900],
      ],
      color: "tan",
      height: 5,
    });

    const sea = stage.addActor();
    sea.assignRole(Space, {
      polygon: generatedCity.sea.polygon,
      color: "blue",
      height: 1,
    });

    const coastline = stage.addActor();
    coastline.assignRole(Space, {
      polygon: generatedCity.coastline.polygon,
      color: "tan",
      height: 1,
    });

    const river = stage.addActor();
    river.assignRole(Space, {
      polygon: generatedCity.river.polygon,
      color: "blue",
      height: 3,
    });

    const secondaryRiver = stage.addActor();
    secondaryRiver.assignRole(Space, {
      polygon: generatedCity.secondaryRiver.polygon,
      color: "blue",
      height: 2,
    });

    // setCityState(new CityState(generatedCity));
  });

  const StageProvider = stage.Provider;

  if (!cityState) {
    return (
      <StageProvider>
        {children}
        <Spaces />
      </StageProvider>
    );
  }

  return (
    <StageProvider>
      <CityState.Context.Provider value={cityState}>
        {children}

        {/*
        <group position={[0, 0, 0]}>
          <Space polygon={cityState.sea.polygon} color="blue" />
        </group>

        <group position={[0, 0, 1]}>
          <Space polygon={cityState.coastline.polygon} color="tan" />
        </group>
        <group position={[0, 0, 3]}>
          <Space polygon={cityState.river.polygon} color="blue" />
        </group>
        <group position={[0, 0, 2]}>
          <Space polygon={cityState.secondaryRiver.polygon} color="blue" />
        </group>
  */}

        {cityState.roads.coastline.map((road) => (
          <Road
            key={road.name}
            line={road.polygon.map(([xx, yy]) => [xx, yy, 10])}
            color="orange"
            size={12}
          />
        ))}

        {cityState.roads.main.map((road) => (
          <Road
            key={road.name}
            line={road.polygon.map(([xx, yy]) => [xx, yy, 5])}
            color="yellow"
            size={12}
          />
        ))}

        {cityState.roads.major.map((road) => (
          <Road
            key={road.name}
            line={road.polygon.map(([xx, yy]) => [xx, yy, 4])}
            color="white"
            size={8}
          />
        ))}

        {cityState.roads.minor.map((road) => (
          <Road
            key={road.name}
            line={road.polygon.map(([xx, yy]) => [xx, yy, 3])}
            color="grey"
            size={5}
          />
        ))}

        <group position={[0, 0, -30]}>
          {cityState.parks.map((park) => (
            <Park key={park.name} park={park} />
          ))}
        </group>

        <group position={[0, 0, 3]}>
          {cityState.blocks.map((block) => (
            <Space
              key={block.shape.name}
              polygon={block.shape.polygon}
              color="#afa"
            />
          ))}
        </group>

        {/*<Space key={lot.address} polygon={lot.shape} color="#fff" /> */}
        <group position={[0, 0, 5]}>
          {cityState.lots.map((lot) => (
            <Piece
              key={lot.address}
              polygon={lot.shape}
              color="white"
              height={(lot.address.length - 6) * 2}
            />
          ))}
        </group>
      </CityState.Context.Provider>
    </StageProvider>
  );
};
