import { makeAutoObservable } from "mobx";
import { createContext, useContext } from "react";
import { FocusedItem } from "../ui/FocusedItem";

export class DisplayState {
  public focusedItem: FocusedItem | null = null;

  public constructor() {
    makeAutoObservable(this);
  }

  public static Context = createContext<DisplayState>(new DisplayState());

  public static use(): DisplayState {
    return useContext(DisplayState.Context);
  }

  public focusItem(item: FocusedItem | null) {
    this.focusedItem = item;
  }
}
