import { ComponentProps, useEffect, useState } from "react";
import { Piece } from "./Piece";
import { Unit } from "./Unit";
import React from "react";
import { Color } from "three";

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export function Building({
  ...pieceProps
}: PartialBy<ComponentProps<typeof Piece>, "color">) {
  const { height } = pieceProps;
  const [color, setColor] = useState(() => {
    const color = new Color();

    color.setHSL(Math.random(), Math.random() * 0.2 + 0.2, 0.7);

    return color;
  });

  useEffect(() => {
    if (pieceProps.color) {
      // setColor(new Color(pieceProps.color));
    }
  }, [pieceProps.color]);

  const units = new Array<JSX.Element>();

  for (let floor = 0; floor < height / 3; floor++) {
    units.push(<Unit key={floor} />);
  }

  return (
    <>
      {units}
      <Piece
        onClick={() => {
          console.log("clicked an anonymous building");
        }}
        {...pieceProps}
        color={`#${color.getHexString()}`}
      />
    </>
  );
}
