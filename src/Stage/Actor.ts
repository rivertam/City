import * as zod from "zod";
import { Stage } from "./Stage";
import {
  ManifestToRoleData,
  Role,
  RoleData,
  RoleManifest,
  RoleSpecification,
} from "./Role";

export interface ActorIndex {
  readonly index: number;
  readonly generation: number;
}

export interface ActorHandle<Roles extends Array<RoleSpecification>>
  extends ActorIndex {
  readonly stage: Stage;

  // public API

  // assign the actor to a role and return a type-checked handle that
  // can access the role data
  assignRole<Manifest extends RoleManifest, RoleName extends string>(
    role: Role<Manifest, RoleName>,
    initialData: ManifestToRoleData<Manifest>
  ): ActorHandle<[typeof role, ...Roles]>;
  assignRole<RoleName extends string>(
    role: Role<void, RoleName>
  ): ActorHandle<[typeof role, ...Roles]>;

  setPart<R extends Roles[keyof Roles]>(role: R, data: RoleData<R>): void;
  getPart<R extends Roles[keyof Roles]>(role: R): RoleData<R>;

  removeRole(role: Role<any, any>): void;

  remove(): void;
}

export const ActorStatus = {
  index: zod.number(),
  generation: zod.number(),
  isLive: zod.boolean(),
} as const;
