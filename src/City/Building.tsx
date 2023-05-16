import { ComponentProps, useEffect, useRef, useState } from "react";
import { Piece } from "./Piece";
import { Unit, UnitRole } from "./Unit";
import React from "react";
import { Actor, Role, useStage } from "../Stage";
import { number } from "zod";
import { Color } from "three";
import { ResidentRole } from "./ResidentRole";

export const BuildingRole = new Role<{
  reds: number;
  blues: number;

  log: string[];

  units: Set<Actor>;
}>("Building");

export function Building({ ...pieceProps }: ComponentProps<typeof Piece>) {
  const { height } = pieceProps;
  const { stage } = useStage();
  const building = stage.useActor();
  const [color] = useState(() => new Color("red"));

  building.useRole(BuildingRole, () => ({
    reds: 0,
    blues: 0,
    log: [],
    units: new Set(),
  }));

  const units = new Array<JSX.Element>();

  for (let floor = 0; floor < height / 3; floor++) {
    units.push(<Unit key={floor} building={building} />);
  }

  const { reds, blues } = stage.useQuery(() => {
    return building.get(BuildingRole);
  });

  const { happiness, happinesses } = stage.useQuery(() => {
    const tenants = Array.from(building.get(BuildingRole).units)
      .map((unit) => unit.get(UnitRole))
      .filter((unit) => unit.tenant)
      .map((unit) => unit.tenant.get(ResidentRole));

    return {
      happinesses: tenants.map((tenant) => tenant.happiness),
      happiness:
        tenants.reduce((sum, tenant) => {
          return sum + tenant.happiness;
        }, 0) / tenants.length,
    };
  });

  const bluePortion = blues / (reds + blues);

  color.setRGB(1 - bluePortion, 0, bluePortion);

  return (
    <>
      {units}
      <Piece
        onClick={() => {
          console.log({ reds, blues, happiness, happinesses });

          building.get(BuildingRole).units.forEach((unit) => {
            unit.get(UnitRole).tenant?.get(ResidentRole).determineHappiness();
          });
        }}
        {...pieceProps}
        color={`#${color.getHexString()}`}
      />
    </>
  );
}
