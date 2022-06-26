import React from "react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { CityState } from "../City/CityState";
import { GUIState } from "../GUIState";
import { Agent, AgentConfigurationFromState, AgentState } from "../Agents";

type Resident = {};

type SegregationSimulationState = {
  "Occupancy %": number;
  "Set Up"(this: Agent<SegregationSimulationState>);
};

export const SegregationSimulation = observer(() => {
  const cityState = CityState.use();

  const [residents, setResidents] = useState<Resident>([]);

  const simulationAgent = Agent.useAgent<SegregationSimulationState>(
    "Segregation Simulation",
    {
      "Occupancy %": {
        defaultValue: 75,
        min: 1,
        max: 99,
        step: 1,
      },
      "Set Up": {
        method(this: Agent<SegregationSimulationState>) {
          console.log("setting up");
          try {
            const occupancyPercent = this.state["Occupancy %"];
            const newResidents: Array<Resident> = [];

            setResidents(newResidents);
          } catch (error) {
            console.error("Failed to set up");
          }
        },
      },
    }
  );

  return <></>;
});
