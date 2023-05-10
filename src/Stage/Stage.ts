import * as React from "react";
import { create } from "zustand";

import { Actor } from "./Actor";
import { Role } from "./Role";

export class Stage {
  actors = new Set<Actor>();

  constructor() {
    console.log("constructing stage");
  }

  public useActor(): Actor {
    const actor = React.useRef<Actor | null>(null);

    if (actor.current === null) {
      actor.current = new Actor();
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
  }) {
    console.log(`looking through ${this.actors.size} actors`);
    const actors = [];
    for (const actor of this.actors.values()) {
      if (roles.every((role) => actor.hasRole(role))) {
        actors.push(actor);
      }
    }

    return actors;
  }
}

export const useStage = create((set) => ({
  stage: new Stage(),
}));
