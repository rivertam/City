import { ComponentProps, useState } from "react";
import { Piece } from "./Piece";
import { Unit } from "./Unit";
import React from "react";
import { Color } from "three";
import { Cylinder } from "@react-three/drei";
import { toJS } from "mobx";
import { CityState } from "./CityState";

type BuildingProps = {
  entryPoint: { x: number; y: number };
};

export function Building({
  entryPoint,
  ...pieceProps
}: ComponentProps<typeof Piece> & BuildingProps) {
  const city = CityState.use();
  const [displayingEntry, setDisplayingEntry] = useState(false);

  const { height } = pieceProps;
  const [color] = useState(() => {
    const color = new Color();

    color.setHSL(Math.random(), Math.random() * 0.2 + 0.2, 0.7);

    return color;
  });

  const units = new Array<JSX.Element>();

  for (let floor = 0; floor < height / 3; floor++) {
    units.push(<Unit key={floor} />);
  }

  return (
    <>
      {units}
      {displayingEntry && (
        <Cylinder
          args={[3, 3, height, 8]}
          position={[entryPoint.x, entryPoint.y, height / 2]}
          rotation={[Math.PI / 2, 0, 0]}
        />
      )}
      <Piece
        onClick={() => {
          console.log(
            "clicked an anonymous building",
            toJS(pieceProps.polygon)
          );
          console.log("entryPoint", entryPoint);
          setDisplayingEntry((d) => !d);
        }}
        {...pieceProps}
        color={pieceProps.color ?? `#${color.getHexString()}`}
      />
    </>
  );
}
