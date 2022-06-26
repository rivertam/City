import React from "react";
import { GameState } from "../GameState";
import { Park } from "./Park";
import { Piece } from "./Piece";
import { Road } from "./Road";
import { Space } from "./Space";

export const City = () => {
  const gameState = GameState.use();

  return (
    <>
      <group position={[0, 0, -1]}>
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

      <group position={[0, 0, 0]}>
        <Space polygon={gameState.sea.polygon} color="blue" />
      </group>

      <group position={[0, 0, 1]}>
        <Space polygon={gameState.coastline.polygon} color="tan" />
      </group>
      <group position={[0, 0, 3]}>
        <Space polygon={gameState.river.polygon} color="blue" />
      </group>
      <group position={[0, 0, 2]}>
        <Space polygon={gameState.secondaryRiver.polygon} color="blue" />
      </group>

      {gameState.roads.coastline.map((road) => (
        <Road
          key={road.name}
          line={road.polygon.map(([xx, yy]) => [xx, yy, 10])}
          color="orange"
          size={12}
        />
      ))}

      {gameState.roads.main.map((road) => (
        <Road
          key={road.name}
          line={road.polygon.map(([xx, yy]) => [xx, yy, 5])}
          color="yellow"
          size={12}
        />
      ))}

      {gameState.roads.major.map((road) => (
        <Road
          key={road.name}
          line={road.polygon.map(([xx, yy]) => [xx, yy, 4])}
          color="white"
          size={8}
        />
      ))}

      {gameState.roads.minor.map((road) => (
        <Road
          key={road.name}
          line={road.polygon.map(([xx, yy]) => [xx, yy, 3])}
          color="grey"
          size={5}
        />
      ))}

      <group position={[0, 0, -30]}>
        {gameState.parks.map((park) => (
          <Park key={park.name} park={park} />
        ))}
      </group>

      <group position={[0, 0, 3]}>
        {gameState.blocks.map((block) => (
          <Space
            key={block.shape.name}
            polygon={block.shape.polygon}
            color="#afa"
          />
        ))}
      </group>
      <group position={[0, 0, 5]}>
        {gameState.lots.map((lot) => (
          <Piece
            key={lot.shape.name}
            polygon={lot.shape.polygon}
            color="white"
            height={(lot.shape.name.length - 6) * 2}
          />
        ))}
        {/*
          <Space
            key={lot.shape.name}
            polygon={lot.shape.polygon}
            color="#fff"
          />

                  */}
      </group>
    </>
  );
};
