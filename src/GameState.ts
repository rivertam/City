import { makeAutoObservable } from "mobx";
import { createContext, useContext } from "react";

export type MapLine = {
  name: string;
  polygon: Array<[number, number]>;
};

// essentially the output of the generation algorithms
export type GeneratedCity = {
  sea: MapLine;
  coastline: MapLine;
  river: MapLine;
  secondaryRiver: MapLine;
  mainRoads: Array<MapLine>;
  majorRoads: Array<MapLine>;
  minorRoads: Array<MapLine>;
  parks: Array<MapLine>;
  blocks: Array<{
    shape: MapLine;
  }>;
  lots: Array<{
    shape: MapLine;
  }>;
};

export class GameState {
  public sea: MapLine;
  public coastline: MapLine;
  public river: MapLine;
  public secondaryRiver: MapLine;
  public mainRoads: Array<MapLine>;
  public majorRoads: Array<MapLine>;
  public minorRoads: Array<MapLine>;
  public blocks: Array<{
    shape: MapLine;
  }>;
  public lots: Array<{
    shape: MapLine;
  }>;

  public parks: Array<MapLine>;
  public static instance: GameState | null = null;

  public constructor(generatedCity: GeneratedCity) {
    this.sea = generatedCity.sea;
    this.coastline = generatedCity.coastline;
    this.river = generatedCity.river;
    this.secondaryRiver = generatedCity.secondaryRiver;
    this.mainRoads = generatedCity.mainRoads;
    this.majorRoads = generatedCity.majorRoads;
    this.minorRoads = generatedCity.minorRoads;
    this.blocks = generatedCity.blocks;
    this.lots = generatedCity.lots;
    this.parks = generatedCity.parks;

    console.time("Centralizing city");
    // average all vertices and normalize so the average is 0, 0
    const vertices: Array<[number, number]> = [];
    this.sea.polygon.forEach((vertex) => vertices.push(vertex));
    this.coastline.polygon.forEach((vertex) => vertices.push(vertex));
    this.river.polygon.forEach((vertex) => vertices.push(vertex));
    this.secondaryRiver.polygon.forEach((vertex) => vertices.push(vertex));
    this.mainRoads.forEach((road) =>
      road.polygon.forEach((vertex) => vertices.push(vertex))
    );
    this.majorRoads.forEach((road) =>
      road.polygon.forEach((vertex) => vertices.push(vertex))
    );
    this.minorRoads.forEach((road) =>
      road.polygon.forEach((vertex) => vertices.push(vertex))
    );
    this.blocks.forEach((block) =>
      block.shape.polygon.forEach((vertex) => vertices.push(vertex))
    );
    this.lots.forEach((lot) =>
      lot.shape.polygon.forEach((vertex) => vertices.push(vertex))
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
    makeAutoObservable(this);

    GameState.instance = this;
  }

  public static Context = createContext<GameState>(null);

  public static use(): GameState {
    return this.instance!;
    // return useContext(GameState.Context);
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
