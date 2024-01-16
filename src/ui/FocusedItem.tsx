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
        Street Node: {item.node.value.x}, {item.node.value.y}
      </FocusedItemWindow>
    );
  }

  return null;
}

export function FocusedStreetNode({
  focusedItem,
}: {
  focusedItem: FocusedStreetNode;
}) {
  return (
    <FocusedItemWindow>
      {Array.from(focusedItem.node.segments.keys()).join(", ")}
    </FocusedItemWindow>
  );
}
