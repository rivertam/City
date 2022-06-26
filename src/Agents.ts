import { makeAutoObservable } from "mobx";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type NumberFieldConfiguration = {
  defaultValue: number;
  min: number;
  max: number;
  step: number;
};

export type MethodFieldConfiguration<
  Fn extends (this: Agent<any>, ...args: Array<unknown>) => Promise<unknown>
> = {
  label?: string;
  method: Fn;
};

/**
 * De-muxes the field config without you having to do the duck-typing
 */
export function visitAgentConfigurationField<T>(
  fieldConfiguration: FieldConfiguration,
  visitor: {
    number: (config: NumberFieldConfiguration) => T;
    method: (config: MethodFieldConfiguration<any>) => T;
  }
): T {
  try {
    if ("method" in fieldConfiguration) {
      return visitor.method(fieldConfiguration);
    }

    return visitor.number(fieldConfiguration);
  } catch (error) {
    debugger;
  }
}

export type FieldConfiguration =
  | NumberFieldConfiguration
  | MethodFieldConfiguration<(...args: Array<unknown>) => Promise<unknown>>;

export type AgentConfiguration = Record<string, FieldConfiguration>;

export type AgentState<Configuration extends {}> = {
  [key in keyof Configuration]: Configuration[key] extends NumberFieldConfiguration
    ? number
    : Configuration[key] extends MethodFieldConfiguration<infer Fn>
    ? Fn
    : never;
};

type StateFieldToConfig<SF> = SF extends number
  ? NumberFieldConfiguration
  : SF extends Function
  ? MethodFieldConfiguration<any>
  : never;

export type AgentConfigurationFromState<
  State extends AgentState<AgentConfiguration>
> = {
  [key in keyof State]: StateFieldToConfig<State[key]>;
};

export class Agent<State extends AgentState<any>> {
  public constructor(
    public id: string,
    public kind: string,
    public configuration: AgentConfigurationFromState<State>,
    public state: State = Agent.getInitialState(configuration)
  ) {
    makeAutoObservable(this);
  }

  private static getInitialState<State extends AgentState<any>>(
    configuration: AgentConfigurationFromState<State>
  ): State {
    const state: any = {};
    for (const key in configuration) {
      state[key] = visitAgentConfigurationField(configuration[key], {
        method: (config) => config.method,
        number: (config) => config.defaultValue,
      });
    }

    return state;
  }

  public static useAgent<State extends AgentState<{}>>(
    kind: string,
    constructAgent:
      | AgentConfigurationFromState<State>
      | ((args: { id: string }) => Agent<State>),
    initialState?: State
  ): Agent<State> {
    const agents = useContext(Agents.Context);

    const [agent] = useState<Agent<State>>(() => {
      const id = agents.agentIDs[kind] ?? 0;

      agents.agentIDs[kind] = id + 1;

      let agent: Agent<State>;
      if (typeof constructAgent === "function") {
        agent = constructAgent({ id: `${kind} ${id}` });
      } else {
        agent = new Agent(`${kind} ${id}`, kind, constructAgent, initialState);
      }

      agents.addAgent(kind, agent);

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

  public addAgent(kind: string, agent: Agent<any>) {
    this.agents[kind] = this.agents[kind] ?? [];
    this.agents[kind].push(agent);
  }
}
