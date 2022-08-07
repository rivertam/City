import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { CityState } from "../City/CityState";
import { GUIState } from "../GUIState";
import { Agent, AgentConfigurationFromState, AgentState } from "../Agents";
import { Stage } from "../Stage/Stage";
import { Role } from "../Stage";

const Position3D = new Role<{ x: number; y: number; z: number }>("Position 3D");
const FamilyMember = new Role<string>("Family Member");
const Named = new Role<string>("Name");
const TheEast = new Role<void>("The East");
const TheSun = new Role<void>("The Sun");

const Environment = () => {
  const stage = Stage.use();

  stage.useActor((sun) => {
    sun.assignRole(TheSun);
  });

  stage.useActor((east) => {
    east.assignRole(TheEast);
  });

  return <></>;
};

const Romeo = () => {
  const stage = Stage.use();

  stage.useActor((romeo) => {
    romeo.assignRole(Position3D, { x: 0, y: 0, z: 0 });
    romeo.assignRole(Named, "Romeo");
    romeo.assignRole(FamilyMember, "Montegue");
    romeo.assignRole(TheEast);
  });

  // find all Named and TheEast actors
  const easts = stage.useQuery([Named, TheEast], (name) => {
    return name;
  });

  // whenever the list of named actors who are the east changes, announce their names
  useEffect(() => {
    if (easts.length === 0) {
      console.log(`Romeo: No one is the east`);
    }

    easts.forEach((name) => {
      console.log(`Romeo: ${name} is the east`);
    });
  }, [easts]);

  // repeat for TheSun actors
  const suns = stage.useQuery([Named, TheSun], (name) => {
    return name;
  });

  // whenever the list of named actors who are the east changes, announce their names
  useEffect(() => {
    if (suns.length === 0) {
      console.log(`Romeo: No one is the sun`);
    }

    suns.forEach((name) => {
      console.log(`Romeo: ${name} is the sun`);
    });
  }, [suns]);

  return <></>;
};

const Juliet = () => {
  const stage = Stage.use();
  stage.useActor((juliet) => {
    juliet.assignRole(Position3D, { x: 0, y: 0, z: 0 });
    juliet.assignRole(Named, "Juliet");
    juliet.assignRole(FamilyMember, "Capulet");
    juliet.assignRole(TheSun);
  });

  return <></>;
};

export const RomeoAndJuliet = () => {
  return (
    <>
      <Environment />
      <Romeo />
      <Juliet />
    </>
  );
};
