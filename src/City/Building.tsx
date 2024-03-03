import { ComponentProps, useState } from "react";
import { Piece } from "./Piece";
import { Unit } from "./Unit";
import * as React from "react";
import { Color } from "three";
import { Cylinder } from "@react-three/drei";
import { Lot } from "../state/Lot";
import { DisplayState } from "../state/DisplayState";
import { observer } from "mobx-react-lite";
import { action, computed } from "mobx";

type BuildingProps = {
  lot: Lot;
};

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export const Building = observer(function Building({
  lot,
  ...pieceProps
}: PartialBy<ComponentProps<typeof Piece>, "color"> & BuildingProps) {
  const displayState = DisplayState.use();
  const focused = computed(() => displayState.focusedItem === lot).get();

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
      {focused && (
        <>
          <Cylinder
            args={[3, 3, height, 8]}
            position={[lot.door.x, lot.door.y, height / 2]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <Cylinder
            args={[3, 3, height, 8]}
            position={[
              lot.streetNode.value.x,
              lot.streetNode.value.y,
              height / 2,
            ]}
            rotation={[Math.PI / 2, 0, 0]}
          />
        </>
      )}
      <Piece
        onClick={action(() => {
          displayState.focusedItem = lot;
        })}
        onHover={(hovered: boolean) => {
          displayState.hoverItem(lot, hovered);
        }}
        {...pieceProps}
        color={focused ? "red" : pieceProps.color ?? `#${color.getHexString()}`}
      />
    </>
  );
});
