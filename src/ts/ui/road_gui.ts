import { RNG } from "../../utils/random";
import FieldIntegrator from "../impl/integrator";
import { StreamlineParams } from "../impl/streamlines";
import StreamlineGenerator from "../impl/streamlines";
import Vector from "../vector";

export type Road = {
  points: Vector[];
  name: string;
};

/**
 * Handles creation of roads
 */
export default class RoadGUI {
  protected streamlines: StreamlineGenerator;
  private existingStreamlines: RoadGUI[] = [];
  private roadNames = new Map<Vector[], string>();

  protected preGenerateCallback: () => void = () => {};
  protected postGenerateCallback: () => void = () => {};

  constructor(
    protected rng: RNG,
    protected params: StreamlineParams,
    protected integrator: FieldIntegrator,
    protected worldDimensions: Vector,
    private nameBag: Array<string>
  ) {
    this.streamlines = new StreamlineGenerator(
      this.rng,
      this.integrator,
      this.worldDimensions.clone(),
      this.params
    );

    // Update path iterations based on window size
    this.setPathIterations();
    window.addEventListener("resize", (): void => this.setPathIterations());
  }

  get allStreamlines(): Vector[][] {
    return this.streamlines.allStreamlinesSimple.map((s) =>
      s.map((v) => v.clone())
    );
  }

  get roads(): Array<Road> {
    return this.streamlines.allStreamlinesSimple.map((streamline) => ({
      points: streamline,
      name: this.roadNames.get(streamline),
    }));
  }

  get roadPolygons(): Vector[][] {
    // For drawing not generation, probably fine to leave map
    return this.streamlines.allStreamlinesSimple.map((s) =>
      s.map((v) => v.clone())
    );
  }

  roadsEmpty(): boolean {
    return this.streamlines.allStreamlinesSimple.length === 0;
  }

  setExistingStreamlines(existingStreamlines: RoadGUI[]): void {
    this.existingStreamlines = existingStreamlines;
  }

  setPreGenerateCallback(callback: () => void) {
    this.preGenerateCallback = callback;
  }

  setPostGenerateCallback(callback: () => void) {
    this.postGenerateCallback = callback;
  }

  clearStreamlines(): void {
    this.streamlines.clearStreamlines();
  }

  async generateRoads(): Promise<void> {
    this.preGenerateCallback();

    this.streamlines = new StreamlineGenerator(
      this.rng,
      this.integrator,
      this.worldDimensions,
      Object.assign({}, this.params)
    );

    for (const s of this.existingStreamlines) {
      this.streamlines.addExistingStreamlines(s.streamlines);
    }

    await this.streamlines.createAllStreamlines();

    this.setRoadNames();

    this.postGenerateCallback();
  }

  private setRoadNames() {
    for (const streamline of this.streamlines.allStreamlinesSimple) {
      const name = this.nameBag.shift();

      if (name === undefined) {
        throw new Error("Ran out of road names");
      }

      this.roadNames.set(streamline, name);
    }
  }

  /**
   * Returns true if streamlines changes
   */
  update(): boolean {
    return this.streamlines.update();
  }

  /**
   * Sets path iterations so that a road can cover the screen
   */
  private setPathIterations(): void {
    const max = 1.5 * Math.max(window.innerWidth, window.innerHeight);
    this.params.pathIterations = max / this.params.dstep;
  }
}
