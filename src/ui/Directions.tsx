import * as React from "react";
import styled from "styled-components";
import { Lot } from "../state/Lot";
import { DisplayState } from "../state/DisplayState";
import { StreetNode } from "../streets";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";

const DirectionsPanel = styled.div`
  transform: translateY(-500px);

  width: 300px;
  height: 500px;

  background-color: #a5a0a3;

  position: absolute;
`;

export const Directions = observer(function Directions({
  from,
}: {
  from: Lot;
}) {
  const displayState = DisplayState.use();
  const hoveredItem = displayState.hoveredItem;

  const path = React.useMemo(() => {
    if (hoveredItem instanceof Lot) {
      return from.navigateTo(hoveredItem);
    } else if (hoveredItem instanceof StreetNode) {
      return from.navigateTo(hoveredItem);
    }

    return null;
  }, [from, hoveredItem]);

  useEffect(() => {
    if (!path) {
      return;
    }

    displayState.focusPath(path);

    return () => {
      displayState.focusPath(path, false);
    };
  }, [path]);

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
});
