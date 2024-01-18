import * as seedrandom from "seedrandom";

export class RNG {
  private rng: seedrandom.PRNG;

  public seed: string | undefined;

  private calls = 0;

  public static readonly default = new RNG(
    new URLSearchParams(document.location.search).get("seed")
  );

  public constructor(seed: string | null) {
    this.seed = seed;
    this.rng = seedrandom(seed ?? undefined);
    console.log("using seed", seed);
  }

  public random = (): number => {
    this.calls++;
    return this.rng();
  };

  public static random(): number {
    return RNG.default.random();
  }

  public reset(): void {
    this.calls = 0;

    this.rng = seedrandom(this.seed ?? undefined);
    console.log("using seed", this.seed);
  }

  public static reset(): void {
    RNG.default.reset();
  }
}
