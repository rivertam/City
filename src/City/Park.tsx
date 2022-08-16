import React from "react";
import { MapLine, CityState } from "./CityState";
import { Piece } from "./Piece";
import { Line } from "@react-three/drei";
import { ReactStage, Role } from "../Stage";

export const ParkView: React.FC<{ park: MapLine }> = ({ park }) => {
  return (
    <>
      <Piece height={30} color="green" polygon={park.polygon} />
    </>
  );
};

export const Park = new Role<Parameters<typeof ParkView>[0]>("Park");

export const Parks = () => {
  const stage = ReactStage.use();

  return (
    <>
      {stage.useQuery([stage.ActorRole, Park], ({ index }, park) => (
        <ParkView key={index} {...park} />
      ))}
    </>
  );
};
