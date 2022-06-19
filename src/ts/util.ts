export interface RandomRange {
  min?: number;
  max: number;
}

export default class Util {
  // Refresh dat.GUI values
  static updateGui(gui: dat.GUI): void {
    if (gui.__controllers) {
      gui.__controllers.forEach((c) => c.updateDisplay());
    }
    if (gui.__folders) {
      for (const folderName in gui.__folders) {
        this.updateGui(gui.__folders[folderName]);
      }
    }
  }

  static removeAllFolders(gui: dat.GUI): void {
    if (gui.__folders) {
      for (const folderName in gui.__folders) {
        gui.removeFolder(gui.__folders[folderName]);
      }
    }
  }

  static randomRange(max: number, min = 0): number {
    return Math.random() * (max - min) + min;
  }
}
