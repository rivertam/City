import { Faker, en } from "@faker-js/faker";
import seedrandom from "seedrandom";

function cyrb53(str: string) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;

  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export class RNG {
  private rng: seedrandom.PRNG;

  public seed: string | undefined;

  public static readonly default = new RNG(
    new URLSearchParams(document.location.search).get("seed")
  );

  private _faker: Faker;

  public constructor(seed: string | null) {
    this.seed = seed;
    this.rng = seedrandom(seed ?? undefined);
    console.log("using seed", seed);

    this._faker = new Faker({ locale: en });

    if (seed) {
      this._faker.seed(cyrb53(seed));
    }
  }

  public random = (): number => {
    return this.rng();
  };

  public static random(): number {
    return RNG.default.random();
  }

  public reset(): void {
    this.rng = seedrandom(this.seed ?? undefined);
    console.log("using seed", this.seed);
  }

  public static reset(): void {
    RNG.default.reset();
  }

  public faker(): Faker {
    return this._faker;
  }

  public static faker(): Faker {
    return RNG.default.faker();
  }
}

export const faker = RNG.faker();
