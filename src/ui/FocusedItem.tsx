import { FaDirections } from "react-icons/fa";
import * as React from "react";
import styled from "styled-components";

import { StreetNode } from "../generation/impl/graph";
import { DisplayState } from "../state/DisplayState";
import { Lot } from "../state/Lot";
import { Street } from "../state/Street";
import { CityState } from "../state/CityState";

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

const Coordinates = styled.div`
  position: absolute;
  top: 5px;
  right: 15px;
  color: #000000;
  opacity: 0.5;
  z-index: 2;
`;

function FocusedStreetNode({ streetNode }: { streetNode: StreetNode }) {
  const title: Array<React.ReactNode> = [];

  const streetNames = Array.from(
    new Set(streetNode.edges().map((edge) => edge.streetName))
  );

  if (streetNames.length === 0) {
    title.push("Lone node...");
  } else if (streetNames.length === 1) {
    title.push(
      <StreetNameLink key={streetNames[0]} streetName={streetNames[0]} />
    );
  } else if (streetNames.length === 2) {
    title.push(
      <StreetNameLink key={streetNames[0]} streetName={streetNames[0]} />
    );
    title.push(" and ");
    title.push(
      <StreetNameLink key={streetNames[1]} streetName={streetNames[1]} />
    );
  } else {
    title.push(
      <StreetNameLink key={streetNames[0]} streetName={streetNames[0]} />
    );
    for (let ii = 1; ii < streetNames.length - 1; ii++) {
      title.push(
        <>
          ,{" "}
          <StreetNameLink key={streetNames[ii]} streetName={streetNames[ii]} />
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
        {streetNode.value.x.toFixed(3)}, {streetNode.value.y.toFixed(3)}
      </Coordinates>
    </div>
  );
}

export function FocusedStreet({ street }: { street: Street }) {
  return (
    <div>
      <h1>{street.name}</h1>
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
    displayState.focusItem(street);
    e.preventDefault();
  };

  return (
    <StreetNameLinkComponent onClick={focusStreet}>
      {streetName}
    </StreetNameLinkComponent>
  );
};

export const OpenDirectionsButton = styled.button`
  all: unset;
  position: absolute;
  top: 15px;
  right: 15px;

  border-radius: 999px;
  background-color: white;

  &:focus {
    outline: orange auto 1px;
  }

  > svg {
    font-size: 1.2rem;
    line-height: 2.4rem;
    vertical-align: middle;
  }

  width: 2rem;
  height: 2rem;
  text-align: center;
`;

export function FocusedBuilding({ building }: { building: Lot }) {
  return (
    <>
      <h1>{building.address}</h1>

      <hr />

      <OpenDirectionsButton>
        <FaDirections />
      </OpenDirectionsButton>

      <div>
        on <StreetNameLink streetName={building.streetName} />
      </div>
    </>
  );
}
