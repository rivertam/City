import { makeAutoObservable } from "mobx";
import { Polygon } from "../generation/impl/polygon_finder";
import { LotEntryPoint, StreetNode } from "../streets";
import Vector from "../generation/vector";
import { NavigationPath } from "../streets/navigation";

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

  public get exitDirection(): Vector {
    return new Vector(
      this.streetNode.value.x - this.door.x,
      this.streetNode.value.y - this.door.y
    );
  }

  public get entryDirection(): Vector {
    return new Vector(
      this.door.x - this.streetNode.value.x,
      this.door.y - this.streetNode.value.y
    );
  }

  public navigateTo(
    other: Lot | StreetNode
  ): Generator<NavigationPath, NavigationPath> {
    const startDirection = this.exitDirection;
    const endDirection =
      other instanceof Lot ? other.entryDirection : undefined;

    return this.streetNode.navigateTo(
      startDirection,
      other instanceof Lot ? other.streetNode : other,
      endDirection
    );
  }
}
