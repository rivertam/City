export interface ActorIndex {
  readonly index: number;
  readonly generation: number;
}

export interface ActorHandle extends ActorIndex {
  readonly stage: Stage;

  // public API
  assignRole<RoleData>(role: Role<RoleData>, initialData: RoleData): void;
  assignRole(role: Role<void>): void;

  removeRole(role: Role<any>);

  remove(): void;
}

export interface ActorStatus {
  generation: number;
  isLive: boolean;
}
