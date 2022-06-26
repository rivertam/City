import React, { useContext, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import dat from "dat.gui";
import {
  Agent,
  AgentConfiguration,
  Agents,
  FieldConfiguration,
  MethodFieldConfiguration,
  NumberFieldConfiguration,
  visitAgentConfigurationField,
} from "./Agents";
import { toJS } from "mobx";
import { GUIState } from "./GUIState";

export const AgentNumberGUI = observer(
  ({
    agent,
    configuration,
    label,
    gui,
  }: {
    agent: Agent<any>;
    configuration: NumberFieldConfiguration;
    label: string;
    gui: dat.GUI;
  }) => {
    const state = toJS(agent.state);
    useEffect(() => {
      const input = gui.add(
        state,
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
    }, [label, state, configuration]);

    return <></>;
  }
);

export const AgentMethodGUI = observer(
  ({
    agent,
    configuration,
    label,
    gui,
  }: {
    agent: Agent<any>;
    configuration: MethodFieldConfiguration<any>;
    label: string;
    gui: dat.GUI;
  }) => {
    const { method, label: stringLabel = label } = configuration;
    useEffect(() => {
      const bound = method.bind(agent);

      const controller = gui.add(
        {
          [stringLabel]: async () => {
            console.time(stringLabel);
            await bound();
            console.timeEnd(stringLabel);
          },
        },
        stringLabel
      );

      return () => {
        controller.remove();
      };
    }, [agent, method, stringLabel, gui]);

    return <></>;
  }
);

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
    return visitAgentConfigurationField(configuration, {
      number: (configuration) => (
        <AgentNumberGUI
          agent={agent}
          label={label}
          gui={gui}
          configuration={configuration}
        />
      ),
      method: (configuration) => (
        <AgentMethodGUI
          agent={agent}
          label={label}
          gui={gui}
          configuration={configuration}
        />
      ),
    });
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
      const name = agents.length === 1 ? `${kind}` : `${kind} Agents`;
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
  const { globalMethods: methods } = GUIState.instance;

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
