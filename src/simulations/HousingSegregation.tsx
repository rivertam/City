import React, { useEffect } from "react";
import { Lot } from "../City";
import { Piece } from "../City/Piece";
import { ActorHandle, ReactStage } from "../Stage";
import { Role } from "../Stage";

export const Family = new Role("Family", {
  lot: Lot,
});

const Houses = () => {
  const stage = ReactStage.use();

  return (
    <>
      {stage.useQuery([Family], (family) => {
        return (
          <Piece
            key={family.lot.address}
            polygon={lot.shape}
            color="red"
            height={50}
          />
        );
      })}
    </>
  );
};

export const HousingSegregationSimulation = () => {
  const stage = ReactStage.use();

  stage.useSetup(() => {
    const lots = stage.query([Lot], (lot) => {
      return true;
    });

    console.log(lots.length, "lots");

    for (let ii = 0; ii < 50; ++ii) {
      stage.addActor();
    }
  });

  return <Houses />;
};
