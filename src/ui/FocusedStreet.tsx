import * as React from "react";

import { Street } from "../state/Street";

export function FocusedStreet({ street }: { street: Street }) {
  return (
    <div>
      <h1>{street.name}</h1>
    </div>
  );
}
