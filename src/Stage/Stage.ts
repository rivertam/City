import { ActorStatus, ActorHandle } from "./Actor";
import {
  ManifestToRoleData,
  Role,
  RoleData,
  RoleManifest,
  RolesData,
  RoleSpecifications,
} from "./Role";
import { normalizeQueryParameters, QueryParameters } from "./Query";

type DynRole = Role<any, string>;

// ECS
export class Stage {
  // Special role which every actor has, exposing its index and generation
  public ActorRole = new Role<
    typeof ActorStatus,
    "Actor",
    ManifestToRoleData<typeof ActorStatus>
  >("Actor", ActorStatus);

  private get actorStatus() {
    return (this.ActorRole as any).data;
  }

  private roles = new Array<DynRole>();

  private vacatedActors = new Array<ActorHandle<any>>();

  // methods attached to ActorHandles, implemented here because
  // they're really Stage methods from an implementation standpoint
  // and attaching the object as a prototype is cheap/optimizable
  private actorPrototype = {
    stage: this,

    assignRole<Manifest extends RoleManifest, RoleName extends string>(
      this: ActorHandle<Array<DynRole>>,
      role: Role<Manifest, RoleName>,
      initialData: ManifestToRoleData<Manifest>
    ) {
      role.setData(this, initialData);

      return this;
    },

    setPart<R extends Role<any, string>>(
      this: ActorHandle<Array<DynRole>>,
      role: R,
      initialData: RoleData<R>
    ) {
      role.setData(this, initialData);
    },

    getPart<R extends Role<any, string>>(
      this: ActorHandle<Array<DynRole>>,
      role: R
    ) {
      return role.getData(this);
    },

    removeRole(role: DynRole) {
      role.removeData(this);
    },

    remove(this: ActorHandle<any>) {
      const { hasRole, data } = this.stage.ActorRole.getData(this);

      if (!hasRole) {
        return;
      }

      data.isLive = false;
    },
  };

  public constructor() {
    this.addRole(this.ActorRole);
  }

  public addActor(): ActorHandle<[]> {
    let index = this.actorStatus.length;
    let generation = 0;

    const firstVacatedActor = this.vacatedActors.shift();
    if (firstVacatedActor) {
      index = firstVacatedActor.index;
      generation = firstVacatedActor.generation;
    }

    const actor: ActorHandle<[]> = Object.create(this.actorPrototype, {
      index: {
        value: index,
        writable: false,
        configurable: false,
      },
      generation: {
        value: 0,
        writable: true,
        configurable: true,
      },
    });

    actor.assignRole(this.ActorRole, { index, generation, isLive: true });

    return actor;
  }

  public addRole(role: DynRole) {
    this.roles.push(role);
  }

  public query<Roles extends RoleSpecifications, EachReturnType>(
    ...query: QueryParameters<Roles, EachReturnType>
  ): Array<EachReturnType> {
    const { roles, filter, forEach } = normalizeQueryParameters(query);

    const results: Array<EachReturnType> = [];

    for (let index = 0; index < this.actorStatus.length; ++index) {
      const { generation, isLive } = this.actorStatus[index].data;

      if (!isLive) {
        continue;
      }

      const roleData = [] as RolesData<Roles>;

      for (let roleIndex = 0; roleIndex < roles.length; ++roleIndex) {
        const role = roles[roleIndex];

        const { data, hasRole } = role.getData({ index, generation });

        if (!hasRole) {
          break;
        }

        roleData.push(data);
      }

      if (roleData.length < roles.length) {
        continue;
      }

      if (!filter || filter.apply(null, roleData)) {
        results.push(forEach.apply(null, roleData));
      }
    }

    return results;
  }
}
