import React from "react";
import { MapLine } from "./CityState";
import { Piece } from "./Piece";

export const Park: React.FC<{ park: MapLine }> = ({ park }) => {
  return (
    <>
      <Piece height={5} color="green" polygon={park.polygon} />
    </>
  );
};
