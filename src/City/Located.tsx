import { Actor, Role, Stage, useStage } from "../Stage";

export type Location = {
  x: number;
  y: number;
};

export const LocatedRole = new Role<Location>("Located");

export const getNearby = (
  stage: Stage,
  roles: Array<Role<any>>,
  { x, y }: Location,
  radius: number
): Array<Actor> => {
  const actors = stage.getActors({ roles: [...roles, LocatedRole] });

  return actors.filter((actor) => {
    const { x: actorX, y: actorY } = actor.get(LocatedRole);

    return Math.sqrt((actorX - x) ** 2 + (actorY - y) ** 2) <= radius;
  });
};

export const useNearby = (
  roles: Array<Role<any>>,
  location: Location,
  radius: number
) => {
  const { stage } = useStage();

  return stage.useQuery(() => {
    return getNearby(stage, roles, location, radius);
  });
};
