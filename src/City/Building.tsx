import { ComponentProps, useState } from "react";
import { Piece } from "./Piece";
import { Unit } from "./Unit";
import * as React from "react";
import { Color } from "three";
import { Cylinder } from "@react-three/drei";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { Lot } from "../state/Lot";
import { Node } from "../generation/impl/graph";

type BuildingProps = {
  lot: Lot;
};

export const Building = observer(
  ({ lot, ...pieceProps }: ComponentProps<typeof Piece> & BuildingProps) => {
    const [displayingEntry, setDisplayingEntry] = useState(false);
    const [displayingStreetNodes, setDisplayingStreetNodes] =
      useState<Array<Node> | null>(null);

    const { height } = pieceProps;
    const [color] = useState(() => {
      const color = new Color();

      color.setHSL(Math.random(), Math.random() * 0.2 + 0.2, 0.7);

      return color;
    });

    const units = new Array<JSX.Element>();

    for (let floor = 0; floor < height / 3; floor++) {
      units.push(<Unit key={floor} />);
    }

    const entryPoint = {
      x: lot.door.x,
      y: lot.door.y,
    };

    return (
      <>
        {units}
        {displayingEntry && (
          <Cylinder
            args={[3, 3, height, 8]}
            position={[entryPoint.x, entryPoint.y, height / 2]}
            rotation={[Math.PI / 2, 0, 0]}
          />
        )}
        {displayingStreetNodes && (
          <>
            {displayingStreetNodes.map((node, index) => (
              <Cylinder
                key={index}
                args={[3, 3, height, 8]}
                position={[node.value.x, node.value.y, 5 / 2]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <meshBasicMaterial color="blue" />
              </Cylinder>
            ))}
          </>
        )}
        <Piece
          onClick={() => {
            console.log(
              "clicked an anonymous building",
              toJS(pieceProps.polygon)
            );
            console.log("entryPoint", entryPoint);
            console.log(
              "street nodes",
              lot.streetNodes.map((n) => n.value)
            );
            console.log("it's on street", lot.streetName);
            setDisplayingStreetNodes(lot.streetNodes);
            setDisplayingEntry((d) => !d);
          }}
          {...pieceProps}
          color={pieceProps.color ?? `#${color.getHexString()}`}
        />
      </>
    );
  }
);
