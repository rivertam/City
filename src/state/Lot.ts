import { makeAutoObservable } from "mobx";
import { Polygon } from "../generation/impl/polygon_finder";
import { StreetNode } from "../generation/impl/graph";
import Vector from "../generation/vector";

export class Lot {
  public address: string;
  public door: Vector;
  public streetName: string;

  private polygon: Polygon;

  public constructor({
    address,
    door,
    streetName,
    polygon,
  }: {
    address: string;
    door: Vector;
    streetName: string;
    polygon: Polygon;
  }) {
    this.address = address;
    this.door = door;
    this.streetName = streetName;
    this.polygon = polygon;

    makeAutoObservable(this);
  }

  public get shape(): Array<Vector> {
    return this.polygon.polygon;
  }
}
