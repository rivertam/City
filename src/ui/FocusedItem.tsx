import React from "react";
import styled from "styled-components";

import { Node } from "../ts/impl/graph";
import { DisplayState } from "../City/DisplayState";
import { observer } from "mobx-react-lite";

export type FocusedStreetNode = {
  kind: "streetNode";
  node: Node;
};

export type FocusedItem = FocusedStreetNode;

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

export const FocusedItem = observer(() => {
  const { focusedItem } = DisplayState.use();

  if (!focusedItem) {
    return <FocusedItemWindow>nothing</FocusedItemWindow>;
  }

  if (focusedItem.kind === "streetNode") {
    return (
      <FocusedItemWindow>
        <FocusedStreetNode focusedItem={focusedItem} />
      </FocusedItemWindow>
    );
  }

  return null;
});

const Coordinates = styled.div`
  position: absolute;
  top: 5px;
  right: 15px;
  color: #000000;
  opacity: 0.5;
  z-index: 2;
`;

function FocusedStreetNode({
  focusedItem,
}: {
  focusedItem: FocusedStreetNode;
}) {
  let nodeName: string;

  const streetNames = Array.from(focusedItem.node.segments.keys());

  if (streetNames.length === 1) {
    nodeName = streetNames[0];
  } else if (streetNames.length === 2) {
    nodeName = streetNames.join(" and ");
  } else {
    nodeName = streetNames[0];
    for (let ii = 1; ii < streetNames.length - 1; ii++) {
      nodeName += `, ${streetNames[ii]}`;
    }

    nodeName += `, and ${streetNames[streetNames.length - 1]}`;
  }

  return (
    <div>
      <h1>{nodeName}</h1>

      <hr />

      <h3>Streets</h3>

      {streetNames.map((streetName) => {
        return <div key={streetName}>{streetName}</div>;
      })}

      <Coordinates>
        {focusedItem.node.value.x.toFixed(3)},{" "}
        {focusedItem.node.value.y.toFixed(3)}
      </Coordinates>
    </div>
  );
}
