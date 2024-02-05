import { makeAutoObservable } from "mobx";
import { createContext, useContext, useEffect, useState } from "react";
import { FocusedItem } from "../ui/FocusedItem";

type FocusChecker = (focusedItem: FocusedItem) => boolean;

export class DisplayState {
  public focusedItem: FocusedItem | null = null;

  private itemListeners = new Map<FocusChecker, (isFocused: boolean) => void>();

  public constructor() {
    makeAutoObservable(this);
  }

  public static Context = createContext<DisplayState>(new DisplayState());

  public static use(): DisplayState {
    return useContext(DisplayState.Context);
  }

  public useIsFocused(check: FocusChecker): boolean {
    const [isFocused, setIsFocused] = useState(check(this.focusedItem));

    useEffect(() => {
      const listener = (isFocused: boolean) => {
        setIsFocused(isFocused);
      };

      this.itemListeners.set(check, listener);

      return () => {
        this.itemListeners.delete(check);
      };
    });

    return isFocused;
  }

  public focusItem(item: FocusedItem | null) {
    this.focusedItem = item;

    for (const [check, listener] of this.itemListeners.entries()) {
      if (item === null) {
        listener(false);
      } else {
        listener(check(item));
      }
    }
  }
}
