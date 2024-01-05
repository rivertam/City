import FieldIntegrator from "../impl/integrator";
import { WaterParams } from "../impl/water_generator";
import WaterGenerator from "../impl/water_generator";
import Vector from "../vector";
import RoadGUI from "./road_gui";
import TensorField from "../impl/tensor_field";

/**
 * Handles generation of river and coastline
 */
export default class WaterGUI extends RoadGUI {
  protected streamlines: WaterGenerator;

  constructor(
    private tensorField: TensorField,
    protected params: WaterParams,
    integrator: FieldIntegrator,
    protected worldDimensions: Vector
  ) {
    super(params, integrator, worldDimensions);
    this.streamlines = new WaterGenerator(
      this.integrator,
      this.worldDimensions,
      Object.assign({}, this.params),
      this.tensorField
    );
  }

  generateRoads(): Promise<void> {
    this.preGenerateCallback();

    this.streamlines = new WaterGenerator(
      this.integrator,
      this.worldDimensions,
      Object.assign({}, this.params),
      this.tensorField
    );

    this.streamlines.createCoast();
    this.streamlines.createRiver();

    this.postGenerateCallback();
    return new Promise<void>((resolve) => resolve());
  }

  /**
   * Secondary road runs along other side of river
   */
  get streamlinesWithSecondaryRoad(): Vector[][] {
    const withSecondary = this.streamlines.allStreamlinesSimple.slice();
    withSecondary.push(this.streamlines.riverSecondaryRoad);
    return withSecondary;
  }

  get river(): Vector[] {
    return this.streamlines.riverPolygon.map((v) => v.clone());
  }

  get secondaryRiver(): Vector[] {
    return this.streamlines.riverSecondaryRoad.map((v) => v.clone());
  }

  get coastline(): Vector[] {
    // Use unsimplified noisy streamline as coastline
    // Visual only, no road logic performed using this
    return this.streamlines.coastline.map((v) => v.clone());
  }

  get seaPolygon(): Vector[] {
    return this.streamlines.seaPolygon.map((v) => v.clone());
  }
}
