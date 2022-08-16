import React, { useEffect } from "react";
import { ReactStage, Role, RoleData } from "../Stage";
import { MapLine } from "./MapLine";
import { Space } from "./Space";

export const Block = new Role<MapLine>("Block");

export const BlockView = ({ polygon }: RoleData<typeof Block>) => {
  const stage = ReactStage.use();

  const actor = stage.useSetup(() => {
    return stage.addActor();
  });

  useEffect(() => {
    if (!actor) {
      return;
    }

    actor.assignRole(Space, {
      polygon,
      color: "#afa",
      height: 3,
    });
  }, [actor, polygon]);

  return <></>;
};

export const Blocks = () => {
  const stage = ReactStage.use();

  return (
    <>
      {stage.useQuery([Block], (block) => (
        <BlockView key={block.name} {...block} />
      ))}
    </>
  );
};
