import { JSONValue, JSONArray } from "./JSONValue";

export class Role<RoleData> {
  public readonly symbol = Symbol();

  constructor(public readonly name: string) {}
}
