import React, { useContext, useEffect, useRef, useState } from "react";
import { ActorStatus, ActorHandle } from "./Actor";
import { Role, RolesData } from "./Role";
import {
  ArrayQuery,
  normalizeQueryParameters,
  QueryParameters,
  RoleGroup,
} from "./Query";

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

    removeRole(role: Role<any>) {
      role.removeData(this);
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

    const firstVacatedActor = this.vacatedActors.shift();
    if (firstVacatedActor) {
      index = firstVacatedActor.index;
      generation = firstVacatedActor.generation;
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

  public query<Roles extends RoleGroup, EachReturnType>(
    ...query: QueryParameters<Roles, EachReturnType>
  ): Array<EachReturnType> {
    const { roles, filter, forEach } = normalizeQueryParameters(query);

    const results: Array<EachReturnType> = [];

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

  public static Context = React.createContext<Stage | null>(null);

  public static use(): Stage {
    const stage = useContext(this.Context);

    if (!stage) {
      throw new Error("No Stage in context");
    }

    return stage;
  }

  public useActor(fn: (actor: ActorHandle) => void) {
    useEffect(() => {
      const actor = this.addActor();
      fn(actor);
      return () => {
        actor.remove();
      };
    }, [this]);
  }

  public Provider = (
    props: Omit<Parameters<typeof Stage.Context.Provider>[0], "value">
  ) => {
    const { Provider } = Stage.Context;

    return <Provider value={this} {...props} />;
  };

  public useQuery<Roles extends Array<Role<any>>, EachReturnType>(
    ...parameters: QueryParameters<Roles, EachReturnType>
  ): Array<EachReturnType> {
    const [state, setState] = useState<Array<EachReturnType>>([]);

    useEffect(() => {
      const { roles } = normalizeQueryParameters(parameters);

      roles.forEach((role) => {
        role.onUpdate(() => {
          const queryResult = this.query(...parameters);

          setState(queryResult);
        });
      });
    }, [parameters, this]);

    return state;
  }
}
