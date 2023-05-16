import React, { useEffect } from "react";
import { Actor, Role, useStage } from "../Stage";
import { BuildingRole } from "./Building";
import { UnitRole } from "./Unit";
import { ResidentRole } from "./ResidentRole";

export function Resident({
  color,

  buildingTolerance,
  neighborhoodTolerance,
}: {
  color: "red" | "blue";
  buildingTolerance: number;
  neighborhoodTolerance: number;
}) {
  const { stage } = useStage();
  const actor = stage.useActor();

  actor.useRole(ResidentRole, () => ({
    happiness: 0,
    color,
    buildingTolerance,
    neighborhoodTolerance,
    determineHappiness() {
      const { unit: existingUnit } = actor.get(ResidentRole);

      if (!existingUnit) {
        return;
      }

      const { building } = existingUnit.get(UnitRole);

      const { reds, blues } = building.get(BuildingRole);

      let happiness = 1;

      const redRatio = reds / (reds + blues);

      const ratioOfOthers = color === "red" ? 1 - redRatio : redRatio;

      if (ratioOfOthers > buildingTolerance) {
        happiness = 0;
      }

      console.log(
        `I'm ${color} and my building is ${redRatio} red, so I am ${happiness} happy`
      );
    },
  }));

  // query the building demographics
  const [buildingExists, reds, blues] = stage.useQuery(() => {
    const { unit: existingUnit } = actor.get(ResidentRole);

    if (!existingUnit) {
      return [false, 0, 0];
    }

    const { building } = existingUnit.get(UnitRole);

    const { reds, blues } = building.get(BuildingRole);

    return [true, reds, blues];
  });

  // when the demographics (or parameters) change, update the agent's happiness
  useEffect(() => {
    if (!buildingExists) {
      return;
    }

    let happiness = 1;
    const redRatio = reds / (reds + blues);

    const ratioOfOthers = color === "red" ? 1 - redRatio : redRatio;

    if (ratioOfOthers > buildingTolerance) {
      happiness = 0;
    }

    actor.set(ResidentRole, (data) => ({
      ...data,
      happiness,
      buildingTolerance,
      color,
    }));
  }, [actor, color, buildingTolerance, buildingExists, reds, blues]);

  return <></>;
}
