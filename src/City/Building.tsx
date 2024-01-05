import { ComponentProps, useState } from "react";
import { Piece } from "./Piece";
import { Unit } from "./Unit";
import React from "react";
import { Color } from "three";

export function Building({ ...pieceProps }: ComponentProps<typeof Piece>) {
  const { height } = pieceProps;
  const [color] = useState(() => {
    const color = new Color()

    color.setHSL(Math.random(), Math.random() * 0.2 + 0.2, 0.7)

    return color;
  });

  const units = new Array<JSX.Element>();

  for (let floor = 0; floor < height / 3; floor++) {
    units.push(<Unit key={floor} />);
  }

  return (
    <>
      {units}
      <Piece
        onClick={() => {
          console.log('clicked an anonymous building');
        }}
        {...pieceProps}
        color={`#${color.getHexString()}`}
      />
    </>
  );
}
