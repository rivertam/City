import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { CityState } from "../City/CityState";
import { Agent, AgentConfigurationFromState, AgentState } from "../Agents";
import { makeButton, useTweaks } from "use-tweaks";
import { City } from "../City/City";
import { useStage } from "../Stage";
import { Unit, UnitRole } from "../City/Unit";

type Resident = {};

export const SegregationSimulation = observer(() => {
  const { stage } = useStage();

  const { "Occupancy %": occupancy } = useTweaks("Segregation Simulation", {
    "Occupancy %": {
      value: 75,
      min: 1,
      max: 99,
      step: 1,
    },
    ...makeButton("Set Up", () => {
      console.log("setting up with occupancy", occupancy);
    }),
  });

  useEffect(() => {
    setTimeout(() => {
      console.log("after setup,", stage.getActors({ roles: [UnitRole] }));
    }, 3000);
  }, []);

  return <City></City>;
});
