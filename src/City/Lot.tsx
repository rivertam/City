import * as React from "react";
import { observer } from "mobx-react-lite";
import { Space } from "./Space";

export type LotState = {
  Address: string;
};

export const Lot = observer(
  ({ shape }: { address: string; shape: Array<[number, number]> }) => {
    return <Space polygon={shape} color="#fff" />;
  }
);
