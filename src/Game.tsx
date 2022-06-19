import React, { useRef, useMemo, useCallback } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Box, PerspectiveCamera, OrbitControls, Line } from "@react-three/drei";
import styled from "styled-components";

import { Park } from "./City/Park";
import { Piece } from "./City/Piece";
import { GameState } from "./GameState";
import { observer } from "mobx-react-lite";
import { Space } from "./City/Space";
import { Road } from "./City/Road";

export const GameWindow = styled.div`
  position: fixed;
  top: 0;
  width: 100%;
  height: 100%;

  background-color: blue;
`;

function Camera() {
  const camera = useRef<THREE.PerspectiveCamera>();
  return (
    <>
      <PerspectiveCamera
        ref={camera}
        makeDefault
        position={[0, 0, 600]}
        near={10}
        far={9999}
        fov={80}
        aspect={window.innerWidth / 2 / window.innerHeight}
      ></PerspectiveCamera>
      <directionalLight position={[1000, 100, 1000]} color={0xaaaaaa} />
      <directionalLight position={[100, 1000, 1000]} color={0xaaaaaa} />
      <directionalLight position={[0, 0, 1000]} color={0xaaaaaa} />
      <OrbitControls
        addEventListener={undefined}
        hasEventListener={undefined}
        removeEventListener={undefined}
        dispatchEvent={undefined}
      />
    </>
  );
}

export const Game = observer(
  ({ gameState }: { gameState: GameState }): React.ReactElement => {
    const renderer = useRef<THREE.WebGLRenderer>();

    const divWrapper = useRef<HTMLDivElement | null>(null);

    const testRoads: Array<[number, number][]> = [
      [
        [0, 0],
        [50, 50],
        [100, 0],
        [100, 100],
        [0, 100],
        [0, 0],
      ],

      [
        [200, 0],
        [200, 100],
      ],
    ];

    return (
      <GameWindow ref={divWrapper}>
        <GameState.Context.Provider value={gameState}>
          <Canvas
            gl={(canvas) => {
              renderer.current = new THREE.WebGLRenderer({
                logarithmicDepthBuffer: true,
                canvas,
              });

              renderer.current.setClearColor(0x333333);
              renderer.current.setPixelRatio(window.devicePixelRatio);
              if (divWrapper.current) {
                renderer.current.setSize(
                  canvas.offsetWidth,
                  canvas.offsetHeight
                );
              }

              return renderer.current;
            }}
          >
            <Camera />

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

            {/*testRoads.map((road) => (
              <Road line={road} color="red" size={30} />
            ))*/}

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
            </group>
          </Canvas>
        </GameState.Context.Provider>
      </GameWindow>
    );
  }
);
