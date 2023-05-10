import Vector from "../vector";

/**
 * Singleton
 * Controls panning and zooming
 */
export default class DomainController {
  private static instance: DomainController;

  // Screen-space width and height
  private _screenDimensions = Vector.zeroVector();

  private constructor() {
    this.setScreenDimensions();
  }

  private setScreenDimensions(): void {
    this._screenDimensions.setX(300);
    this._screenDimensions.setY(300);
  }

  public static getInstance(): DomainController {
    if (!DomainController.instance) {
      DomainController.instance = new DomainController();
    }
    return DomainController.instance;
  }

  get screenDimensions(): Vector {
    return this._screenDimensions.clone();
  }

  get worldDimensions(): Vector {
    return this.screenDimensions;
  }

  set screenDimensions(v: Vector) {
    this._screenDimensions.copy(v);
  }

  /**
   * Edits vector
   */
  zoomToWorld(v: Vector): Vector {
    return v.clone();
  }

  /**
   * Edits vector
   */
  zoomToScreen(v: Vector): Vector {
    return v.clone();
  }

  /**
   * Edits vector
   */
  screenToWorld(v: Vector): Vector {
    return v.clone();
  }

  /**
   * Edits vector
   */
  worldToScreen(v: Vector): Vector {
    return v.clone();
  }
}
