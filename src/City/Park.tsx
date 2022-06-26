import React from "react";
import { MapLine, CityState } from "./CityState";
import { Piece } from "./Piece";
import { Line } from "@react-three/drei";

export const Park: React.FC<{ park: MapLine }> = ({ park }) => {
  return (
    <>
      <Piece height={30} color="green" polygon={park.polygon} />
    </>
  );
};
