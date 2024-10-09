import * as robot from "robotjs";
import * as tesseract from "tesseract.js";
import * as fs from "fs";
import { Jimp } from "jimp";
import * as path from "path";
import * as lodash from "lodash";

const _jimp = new Jimp();
type TJimp = typeof _jimp;

const log = (...msg: any[]) => {
  console.log(...msg);
  return log;
};

const screenSize = robot.getScreenSize();
const captureArea = {
  x: 100,
  y: 100,
  // width: screenSize.width,
  // height: screenSize.height,
  width: 700,
  height: 80,
};

const _nameImage = "screen" as const;
const _ext = "png" as const;
let mix = "";

const filename = new Proxy(
  { value: `${_nameImage}.${_ext}` as const },
  {
    get(target) {
      return Reflect.get(target, "value");
    },
  }
);

console.log(filename.value);

const read = () => {
  return new Promise(async (resolve) => {
    const start = new Date();
    try {
      const img = fs.readFileSync(path.join(__dirname, "../", filename.value));
      if (img) {
        const res = await tesseract.recognize(img);
        if (res.data) {
          console.log(res.data.text);
          resolve(res.data.text);
        }
      }
    } catch (e) {
      // console.log(e);
      resolve("");
    } finally {
      log("read", `time: ${+new Date() - +start}`);
      resolve("");
    }
  });
};

// (async () => {
//   while(true) {
//     await read()
//   }
// })();

class Pixel {
  watch = false;

  private _pixelColor: [number, number, number] = [null, null, null];

  constructor(private x: number, private y: number, private appState: AppState) {
    this.run();
  }

  get screenData() {
    return this.appState.screenData;
  }

  get jimp() {
    return this.appState.jimp;
  }

  get r(): number {
    return this.screenData.image[this.index];
  }
  get g(): number {
    return this.screenData.image[this.index + 1];
  }
  get b(): number {
    return this.screenData.image[this.index + 2];
  }

  get index() {
    return this.y * this.screenData.byteWidth + this.x * this.screenData.bytesPerPixel;
  }

  get hex() {
    return this.r * 256 + this.g * 256 * 256 + this.b * 256 * 256 * 256 + 255;
  }

  get pixelColor(): Parameters<TJimp["setPixelColor"]> {
    if (this.appState.jimp.getPixelColor(this.x, this.y) !== this.hex) {
      this._pixelColor = [this.hex, this.x, this.y];
      return this._pixelColor;
    }

    return null;
  }

  async setPixelColor() {
    if (!this.pixelColor) return;
    return new Promise((resolve) => resolve(this.jimp.setPixelColor(...this.pixelColor)));
  }

  run = async () => {
    this.watch = true;
    // while (this.watch) {
    //   await new Promise((resolve) => setTimeout(() => resolve(null), 1));
    //   await this.setPixelColor();
    // }
  };
}

class AppState {
  // screenData: robot.Bitmap = null;
  jimp: TJimp = null;

  watch = false;

  matrix: Pixel[] = [];

  private _screenData: { value: robot.Bitmap } = {
    value: null,
  };

  constructor() {
    this.create();
    this.run();
    this.createMatrix();
  }

  get screenData() {
    return this._screenData.value;
  }

  get store() {
    return {
      screenData: this.screenData,
      jimp: this.jimp,
    };
  }

  private createMatrix() {
    for (let x = 0; x < this.screenData.width; x++) {
      for (let y = 0; y < this.screenData.height; y++) {
        this.matrix.push(new Pixel(x, y, this));
      }
    }
  }

  create() {
    this._screenData.value = robot.screen.capture(captureArea.x, captureArea.y, captureArea.width, captureArea.height);
    if (!this.jimp) {
      this.jimp = new Jimp(this._screenData.value);
    }
  }

  run = async () => {
    this.watch = true;
    let someChange = true;
    while (this.watch) {
      const start = new Date();
      this.create();
      // await new Promise((resolve) => {
      //   const timeout = setTimeout(() => resolve(clearTimeout(timeout)), 1);
      // });
      // this.matrix.forEach((item) => item.createPixel(this.jimp, this.screenData).setPixelColor());
      for (let item of this.matrix) {
        !someChange && (someChange = Boolean(item.pixelColor));
        item.pixelColor && (await item.setPixelColor());
      }
      someChange && (await this.jimp.write(filename.value));
      await read();
      someChange = false;
      log("create", `time: ${+new Date() - +start}`);
    }
  };
}

const appState = new AppState();

// appState.matrix.forEach((item) => item.setPixelColor());
// console.log(appState);

// (async () => {
//   while (true) {
//     const start = new Date();
//     appState.create();
//     for (var x = 0; x < appState.screenData.width; x++) {
//       for (var y = 0; y < appState.screenData.height; y++) {
//         var index = y * appState.screenData.byteWidth + x * appState.screenData.bytesPerPixel;
//         var r = appState.screenData.image[index];
//         var g = appState.screenData.image[index + 1];
//         var b = appState.screenData.image[index + 2];
//         var num = r * 256 + g * 256 * 256 + b * 256 * 256 * 256 + 255;
//         appState.jimp.setPixelColor(num, x, y);
//       }
//     }
//     await appState.jimp.write(filename.value);
//     log("create", `time: ${+new Date() - +start}`);
//   }
// })();
