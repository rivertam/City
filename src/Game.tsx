import React, { useRef } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls } from "@react-three/drei";
import styled from "styled-components";
import { observer } from "mobx-react-lite";

import { Agent } from "./Agents";
import { CityState } from "./City/CityState";
import { GUI } from "./GUI";
import { City } from "./City/City";
import { SegregationSimulation } from "./simulations/Segregation";

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

export const Game = observer((): React.ReactElement => {
  const renderer = useRef<THREE.WebGLRenderer>();

  const divWrapper = useRef<HTMLDivElement | null>(null);

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
          <City>
            <SegregationSimulation />
          </City>
        </Canvas>
      </GameWindow>
      <GUI />
    </>
  );
});
