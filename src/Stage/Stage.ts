import * as React from "react";
import { create } from "zustand";

import { Actor, TurnHandler } from "./Actor";
import { Role } from "./Role";
import { set } from "mobx";

export class Stage {
  private queryContext: {
    rolesRead: Set<Role<any>>;
  } | null = null;

  // change subscribers are notified whenever data for a role changes.
  // any change to the role on any actor will cause any subscriber that
  // looks at that role to re-evaluate.
  // actor-level subscriptions are not currently supported, which means
  // components should query for small amounts of data sparingly as it cannot
  // be very easily memoized.
  private changeSubscribers: Map<Role<any>, Set<() => void>> = new Map();

  // turn subscribers are notified on a new turn if the data for that role
  // has changed.
  private turnSubscribers: Map<Role<any>, Set<() => void>> = new Map();

  private rolesChangedSinceLastTurn: Set<Role<any>> = new Set();

  // actively notifying on change; we don't want to call recompute multiple times
  // if multiple actors change the same role or if a query monitors multiple roles
  // that change during the same engine cycle.
  // Queries should maintain referential integrity for their subscribers which
  // should only need to be called once when multiple roles update. That way, this
  // set doesn't grow when the same component queries multiple roles.
  private notifyingSubscribers: Set<() => void> = new Set();

  private actors = new Set<Actor>();

  constructor() {
    console.log("constructing stage");
  }

  public tick(): void {
    // use a set to ensure the same subscriber isn't called multiple times
    const notifyingSubscribers = new Set<() => void>();

    this.getActors({ roles: [TurnHandler] }).forEach((actor) => {
      actor.get(TurnHandler).afterTurn();
    });

    for (const role of this.rolesChangedSinceLastTurn) {
      const subscribers = this.turnSubscribers.get(role);

      for (const subscriber of subscribers ?? []) {
        notifyingSubscribers.add(subscriber);
      }
    }

    this.rolesChangedSinceLastTurn.clear();

    for (const subscriber of notifyingSubscribers) {
      subscriber();
    }
  }

  public notifyChange(role: Role<any>): void {
    this.rolesChangedSinceLastTurn.add(role);

    if (this.changeSubscribers.has(role)) {
      for (const subscriber of this.changeSubscribers.get(role) ?? []) {
        this.notifyingSubscribers.add(subscriber);
      }
    }

    this.batchNotifySubscribers();
  }

  private notifyingTimeout: ReturnType<typeof setTimeout> | null = null;
  private batchNotifySubscribers() {
    if (this.notifyingTimeout) {
      return;
    }

    this.notifyingTimeout = setTimeout(() => {
      console.log("notifying", this.notifyingSubscribers.size, "subscribers");

      for (const subscriber of this.notifyingSubscribers) {
        subscriber();
      }

      this.notifyingSubscribers.clear();

      delete this.notifyingTimeout;
    }, 0);
  }

  public useActor(): Actor {
    const actor = React.useRef<Actor | null>(null);

    if (actor.current === null) {
      actor.current = new Actor(this);
    }

    React.useEffect(() => {
      this.actors.add(actor.current);

      return () => {
        this.actors.delete(actor.current);
      };
    }, []);

    return actor.current;
  }

  public getActors<Roles extends Array<Role<any>>>({
    roles,
  }: {
    roles: Roles extends Array<any> ? [...Roles] : never;
  }): Array<Actor> {
    if (this.queryContext) {
      for (const role of roles) {
        this.queryContext.rolesRead.add(role);
      }
    }

    const actors = [];
    for (const actor of this.actors.values()) {
      if (roles.every((role) => actor.hasRole(role))) {
        actors.push(actor);
      }
    }

    return actors;
  }

  /**
   * Create a new query on the stage that will automatically subscribe
   * to updates to roles that are accessed during the query.
   *
   * Queries should be relatively simple. Queries should never be nested.
   */
  public useQuery<T>(
    fn: () => T,
    // whether to rerender when any change occurs or just when a turn ticks
    // and the query is reevaluated once during that time.
    rerenderType: "onChange" | "onTurn" = "onTurn"
  ) {
    const [subscribedRoles, setSubscribedRoles] = React.useState<
      Set<Role<any>>
    >(new Set());

    const compute = React.useCallback(() => {
      this.queryContext = {
        rolesRead: new Set(),
      };

      const result = fn();

      setSubscribedRoles(this.queryContext.rolesRead);

      this.queryContext = null;

      return result;
    }, [fn, rerenderType]);

    const [lastResult, setLastResult] = React.useState<T>(compute);

    const recompute = React.useMemo(
      () => () => {
        setLastResult(compute());
      },
      []
    );

    // if recompute changes value or the component dismounts,
    // we need to unsubscribe from the old recompute
    React.useEffect(() => {
      let subscribers: Map<Role<any>, Set<() => void>>;
      if (rerenderType === "onChange") {
        subscribers = this.changeSubscribers;
      } else if (rerenderType === "onTurn") {
        subscribers = this.turnSubscribers;
      } else {
        throw new Error(`Invalid rerenderType ${rerenderType}`);
      }

      for (const role of subscribedRoles) {
        if (!subscribers.has(role)) {
          subscribers.set(role, new Set());
        }

        subscribers.get(role)!.add(recompute);
      }

      return () => {
        for (const role of this.changeSubscribers.keys()) {
          this.changeSubscribers.get(role)!.delete(recompute);
        }
      };
    }, [recompute, rerenderType, subscribedRoles]);

    return lastResult;
  }

  /**
   * Usable during queries to subscribe that query to updates to the given roles
   */
  public addRolesSubscriber(roles: Array<Role<any>>) {
    if (!this.queryContext) {
      // Cannot subscribe outside of query
      return;
    }

    for (const role of roles) {
      this.queryContext.rolesRead.add(role);
    }
  }
}

export const useStage = create((set) => ({
  stage: new Stage(),
}));
