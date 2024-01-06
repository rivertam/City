import TensorField from "../impl/tensor_field";
import Graph from "../impl/graph";
import Vector from "../vector";
import PolygonFinder from "../impl/polygon_finder";
import { PolygonParams } from "../impl/polygon_finder";

export interface BuildingModel {
  height: number;
  lotWorld: Vector[]; // In world space
  lotScreen: Vector[]; // In screen space
  roof: Vector[]; // In screen space
  sides: Vector[][]; // In screen space
}

/**
 * Pseudo 3D buildings
 */
class BuildingModels {
  private _buildingModels: BuildingModel[] = [];

  constructor(lots: Vector[][]) {
    // Lots in world space
    for (const lot of lots) {
      this._buildingModels.push({
        height: Math.random() * 20 + 20,
        lotWorld: lot,
        lotScreen: [],
        roof: [],
        sides: [],
      });
    }
    this._buildingModels.sort((a, b) => a.height - b.height);
  }

  get buildingModels(): BuildingModel[] {
    return this._buildingModels;
  }

  /**
   * Recalculated when the camera moves
   */
  setBuildingProjections(): void {
    const d = 1000 / 1;
    for (const b of this._buildingModels) {
      b.lotScreen = b.lotWorld.map((v) => v.clone());
      b.roof = b.lotScreen.map((v) =>
        this.heightVectorToScreen(v, b.height, d)
      );
      b.sides = this.getBuildingSides(b);
    }
  }

  private heightVectorToScreen(v: Vector, h: number, d: number): Vector {
    const scale = d / (d - h); // 0.1
    return v.clone().multiplyScalar(scale);
  }

  /**
   * Get sides of buildings by joining corresponding edges between the roof and ground
   */
  private getBuildingSides(b: BuildingModel): Vector[][] {
    const polygons: Vector[][] = [];
    for (let i = 0; i < b.lotScreen.length; i++) {
      const next = (i + 1) % b.lotScreen.length;
      polygons.push([
        b.lotScreen[i],
        b.lotScreen[next],
        b.roof[next],
        b.roof[i],
      ]);
    }
    return polygons;
  }
}

/**
 * Finds building lots and optionally pseudo3D buildings
 */
export default class Buildings {
  private polygonFinder: PolygonFinder;
  private allStreamlines: Vector[][] = [];
  private preGenerateCallback: () => any = () => {};
  private postGenerateCallback: () => any = () => {};
  private _models: BuildingModels = new BuildingModels([]);
  private _blocks: Vector[][] = [];

  private buildingParams: PolygonParams = {
    maxLength: 20,
    minArea: 50,
    shrinkSpacing: 4,
    chanceNoDivide: 0.05,
  };

  constructor(private tensorField: TensorField, private dstep: number) {
    this.polygonFinder = new PolygonFinder(
      [],
      this.buildingParams,
      this.tensorField
    );
  }

  get lots(): Vector[][] {
    return this.polygonFinder.polygons.map((p) => p.map((v) => v.clone()));
  }

  /**
   * Only used when creating the 3D model to 'fake' the roads
   */
  async getBlocks(): Promise<Vector[][]> {
    const g = new Graph(this.allStreamlines, this.dstep, true);
    const blockParams = Object.assign({}, this.buildingParams);
    blockParams.shrinkSpacing = blockParams.shrinkSpacing / 2;
    const polygonFinder = new PolygonFinder(
      g.nodes,
      blockParams,
      this.tensorField
    );
    polygonFinder.findPolygons();
    await polygonFinder.shrink(false);
    return polygonFinder.polygons.map((p) => p.map((v) => v.clone()));
  }

  get models(): BuildingModel[] {
    this._models.setBuildingProjections();
    return this._models.buildingModels;
  }

  setAllStreamlines(s: Vector[][]): void {
    this.allStreamlines = s;
  }

  reset(): void {
    this.polygonFinder.reset();
    this._models = new BuildingModels([]);
  }

  update(): boolean {
    return this.polygonFinder.update();
  }

  /**
   * Finds blocks, shrinks and divides them to create building lots
   */
  async generate(): Promise<void> {
    this.preGenerateCallback();
    this._models = new BuildingModels([]);
    const g = new Graph(this.allStreamlines, this.dstep, true);

    this.polygonFinder = new PolygonFinder(
      g.nodes,
      this.buildingParams,
      this.tensorField
    );
    this.polygonFinder.findPolygons();
    this.polygonFinder.shrink();
    this.polygonFinder.divide();
    this._models = new BuildingModels(this.polygonFinder.polygons);

    this.postGenerateCallback();
  }

  setPreGenerateCallback(callback: () => any): void {
    this.preGenerateCallback = callback;
  }

  setPostGenerateCallback(callback: () => any): void {
    this.postGenerateCallback = callback;
  }
}
