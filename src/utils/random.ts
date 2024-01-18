import * as seedrandom from "seedrandom";

export class RNG {
  private rng: seedrandom.PRNG;

  public seed: string | undefined;

  public static readonly default = new RNG(
    new URLSearchParams(document.location.search).get("seed")
  );

  public constructor(seed: string | null) {
    this.rng = seedrandom(seed ?? undefined);
  }

  public random(): number {
    return this.rng();
  }

  public static random(): number {
    return RNG.default.random();
  }
}
