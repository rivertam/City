import { v4 as uuid } from "uuid";
import { action, makeAutoObservable } from "mobx";
import { createContext, useEffect, useRef } from "react";

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

export class GameState {
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
  public lots: Array<{
    shape: MapLine;
  }>;

  public parks: Array<MapLine>;
  public static instance: GameState | null = null;

  public globalMethods: Array<{
    id: string;
    label: string;
    method: () => void;
  }> = [];

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
    this.lots = generatedCity.lots;
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
    console.log(`${vertices.length} points`);
    makeAutoObservable(this);

    GameState.instance = this;
  }

  public useMethod(label: string, method: () => void) {
    const referenceCount = useRef(0);
    const id = useRef(uuid());

    useEffect(
      action(() => {
        const extantMethod = this.globalMethods.find(
          (m) => m.id === id.current
        );
        if (extantMethod) {
          extantMethod.label = label;
          extantMethod.method = method;
        } else {
          this.globalMethods.push({
            id: id.current,
            label,
            method,
          });
        }

        referenceCount.current += 1;

        return action(() => {
          referenceCount.current -= 1;
          setTimeout(
            action(() => {
              if (referenceCount.current === 0) {
                this.globalMethods = this.globalMethods.filter(
                  (m) => m.id !== id.current
                );
              }
            }),
            500
          );
        });
      }),
      [this, label, method]
    );
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
