import React, { useRef, useMemo, useCallback } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Box, PerspectiveCamera, OrbitControls, Line } from "@react-three/drei";
import styled from "styled-components";

import { Park } from "./Park";
import { Piece } from "./Piece";
import { GameState, MapLine, GeneratedCity } from "./GameState";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { Geometry, ConvexHull, VertexNode, ConvexGeometry } from "three-stdlib";
import { Space } from "./Space";

export const GameWindow = styled.div`
  position: fixed;
  right: 0;
  top: 0;
  width: 50%;
  height: 50%;

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
}

const MapLineRender: React.FC<{ line: MapLine; color: string }> = ({
  line,
  color,
}) => {
  return null;
  return (
    <Line
      points={line.polygon.map(([x, y]) => [x, y, 0.05])}
      color={color}
      lineWidth={2}
    />
  );
};

export const Game = observer(
  ({ city }: { city: GeneratedCity }): React.ReactElement => {
    const renderer = useRef<THREE.WebGLRenderer>();

    const gameState = useMemo(() => {
      return new GameState(city);
    }, [city]);

    const divWrapper = useRef<HTMLDivElement | null>(null);

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
                console.log("seting size");
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
                color="beige"
              />
            </group>

            <group position={[0, 0, 0]}>
              <Space polygon={gameState.sea.polygon} color="blue" />
            </group>

            <group position={[0, 0, 1]}>
              <Space polygon={gameState.coastline.polygon} color="beige" />
            </group>
            <group position={[0, 0, 3]}>
              <Space polygon={gameState.river.polygon} color="blue" />
            </group>
            <group position={[0, 0, 2]}>
              <Space polygon={gameState.secondaryRiver.polygon} color="blue" />
            </group>
            <group position={[0, 0, 5]}>
              {gameState.mainRoads.map((road) => (
                <MapLineRender key={road.name} line={road} color="yellow" />
              ))}
            </group>

            <group position={[0, 0, 2]}>
              {gameState.majorRoads.map((road) => (
                <MapLineRender key={road.name} line={road} color="white" />
              ))}
            </group>

            <group position={[0, 0, 3]}>
              {gameState.minorRoads.map((road) => (
                <MapLineRender key={road.name} line={road} color="grey" />
              ))}
            </group>

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
                  color="#ddd"
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
