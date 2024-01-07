import { makeAutoObservable } from "mobx";
import { createContext, useContext } from "react";
import Graph from "../ts/impl/graph";

export type MapLine = {
  name: string;
  polygon: Array<[number, number]>;
};

export class Road {
  public name: string;
  public polygon: Array<[number, number]>;

  public constructor() {
    makeAutoObservable(this);
  }
}

export class Lot {
  public address: string;
  public shape: Array<[number, number]>;

  public constructor({
    address,
    shape,
  }: {
    address: string;
    shape: Array<[number, number]>;
  }) {
    this.address = address;
    this.shape = shape;

    makeAutoObservable(this);
  }
}

/**
 * The state of the city, mostly the generated features such as rivers,
 * roads, and lot allocations. Primarily static at the present, but agents should
 * be able to move these kinds of things.
 */
export class CityState {
  public sea: MapLine;
  public coastline: MapLine;
  public river: MapLine;
  public secondaryRiver: MapLine;

  public roads: {
    main: Array<Road>;
    minor: Array<Road>;
    major: Array<Road>;
    coastline: Array<Road>;
  };

  public blocks: Array<{
    shape: MapLine;
  }>;

  public lots: Array<Lot>;

  public parks: Array<MapLine>;

  public streetGraph: Graph;

  public constructor(generatedCity: GeneratedCity) {
    this.sea = generatedCity.sea;
    this.coastline = generatedCity.coastline;
    this.river = generatedCity.river;
    this.secondaryRiver = generatedCity.secondaryRiver;
    this.roads = generatedCity.roads;

    this.blocks = generatedCity.blocks;
    this.lots = generatedCity.lots.map(({ shape: { name, polygon } }) => {
      return new Lot({ address: name, shape: polygon });
    });
    this.parks = generatedCity.parks;

    this.streetGraph = generatedCity.streetGraph;

    makeAutoObservable(this);
  }

  public static Context = createContext<CityState>(null);

  public static use(): CityState {
    return useContext(CityState.Context);
  }

  public getParkVertices(parkName: string): Float32Array {
    const park = this.parks.find((park) => park.name === parkName);

    if (!park) {
      throw new Error(
        `Tried to get vertices for park ${parkName}, which doesn't exist`
      );
    }

    const floats: Array<number> = [];
    for (
      let pointIndex = 0;
      pointIndex < park.polygon.length;
      pointIndex += 1
    ) {
      floats.push(park.polygon[pointIndex][0]);
      floats.push(park.polygon[pointIndex][1]);
      floats.push(0);
    }

    return new Float32Array(floats);
  }
}

// essentially the output of the generation algorithms
export type GeneratedCity = {
  sea: MapLine;
  coastline: MapLine;
  river: MapLine;
  secondaryRiver: MapLine;
  roads: {
    main: Array<MapLine>;
    major: Array<MapLine>;
    minor: Array<MapLine>;
    coastline: Array<MapLine>;
  };
  parks: Array<MapLine>;
  blocks: Array<{
    shape: MapLine;
  }>;
  lots: Array<{
    shape: MapLine;
  }>;

  streetGraph: Graph;
};
