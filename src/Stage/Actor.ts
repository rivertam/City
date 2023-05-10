import { Role } from "./Role";

export class Actor {
  data: {
    [role: symbol]: any;
  } = {};

  public hasRole(role: Role<any>): boolean {
    return Object.hasOwnProperty.call(this.data, role.symbol);
  }

  public set<R extends Role<any>>(
    role: R,
    data: R extends Role<infer RoleData> ? RoleData : never
  ): void {
    this.data[role.symbol] = data;
  }
}
