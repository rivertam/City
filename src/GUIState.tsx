import { v4 as uuid } from "uuid";
import { useEffect, useRef } from "react";
import { action, makeAutoObservable } from "mobx";

export class GUIState {
  public static instance = new GUIState();

  private constructor() {
    makeAutoObservable(this);
  }

  public globalMethods: Array<{
    id: string;
    label: string;
    method: () => void;
  }> = [];

  public useMethod(label: string, method: () => void) {
    const referenceCount = useRef(0);
    const id = useRef(uuid());

    useEffect(
      action(() => {
        const extantMethod = this.globalMethods.find(
          (m) => m.id === id.current
        );
        if (extantMethod) {
          extantMethod.label = label;
          extantMethod.method = method;
        } else {
          this.globalMethods.push({
            id: id.current,
            label,
            method,
          });
        }

        referenceCount.current += 1;

        return action(() => {
          referenceCount.current -= 1;
          setTimeout(
            action(() => {
              if (referenceCount.current === 0) {
                this.globalMethods = this.globalMethods.filter(
                  (m) => m.id !== id.current
                );
              }
            }),
            500
          );
        });
      }),
      [this, label, method]
    );
  }
}
