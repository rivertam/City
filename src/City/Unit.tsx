import React, { useEffect } from "react";
import { Actor, Role, useStage } from "../Stage";
import { BuildingRole } from "./Building";

export const UnitRole = new Role<{
  building: Actor;
  tenant?: Actor;
}>("Unit");

export function Unit({ building }: { building: Actor }) {
  const { stage } = useStage();
  const actor = stage.useActor();

  actor.useRole(UnitRole, (data = {}) => ({
    ...data,
    building,
  }));

  useEffect(() => {
    building.set(BuildingRole, (data) => {
      data.units.add(actor);

      return data;
    });

    return () => {
      building.set(BuildingRole, (data) => {
        data.units.delete(actor);

        return data;
      });
    };
  }, [actor, building]);

  return <></>;
}
