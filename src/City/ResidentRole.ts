import { Actor, Role } from "../Stage";

export const ResidentRole = new Role<{
  color: "red" | "blue";
  happiness: number;
  buildingTolerance: number;
  neighborhoodTolerance: number;
  unit?: Actor;

  determineHappiness: () => number;
}>("Resident");
