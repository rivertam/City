import React, { useEffect } from "react";
import { Actor, Role, useStage } from "../Stage";

export const UnitRole = new Role<{
  building: Actor;
  tenant?: Actor;
}>("Unit");

export function Unit({ building }: { building: Actor }) {
  const { stage } = useStage();
  const actor = stage.useActor();

  useEffect(() => {
    actor.set(UnitRole, { building });
  }, [actor]);

  return <></>;
}
