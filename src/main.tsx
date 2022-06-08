import "./style.css";
import React from "react";
import ReactDOM from "react-dom/client";
import faker from "faker";
import * as log from "loglevel";
import * as dat from "dat.gui";
import TensorFieldGUI from "./ts/ui/tensor_field_gui";
import { NoiseParams } from "./ts/impl/tensor_field";
import MainGUI from "./ts/ui/main_gui";
import Util from "./ts/util";
import DragController from "./ts/ui/drag_controller";
import DomainController from "./ts/ui/domain_controller";
import Style, { NoStyle } from "./ts/ui/style";
import { ColourScheme, DefaultStyle, RoughStyle } from "./ts/ui/style";
import ColourSchemes from "./ColorSchemes";
import Vector from "./ts/vector";
import { SVG } from "@svgdotjs/svg.js";
import ModelGenerator from "./ts/model_generator";
import { saveAs } from "file-saver";
import { Game } from "./Game";
import { GeneratedCity, GameState, MapLine } from "./GameState";

class Generator {
  private readonly STARTING_WIDTH = 1440; // Initially zooms in if width > STARTING_WIDTH

  // UI
  private gui: dat.GUI = new dat.GUI({ width: 300 });
  private tensorFolder: dat.GUI;
  private roadsFolder: dat.GUI;
  private styleFolder: dat.GUI;
  private optionsFolder: dat.GUI;
  private downloadsFolder: dat.GUI;

  private domainController = DomainController.getInstance();
  private dragController = new DragController(this.gui);
  private tensorField: TensorFieldGUI;
  private mainGui: MainGUI; // In charge of glueing everything together

  // Options
  private imageScale = 3; // Multiplier for res of downloaded image
  public highDPI = false; // Increases resolution for hiDPI displays

  // Style options
  private colourScheme: string = "Default"; // See colour_schemes.json
  private zoomBuildings: boolean = false; // Show buildings only when zoomed in?
  private buildingModels: boolean = false; // Draw pseudo-3D buildings?
  private showFrame: boolean = false;

  // Force redraw of roads when switching from tensor vis to map vis
  private previousFrameDrawTensor = true;

  // 3D camera position
  private cameraX = 0;
  private cameraY = 0;

  private firstGenerate = true; // Don't randomise tensor field on first generate
  private modelGenerator: ModelGenerator;

  constructor() {
    // GUI Setup
    const zoomController = this.gui.add(this.domainController, "zoom");
    this.domainController.setZoomUpdate(() => zoomController.updateDisplay());
    this.gui.add(this, "generate");

    this.tensorFolder = this.gui.addFolder("Tensor Field");
    this.roadsFolder = this.gui.addFolder("Map");
    this.styleFolder = this.gui.addFolder("Style");
    this.optionsFolder = this.gui.addFolder("Options");
    this.downloadsFolder = this.gui.addFolder("Download");

    // Make sure we're not too zoomed out for large resolutions
    const screenWidth = this.domainController.screenDimensions.x;
    if (screenWidth > this.STARTING_WIDTH) {
      this.domainController.zoom = screenWidth / this.STARTING_WIDTH;
    }

    // Style setup
    this.styleFolder
      .add(this, "colourScheme", Object.keys(ColourSchemes))
      .onChange((val: string) => this.changeColourScheme(val));

    this.styleFolder.add(this, "zoomBuildings").onChange((val: boolean) => {
      // Force redraw
      this.previousFrameDrawTensor = true;
    });

    this.styleFolder.add(this, "buildingModels").onChange((val: boolean) => {
      // Force redraw
      this.previousFrameDrawTensor = true;
    });

    this.styleFolder.add(this, "showFrame").onChange((val: boolean) => {
      this.previousFrameDrawTensor = true;
    });

    this.styleFolder.add(this.domainController, "orthographic");
    this.styleFolder
      .add(this, "cameraX", -15, 15)
      .step(1)
      .onChange(() => this.setCameraDirection());
    this.styleFolder
      .add(this, "cameraY", -15, 15)
      .step(1)
      .onChange(() => this.setCameraDirection());

    const noiseParamsPlaceholder: NoiseParams = {
      // Placeholder values for park + water noise
      globalNoise: false,
      noiseSizePark: 20,
      noiseAnglePark: 90,
      noiseSizeGlobal: 30,
      noiseAngleGlobal: 20,
    };

    this.tensorField = new TensorFieldGUI(
      this.tensorFolder,
      this.dragController,
      true,
      noiseParamsPlaceholder
    );
    this.mainGui = new MainGUI(this.roadsFolder, this.tensorField, () =>
      this.tensorFolder.close()
    );

    this.optionsFolder.add(this.tensorField, "drawCentre");

    this.downloadsFolder.add(this, "imageScale", 1, 5).step(1);
    this.downloadsFolder.add({ PNG: () => this.downloadPng() }, "PNG"); // This allows custom naming of button
    this.downloadsFolder.add({ SVG: () => this.downloadSVG() }, "SVG");
    this.downloadsFolder.add({ STL: () => this.downloadSTL() }, "STL");
    this.downloadsFolder.add(
      { Heightmap: () => this.downloadHeightmap() },
      "Heightmap"
    );

    this.changeColourScheme(this.colourScheme);
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

  /**
   * @param {string} scheme Matches a scheme name in colour_schemes.json
   */
  changeColourScheme(scheme: string): void {
    const colourScheme: ColourScheme = ColourSchemes[scheme];
    this.zoomBuildings = colourScheme.zoomBuildings;
    this.buildingModels = colourScheme.buildingModels;
    Util.updateGui(this.styleFolder);
  }

  /**
   * Change camera position for pseudo3D buildings
   */
  setCameraDirection(): void {
    this.domainController.cameraDirection = new Vector(
      this.cameraX / 10,
      this.cameraY / 10
    );
  }

  downloadSTL(): void {
    // All in screen space
    const extendScreenX =
      this.domainController.screenDimensions.x *
      ((Util.DRAW_INFLATE_AMOUNT - 1) / 2);
    const extendScreenY =
      this.domainController.screenDimensions.y *
      ((Util.DRAW_INFLATE_AMOUNT - 1) / 2);
    const ground: Vector[] = [
      new Vector(-extendScreenX, -extendScreenY),
      new Vector(
        -extendScreenX,
        this.domainController.screenDimensions.y + extendScreenY
      ),
      new Vector(
        this.domainController.screenDimensions.x + extendScreenX,
        this.domainController.screenDimensions.y + extendScreenY
      ),
      new Vector(
        this.domainController.screenDimensions.x + extendScreenX,
        -extendScreenY
      ),
    ];

    this.mainGui.getBlocks().then((blocks) => {
      this.modelGenerator = new ModelGenerator(
        ground,
        this.mainGui.seaPolygon,
        this.mainGui.coastlinePolygon,
        this.mainGui.riverPolygon,
        this.mainGui.mainRoadPolygons,
        this.mainGui.majorRoadPolygons,
        this.mainGui.minorRoadPolygons,
        this.mainGui.buildingModels,
        blocks
      );

      this.modelGenerator
        .getSTL()
        .then((blob) => this.downloadFile("model.zip", blob));
    });
  }

  private downloadFile(filename: string, file: any): void {
    saveAs(file, filename);
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

// Add log to window so we can use log.setlevel from the console
(window as any).log = log;
window.addEventListener("contextmenu", (e) => e.preventDefault());
window.addEventListener("load", async (): void => {
  const generator = new Generator();

  const city = await generator.generate();

  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(
    <React.StrictMode>
      <Game city={city} />
    </React.StrictMode>
  );
});
window.addEventListener("scroll", (event) => {
  event.preventDefault();
});
