import { RNG } from "../../utils/random";

import TensorField from "../impl/tensor_field";
import { RK4Integrator } from "../impl/integrator";
import { StreamlineParams } from "../impl/streamlines";
import { WaterParams } from "../impl/water_generator";
import StreetGraph from "../impl/graph";
import RoadGUI from "./road_gui";
import WaterGUI from "./water_gui";
import Vector from "../vector";
import PolygonFinder from "../impl/polygon_finder";
import Buildings, { BuildingModel } from "./buildings";
import PolygonUtil from "../impl/polygon_util";

/**
 * Handles Map folder, glues together impl
 */
export default class MainGUI {
  private numBigParks = 2;
  private numSmallParks = 0;
  private clusterBigParks = false;

  private intersections: Vector[] = [];
  public bigParks: Vector[][] = [];
  public smallParks: Vector[][] = [];
  private animationSpeed = 30;

  public coastline: WaterGUI;
  public mainRoads: RoadGUI;
  public majorRoads: RoadGUI;
  public minorRoads: RoadGUI;
  public buildings: Buildings;

  // Params
  private coastlineParams: WaterParams;
  private mainParams: StreamlineParams;
  private majorParams: StreamlineParams;
  private minorParams: StreamlineParams = {
    dsep: 20,
    dtest: 15,
    dstep: 1,
    dlookahead: 40,
    dcirclejoin: 5,
    joinangle: 0.1, // approx 30deg
    pathIterations: 1000,
    seedTries: 300,
    simplifyTolerance: 0.5,
    collideEarly: 0,
  };

  constructor(private rng: RNG, private tensorField: TensorField) {
    this.coastlineParams = Object.assign(
      {
        coastNoise: {
          noiseEnabled: true,
          noiseSize: 30,
          noiseAngle: 20,
        },
        riverNoise: {
          noiseEnabled: true,
          noiseSize: 30,
          noiseAngle: 20,
        },
        riverBankSize: 10,
        riverSize: 30,
      },
      this.minorParams
    );
    this.coastlineParams.pathIterations = 10000;
    this.coastlineParams.simplifyTolerance = 10;

    this.majorParams = Object.assign({}, this.minorParams);
    this.majorParams.dsep = 100;
    this.majorParams.dtest = 30;
    this.majorParams.dlookahead = 200;
    this.majorParams.collideEarly = 0;

    this.mainParams = Object.assign({}, this.minorParams);
    this.mainParams.dsep = 400;
    this.mainParams.dtest = 200;
    this.mainParams.dlookahead = 500;
    this.mainParams.collideEarly = 0;

    const integrator = new RK4Integrator(tensorField, this.minorParams);

    this.coastline = new WaterGUI(
      this.rng,
      tensorField,
      this.coastlineParams,
      integrator,
      this.worldDimensions.clone()
    );

    const roadNames = new Set<string>();

    while (roadNames.size < 1000) {
      roadNames.add(this.rng.faker().location.street());
    }

    const roadNamesArray = Array.from(roadNames);

    this.mainRoads = new RoadGUI(
      this.rng,
      this.mainParams,
      integrator,
      this.worldDimensions.clone(),
      roadNamesArray.slice(0, roadNamesArray.length / 3)
    );

    this.majorRoads = new RoadGUI(
      this.rng,
      this.majorParams,
      integrator,
      this.worldDimensions.clone(),
      roadNamesArray.slice(
        roadNamesArray.length / 3,
        (roadNamesArray.length / 3) * 2
      )
    );

    this.minorRoads = new RoadGUI(
      this.rng,
      this.minorParams,
      integrator,
      this.worldDimensions.clone(),
      roadNamesArray.slice((roadNamesArray.length / 3) * 2)
    );

    this.buildings = new Buildings(
      this.rng,
      tensorField,
      this.minorParams.dstep
    );
    this.buildings.setPreGenerateCallback(() => {
      this.buildings.setLotBoundaryGraph(this.getLotBoundaryGraph());
      this.buildings.setStreetGraph(this.getStreetGraph());
    });

    this.minorRoads.setExistingStreamlines([
      this.coastline,
      this.mainRoads,
      this.majorRoads,
    ]);
    this.majorRoads.setExistingStreamlines([this.coastline, this.mainRoads]);
    this.mainRoads.setExistingStreamlines([this.coastline]);

    this.coastline.setPreGenerateCallback(() => {
      this.mainRoads.clearStreamlines();
      this.majorRoads.clearStreamlines();
      this.minorRoads.clearStreamlines();
      this.bigParks = [];
      this.smallParks = [];
      this.buildings.reset();
      tensorField.parks = [];
      tensorField.sea = [];
      tensorField.river = [];
    });

    this.mainRoads.setPreGenerateCallback(() => {
      this.majorRoads.clearStreamlines();
      this.minorRoads.clearStreamlines();
      this.bigParks = [];
      this.smallParks = [];
      this.buildings.reset();
      tensorField.parks = [];
      tensorField.ignoreRiver = true;
    });

    this.mainRoads.setPostGenerateCallback(() => {
      tensorField.ignoreRiver = false;
    });

    this.majorRoads.setPreGenerateCallback(() => {
      this.minorRoads.clearStreamlines();
      this.bigParks = [];
      this.smallParks = [];
      this.buildings.reset();
      tensorField.parks = [];
      tensorField.ignoreRiver = true;
    });

    this.majorRoads.setPostGenerateCallback(() => {
      tensorField.ignoreRiver = false;
      this.addParks();
    });

    this.minorRoads.setPreGenerateCallback(() => {
      this.buildings.reset();
      this.smallParks = [];
      tensorField.parks = this.bigParks;
    });

    this.minorRoads.setPostGenerateCallback(() => {
      this.addParks();
    });
  }

  addParks(): void {
    const graph = this.createStreetGraph();
    this.intersections = graph.intersections;

    const polygonFinder = new PolygonFinder(
      this.rng,
      graph.nodes,
      {
        maxLength: 20,
        minArea: 80,
        shrinkSpacing: 4,
        chanceNoDivide: 1,
      },
      this.tensorField
    );
    polygonFinder.findPolygons();
    const polygons = polygonFinder.polygons.map(({ polygon }) => polygon);

    if (this.minorRoads.allStreamlines.length === 0) {
      // Big parks
      this.bigParks = [];
      this.smallParks = [];
      if (polygons.length > this.numBigParks) {
        if (this.clusterBigParks) {
          // Group in adjacent polygons
          const parkIndex = Math.floor(
            this.rng.random() * (polygons.length - this.numBigParks)
          );
          for (let i = parkIndex; i < parkIndex + this.numBigParks; i++) {
            this.bigParks.push(polygons[i]);
          }
        } else {
          for (let i = 0; i < this.numBigParks; i++) {
            const parkIndex = Math.floor(this.rng.random() * polygons.length);
            this.bigParks.push(polygons[parkIndex]);
          }
        }
      } else {
        this.bigParks.push(...polygons);
      }
    } else {
      // Small parks
      this.smallParks = [];
      for (let i = 0; i < this.numSmallParks; i++) {
        const parkIndex = Math.floor(this.rng.random() * polygons.length);
        this.smallParks.push(polygons[parkIndex]);
      }
    }

    this.tensorField.parks = [];
    this.tensorField.parks.push(...this.bigParks);
    this.tensorField.parks.push(...this.smallParks);
  }

  async generateEverything() {
    this.coastline.generateRoads();
    await this.mainRoads.generateRoads();
    await this.majorRoads.generateRoads();
    await this.minorRoads.generateRoads();
    this.buildings.generate();
  }

  public get worldDimensions(): Vector {
    return this.tensorField.worldDimensions;
  }

  public get parks() {
    return [
      ...this.bigParks.map((p) => p.map((v) => v.clone())),
      ...this.smallParks.map((p) => p.map((v) => v.clone())),
    ];
  }

  roadsEmpty(): boolean {
    return (
      this.majorRoads.roadsEmpty() &&
      this.minorRoads.roadsEmpty() &&
      this.mainRoads.roadsEmpty() &&
      this.coastline.roadsEmpty()
    );
  }

  // OBJ Export methods

  public get seaPolygon(): Vector[] {
    return this.coastline.seaPolygon;
  }

  public get riverPolygon(): Vector[] {
    return this.coastline.river;
  }

  public get secondaryRiverPolygon(): Vector[] {
    return this.coastline.river;
  }

  public get buildingModels(): BuildingModel[] {
    return this.buildings.models;
  }

  public getBlocks(): Vector[][] {
    return this.buildings.getBlocks();
  }

  /**
   * Shared street graph used to place buildings at the end of generation
   */
  private streetGraph: StreetGraph | null = null;

  public getStreetGraph(): StreetGraph {
    if (!this.streetGraph) {
      this.streetGraph = this.createStreetGraph();
    }

    return this.streetGraph;
  }

  public createStreetGraph(): StreetGraph {
    return new StreetGraph(
      this.majorRoads.roads
        .concat(this.mainRoads.roads)
        .concat(this.minorRoads.roads)
        .concat(this.coastline.roads),
      this.minorParams.dstep
    );
  }

  private lotBoundaryGraph: StreetGraph | null = null;

  public getLotBoundaryGraph(): StreetGraph {
    if (!this.lotBoundaryGraph) {
      const allStreamlines = [];
      allStreamlines.push(...this.mainRoads.roads);
      allStreamlines.push(...this.majorRoads.roads);
      allStreamlines.push(...this.minorRoads.roads);
      allStreamlines.push(...this.coastline.namedStreamlines);

      this.lotBoundaryGraph = new StreetGraph(
        allStreamlines,
        this.minorParams.dstep
      );
    }

    return this.lotBoundaryGraph;
  }

  public get minorRoadPolygons(): Vector[][] {
    return this.minorRoads.roadPolygons.map((r) =>
      PolygonUtil.resizeGeometry(r, 1, false)
    );
  }

  public get majorRoadPolygons(): Vector[][] {
    return this.majorRoads.roadPolygons
      .concat([this.coastline.secondaryRiver])
      .map((r) => PolygonUtil.resizeGeometry(r, 2, false));
  }

  public get mainRoadPolygons(): Vector[][] {
    return this.mainRoads.roadPolygons
      .concat(this.coastline.roadPolygons)
      .map((r) => PolygonUtil.resizeGeometry(r, 2.5, false));
  }

  public get coastlinePolygon(): Vector[] {
    return PolygonUtil.resizeGeometry(this.coastline.coastline, 15, false);
  }
}
