import React, { useEffect } from "react";
import { ActorHandle, ReactStage, Role, RoleData } from "../Stage";
import { Piece } from "./Piece";
import { Space } from "./Space";

export const Lot = new Role<
  {
    address: string;
    shape: Array<[number, number]>;
  },
  "Lot"
>("Lot");

export const LotView = ({ shape }: RoleData<typeof Lot>) => {
  const stage = ReactStage.use();

  const actor = stage.useSetup(() => {
    return stage.addActor();
  });

  useEffect(() => {
    if (!actor) {
      return;
    }

    actor.assignRole(Space, {
      polygon: shape,
      color: "white",
      height: 5,
    });
  }, [actor, shape]);

  return <></>;
};

export const Lots = () => {
  const stage = ReactStage.use();

  return (
    <>
      {stage.useQuery([Lot], (lot) => (
        <LotView key={lot.address} {...lot} />
      ))}
    </>
  );
};
