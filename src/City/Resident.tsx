import React, { useEffect } from "react";
import { Actor, Role, useStage } from "../Stage";
import { BuildingRole } from "./Building";
import { UnitRole } from "./Unit";
import { ResidentRole } from "./ResidentRole";
import { LocatedRole, getNearby, useNearby } from "./Located";

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
  }));

  // query the building demographics
  const [buildingExists, buildingReds, buildingBlues, reds, blues, location] =
    stage.useQuery(() => {
      const { unit: existingUnit } = actor.get(ResidentRole);

      if (!existingUnit) {
        return [false, 0, 0, null];
      }

      const { building } = existingUnit.get(UnitRole);

      const { reds: buildingReds, blues: buildingBlues } =
        building.get(BuildingRole);
      const location = building.get(LocatedRole);

      const nearbyBuildings = getNearby(stage, [BuildingRole], location, 80);

      const { reds, blues } = nearbyBuildings.reduce(
        (sum, building) => {
          const { reds, blues } = building.get(BuildingRole);

          return {
            reds: sum.reds + reds,
            blues: sum.blues + blues,
          };
        },
        { reds: 0, blues: 0 }
      );

      return [true, buildingReds, buildingBlues, reds, blues, location];
    });

  // a percentage happiness based on the ratio of reds to blues and a tolerance
  const calculateHappiness = (
    reds: number,
    blues: number,
    tolerance: number
  ): number => {
    const redRatio = reds / (reds + blues);
    const otherRatio = color === "red" ? 1 - redRatio : redRatio;

    if (otherRatio > tolerance) {
      return 1 - otherRatio - tolerance;
    }

    return 1;
  };

  // when the demographics (or parameters) change, update the agent's happiness
  useEffect(() => {
    if (!buildingExists) {
      return;
    }

    const buildingHappiness =
      0.3 * calculateHappiness(buildingReds, buildingBlues, buildingTolerance);
    const neighborhoodHappiness =
      0.3 * calculateHappiness(reds, blues, neighborhoodTolerance);

    actor.set(ResidentRole, (data) => ({
      ...data,
      happiness: buildingHappiness + neighborhoodHappiness,
      buildingTolerance,
      color,
    }));
  }, [
    actor,
    color,
    buildingReds,
    buildingBlues,
    buildingTolerance,
    neighborhoodTolerance,
    buildingExists,
    reds,
    blues,
  ]);

  return <></>;
}
