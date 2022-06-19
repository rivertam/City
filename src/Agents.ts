import { makeAutoObservable } from "mobx";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type NumberFieldConfiguration = {
  defaultValue: number;
  min: number;
  max: number;
  step: number;
};

export type FieldConfiguration = NumberFieldConfiguration;

export type AgentConfiguration = Record<string, FieldConfiguration>;

export type AgentState<Configuration extends AgentConfiguration> = {
  [key in keyof Configuration]: Configuration[key] extends NumberFieldConfiguration
    ? number
    : never;
};

export class Agent<Configuration extends AgentConfiguration> {
  public constructor(
    public id: string,
    public kind: string,
    public configuration: Configuration,
    public state: AgentState<Configuration> = Agent.getInitialState(
      configuration
    )
  ) {
    makeAutoObservable(this);
  }

  private static getInitialState<Config extends AgentConfiguration>(
    configuration: Config
  ): AgentState<Config> {
    const state: any = {};
    for (const key in configuration) {
      state[key] = configuration[key].defaultValue;
    }

    return state;
  }

  public static useAgent<Configuration extends AgentConfiguration>(
    kind: string,
    constructAgent:
      | Configuration
      | ((args: { id: string }) => Agent<Configuration>),
    initialConfiguration?: AgentState<Configuration>
  ): Agent<Configuration> {
    const agents = useContext(Agents.Context);

    const [agent] = useState<Agent<Configuration>>(() => {
      const id = agents.agentIDs[kind] ?? 0;

      agents.agentIDs[kind] = id + 1;

      let agent: Agent<Configuration>;
      if (typeof constructAgent === "function") {
        agent = constructAgent({ id: `${kind} ${id}` });
      } else {
        agent = new Agent(
          `${kind} ${id}`,
          kind,
          constructAgent,
          initialConfiguration
        );
      }

      agents.agents[kind] = agents.agents[kind] ?? [];
      agents.agents[kind].push(agent);

      return agent;
    });

    return agent;
  }

  public setField(
    fieldName: keyof typeof this.state,
    value: typeof this.state[typeof fieldName]
  ) {
    this.state[fieldName] = value;
  }
}

export class Agents {
  public constructor() {
    makeAutoObservable(this);
  }

  public agents: Record<string, Array<Agent<any>>> = {};
  public agentIDs: Record<string, number> = {};

  public static Context = createContext(new Agents());
}
