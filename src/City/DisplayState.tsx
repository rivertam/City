import { makeAutoObservable } from "mobx";
import { createContext, useContext } from "react";

export class DisplayState {
  public focusedStreet: string | null = null;

  public constructor() {
    makeAutoObservable(this);
  }

  public static Context = createContext<DisplayState>(new DisplayState());

  public static use(): DisplayState {
    return useContext(DisplayState.Context);
  }
}
