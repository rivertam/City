import React, { useRef } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, MapControls } from "@react-three/drei";
import styled from "styled-components";
import { observer } from "mobx-react-lite";

import { wait } from './utils/wait';
import { makeButton, useTweaks } from "use-tweaks";
import { Simple } from "./simulations/Simple";

export const GameWindow = styled.div`
  position: fixed;
  top: 0;
  width: 100%;
  height: 100%;

  background-color: blue;
`;

const Camera = observer(() => {
  const camera = useRef<THREE.PerspectiveCamera>();

  const { fov } = useTweaks("Camera", {
    fov: {
      value: 20,
      min: 0.01,
      max: 100,
    },
  });

  return (
    <>
      <PerspectiveCamera
        ref={camera}
        makeDefault
        position={[80, 1000, 1200]}
        up={[0, 0, 1]}
        near={10}
        far={999999}
        fov={fov}
        aspect={window.innerWidth / window.innerHeight}
      ></PerspectiveCamera>
      <directionalLight
        position={[1000, 100, 1000]}
        color={0xaaaaaa}
        intensity={0.5}
      />
      <directionalLight
        position={[100, 1000, 1000]}
        color={0xaaaaaa}
        intensity={0.5}
      />
      <directionalLight
        position={[0, 0, 1000]}
        color={0xaaaaaa}
        intensity={0.5}
      />
      <ambientLight intensity={0.1} />
      <MapControls
        addEventListener={undefined}
        hasEventListener={undefined}
        removeEventListener={undefined}
        dispatchEvent={undefined}
      />
    </>
  );
});

export const Game = observer((): React.ReactElement => {
  const renderer = useRef<THREE.WebGLRenderer>();

  const divWrapper = useRef<HTMLDivElement | null>(null);

  const [Simulation, setSimulation] = React.useState<React.ReactNode | null>(
    null
  );

  const tweaks = useTweaks("Game", {
    ...makeButton("Make simple city", async () => {
      setSimulation(() => null);
      await wait(100);
      setSimulation(() => Simple);
    }),
    size: {
      min: 100,
      max: 1000,
      value: 500,
      step: 20,
    },
  });

  return (
    <>
      <GameWindow ref={divWrapper}>
        <Canvas
          gl={(canvas) => {
            renderer.current = new THREE.WebGLRenderer({
              logarithmicDepthBuffer: true,
              canvas,
            });

            renderer.current.setClearColor(0x333333);
            renderer.current.setPixelRatio(window.devicePixelRatio);
            if (divWrapper.current) {
              renderer.current.setSize(canvas.offsetWidth, canvas.offsetHeight);
            }

            return renderer.current;
          }}
        >
          <Camera />
          {Simulation && <Simulation size={tweaks.size} />}
        </Canvas>
      </GameWindow>
    </>
  );
});
