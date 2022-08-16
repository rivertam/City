import { ActorStatus, ActorHandle } from "./Actor";
import { Role, RolesData } from "./Role";
import { normalizeQueryParameters, QueryParameters, RoleGroup } from "./Query";

// ECS
export class Stage {
  // Special role which every actor has, exposing its index and generation
  public ActorRole = new Role<ActorStatus>("Actor");

  private get actorStatus() {
    return (this.ActorRole as any).data;
  }

  private roles = new Array<Role<any>>();

  private vacatedActors = new Array<ActorHandle>();

  // methods attached to ActorHandles, implemented here because
  // they're really Stage methods from a conceptual standpoint.
  private actorPrototype = {
    stage: this,

    assignRole<RoleData>(
      this: ActorHandle,
      role: Role<RoleData>,
      initialData: RoleData
    ) {
      role.setData(this, initialData);
    },

    removeRole(role: Role<any>) {
      role.removeData(this);
    },

    remove(this: ActorHandle) {
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

  public addActor(): ActorHandle {
    let index = this.actorStatus.length;
    let generation = 0;

    const firstVacatedActor = this.vacatedActors.shift();
    if (firstVacatedActor) {
      index = firstVacatedActor.index;
      generation = firstVacatedActor.generation;
    }

    const actor: ActorHandle = Object.create(this.actorPrototype, {
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

  public addRole(role: Role<any>) {
    this.roles.push(role);
  }

  public query<Roles extends RoleGroup, EachReturnType>(
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
          console.log(`${roleIndex} doesn\'t have ${role.name}`);
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

    console.log("heh", results);
    return results;
  }
}
