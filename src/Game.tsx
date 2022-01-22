import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Box, PerspectiveCamera, OrbitControls, Line } from '@react-three/drei';
import styled from 'styled-components';

import { Piece } from './Piece';
import { GameState, MapLine, GeneratedCity } from './GameState';
import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Geometry, ConvexHull, VertexNode, ConvexGeometry } from 'three-stdlib';

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
        position={[0, 0, 300]}
        near={0.005}
        far={999999999}
        fov={80}
        aspect={window.innerWidth / window.innerHeight}
      ></PerspectiveCamera>
      <directionalLight position={[1000, 100, 1000]} color={0xaaaaaa} />
      <directionalLight position={[100, 1000, 1000]} color={0xaaaaaa} />
      <OrbitControls
        addEventListener={undefined}
        hasEventListener={undefined}
        removeEventListener={undefined}
        dispatchEvent={undefined}
      />
    </>
  );
}

function canvasRef(canvas: HTMLCanvasElement | null) {
  if (!canvas) {
    return;
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

const MapLineRender: React.FC<{ line: MapLine; color: string }> = ({
  line,
  color,
}) => {
  return (
    <Line
      points={line.polygon.map(([x, y]) => [x, y, 0])}
      color={color}
      lineWidth={1}
    />
  );
};

const Park: React.FC<{ park: MapLine }> = observer(({ park }) => {
  const gameState = GameState.use();

  return (
    <>
      <Piece color="green" polygon={park.polygon} />
      <Line
        points={park.polygon.map(([x, y]) => [x, y, 0])}
        color={'green'}
        lineWidth={1}
      />
    </>
  );
});

export const Game = observer(
  ({ city }: { city: GeneratedCity }): React.ReactElement => {
    const renderer = useRef<THREE.WebGLRenderer>();

    const gameState = useMemo(() => {
      return new GameState(city);
    }, [city]);

    return (
      <GameWindow>
        <GameState.Context.Provider value={gameState}>
          <Canvas
            gl={(canvas) => {
              renderer.current = new THREE.WebGLRenderer({
                logarithmicDepthBuffer: true,
                canvas,
              });

              renderer.current.setClearColor(0x333333);
              renderer.current.setPixelRatio(window.devicePixelRatio);
              renderer.current.setSize(window.innerWidth, window.innerHeight);

              return renderer.current;
            }}
            ref={canvasRef}
          >
            <Camera />

            <MapLineRender line={gameState.coastline} color="blue" />
            <MapLineRender line={gameState.river} color="blue" />
            {gameState.mainRoads.map((road) => (
              <MapLineRender key={road.name} line={road} color="yellow" />
            ))}

            {gameState.majorRoads.map((road) => (
              <MapLineRender key={road.name} line={road} color="white" />
            ))}

            {gameState.minorRoads.map((road) => (
              <MapLineRender key={road.name} line={road} color="grey" />
            ))}

            {gameState.parks.map((park) => (
              <Park key={park.name} park={park} />
            ))}

            <Box position={[1.2, 0, 0]} />
          </Canvas>
        </GameState.Context.Provider>
      </GameWindow>
    );
  },
);
