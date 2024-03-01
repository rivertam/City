export { StreetSegment } from "./segment";
import Vector from "../generation/vector";
import { StreetNode } from "./node";
export { StreetGraph } from "./graph";

export type LotEntryPoint = {
  door: Vector;
  streetNode: StreetNode;
  streetName: string;
};

export { StreetNode };
