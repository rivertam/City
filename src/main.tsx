import "./style.css";
import React from "react";
import ReactDOM from "react-dom/client";
import faker from "faker";
import TensorField, { NoiseParams } from "./ts/impl/tensor_field";
import MainGUI from "./ts/ui/main_gui";
import Vector from "./ts/vector";
import ModelGenerator from "./ts/model_generator";
import { Game } from "./Game";
import { GeneratedCity, GameState, MapLine } from "./GameState";

class Generator {
  private readonly STARTING_WIDTH = 1440; // Initially zooms in if width > STARTING_WIDTH

  private tensorField: TensorField;
  private mainGui: MainGUI; // In charge of glueing everything together

  private firstGenerate = true; // Don't randomise tensor field on first generate
  private modelGenerator: ModelGenerator;

  constructor() {
    const noiseParamsPlaceholder: NoiseParams = {
      // Placeholder values for park + water noise
      globalNoise: false,
      noiseSizePark: 20,
      noiseAnglePark: 90,
      noiseSizeGlobal: 30,
      noiseAngleGlobal: 20,
    };

    this.tensorField = new TensorField(noiseParamsPlaceholder);
    this.mainGui = new MainGUI(this.tensorField);

    this.tensorField.setRecommended();
    requestAnimationFrame(() => this.update());
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

    return await this.getGeneratedCity();
  }

  update(): void {
    if (this.modelGenerator) {
      let continueUpdate = true;
      const start = performance.now();
      while (continueUpdate && performance.now() - start < 100) {
        continueUpdate = this.modelGenerator.update();
      }
    }

    this.mainGui.update();
    requestAnimationFrame(this.update.bind(this));
  }

  public async getGeneratedCity(): Promise<GeneratedCity> {
    const usedNames = new Set<string>();

    const createRiverName = (): string => {
      let name: string;
      do {
        const fish = faker.animal.fish();
        const kind = faker.random.arrayElement(["Stream", "Creek", "River"]);
        name = `${fish} ${kind}`;
      } while (usedNames.has(name));

      usedNames.add(name);
      return name;
    };

    const createRoadName = (): string => {
      let name: string;
      do {
        name = faker.address.streetName();
      } while (usedNames.has(name));

      usedNames.add(name);
      return name;
    };

    const createParkName = (): string => {
      let name: string;
      do {
        name = `${faker.name.lastName()} park`;
      } while (usedNames.has(name));

      usedNames.add(name);
      return name;
    };

    const convertLine = (poly: Array<Vector>, name: string): MapLine => {
      return {
        name,
        polygon: poly.map((vec) => [vec.x, -vec.y]),
      };
    };

    const createLotName = (): string => {
      let name: string;
      let num = 0;
      do {
        name = `${num++} ${faker.address.streetAddress()}`;
      } while (usedNames.has(name));

      return name;
    };

    const blocks = await this.mainGui.getBlocks();

    return {
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

      coastlineRoads: this.mainGui.coastline.roads.map((poly) =>
        convertLine(poly, createRoadName())
      ),
      mainRoads: this.mainGui.mainRoads.roads.map((poly) =>
        convertLine(poly, createRoadName())
      ),
      majorRoads: this.mainGui.majorRoads.roads.map((poly) =>
        convertLine(poly, createRoadName())
      ),
      minorRoads: this.mainGui.minorRoads.roads.map((poly) =>
        convertLine(poly, createRoadName())
      ),
      blocks: blocks.map((block) => ({
        shape: convertLine(block, createLotName()),
      })),
      lots: this.mainGui.buildingModels.map((building) => {
        return {
          shape: convertLine(building.lotScreen, createLotName()),
        };
      }),
    };
  }
}

window.addEventListener("contextmenu", (e) => e.preventDefault());
window.addEventListener("load", async () => {
  const generator = new Generator();

  const city = await generator.generate();
  const gameState = new GameState(city);

  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(
    <React.StrictMode>
      <Game gameState={gameState} />
    </React.StrictMode>
  );
});
window.addEventListener("scroll", (event) => {
  event.preventDefault();
});
