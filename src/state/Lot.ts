import { makeAutoObservable } from "mobx";
import { NodeAssociatedPolygon } from "../generation/impl/polygon_finder";
import { Node } from '../generation/impl/graph'
import Vector from "../generation/vector";

export class Lot {
  public address: string;
  public entryPoint: Node;
  private polygon: NodeAssociatedPolygon;

  public constructor({
    address,
    entryPoint,
    polygon,
  }: {
    address: string;
    entryPoint: Node;
    polygon: NodeAssociatedPolygon;
  }) {
    this.address = address;
    this.entryPoint = entryPoint;
    this.polygon = polygon;

    makeAutoObservable(this);
  }

  public get shape(): Array<Vector> {
    return this.polygon.polygon;
  }

  public get hasExcessNodes(): boolean {
    return this.polygon.hasExcessNodes();
  }

  public get streetNodes(): Array<Node> {
    return this.polygon.nodes;
  }
}
