import { ComponentProps, useState } from "react";
import { Piece } from "./Piece";
import { Unit } from "./Unit";
import * as React from "react";
import { Color } from "three";
import { Cylinder } from "@react-three/drei";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { Lot } from "../state/Lot";

type BuildingProps = {
  lot: Lot;
};

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export const Building = observer(
  ({
    lot,
    ...pieceProps
  }: PartialBy<ComponentProps<typeof Piece>, "color"> & BuildingProps) => {
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
          <>
            <Cylinder
              args={[3, 3, height, 8]}
              position={[lot.door.x, lot.door.y, height / 2]}
              rotation={[Math.PI / 2, 0, 0]}
            />
            <Cylinder
              args={[3, 3, height, 8]}
              position={[lot.streetPoint.x, lot.streetPoint.y, height / 2]}
              rotation={[Math.PI / 2, 0, 0]}
            />
          </>
        )}
        <Piece
          onClick={() => {
            console.log("it's on street", lot.streetName);
            console.log("at", lot.streetPoint);
            console.log("door", lot.door);
            setDisplayingEntry((d) => !d);
          }}
          {...pieceProps}
          color={pieceProps.color ?? `#${color.getHexString()}`}
        />
      </>
    );
  }
);
