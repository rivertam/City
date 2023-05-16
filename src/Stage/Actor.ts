import { useEffect } from "react";
import { Role } from "./Role";
import { Stage } from "./Stage";

export const TurnHandler = new Role<{
  afterTurn: () => void;
}>("TurnHandler");

export class Actor {
  private static ids = 0;

  public readonly id = Actor.ids++;

  private data: {
    [role: symbol]: any;
  } = {};

  public constructor(private stage: Stage) {}

  public hasRole(role: Role<any>): boolean {
    return Object.hasOwnProperty.call(this.data, role.symbol);
  }

  public set<R extends Role<any>>(
    role: R,
    data: R extends Role<infer RoleData>
      ? RoleData | ((d: RoleData) => RoleData)
      : never
  ): void {
    this.data[role.symbol] =
      typeof data === "function" ? data(this.data[role.symbol]) : data;

    this.stage.notifyChange(role);
  }

  public useRole<R extends Role<any>>(
    role: R,
    initialize: R extends Role<infer RoleData> ? () => RoleData : never
  ): void {
    if (!this.hasRole(role)) {
      this.set(role, initialize());
    }

    useEffect(() => {
      if (!this.hasRole(role)) {
        this.set(role, initialize());
      }

      return () => {
        this.remove(role);
      };
    }, [this, role]);
  }

  public remove(role: Role<any>): void {
    delete this.data[role.symbol];
  }

  public get<R extends Role<any>>(
    role: R
  ): R extends Role<infer RoleData> ? RoleData : never {
    if (!this.hasRole(role)) {
      throw new Error(`Actor does not have role ${role.name}`);
    }

    this.stage.addRolesSubscriber([role]);

    return this.data[role.symbol];
  }

  public useAfterTurn(afterTurn: () => void): void {
    useEffect(() => {
      this.set(TurnHandler, { afterTurn });

      return () => {
        this.remove(TurnHandler);
      };
    }, [afterTurn]);
  }
}
