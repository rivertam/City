import * as React from "react";
import styled from "styled-components";

import { StreetNode } from "../generation/impl/graph";
import { DisplayState } from "../state/DisplayState";
import { Lot } from "../state/Lot";
import { Street } from "../state/Street";
import { FocusedBuilding } from "./FocusedBuilding";
import { StreetNameLink } from "./StreetNameLink";
import { FocusedStreetNode } from "./FocusedStreetNode";
import { FocusedStreet } from "./FocusedStreet";

export type FocusedItem = StreetNode | Lot | Street;

const FocusedItemWindow = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 45%;
  height: 20%;
  max-width: 400px;
  max-height: 250px;
  border-top-right-radius: 10px;
  background-color: #a5a0a3;
  z-index: 1;
`;

export const FocusedItem = () => {
  const displayState = DisplayState.use();
  const focusedItem = displayState.useFocusedItem();

  if (!focusedItem) {
    return <FocusedItemWindow>nothing</FocusedItemWindow>;
  }

  if (focusedItem instanceof Lot) {
    return (
      <FocusedItemWindow>
        <FocusedBuilding building={focusedItem} />
      </FocusedItemWindow>
    );
  }

  if (focusedItem instanceof StreetNode) {
    return (
      <FocusedItemWindow>
        <FocusedStreetNode streetNode={focusedItem} />
      </FocusedItemWindow>
    );
  }

  if (focusedItem instanceof Street) {
    return (
      <FocusedItemWindow>
        <FocusedStreet street={focusedItem} />
      </FocusedItemWindow>
    );
  }

  return null;
};
