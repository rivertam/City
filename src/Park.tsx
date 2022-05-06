import React from 'react';
import { MapLine, GameState } from './GameState';
import { Piece } from './Piece';
import { Line } from '@react-three/drei';

export const Park: React.FC<{ park: MapLine }> = ({ park }) => {
  return (
    <>
      <Piece height={5} color="green" polygon={park.polygon} />
      <Line
        points={park.polygon.map(([x, y]) => [x, y, 0])}
        color={'green'}
        lineWidth={1}
      />
    </>
  );
};
