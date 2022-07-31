import React from "react";
import { observer } from "mobx-react-lite";
import { Agent } from "../Agents";
import { Space } from "./Space";

export type LotState = {
  Address: string;
};

export const Lot = observer(
  ({ address, shape }: { address: string; shape: Array<[number, number]> }) => {
    Agent.useAgent<LotState>("Lot", {
      Address: {
        defaultValue: address,
      },
    });

    return <Space polygon={shape} color="#fff" />;
  }
);
