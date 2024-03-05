import TensorField, { NoiseParams } from "./impl/tensor_field";
import MainGUI from "./ui/main_gui";
import Vector from "./vector";
import { RNG, faker } from "../utils/random";
import { GeneratedCity, MapLine } from "../state/CityState";
import { Street } from "../state/Street";
import { Lot } from "../state/Lot";

export type CityGenerationParameters = {
  size?: number;
};

export class CityGenerator {
  private tensorField: TensorField;
  private mainGui: MainGUI; // In charge of glueing everything together

  private firstGenerate = true; // Don't randomise tensor field on first generate

  private rng = RNG.default;

  constructor({ size = 800 }: CityGenerationParameters) {
    const noiseParamsPlaceholder: NoiseParams = {
      // Placeholder values for park + water noise
      globalNoise: false,
      noiseSizePark: 20,
      noiseAnglePark: 90,
      noiseSizeGlobal: 30,
      noiseAngleGlobal: 20,
      rng: this.rng,
    };

    this.tensorField = new TensorField(
      noiseParamsPlaceholder,
      new Vector(size, size)
    );
    this.mainGui = new MainGUI(this.rng, this.tensorField);

    this.tensorField.setRecommended();
  }

  /**
   * Generate an entire map with no control over the process
   */
  async generate(): Promise<GeneratedCity> {
    if (!this.firstGenerate) {
      this.tensorField.setRecommended();
    } else {
      this.firstGenerate = false;
    }

    await this.mainGui.generateEverything();

    this.rng.random();
    return await this.getGeneratedCity();
  }

  public async getGeneratedCity(): Promise<GeneratedCity> {
    const usedNames = new Set<string>();

    const createRiverName = (): string => {
      let name: string;
      do {
        const fish = faker.animal.fish();
        const kind = faker.helpers.arrayElement(["Stream", "Creek", "River"]);
        name = `${fish} ${kind}`;
      } while (usedNames.has(name));

      usedNames.add(name);
      return name;
    };

    const createParkName = (): string => {
      let name: string;
      do {
        name = `${faker.person.lastName()} park`;
      } while (usedNames.has(name));

      usedNames.add(name);
      return name;
    };

    const convertLine = (poly: Array<Vector>, name: string): MapLine => {
      return {
        name,
        polygon: poly.map((vec) => [vec.x, vec.y]),
      };
    };

    const coastlineRoads = this.mainGui.coastline.roads.map((street) => {
      return new Street(street.name, street.points);
    });

    const mainRoads = this.mainGui.mainRoads.roads.map((street) => {
      return new Street(street.name, street.points);
    });

    const majorRoads = this.mainGui.majorRoads.roads.map((street) => {
      return new Street(street.name, street.points);
    });

    const minorRoads = this.mainGui.minorRoads.roads.map((street) => {
      return new Street(street.name, street.points);
    });

    const nameToStreet = new Map<string, Street>();

    for (const street of coastlineRoads.concat(
      mainRoads,
      majorRoads,
      minorRoads
    )) {
      nameToStreet.set(street.name, street);
    }

    // attach addresses to lots
    const lots = this.mainGui.buildingModels.map((building) => {
      const lot = new Lot({
        address: new Array(100).join("j"),
        polygon: building.lotWorld,
        entryPoint: building.entryPoint,
      });

      const street = nameToStreet.get(building.entryPoint.streetName);

      if (!street) {
        console.error(`No street found for ${building.entryPoint.streetName}`);

        return lot;
      }

      street.associateLot(lot);

      return lot;
    });

    for (const street of coastlineRoads.concat(
      mainRoads,
      majorRoads,
      minorRoads
    )) {
      street.nameLots();
    }

    const blocks = this.mainGui.getBlocks();

    const city = {
      sea: convertLine(this.mainGui.seaPolygon, "sea"),
      coastline: convertLine(this.mainGui.coastlinePolygon, "coastline"),
      river: convertLine(this.mainGui.riverPolygon, createRiverName()),
      secondaryRiver: convertLine(
        this.mainGui.secondaryRiverPolygon,
        createRiverName()
      ),
      parks: this.mainGui.parks.map((park) =>
        convertLine(park, createParkName())
      ),
      roads: {
        coastline: coastlineRoads,
        main: mainRoads,
        major: majorRoads,
        minor: minorRoads,
      },
      blocks: blocks.map((block, i) => ({
        shape: convertLine(block, `Block ${i + 1}`),
      })),
      lots,
      streetGraph: this.mainGui.getStreetGraph(),
    };

    // average all vertices and normalize so the average is 0, 0
    const vertices: Array<[number, number] | { x: number; y: number }> = [];
    city.sea.polygon.forEach((vertex) => vertices.push(vertex));
    city.coastline.polygon.forEach((vertex) => vertices.push(vertex));
    city.river.polygon.forEach((vertex) => vertices.push(vertex));
    city.secondaryRiver.polygon.forEach((vertex) => vertices.push(vertex));
    city.roads.main.forEach((road) =>
      road.line.forEach((vertex) => vertices.push(vertex))
    );
    city.roads.major.forEach((road) =>
      road.line.forEach((vertex) => vertices.push(vertex))
    );
    city.roads.minor.forEach((road) =>
      road.line.forEach((vertex) => vertices.push(vertex))
    );

    city.roads.coastline.forEach((road) =>
      road.line.forEach((vertex) => vertices.push(vertex))
    );
    city.blocks.forEach((block) =>
      block.shape.polygon.forEach((vertex) => vertices.push(vertex))
    );
    city.lots.forEach((lot) => {
      lot.shape.forEach((vertex) => vertices.push(vertex));
      vertices.push(lot.door);
      vertices.push(lot.streetNode.value);
    });
    city.parks.forEach((park) =>
      park.polygon.forEach((vertex) => vertices.push(vertex))
    );

    console.time("Centralizing city");
    const averageX =
      vertices.reduce((current, vertex) => {
        return current + (Array.isArray(vertex) ? vertex[0] : vertex.x);
      }, 0) / vertices.length;

    const averageY =
      vertices.reduce((current, vertex) => {
        return current + (Array.isArray(vertex) ? vertex[1] : vertex.y);
      }, 0) / vertices.length;

    vertices.forEach((vertex) => {
      if (Array.isArray(vertex)) {
        vertex[0] -= averageX;
        vertex[1] -= averageY;
      } else {
        vertex.x -= averageX;
        vertex.y -= averageY;
      }
    });

    city.streetGraph.translate(new Vector(-averageX, -averageY));

    globalThis.globalCityTranslation = new Vector(-averageX, -averageY);

    console.timeEnd("Centralizing city");
    console.log(`${vertices.length} points`);

    return city;
  }
}
