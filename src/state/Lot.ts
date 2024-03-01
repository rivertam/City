import { makeAutoObservable } from "mobx";
import { Polygon } from "../generation/impl/polygon_finder";
import { LotEntryPoint, StreetNode } from "../streets";
import Vector from "../generation/vector";

export class Lot implements LotEntryPoint {
  public address: string;
  public door: Vector;
  public streetNode: StreetNode;
  public streetName: string;

  private polygon: Polygon;

  public constructor({
    address,
    entryPoint,
    polygon,
  }: {
    address: string;
    entryPoint: LotEntryPoint;
    polygon: Polygon;
  }) {
    this.address = address;
    this.polygon = polygon;

    this.streetNode = entryPoint.streetNode;
    this.streetName = entryPoint.streetName;
    this.door = entryPoint.door;

    makeAutoObservable(this);
  }

  public get shape(): Array<Vector> {
    return this.polygon.polygon;
  }
}
