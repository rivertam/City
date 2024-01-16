import React, { createContext, useContext } from "react";
import styled from "styled-components";

import { Node } from "../ts/impl/graph";

export type FocusedStreetNode = {
  kind: "streetNode";
  node: Node;
};

export type FocusedItem = FocusedStreetNode;

export const FocusedItemContext = createContext<{
  item: FocusedItem | null;
  setItem: (item: FocusedItem | null) => void;
}>({
  item: null,
  setItem: () => {
    throw new Error("not provided");
  },
});

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

export function FocusedItem() {
  const { item } = useContext(FocusedItemContext);

  if (!item) {
    return <FocusedItemWindow>nothing</FocusedItemWindow>;
  }

  if (item.kind === "streetNode") {
    return (
      <FocusedItemWindow>
        <FocusedStreetNode focusedItem={item} />
      </FocusedItemWindow>
    );
  }

  return null;
}

function FocusedStreetNode({
  focusedItem,
}: {
  focusedItem: FocusedStreetNode;
}) {
  let nodeName: string;

  if (focusedItem.node.segments.size === 1) {
    nodeName = focusedItem.node.segments.keys().next().value;
  } else if (focusedItem.node.segments.size === 2) {
    nodeName = Array.from(focusedItem.node.segments.keys()).join(" and ");
  } else {
    const streetNames = Array.from(focusedItem.node.segments.keys());
    nodeName = streetNames[0];
    for (let ii = 1; ii < streetNames.length - 1; ii++) {
      nodeName += `, ${streetNames[ii]}`;
    }

    nodeName += `, and ${streetNames[streetNames.length - 1]}`;
  }

  return (
    <div>
      <h1>{nodeName}</h1>
    </div>
  );
}
