export class Role<RoleData> {
  readonly symbol = Symbol();

  constructor(public readonly name: string) {}
}
