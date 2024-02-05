import { makeAutoObservable } from "mobx";
import { createContext, useContext } from "react";
import Graph, { Node } from "../generation/impl/graph";
import { NodeAssociatedPolygon } from "../generation/impl/polygon_finder";
import { Lot } from "./Lot";
import Vector from "../generation/vector";

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
    this.lots = generatedCity.lots.map(
      ({ address, polygon, door, streetName }) => {
        return new Lot({ address, polygon, door, streetName });
      }
    );
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
    address: string;
    door: Vector;
    streetName: string;
    polygon: NodeAssociatedPolygon;
  }>;

  streetGraph: Graph;
};
