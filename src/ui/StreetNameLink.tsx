import * as React from "react";
import styled from "styled-components";

import { CityState } from "../state/CityState";
import { DisplayState } from "../state/DisplayState";

const StreetNameLinkComponent = styled.a`
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
