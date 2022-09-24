import * as zod from "zod";
import { any, inferFlattenedErrors } from "zod";
import { ActorHandle, ActorIndex } from "./Actor";

export type AnyRole = Role<any, string>;
export type RoleThunk<
  T extends RoleManifest = any,
  N extends string = string
> = () => Role<T, N>;
export type RoleSpecification<
  T extends RoleManifest = any,
  N extends string = string
> = Role<T, N> | RoleThunk<T, N>;

export type RoleSpecifications<
  Ts extends Array<RoleManifest> = Array<RoleManifest>,
  Ns extends Array<string> = Array<string>
> = {
  [index in keyof Ts & keyof Ns & keyof Array<any>]: index extends number
    ? Role<Ts[index], Ns[index]>
    : index;
} & Array<RoleSpecification>;

function specificationToRole<
  T extends RoleManifest = any,
  N extends string = string
>(specification: RoleSpecification<T, N>): Role<T, N> {
  if (typeof specification === "function") {
    return specification();
  }

  return specification;
}

// Convert an array of RoleSpecifications to an array of their respective data
export type RolesData<Roles extends Array<RoleSpecification>> = {
  [index in keyof Roles]: index extends keyof []
    ? RoleData<Roles[index]>
    : Roles[index];
} & Array<RoleData<RoleSpecification>>;

// extract the `RoleData` type parameter from a Role type
export type RoleData<T> = T extends Role<infer D, infer _N> ? D : never;

export type OneRelation<
  Ts extends Array<RoleManifest> = Array<RoleManifest>,
  Ns extends Array<string> = Array<string>
> = {
  relation: "one";
  roles: RoleSpecifications<Ts, Ns>;
};

export type ManyRelation<
  Ts extends Array<RoleManifest> = Array<RoleManifest>,
  Ns extends Array<string> = Array<string>
> = {
  relation: "many";
  roles: RoleSpecifications<Ts, Ns>;
};

/**
 * const personManifest: RoleManifest = {
 *   name: zod.string(),
 *   age: zod.number().integer(),
 *
 *   bestFriend: () => Person,
 * }
 *
 * const Person = new Role('Person', personManifest);
 */
export type RoleManifest = void | {
  [key: string]:
    | zod.ZodTypeAny
    // relation (an Actor that must be playing certain Roles).
    // it's allowed to be a thunk to avoid circular dependencies
    | OneRelation
    | ManyRelation;
};

export type ManifestToRoleData<Manifest extends RoleManifest> =
  Manifest extends object ? NonVoidManifestToRoleData<Manifest> : void;

export type NonVoidManifestToRoleData<Manifest extends RoleManifest & object> =
  {
    [key in keyof Manifest]: Manifest[key] extends zod.ZodTypeAny
      ? zod.infer<Manifest[key]>
      : Manifest[key] extends OneRelation<infer Ts>
      ? Ts
      : Manifest[key] extends ManyRelation<infer Ts>
      ? Array<Ts>
      : never;
  };

// convert the Manifest type to the type that will be returned by getData,
// which returns ActorHandles for relationship data rather than the data
// within the relative actor's role
export type ManifestToStorage<Manifest extends RoleManifest> = {
  [key in keyof Manifest]: Manifest[key] extends zod.ZodTypeAny
    ? zod.infer<Manifest[key]>
    : Manifest[key] extends OneRelation<infer Ts>
    ? Ts
    : Manifest[key] extends ManyRelation<infer Ts>
    ? Array<Ts>
    : never;
};

export type RoleFromManifest<Manifest extends RoleManifest> = Role<
  Manifest,
  string
>;

type StoredData<RoleData> = RoleData extends undefined
  ? undefined
  : {
      [key in keyof RoleData]: RoleData[key] extends ActorHandle<any>
        ? ActorIndex
        : RoleData[key];
    };

// Component
// Just uses an array for storage and a timer based debouncer to call updates
export class Role<
  Manifest extends RoleManifest,
  RoleName extends string,
  RoleData = ManifestToRoleData<Manifest>
> {
  private changeNotifiers = new Array<() => void>();

  private data = new Array<
    { generation: number; data: StoredData<RoleData> } | undefined
  >();

  public setData(actor: ActorIndex, data: RoleData) {
    if (data === undefined) {
      this.data[actor.index] = {
        generation: actor.generation,
        data: data as StoredData<RoleData>,
      };

      this.markUpdate();

      return;
    }

    // build up a copy of stored data that will be stored in the data array
    const storedData: Partial<StoredData<RoleData>> = {};

    for (const key in data) {
      // this if should delineate in TS that data[key] is an Actor handle/index and that the
      // StoreData<Key> should be an ActorIndex, so there are a few `as`es
      if (key in this.relationships) {
        // while the type here is ActorIndex, the user may pass in a full
        // Actor, so we want to strip the metadata for simpler memory representation.
        const actorHandle = data[key] as ActorIndex;

        storedData[key] = {
          index: actorHandle.index,
          generation: actorHandle.generation,
        } as any;
      } else {
        storedData[key] = data[key] as any;
      }
    }

    this.data[actor.index] = {
      generation: actor.generation,
      data: storedData as StoredData<RoleData>,
    };

    this.markUpdate();
  }

  public removeData(actor: ActorHandle<any>) {
    delete this.data[actor.index];
  }

  private convertFromStoredDataToRoleData(
    storedData: StoredData<RoleData>
  ): RoleData {
    const roleData: RoleData = {} as RoleData;

    for (const key in storedData) {
      // this if should delineate in TS that data[key] is an Actor handle/index and that the
      // StoreData<Key> should be an ActorIndex, so there are a few `as`es
      if (key in this.relationships) {
        // fetch the other roles' data and fill the data with it
        const actorIndex = storedData[key] as ActorIndex;

        let relationshipRoles = this.relationships[key];

        if (!Array.isArray(relationshipRoles)) {
          relationshipRoles = [relationshipRoles];
        }

        relationshipRoles = relationshipRoles.map(specificationToRole);

        // not sure exactly why Extract<keyof StoredData<RoleData>, string> cannot be
        // used to index RoleData, but it can't
        roleData[key as keyof RoleData] = relationshipRoles.map(
          (role: AnyRole) => {
            const data = role.getData(actorIndex);

            if (!data.hasRole) {
              throw new Error(
                `Relation ${key} was set, but actor ${actorIndex.index} does not have that role`
              );
            }

            return data.data;
          }
        ) as RoleData[keyof RoleData];
      } else {
        roleData[key as keyof RoleData] = storedData[key] as any;
      }
    }

    return roleData;
  }

  public getData(
    actor: ActorIndex
  ): { hasRole: true; data: RoleData } | { hasRole: false; data: null } {
    const data = this.data[actor.index];
    if (data?.generation === actor.generation) {
      return {
        hasRole: true,
        data: this.convertFromStoredDataToRoleData(data.data),
      };
    }

    return { hasRole: false, data: null };
  }

  private updateTimeout: ReturnType<typeof setTimeout> | null = null;
  private markUpdate() {
    if (this.updateTimeout !== null) {
      return;
    }

    console.count("setting update");
    this.updateTimeout = setTimeout(() => {
      this.changeNotifiers.forEach((notifier) => notifier());

      this.updateTimeout = null;
      clearTimeout(this.updateTimeout);
    }, 0);
  }

  public onUpdate(callback: () => void): { cancel(): void } {
    this.changeNotifiers.push(callback);

    return {
      cancel: () => {
        this.changeNotifiers = this.changeNotifiers.filter(
          (notifier) => notifier !== callback
        );
      },
    };
  }

  // used by Stage.query to join the relationship data into the role data
  public relationships: Record<string, Array<RoleSpecification>>;

  public constructor(
    public readonly name: RoleName,
    private manifest: RoleManifest
  ) {
    this.relationships = {};

    if (this.manifest) {
      for (const key in this.manifest) {
        const property = this.manifest[key];
        if (property instanceof Role) {
          // normalize to an array
          this.relationships[key] = [property];
        } else if (property instanceof Array) {
          this.relationships[key] = property;
        }
      }
    }
  }
}
