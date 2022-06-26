import * as zod from "zod";
import React, { useRef, useMemo, useCallback, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Box, PerspectiveCamera, OrbitControls, Line } from "@react-three/drei";
import styled from "styled-components";
import { observer } from "mobx-react-lite";
import { configurable } from "configui";

import { Agent } from "./Agents";
import { Park } from "./City/Park";
import { Piece } from "./City/Piece";
import { GameState } from "./GameState";
import { Space } from "./City/Space";
import { Road } from "./City/Road";
import { GUI } from "./GUI";
import { observable } from "mobx";
import { City } from "./City/City";

export const GameWindow = styled.div`
  position: fixed;
  top: 0;
  width: 100%;
  height: 100%;

  background-color: blue;
`;

const Camera = observer(() => {
  const camera = useRef<THREE.PerspectiveCamera>();
  const agent = Agent.useAgent("Camera", {
    "Field of View": {
      defaultValue: 20,
      min: 0.01,
      max: 100,
      step: 0.05,
    },
  });

  const fov = agent.state["Field of View"];

  return (
    <>
      <PerspectiveCamera
        ref={camera}
        makeDefault
        position={[0, 0, 100000 / fov]}
        near={10}
        far={999999}
        fov={fov}
        aspect={window.innerWidth / window.innerHeight}
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
});

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

    const [city, setCity] = useState(false);

    gameState.useMethod("Toggle city", () => {
      setCity((city) => !city);
    });

    return (
      <>
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
              {city && <City />}
            </Canvas>
          </GameState.Context.Provider>
        </GameWindow>
        <GUI />
      </>
    );
  }
);
