import { createContext, useContext, useEffect, useState } from "react";
import { makeAutoObservable } from "mobx";

import { FocusedItem } from "../ui/FocusedItem";
import { NavigationPath } from "../streets/navigate";

export class DisplayState {
  public focusedItem: FocusedItem | null = null;
  public hoveredItems = new Set<FocusedItem>();
  public focusedPath: NavigationPath | null = null;

  public constructor() {
    makeAutoObservable(this);
  }

  public static Context = createContext<DisplayState>(new DisplayState());

  public static use(): DisplayState {
    return useContext(DisplayState.Context);
  }

  // used to change what clicking focusable items does
  private focusCaptures: Array<(item: FocusedItem | null) => void> = [];

  /**
   * This allows for the UI to have multiple focus items. For navigation,
   * we use this to focus on one Lot, and then the navigation window itself can
   * override focus clicks to allow for a "secondary" focus item, the destination.
   */
  public useNextFocusItem(): FocusedItem | null {
    const [focusedItem, setFocusedItem] = useState<FocusedItem | null>(null);
    useEffect(() => {
      // on component mount, set this as the highest priority focus item.
      // when other components mount, their priorities will become higher until
      // they dismount.
      // in the future, if we were to need more complex focus handling (such as
      // being able to highlight a specific waypoint to change it), we can use
      // more manual priorities and move the capture up to the front of the list
      this.focusCaptures.unshift(setFocusedItem);

      return () => {
        this.focusCaptures = this.focusCaptures.filter(
          (capture) => capture !== setFocusedItem
        );
      };
    }, [this]);

    return focusedItem;
  }

  public clickItem(item: FocusedItem) {
    // if nothing is overriding the focus capture, then we just focus the item
    if (this.focusCaptures.length === 0) {
      this.focusedItem = item;
      return;
    }

    // otherwise, we call the first focus capture and let it handle the focus
    this.focusCaptures[0](item);
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

  /**
   * Sets the focused path.
   *
   * If focused === false and path is currently focused, this will unfocus the path.
   */
  public focusPath(path: NavigationPath, focused: boolean = true) {
    if (focused && path) {
      this.focusedPath = path;
      return;
    }

    if (this.focusedPath === path) {
      this.focusedPath = null;
    }
  }
}
