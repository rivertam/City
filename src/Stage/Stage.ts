import { getEnhancerFromAnnotation } from "mobx/dist/internal";

interface ActorIndex {
  readonly index: number;
  readonly generation: number;
}

interface ActorHandle extends ActorIndex {
  readonly stage: Stage;

  // public API
  assignRole<RoleData>(role: Role<RoleData>, initialData: RoleData): void;
  assignRole(role: Role<void>): void;

  remove(): void;
}

interface ActorStatus {
  generation: number;
  isLive: boolean;
}

// ECS
export class Stage {
  private roles = new Array<Role<any>>();

  private actorStatus = new Array<ActorStatus>();
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

    remove(this: ActorHandle) {
      const status = this.stage.actorStatus[this.index];

      if (!status?.isLive) {
        return;
      }

      status.isLive = false;
    },
  };

  public constructor() {}

  public addActor(): ActorHandle {
    let index = this.actorStatus.length;
    let generation = 0;

    if (this.vacatedActors.length > 0) {
      ({ index, generation } = this.vacatedActors.shift());
    }

    this.actorStatus[index] = { generation, isLive: true };

    return Object.create(this.actorPrototype, {
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
  }

  public addRole(role: Role<any>) {
    this.roles.push(role);
  }

  public join<Roles extends Array<Role<any>>, R>(
    roles: Roles,
    forEach: (...roleData: RolesData<Roles>) => R,
    filter?: (...roleData: RolesData<Roles>) => boolean
  ): Array<R> {
    const results: Array<R> = [];

    for (let index = 0; index < this.actorStatus.length; ++index) {
      const { generation, isLive } = this.actorStatus[index];

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

      if (!filter || filter(...roleData)) {
        results.push(forEach(...roleData));
      }
    }

    return results;
  }
}

type RoleData<T> = T extends Role<infer D> ? D : T;
type RolesData<Roles extends Array<Role<any>>> = Array<any> & {
  [index in keyof Roles & number]: RoleData<Roles[index]>;
};

// Component
export class Role<RoleData> {
  private data = new Array<
    { generation: number; data: RoleData } | undefined
  >();

  public setData(actor: ActorHandle, data: RoleData) {
    this.data[actor.index] = { generation: actor.generation, data };
  }

  public getData(
    actor: ActorIndex
  ): { hasRole: true; data: RoleData } | { hasRole: false; data: null } {
    const data = this.data[actor.index];
    if (data?.generation === actor.generation) {
      return { hasRole: true, data: data.data };
    }

    return { hasRole: false, data: null };
  }

  public constructor(public readonly name: string) {}
}

export function test() {
  const stage = new Stage();

  const Position3D = new Role<{ x: number; y: number; z: number }>(
    "Position 3D"
  );
  const FamilyMember = new Role<string>("Family Member");
  const TheEast = new Role<void>("The East");
  const TheSun = new Role<void>("The Sun");

  stage.addRole(Position3D);

  const romeo = stage.addActor();
  romeo.assignRole(Position3D, { x: 0, y: 0, z: 0 });
  romeo.assignRole(FamilyMember, "Montegue");
  romeo.assignRole(TheEast);

  const juliet = stage.addActor();
  juliet.assignRole(Position3D, { x: 0, y: 1, z: 2 });
  juliet.assignRole(FamilyMember, "Capulet");
  juliet.assignRole(TheSun);

  stage.join([FamilyMember, TheEast], (lastName) => {
    console.log(`A ${lastName} is the East`);
  });

  stage.join([FamilyMember, TheSun], (lastName) => {
    console.log(`A ${lastName} is the Sun`);
  });
}
