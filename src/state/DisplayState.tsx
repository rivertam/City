import { createContext, useContext } from "react";
import { makeAutoObservable } from "mobx";

import { FocusedItem } from "../ui/FocusedItem";

export class DisplayState {
  public focusedItem: FocusedItem | null = null;
  public hoveredItems = new Set<FocusedItem>();

  public constructor() {
    makeAutoObservable(this);
  }

  public static Context = createContext<DisplayState>(new DisplayState());

  public static use(): DisplayState {
    return useContext(DisplayState.Context);
  }

  public get hoveredItem(): FocusedItem | null {
    if (this.hoveredItems.size === 0) {
      return null;
    }

    return this.hoveredItems.values().next().value;
  }

  /**
   * The UI display cares about what item is being hovered over, so it can display
   * things like tooltips or path highlights.
   *
   * If `unhover` is true, the item is being unhovered, otherwise it's being hovered.
   */
  public hoverItem(item: FocusedItem, hovered: boolean) {
    if (hovered) {
      this.hoveredItems.add(item);
    } else {
      this.hoveredItems.delete(item);
    }
  }
}
