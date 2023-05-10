import { ComponentProps } from "react";
import { Piece } from "./Piece";
import { Unit } from "./Unit";
import React from "react";
import { useStage } from "../Stage";

export function Building({ ...pieceProps }: ComponentProps<typeof Piece>) {
  const { height } = pieceProps;
  const { stage } = useStage();
  const building = stage.useActor();

  const units = new Array<JSX.Element>();

  for (let floor = 0; floor < height / 20; floor++) {
    units.push(<Unit key={floor} building={building} />);
  }

  return (
    <>
      {units}
      <Piece {...pieceProps} />
    </>
  );
}
