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

  const [color] = useState(() => {
    const color = new Color();

    color.setHSL(Math.random(), Math.random() * 0.2 + 0.2, 0.7);

    return color;
  });

  return (
    <>
      <Piece
        onClick={() => {
          displayState.clickItem(lot);
        }}
        onHover={(hovered: boolean) => {
          displayState.hoverItem(lot, hovered);
        }}
        {...pieceProps}
        color={focused ? "red" : pieceProps.color ?? `#${color.getHexString()}`}
      />
    </>
  );
});
