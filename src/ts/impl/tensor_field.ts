import * as log from "loglevel";
// import * as noise from 'noisejs';
import * as SimplexNoise from "simplex-noise";
import Tensor from "./tensor";
import Vector from "../vector";
import { Grid, Radial, BasisField } from "./basis_field";
import PolygonUtil from "./polygon_util";
import DomainController from "../ui/domain_controller";
import Util from "../util";

export interface NoiseParams {
  globalNoise: boolean;
  noiseSizePark: number;
  noiseAnglePark: number; // Degrees
  noiseSizeGlobal: number;
  noiseAngleGlobal: number;
}

/**
 * Combines basis fields
 * Noise added when sampling a point in a park
 */
export default class TensorField {
  private TENSOR_SPAWN_SCALE = 0.7; // How much to shrink worldDimensions to find spawn point
  private domainController = DomainController.getInstance();

  private basisFields: BasisField[] = [];
  private noise: SimplexNoise;

  public parks: Vector[][] = [];
  public sea: Vector[] = [];
  public river: Vector[] = [];
  public ignoreRiver = false;

  public smooth = false;

  constructor(public noiseParams: NoiseParams) {
    this.noise = new SimplexNoise();
  }

  /**
   * Used when integrating coastline and river
   */
  enableGlobalNoise(angle: number, size: number): void {
    this.noiseParams.globalNoise = true;
    this.noiseParams.noiseAngleGlobal = angle;
    this.noiseParams.noiseSizeGlobal = size;
  }

  disableGlobalNoise(): void {
    this.noiseParams.globalNoise = false;
  }

  addGrid(centre: Vector, size: number, decay: number, theta: number): void {
    const grid = new Grid(centre, size, decay, theta);
    this.addField(grid);
  }

  addRadial(centre: Vector, size: number, decay: number): void {
    const radial = new Radial(centre, size, decay);
    this.addField(radial);
  }

  protected addField(field: BasisField): void {
    this.basisFields.push(field);
  }

  protected removeField(field: BasisField): void {
    const index = this.basisFields.indexOf(field);
    if (index > -1) {
      this.basisFields.splice(index, 1);
    }
  }

  reset(): void {
    this.basisFields = [];
    this.parks = [];
    this.sea = [];
    this.river = [];
  }

  getCentrePoints(): Vector[] {
    return this.basisFields.map((field) => field.centre);
  }

  getBasisFields(): BasisField[] {
    return this.basisFields;
  }

  samplePoint(point: Vector): Tensor {
    if (!this.onLand(point)) {
      // Degenerate point
      return Tensor.zero;
    }

    // Default field is a grid
    if (this.basisFields.length === 0) {
      return new Tensor(1, [0, 0]);
    }

    const tensorAcc = Tensor.zero;
    this.basisFields.forEach((field) =>
      tensorAcc.add(field.getWeightedTensor(point, this.smooth), this.smooth)
    );

    // Add rotational noise for parks - range -pi/2 to pi/2
    if (this.parks.some((p) => PolygonUtil.insidePolygon(point, p))) {
      // TODO optimise insidePolygon e.g. distance
      tensorAcc.rotate(
        this.getRotationalNoise(
          point,
          this.noiseParams.noiseSizePark,
          this.noiseParams.noiseAnglePark
        )
      );
    }

    if (this.noiseParams.globalNoise) {
      tensorAcc.rotate(
        this.getRotationalNoise(
          point,
          this.noiseParams.noiseSizeGlobal,
          this.noiseParams.noiseAngleGlobal
        )
      );
    }

    return tensorAcc;
  }

  /**
   * Noise Angle is in degrees
   */
  getRotationalNoise(
    point: Vector,
    noiseSize: number,
    noiseAngle: number
  ): number {
    return (
      (this.noise.noise2D(point.x / noiseSize, point.y / noiseSize) *
        noiseAngle *
        Math.PI) /
      180
    );
  }

  onLand(point: Vector): boolean {
    const inSea = PolygonUtil.insidePolygon(point, this.sea);
    if (this.ignoreRiver) {
      return !inSea;
    }

    return !inSea && !PolygonUtil.insidePolygon(point, this.river);
  }

  inParks(point: Vector): boolean {
    for (const p of this.parks) {
      if (PolygonUtil.insidePolygon(point, p)) return true;
    }
    return false;
  }

  /**
   * 4 Grids, one radial
   */
  setRecommended(): void {
    this.reset();
    const size = this.domainController.worldDimensions.multiplyScalar(
      this.TENSOR_SPAWN_SCALE
    );
    const newOrigin = this.domainController.worldDimensions.multiplyScalar(
      (1 - this.TENSOR_SPAWN_SCALE) / 2
    );
    this.addGridAtLocation(newOrigin);
    this.addGridAtLocation(newOrigin.clone().add(size));
    this.addGridAtLocation(newOrigin.clone().add(new Vector(size.x, 0)));
    this.addGridAtLocation(newOrigin.clone().add(new Vector(0, size.y)));
    this.addRadialRandom();
  }

  addRadialRandom(): void {
    const width = this.domainController.worldDimensions.x;
    this.addRadial(
      this.randomLocation(),
      Util.randomRange(width / 10, width / 5), // Size
      Util.randomRange(50)
    ); // Decay
  }

  addGridRandom(): void {
    this.addGridAtLocation(this.randomLocation());
  }

  private addGridAtLocation(location: Vector): void {
    const width = this.domainController.worldDimensions.x;
    this.addGrid(
      location,
      Util.randomRange(width / 4, width), // Size
      Util.randomRange(50), // Decay
      Util.randomRange(Math.PI / 2)
    );
  }

  /**
   * World-space random location for tensor field spawn
   * Sampled from middle of screen (shrunk rectangle)
   */
  private randomLocation(): Vector {
    const size = this.domainController.worldDimensions.multiplyScalar(
      this.TENSOR_SPAWN_SCALE
    );
    const location = new Vector(Math.random(), Math.random()).multiply(size);
    const newOrigin = this.domainController.worldDimensions.multiplyScalar(
      (1 - this.TENSOR_SPAWN_SCALE) / 2
    );
    return location.add(newOrigin);
  }
}
