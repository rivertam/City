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

  const nextFocusItem = displayState.useNextFocusItem();

  const pathGenerator = React.useMemo(() => {
    if (nextFocusItem instanceof Lot) {
      return from.navigateTo(nextFocusItem);
    } else if (nextFocusItem instanceof StreetNode) {
      return from.navigateTo(nextFocusItem);
    }

    return null;
  }, [from, nextFocusItem]);

  const [path, setPath] = React.useState(null);
  const [isDoneNavigating, setIsDoneNavigating] = React.useState(false);

  const nextNavigationPath = () => {
    const { value: nextPath, done } = pathGenerator.next();

    setPath(nextPath);

    if (done) {
      setIsDoneNavigating(true);
    }

    return done;
  };

  const completeNavigation = () => {
    while (!nextNavigationPath()) {}
  };

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

      {!nextFocusItem && (
        <p>click another building or street node to get directions</p>
      )}

      {nextFocusItem && (
        <>
          to{" "}
          {nextFocusItem instanceof Lot ? nextFocusItem.address : "street node"}
          <br />
          {!isDoneNavigating && (
            <>
              <button onClick={nextNavigationPath}>Next Step</button>
              <button onClick={completeNavigation}>Navigate</button>
            </>
          )}
          <ol>
            {path &&
              path
                .getDirections()
                .map((direction) => (
                  <li
                    key={`${direction.node.value.x}-${direction.node.value.y}`}
                  >
                    {direction.message}
                  </li>
                ))}
          </ol>
        </>
      )}
    </DirectionsPanel>
  );
});
