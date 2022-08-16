import { makeAutoObservable } from "mobx";
import { createContext, useContext, useEffect, useRef } from "react";

import { MapLine } from "./MapLine";

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

  public constructor(generatedCity: GeneratedCity) {
    this.sea = generatedCity.sea;
    this.coastline = generatedCity.coastline;
    this.river = generatedCity.river;
    this.secondaryRiver = generatedCity.secondaryRiver;
    this.roads = {
      main: generatedCity.mainRoads,
      major: generatedCity.majorRoads,
      minor: generatedCity.minorRoads,
      coastline: generatedCity.coastlineRoads,
    };

    this.blocks = generatedCity.blocks;
    this.lots = generatedCity.lots.map(({ shape: { name, polygon } }) => {
      return new Lot({ address: name, shape: polygon });
    });
    this.parks = generatedCity.parks;

    console.time("Centralizing city");
    // average all vertices and normalize so the average is 0, 0
    const vertices: Array<[number, number]> = [];
    this.sea.polygon.forEach((vertex) => vertices.push(vertex));
    this.coastline.polygon.forEach((vertex) => vertices.push(vertex));
    this.river.polygon.forEach((vertex) => vertices.push(vertex));
    this.secondaryRiver.polygon.forEach((vertex) => vertices.push(vertex));
    this.roads.main.forEach((road) =>
      road.polygon.forEach((vertex) => vertices.push(vertex))
    );
    this.roads.major.forEach((road) =>
      road.polygon.forEach((vertex) => vertices.push(vertex))
    );
    this.roads.minor.forEach((road) =>
      road.polygon.forEach((vertex) => vertices.push(vertex))
    );

    this.roads.coastline.forEach((road) =>
      road.polygon.forEach((vertex) => vertices.push(vertex))
    );
    this.blocks.forEach((block) =>
      block.shape.polygon.forEach((vertex) => vertices.push(vertex))
    );
    this.lots.forEach((lot) =>
      lot.shape.forEach((vertex) => vertices.push(vertex))
    );
    this.parks.forEach((park) =>
      park.polygon.forEach((vertex) => vertices.push(vertex))
    );

    const averageX =
      vertices.reduce((current, [x]) => current + x, 0) / vertices.length;
    const averageY =
      vertices.reduce((current, [, y]) => current + y, 0) / vertices.length;

    vertices.forEach((vertex) => {
      vertex[0] -= averageX;
      vertex[1] -= averageY;
    });

    console.timeEnd("Centralizing city");
    console.log(`${vertices.length} points`);
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
  mainRoads: Array<MapLine>;
  majorRoads: Array<MapLine>;
  minorRoads: Array<MapLine>;
  coastlineRoads: Array<MapLine>;
  parks: Array<MapLine>;
  blocks: Array<{
    shape: MapLine;
  }>;
  lots: Array<{
    shape: MapLine;
  }>;
};
