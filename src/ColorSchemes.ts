// bgColour: string;
// bgColourIn?: string;
// buildingColour?: string;
// buildingSideColour?: string;
// buildingStroke?: string;
// seaColour: string;
// grassColour?: string;
// minorRoadColour: string;
// minorRoadOutline?: string;
// majorRoadColour?: string;
// majorRoadOutline?: string;
// mainRoadColour?: string;
// mainRoadOutline?: string;  // Be careful, inherits majorRoadOutline, not mainRoadColour
// outlineSize?: number;      // Cascade semantics in style.ts
// minorWidth?: number;
// majorWidth?: number;
// mainWidth?: number;
// zoomBuildings?: boolean;
// buildingModels?: boolean;
//
// Scheme name startsWith 'Drawn' means scheme will use RoughJS canvas
// // Scheme name startsWith 'Heightmap' draws heightmap

export default {
  Default: {
    bgColour: "rgb(236,229,219)",
    buildingStroke: "#282828",
    seaColour: "#a9d9fe",
    grassColour: "#c5e8c5",
    minorRoadOutline: "#020202",
    minorRoadColour: "#F8F8F8",
    mainRoadOutline: "#282828",
    mainRoadColour: "#FAFA7A",
  },
  Apple: {
    bgColour: "rgb(248,245,238)",
    buildingColour: "rgb(239,236,229)",
    buildingStroke: "rgb(235,234,224)",
    seaColour: "rgb(184,224,243)",
    grassColour: "rgb(224,237,205)",
    minorRoadColour: "rgb(255,255,255)",
    minorRoadOutline: "rgb(215,208,198)",
    majorRoadColour: "rgb(252,252,224)",
    majorRoadOutline: "rgb(240,210,152)",
    mainRoadColour: "rgb(250,224,98)",
    mainRoadOutline: "rgb(238,199,132)",
    zoomBuildings: true,
    outlineSize: 2,
  },
  AppleDark: {
    bgColour: "rgb(43,45,47)",
    buildingColour: "rgb(52,54,56)",
    buildingStroke: "rgb(47,49,51)",
    seaColour: "rgb(55,68,100)",
    grassColour: "rgb(40,56,56)",
    minorRoadColour: "rgb(65,68,71)",
    minorRoadOutline: "rgb(43,45,47)",
    majorRoadColour: "rgb(78,81,84)",
    majorRoadOutline: "rgb(43,45,47)",
    mainRoadColour: "rgb(149,108,62)",
    mainRoadOutline: "rgb(51,51,51)",
    zoomBuildings: true,
    outlineSize: 1,
  },
  Assassin: {
    bgColour: "rgb(77,96,89)",
    buildingStroke: "rgb(72,91,84)",
    seaColour: "rgb(36,40,43)",
    minorRoadColour: "rgb(127,141,137)",
    mainRoadColour: "rgb(149,161,157)",
    mainRoadOutline: "rgb(149,161,157)",
  },
  "Drawn (slow)": {
    // Special canvas
    bgColour: "rgb(242,236,222)",
    seaColour: "#dbd2bd",
    minorRoadColour: "#666666",
    majorRoadColour: "#444444",
    mainRoadColour: "#222222",
    buildingStroke: "#333333",
    buildingColour: "rgb(242,236,222)",
  },
  "Drawn2 (slow)": {
    // Special canvas
    bgColour: "white",
    seaColour: "#c2c5bf",
    minorRoadColour: "#666666",
    majorRoadColour: "#444444",
    mainRoadColour: "#222222",
    buildingStroke: "#333333",
    buildingColour: "rgb(242,236,222)",
  },
  Google: {
    bgColour: "rgb(236,236,236)",
    bgColourIn: "rgb(248,249,250)",
    buildingColour: "rgb(240,240,240)",
    buildingSideColour: "rgb(200,200,200)",
    buildingStroke: "rgb(220,220,220)",
    seaColour: "rgb(166,213,249)",
    grassColour: "rgb(198,232,198)",
    minorRoadColour: "rgb(255,255,255)",
    minorRoadOutline: "rgb(193,197,214)",
    mainRoadColour: "rgb(255,242,175)",
    mainRoadOutline: "rgb(246,207,101)",
    zoomBuildings: true,
    buildingModels: true,
    outlineSize: 2,
  },
  GoogleNoZoom: {
    bgColour: "rgb(236,236,236)",
    bgColourIn: "rgb(248,249,250)",
    buildingColour: "rgb(240,240,240)",
    buildingSideColour: "rgb(200,200,200)",
    buildingStroke: "rgb(220,220,220)",
    seaColour: "rgb(166,213,249)",
    grassColour: "rgb(198,232,198)",
    minorRoadColour: "rgb(255,255,255)",
    minorRoadOutline: "rgb(193,197,214)",
    mainRoadColour: "rgb(255,242,175)",
    mainRoadOutline: "rgb(246,207,101)",
    zoomBuildings: false,
    buildingModels: true,
    outlineSize: 2,
  },
  Heightmap: {
    // Using 0 as sea level
    bgColour: "rgb(30,30,30)",
    seaColour: "rgb(20,20,20)",
    minorRoadColour: "rgb(28,28,28)",
    zoomBuildings: false,
    buildingModels: true,
  },
  Paper: {
    bgColour: "white",
    seaColour: "rgb(233,240,255)",
    grassColour: "rgb(197,232,197)",
    minorRoadColour: "white",
    minorRoadOutline: "rgb(222,223,227)",
    outlineSize: 2,
  },
  SubtleGrey: {
    bgColour: "rgb(247,247,247)",
    buildingColour: "rgb(251,251,251)",
    buildingStroke: "rgb(243,243,243)",
    seaColour: "rgb(162,162,157)",
    grassColour: "rgb(239,239,239)",
    minorRoadOutline: "white",
    minorRoadColour: "rgb(212,212,212)",
    mainRoadOutline: "rgb(208,208,208)",
    mainRoadColour: "rgb(208,208,208)",
    frameTextColour: "rgb(162,162,157)",
  },
  UltraLight: {
    bgColour: "rgb(247,247,247)",
    seaColour: "rgb(237,237,237)",
    buildingStroke: "rgb(238,238,238)",
    grassColour: "rgb(229,229,229)",
    minorRoadColour: "white",
  },
  Wy: {
    bgColour: "white",
    seaColour: "rgb(200,215,212)",
    buildingStroke: "rgb(238,238,238)",
    minorRoadOutline: "rgb(190,190,190)",
    minorRoadColour: "rgb(238,238,238)",
  },
};
