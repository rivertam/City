import * as React from "react";
import { observer } from "mobx-react-lite";
import styled from "styled-components";

import { StreetNode } from "../generation/impl/graph";
import { DisplayState } from "../state/DisplayState";
import { Lot } from "../state/Lot";
import { Street } from "../state/Street";
import { CityState } from "../state/CityState";

export type FocusedStreetNode = {
  kind: "streetNode";
  node: StreetNode;
};

export type FocusedBuilding = {
  kind: "building";
  lot: Lot;
};

export type FocusedStreet = {
  kind: "street";
  street: Street;
};

export type FocusedItem = FocusedStreetNode | FocusedBuilding | FocusedStreet;

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

  if (focusedItem.kind === "street") {
    return (
      <FocusedItemWindow>
        <FocusedStreet focusedItem={focusedItem} />
      </FocusedItemWindow>
    );
  }

  if (focusedItem.kind === "building") {
    return (
      <FocusedItemWindow>
        <FocusedBuilding focusedItem={focusedItem} />
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
  const title: Array<React.ReactNode> = [];

  const streetNames = Array.from(focusedItem.node.segments.keys());

  if (streetNames.length === 1) {
    title.push(<StreetNameLink streetName={streetNames[0]} />);
  } else if (streetNames.length === 2) {
    title.push(<StreetNameLink streetName={streetNames[0]} />);
    title.push(" and ");
    title.push(<StreetNameLink streetName={streetNames[1]} />);
  } else {
    title.push(<StreetNameLink streetName={streetNames[0]} />);
    for (let ii = 1; ii < streetNames.length - 1; ii++) {
      title.push(
        <>
          , <StreetNameLink streetName={streetNames[ii]} />
        </>
      );
    }

    title.push(" and ");
    title.push(
      <StreetNameLink streetName={streetNames[streetNames.length - 1]} />
    );
  }

  return (
    <div>
      <h1>{title}</h1>

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

export function FocusedStreet({ focusedItem }: { focusedItem: FocusedStreet }) {
  return (
    <div>
      <h1>{focusedItem.street.name}</h1>
    </div>
  );
}

export const StreetNameLinkComponent = styled.a`
  color: blue;
  text-decoration: underline;
  cursor: pointer;
`;

export const StreetNameLink = ({ streetName }: { streetName: string }) => {
  const cityState = CityState.use();
  const displayState = DisplayState.use();

  const street = cityState.roads.getStreet(streetName);

  const focusStreet = (e: React.MouseEvent) => {
    displayState.focusItem({ kind: "street", street });
    e.preventDefault();
  };

  return (
    <StreetNameLinkComponent onClick={focusStreet}>
      {streetName}
    </StreetNameLinkComponent>
  );
};

export function FocusedBuilding({
  focusedItem,
}: {
  focusedItem: FocusedBuilding;
}) {
  const cityState = CityState.use();
  const displayState = DisplayState.use();

  return (
    <div>
      <h1>{focusedItem.lot.address}</h1>

      <hr />

      <div>
        on <StreetNameLink streetName={focusedItem.lot.streetName} />
      </div>
    </div>
  );
}
