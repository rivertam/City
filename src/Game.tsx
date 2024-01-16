import { Leva, button } from "leva";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, MapControls } from "@react-three/drei";
import styled from "styled-components";
import { observer } from "mobx-react-lite";

import { useControls } from "leva";
import { City } from "./City/City";
import { CityState } from "./City/CityState";
import { CityGenerator } from "./City/CityGenerator";

export const GameWindow = styled.div`
  position: fixed;
  top: 0;
  width: 100%;
  height: 100%;

  background-color: blue;
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

  const tweaks = useControls("Game", {
    "Make simple city": button(async () => {
      setShouldGenerate(true);
    }),
    size: {
      min: 100,
      max: 1000,
      value: 500,
      step: 20,
    },
  });

  const [cityState, setCityState] = useState<CityState | null>(null);
  const [shouldGenerate, setShouldGenerate] = useState(false);
  const hasGenerated = useRef(false);

  useEffect(() => {
    if (!shouldGenerate) {
      return;
    }

    if (hasGenerated.current) {
      console.warn(
        "City generation props changed after generation. The prop change will be ignored."
      );

      return;
    }

    hasGenerated.current = true;

    (async () => {
      const generator = new CityGenerator({ size: tweaks.size });

      const generatedCity = await generator.generate();

      setCityState(new CityState(generatedCity));
    })();
  }, [shouldGenerate, tweaks.size]);

  if (!cityState) {
    return <></>;
  }

  return (
    <CityState.Context.Provider value={cityState}>
      <Leva />
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
          <City size={tweaks.size} />
        </Canvas>
      </GameWindow>
    </CityState.Context.Provider>
  );
});
