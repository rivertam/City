import React, { useContext, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import dat from "dat.gui";
import {
  Agent,
  AgentConfiguration,
  Agents,
  FieldConfiguration,
} from "./Agents";
import { toJS } from "mobx";
import { GameState } from "./GameState";

export const AgentFieldGUI = observer(
  ({
    agent,
    label,
    configuration,
    gui,
  }: {
    agent: Agent<any>;
    label: string;
    configuration: FieldConfiguration;
    gui: dat.GUI;
  }) => {
    const value = agent.state[label];
    useEffect(() => {
      if (typeof value === "number") {
        const input = gui.add(
          toJS(agent.state),
          label,
          configuration.min,
          configuration.max,
          configuration.step
        );

        // we have to use this indirection rather than simply using the object reference
        // (as dat.GUI is built to use with the first argument of `gui.add`) because
        // mobx requires calling an action when changing state
        input.onChange((newValue) => {
          agent.setField(label, newValue);
        });

        return () => {
          input.remove();
        };
      }
    }, [agent, label, configuration, value]);

    return <></>;
  }
);

export const AgentConfigGUI = observer(
  ({ agent, gui }: { agent: Agent<any>; gui: dat.GUI }) => {
    return (
      <>
        {Object.entries(agent.configuration).map(([key, configuration]) => (
          <AgentFieldGUI
            key={key}
            label={key}
            agent={agent}
            configuration={configuration as FieldConfiguration}
            gui={gui}
          />
        ))}
      </>
    );
  }
);

export const AgentKindGUI = observer(
  ({
    gui,
    kind,
    agents,
  }: {
    gui: dat.GUI;
    kind: string;
    agents: Array<Agent<any>>;
  }) => {
    const [folder, setFolder] = useState<dat.GUI | null>(null);
    useEffect(() => {
      const name = agents.length === 1 ? `${kind} Agent` : `${kind} Agents`;
      const newFolder = gui.addFolder(name);
      setFolder(newFolder);

      return () => {
        gui.removeFolder(newFolder);
      };
    }, [agents.length, gui]);

    const [folders, setFolders] = useState<Record<string, dat.GUI>>({});
    useEffect(() => {
      if (agents.length === 1) {
        if (!folder) {
          return () => {};
        }

        // just use the outer folder
        setFolders({
          [agents[0].id]: folder,
        });

        return () => {};
      }

      const newFolders = {};
      for (const agent of agents) {
        newFolders[agent.id] = gui.addFolder(agent.id);
      }

      setFolders(newFolders);

      return () => {
        for (const [_id, folder] of Object.entries(newFolders)) {
          gui.removeFolder(folder as dat.GUI);
        }
      };
    }, [agents, folder, gui]);

    if (!folder) return null;

    return (
      <>
        {agents.map((agent) => {
          // folder hasn't been mounted yet in useEffect
          if (!folders[agent.id]) {
            return null;
          }

          return (
            <AgentConfigGUI
              key={agent.id}
              agent={agent}
              gui={folders[agent.id]}
            />
          );
        })}
      </>
    );
  }
);

const MethodGUI = observer(
  ({
    gui,
    label,
    method,
  }: {
    gui: dat.GUI;
    label: string;
    method: () => void;
  }) => {
    useEffect(() => {
      const button = gui.add({ [label]: method }, label);

      return () => {
        button.remove();
      };
    }, [gui, label, method]);

    return <></>;
  }
);

export const MethodsGUI = observer(({ gui }: { gui: dat.GUI }) => {
  const { globalMethods: methods } = GameState.use();

  return (
    <>
      {methods.map(({ id, label, method }) => {
        return <MethodGUI key={id} gui={gui} label={label} method={method} />;
      })}
    </>
  );
});

export const GUI = observer(() => {
  const [datGUI, setDatGUI] = useState<null | dat.GUI>(null);
  useEffect(() => {
    const gui = new dat.GUI({ width: 300 });
    setDatGUI(gui);

    return () => {
      gui.destroy();
    };
  }, []);

  const { agents } = useContext(Agents.Context);

  if (!datGUI) return null;

  return (
    <>
      <MethodsGUI gui={datGUI} />
      {Object.entries(agents).map(([kind, agents]) => {
        return (
          <AgentKindGUI
            key={kind}
            kind={kind as string}
            agents={agents}
            gui={datGUI}
          />
        );
      })}
    </>
  );
});
