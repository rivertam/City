import { makeAutoObservable } from 'mobx';
import { createContext, useContext } from 'react';

export type MapLine = {
  name: string;
  polygon: Array<[number, number]>;
};

// essentially the output of the generation algorithms
export type GeneratedCity = {
  coastline: MapLine;
  river: MapLine;
  mainRoads: Array<MapLine>;
  majorRoads: Array<MapLine>;
  minorRoads: Array<MapLine>;
  parks: Array<MapLine>;
};

export class GameState {
  public coastline: MapLine;
  public river: MapLine;
  public mainRoads: Array<MapLine>;
  public majorRoads: Array<MapLine>;
  public minorRoads: Array<MapLine>;
  public parks: Array<MapLine>;
  public static instance: GameState | null = null;

  public constructor(generatedCity: GeneratedCity) {
    this.coastline = generatedCity.coastline;
    this.river = generatedCity.river;
    this.mainRoads = generatedCity.mainRoads;
    this.majorRoads = generatedCity.majorRoads;
    this.minorRoads = generatedCity.minorRoads;
    this.parks = generatedCity.parks;

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
        `Tried to get vertices for park ${parkName}, which doesn't exist`,
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
