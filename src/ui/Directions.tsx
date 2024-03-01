import * as React from "react";
import styled from "styled-components";
import { Lot } from "../state/Lot";
import { DisplayState } from "../state/DisplayState";
import { toJS } from "mobx";

const DirectionsPanel = styled.div`
  transform: translateY(-500px);

  width: 300px;
  height: 500px;

  background-color: #a5a0a3;

  position: absolute;
`;

export function Directions({ from }: { from: Lot }) {
  const displayState = DisplayState.use();
  const hoveredItem = displayState.useHoveredItem();

  return (
    <DirectionsPanel>
      <h2>Directions</h2>

      <p>from {from.address}</p>

      {hoveredItem && <p>to {JSON.stringify(toJS(hoveredItem))}</p>}
    </DirectionsPanel>
  );
}
