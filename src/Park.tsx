import React from "react";
import { MapLine, GameState } from "./GameState";
import { Piece } from "./Piece";
import { Line } from "@react-three/drei";

export const Park: React.FC<{ park: MapLine }> = ({ park }) => {
  return (
    <>
      <Piece height={30} color="green" polygon={park.polygon} />
    </>
  );
};
