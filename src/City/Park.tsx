import React from "react";
import { MapLine } from "../state/CityState";
import { Piece } from "./Piece";

export const Park: React.FC<{ park: MapLine }> = ({ park }) => {
  return (
    <>
      <Piece height={1} color="green" polygon={park.polygon} />
    </>
  );
};
