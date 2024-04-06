import * as React from "react";
import { RNG } from "./utils/random";
import { CityState } from "./state/CityState";
import { CityGenerator } from "./generation/CityGenerator";
import { wait } from "./utils/wait";

export function StartScreen({
  setCityState,
}: {
  setCityState: React.Dispatch<React.SetStateAction<CityState>>;
}) {
  const [size, setSize] = React.useState(500);
  const [shouldGenerate, setShouldGenerate] = React.useState(false);
  const hasGenerated = React.useRef(false);

  const build = async () => {
    RNG.reset();
    setShouldGenerate(false);
    hasGenerated.current = false;

    await wait(100);
    setShouldGenerate(true);
  };

  React.useEffect(() => {
    if (!shouldGenerate) {
      return;
    }

    if (hasGenerated.current) {
      console.warn(
        "City generation props changed after generation. The prop change will be ignored."
      );

      return;
    }

    hasGenerated.current = true;

    (async () => {
      const generator = new CityGenerator({ size });

      const generatedCity = await generator.generate();

      setCityState(new CityState(generatedCity));
    })();
  }, [shouldGenerate, size]);

  return (
    <div>
      <SizePicker selectedSize={size} setSelectedSize={setSize} />
      <button onClick={build}>Build</button>
    </div>
  );
}

export function SizePicker({
  selectedSize,
  setSelectedSize,
}: {
  selectedSize: number;
  setSelectedSize: React.Dispatch<React.SetStateAction<number>>;
}) {
  const sizes = [
    { label: "Small", value: 300 },
    { label: "Medium", value: 500 },
    { label: "Large", value: 800 },
    { label: "Huge", value: 1200 },
  ];

  return (
    <div>
      {sizes.map((size) => (
        <label key={size.label}>
          <input
            type="radio"
            name="size"
            value={size.value}
            className="form-check-input"
            checked={size.value === selectedSize}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedSize(size.value);
              }
            }}
          />
          {size.label}
        </label>
      ))}
    </div>
  );
}
