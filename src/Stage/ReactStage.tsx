import React, { useCallback, useContext, useEffect, useState } from "react";
import { ActorHandle } from "./Actor";
import { normalizeQueryParameters, QueryParameters } from "./Query";
import { Role } from "./Role";

import { Stage } from "./Stage";

export class ReactStage extends Stage {
  public static Context = React.createContext<ReactStage | null>(null);

  public static use(): ReactStage {
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

  // when a setup handler occurs, we want to keep track of the things
  // that we want to do for cleanup (e.g. remove actors who were created during
  // setup once the components demounts)
  private accumulatedCleanups: Array<() => void> | null = null;

  public override addActor(): ActorHandle {
    const actor = super.addActor();

    if (this.accumulatedCleanups) {
      this.accumulatedCleanups.push(() => actor.remove());
    }

    return actor;
  }

  /**
   * Calls a function once for the mounting of a component.
   *
   * If `setup` changes, it is not called again.
   *
   * The actors created during setup will automatically be removed
   * on dismount.
   *
   * @param setup
   * @returns
   */
  public useSetup<ReturnType>(
    setup: () => Promise<ReturnType> | ReturnType
  ): ReturnType | null {
    // ensure referential equality even when the setup function is recreated (common)
    const fn = useCallback(setup, []);

    const [returnValue, setReturnValue] = useState<ReturnType | null>(null);

    useEffect(() => {
      let cleanups: Array<() => void> = [];
      let dismounted = false;
      (async () => {
        const oldCleanups = this.accumulatedCleanups;
        this.accumulatedCleanups = [];

        setReturnValue(await fn());

        // signaled that the component dismounted before an asynchronous
        // setup completed
        if (dismounted) {
          this.accumulatedCleanups.forEach((cleanup) => {
            cleanup();
          });
        } else {
          cleanups = this.accumulatedCleanups;
        }

        this.accumulatedCleanups = oldCleanups;
      })();

      return () => {
        dismounted = true;
        cleanups.forEach((cleanup) => {
          cleanup();
        });
      };
    }, [this, fn]);

    return returnValue;
  }

  public Provider = (
    props: Omit<Parameters<typeof ReactStage.Context.Provider>[0], "value">
  ) => {
    const { Provider } = ReactStage.Context;

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
