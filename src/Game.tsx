import React, { useRef } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Box, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import styled from 'styled-components';

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

export function Game(): React.ReactElement {
  const renderer = useRef<THREE.WebGLRenderer>();

  return (
    <GameWindow>
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
        <Box position={[-1.2, 0, 0]} />
        <Box position={[1.2, 0, 0]} />
      </Canvas>
    </GameWindow>
  );
}
