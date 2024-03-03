import * as React from "react";
import styled from "styled-components";
import { Lot } from "../state/Lot";
import { DisplayState } from "../state/DisplayState";
import { toJS } from "mobx";
import { StreetNode } from "../streets";

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

  const path = React.useMemo(() => {
    if (hoveredItem instanceof Lot) {
      return from.navigateTo(hoveredItem);
    } else if (hoveredItem instanceof StreetNode) {
      return from.navigateTo(hoveredItem);
    }

    return null;
  }, [from, hoveredItem]);

  return (
    <DirectionsPanel>
      <h2>Directions</h2>

      <p>from {from.address}</p>

      {hoveredItem && (
        <p>
          to {hoveredItem instanceof Lot ? hoveredItem.address : "street node"}
          <ol>
            {path.getDirections().map((direction) => (
              <li key={`${direction.node.value.x}-${direction.node.value.y}`}>
                {direction.message}
              </li>
            ))}
          </ol>
        </p>
      )}
    </DirectionsPanel>
  );
}
