import { makeAutoObservable } from "mobx";
import Vector from "../generation/vector";
import { Lot } from "./Lot";

export class Street {
  public lots = new Set<Lot>();

  public line: Array<Vector>;

  public constructor(public name: string, line: Array<Vector>) {
    makeAutoObservable(this);

    this.line = line.map((v) => v.clone());
  }

  public associateLot(lot: Lot): void {
    this.lots.add(lot);
  }

  public nameLots(): void {
    const vertical = this.isVertical();

    const sorted = Array.from(this.lots).sort((a, b) => {
      if (vertical) {
        return a.streetNode.value.y - b.streetNode.value.y;
      }

      return a.streetNode.value.x - b.streetNode.value.x;
    });

    sorted.forEach((lot, i) => {
      lot.address = `${i + 1} ${this.name}`;
    });
  }

  // check whether the street is more vertical or more horizontal
  public isVertical(): boolean {
    const first = this.line[0];
    const last = this.line[this.line.length - 1];
    const slope = (last.y - first.y) / (last.x - first.x);

    return Math.abs(slope) > 1;
  }
}
