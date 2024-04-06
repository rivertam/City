import { Leva, useControls } from "leva";
import { useRef } from "react";
import * as React from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, MapControls } from "@react-three/drei";
import styled from "styled-components";
import { observer } from "mobx-react-lite";

import { City } from "./City/City";
import { CityState } from "./state/CityState";
import { FocusedItem } from "./ui/FocusedItem";
import { StartScreen } from "./StartScreen";

export const GameWindow = styled.div`
  position: fixed;
  top: 0;
  width: 100%;
  height: 100%;

  background-color: blue;
  z-index: 0;
`;

const Camera = observer(() => {
  const camera = useRef<THREE.PerspectiveCamera>();

  const { fov } = useControls("Camera", {
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
        intensity={0.8}
      />
      <directionalLight
        position={[100, 1000, 1000]}
        color={0xaaaaaa}
        intensity={0.8}
      />
      <directionalLight
        position={[0, 0, 1000]}
        color={0xaaaaaa}
        intensity={0.8}
      />
      <ambientLight intensity={0.5} />
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

  const [cityState, setCityState] = React.useState<CityState | null>(null);

  if (!cityState) {
    return <StartScreen setCityState={setCityState} />;
  }

  return (
    <CityState.Context.Provider value={cityState}>
      <Leva />
      <GameWindow onContextMenu={(e) => e.preventDefault()} ref={divWrapper}>
        <Canvas
          gl={(canvas) => {
            renderer.current = new THREE.WebGLRenderer({
              logarithmicDepthBuffer: true,
              canvas,
            });

            renderer.current.setClearColor(0x333333);
            renderer.current.setPixelRatio(window.devicePixelRatio);
            if (divWrapper.current) {
              renderer.current.setSize(canvas.width, canvas.height);
            }

            return renderer.current;
          }}
        >
          <Camera />
          <City />
        </Canvas>
      </GameWindow>
      <FocusedItem />
    </CityState.Context.Provider>
  );
});
