import React, { useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { CityState } from "../City/CityState";
import { Agent, AgentConfigurationFromState, AgentState } from "../Agents";
import { makeButton, makeMonitor, useTweaks } from "use-tweaks";
import { sampleSize } from "lodash";
import { City } from "../City/City";
import { Actor, Role, useStage } from "../Stage";
import { BuildingRole } from "../City/Building";
import { UnitRole } from "../City/Unit";
import { Resident } from "../City/Resident";
import { ResidentRole } from "../City/ResidentRole";

export const SegregationSimulation = observer(() => {
  const [residents, setResidents] = useState({ red: 0, blue: 0 });
  const { stage } = useStage();

  // setup callback is a ref because `useTweaks` does not update
  // the callback when the parameters change.
  const setup = useRef<() => void>();

  const turn = () => {
    const residents = stage.getActors({ roles: [ResidentRole] });

    const unhappyResidents = residents.filter(
      (resident) => resident.get(ResidentRole).happiness < 0.5
    );

    const availableUnits = stage
      .getActors({ roles: [UnitRole] })
      .filter((unit) => !unit.get(UnitRole).tenant);

    console.log("unhappy residents: " + unhappyResidents.length);
    for (const resident of unhappyResidents) {
      const { unit, color } = resident.get(ResidentRole);

      // move out
      if (unit) {
        const building = unit.get(UnitRole).building;
        building.set(BuildingRole, (data) => {
          data.log.push(`resident ${resident.id} (${color}) moved out`);
          if (color === "red") {
            data.reds--;
          } else {
            data.blues--;
          }

          return data;
        });

        unit.set(UnitRole, (data) => {
          delete data.tenant;
          return data;
        });

        resident.set(ResidentRole, (data) => {
          delete data.unit;
          return data;
        });

        availableUnits.push(unit);
      }
    }

    // select a random unit for each unhappy resident
    const newUnits = sampleSize(availableUnits, unhappyResidents.length);

    console.log("moving in " + newUnits.length + " residents");
    for (const unit of newUnits) {
      const resident = unhappyResidents.pop();

      if (!resident) {
        break;
      }

      unit.set(UnitRole, (data) => ({
        ...data,
        tenant: resident,
      }));

      const { color } = resident.get(ResidentRole);
      const { building } = unit.get(UnitRole);
      building.set(BuildingRole, (data) => {
        data.log.push(`resident ${resident.id} (${color}) moved in`);
        if (color === "red") {
          data.reds++;
        } else {
          data.blues++;
        }
        return data;
      });

      resident.set(ResidentRole, (data) => ({
        ...data,
        unit,
      }));
    }

    stage.tick();
  };

  const tweaks = useTweaks("Segregation Simulation", {
    "Occupancy %": {
      value: 50,
      min: 1,
      max: 99,
      step: 1,
    },
    "Building tolerance": {
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
    },
    ...makeButton("Set Up", () => setup.current?.()),
    ...makeButton("+1", () => turn()),
    ...makeButton("+10", () => {
      for (let i = 0; i < 10; i++) {
        turn();
      }
    }),
    ...makeButton("+ until happy", async () => {
      function isHappy() {
        for (const resident of stage.getActors({ roles: [ResidentRole] })) {
          if (resident.get(ResidentRole).happiness < 0.5) {
            return false;
          }
        }

        return true;
      }

      let turns = 0;
      while (!isHappy()) {
        turn();
        await new Promise((resolve) => setTimeout(resolve, 100));
        turns++;
      }

      console.log("took " + turns + " turns");
    }),
    ...makeMonitor(
      "Happiness",
      () => {
        const residents = stage.getActors({ roles: [ResidentRole] });

        const happiness = residents.reduce((sum, resident) => {
          return sum + resident.get(ResidentRole).happiness;
        }, 0);

        return happiness / residents.length;
      },
      {
        view: "graph",
        min: 0,
        max: 2,
      }
    ),
    ...makeMonitor(
      "Num happy people",
      () => {
        const residents = stage.getActors({ roles: [ResidentRole] });

        let happy = 0;

        for (const resident of residents) {
          if (resident.get(ResidentRole).happiness > 0.5) {
            happy++;
          }
        }

        return `${happy} / ${residents.length}`;
      },
      {
        interval: 1,
        min: 0,
        max: residents.red + residents.blue,
      }
    ),
    ...makeMonitor(
      "Percent buildings diverse",
      () => {
        const buildings = stage.getActors({ roles: [BuildingRole] });

        let diverse = 0;
        let occupied = 0;

        for (const building of buildings) {
          const { reds, blues } = building.get(BuildingRole);

          if (reds + blues === 0) {
            continue;
          }

          occupied++;

          const redRatio = reds / (reds + blues);

          if (Math.abs(redRatio - 0.5) < 0.3) {
            diverse++;
          }
        }

        return diverse / occupied;
      },
      {
        view: "graph",
        min: 0,
        max: 1,
        interval: 2,
      }
    ),
    ...makeMonitor(
      "Average building diversity",
      () => {
        const buildings = stage.getActors({ roles: [BuildingRole] });

        const diversity = buildings.reduce((sum, building) => {
          const { reds, blues } = building.get(BuildingRole);

          if (reds + blues === 0) {
            return sum;
          }

          const redRatio = reds / (reds + blues);

          return sum + (0.5 - Math.abs(redRatio - 0.5)) * 2;
        }, 0);

        return diversity / buildings.length;
      },
      {
        view: "graph",
        min: 0,
        max: 1,
        interval: 2,
      }
    ),
  });

  useEffect(() => {
    setup.current = () => {
      const units = stage.getActors({ roles: [UnitRole] });

      const residentCount = Math.floor(
        units.length * 0.01 * tweaks["Occupancy %"]
      );

      setResidents({
        red: residentCount / 2,
        blue: residentCount / 2,
      });
    };
  }, [tweaks]);

  const redResidents = new Array<JSX.Element>();
  const blueResidents = new Array<JSX.Element>();

  for (let i = 0; i < residents.red + residents.red; i++) {
    redResidents.push(
      <Resident
        key={i}
        color={i > residents.red ? "blue" : "red"}
        buildingTolerance={tweaks["Building tolerance"]}
        neighborhoodTolerance={tweaks["Building tolerance"]}
      />
    );
  }

  return (
    <>
      <City></City>
      {redResidents}
      {blueResidents}
    </>
  );
});
