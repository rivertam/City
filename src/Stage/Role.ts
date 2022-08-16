import { ActorHandle, ActorIndex } from "./Actor";

// Convert an array of Roles to an array of their respective data
export type RolesData<Roles extends Array<Role<any>>> = {
  [index in keyof Roles]: index extends keyof []
    ? Roles[index]
    : RoleData<Roles[index]>;
};

// extract the `RoleData` type parameter from a Role type
export type RoleData<T> = T extends Role<infer D> ? D : never;

// Component
// Just uses an array for storage and a timer based debouncer to call updates
export class Role<RoleData> {
  private changeNotifiers = new Array<() => void>();

  private data = new Array<
    { generation: number; data: RoleData } | undefined
  >();

  public setData(actor: ActorIndex, data: RoleData) {
    this.data[actor.index] = { generation: actor.generation, data };

    this.markUpdate();
  }

  public removeData(actor: ActorHandle) {
    delete this.data[actor.index];
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

  private updateTimeout: ReturnType<typeof setTimeout> | null = null;
  private markUpdate() {
    if (this.updateTimeout !== null) {
      return;
    }

    this.updateTimeout = setTimeout(() => {
      this.changeNotifiers.forEach((notifier) => notifier());

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

  public constructor(public readonly name: string) {}
}
