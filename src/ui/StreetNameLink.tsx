import * as React from "react";
import styled from "styled-components";

import { CityState } from "../state/CityState";
import { DisplayState } from "../state/DisplayState";
import { action } from "mobx";

const StreetNameLinkComponent = styled.a`
  color: blue;
  text-decoration: underline;
  cursor: pointer;
`;

export const StreetNameLink = ({ streetName }: { streetName: string }) => {
  const cityState = CityState.use();
  const displayState = DisplayState.use();

  const street = cityState.roads.getStreet(streetName);

  const focusStreet = action((e: React.MouseEvent) => {
    displayState.focusedItem = street;
    e.preventDefault();
  });

  return (
    <StreetNameLinkComponent onClick={focusStreet}>
      {streetName}
    </StreetNameLinkComponent>
  );
};
