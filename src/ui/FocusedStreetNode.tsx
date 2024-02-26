import * as React from "react";
import styled from "styled-components";

import { StreetNameLink } from "./StreetNameLink";
import { StreetNode } from "../generation/impl/graph";

const Coordinates = styled.div`
  position: absolute;
  top: 5px;
  right: 15px;
  color: #000000;
  opacity: 0.5;
  z-index: 2;
`;

export function FocusedStreetNode({ streetNode }: { streetNode: StreetNode }) {
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
