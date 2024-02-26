import { FaDirections } from "react-icons/fa";
import * as React from "react";
import styled from "styled-components";

import { StreetNameLink } from "./StreetNameLink";
import { Lot } from "../state/Lot";

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
