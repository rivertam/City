import { makeAutoObservable } from "mobx";
import { createContext, useContext } from "react";
import StreetGraph, {
  LotEntryPoint,
  StreetNode,
} from "../generation/impl/graph";
import { Polygon } from "../generation/impl/polygon_finder";
import { Lot } from "./Lot";
import Vector from "../generation/vector";
import { Street } from "./Street";

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
    main: Array<Street>;
    minor: Array<Street>;
    major: Array<Street>;
    coastline: Array<Street>;
  };

  public blocks: Array<{
    shape: MapLine;
  }>;

  public lots: Array<Lot>;

  public parks: Array<MapLine>;

  public streetGraph: StreetGraph;

  public constructor(generatedCity: GeneratedCity) {
    this.sea = generatedCity.sea;
    this.coastline = generatedCity.coastline;
    this.river = generatedCity.river;
    this.secondaryRiver = generatedCity.secondaryRiver;
    this.roads = generatedCity.roads;

    this.blocks = generatedCity.blocks;
    this.lots = generatedCity.lots;
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
    main: Array<Street>;
    major: Array<Street>;
    minor: Array<Street>;
    coastline: Array<Street>;
  };
  parks: Array<MapLine>;
  blocks: Array<{
    shape: MapLine;
  }>;
  lots: Array<Lot>;

  streetGraph: StreetGraph;
};
