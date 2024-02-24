import { createContext, useContext, useEffect, useState } from "react";
import { FocusedItem } from "../ui/FocusedItem";

export class DisplayState {
  private focusedItem: FocusedItem | null = null;

  private itemListeners = new Map<FocusedItem | null, Set<() => void>>();

  public static Context = createContext<DisplayState>(new DisplayState());

  public static use(): DisplayState {
    return useContext(DisplayState.Context);
  }

  private getItemListeners(item: FocusedItem | null) {
    const listeners = this.itemListeners.get(item);
    if (!listeners) {
      const newListeners = new Set<() => void>();
      this.itemListeners.set(item, newListeners);
      return newListeners;
    }

    return listeners;
  }

  public useIsFocused(item: FocusedItem): boolean {
    const [isFocused, setIsFocused] = useState(this.focusedItem === item);

    useEffect(() => {
      const listener = () => {
        setIsFocused(item === this.focusedItem);
      };

      const listeners = this.getItemListeners(item);
      listeners.add(listener);

      return () => {
        this.getItemListeners(item).delete(listener);
      };
    }, [item, this]);

    return isFocused;
  }

  public useFocusedItem(): FocusedItem | null {
    const [, rerender] = useState(0);

    useEffect(() => {
      const listener = () => {
        rerender((a) => a + 1);
      };
      this.getItemListeners(null).add(listener);

      return () => {
        this.getItemListeners(null).delete(listener);
      };
    }, [this]);

    return this.focusedItem;
  }

  public focusItem(item: FocusedItem | null) {
    const oldItem = this.focusedItem;
    this.focusedItem = item;

    if (oldItem === item) return;

    this.getItemListeners(oldItem).forEach((listener) => listener());
    this.getItemListeners(item).forEach((listener) => listener());

    if (oldItem !== null && this.focusedItem !== null) {
      // null listeners always get updated
      this.getItemListeners(null).forEach((listener) => listener());
    }
  }

  private hoveredItems = new Set<FocusedItem>();

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
  public hoverItem(item: FocusedItem, unhover: boolean) {
    if (unhover) {
      this.hoveredItems.delete(item);
    } else {
      this.hoveredItems.add(item);
    }

    this.getItemListeners(item).forEach((listener) => listener());
  }

  /**
   * React hook to use the hovered item. This is used by the UI to display tooltips etc.
   * Only gives one hovered item -- if there are multiple, it uses the first
   */
  public useHoveredItem(): FocusedItem | null {
    const [hoveredItem, setHoveredItem] = useState<FocusedItem | null>(null);
    useEffect(() => {
      const changeListener = () => {
        setHoveredItem(this.hoveredItem);
      };

      this.getItemListeners(null).add(changeListener);

      return () => {
        this.getItemListeners(null).delete(changeListener);
      };
    }, [this]);

    return hoveredItem;
  }

  public useIsHovered(focusItem: FocusedItem): boolean {
    const [isHovered, setIsHovered] = useState(
      this.hoveredItems.has(focusItem)
    );

    useEffect(() => {
      const listener = () => {
        setIsHovered(this.hoveredItems.has(focusItem));
      };

      this.getItemListeners(focusItem).add(listener);

      return () => {
        this.getItemListeners(focusItem).delete(listener);
      };
    }, [this, focusItem]);

    return isHovered;
  }
}
