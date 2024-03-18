import * as React from "react";
import { observer } from "mobx-react-lite";
import { DisplayState } from "../../state/DisplayState";
import { windows } from "../../utils/windows";
import { BlockVis } from "./BlockVis";

export const FocusedPath = observer(function FocusedPath() {
  const displayState = DisplayState.use();
  const focusedPath = displayState.focusedPath;

  return (
    <group position={[0, 0, 8]}>
      {focusedPath &&
        windows(2, focusedPath.nodes).map(([nodeA, nodeB], blockIndex) => {
          return (
            <BlockVis key={blockIndex} from={nodeA.node} to={nodeB.node} />
          );
        })}
    </group>
  );
});
