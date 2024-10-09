import * as robot from "robotjs";
import * as tesseract from "tesseract.js";
import * as fs from "fs";
import { Jimp } from "jimp";
import * as path from "path";

const log = (...msg: any[]) => {
  console.log(...msg);
  return log;
}

const screenSize = robot.getScreenSize();
const captureArea = {
  x: 0,
  y: 0,
  width: screenSize.width,
  height: screenSize.height,
};


const _nameImage = "screen" as const;
const _ext = 'png' as const;
let mix = '';

const filename = new Proxy({ value: `${_nameImage}.${_ext}` as const }, {
  get(target, prop, receiver) {
    const prim = Reflect.get(target, 'value');
    const value = prim[prop];
    return typeof value === 'function' ? value.bind(prim) : value;
  }
});

const read = () => {
  return new Promise(async (resolve) => {
      const start = new Date
      try {
        const img = fs.readFileSync(path.join(__dirname, '../', filename.value));
        if(img) {
          const res = await tesseract.recognize(img);
          if(res.data) {
            console.log(res.data.text);
            resolve(res.data.text)
          }
        }
      } catch(e) {
        console.log(e);
        resolve('');
      } finally {
        log("read", `time: ${+new Date - +start}`)
        resolve('')
      }
    })
}

// (async () => {
//   while(true) {
//     await read()
//   }
// })();


(async () => {
  while (true) {
    const start = new Date;
    const screenData = robot.screen.capture(captureArea.x, captureArea.y, captureArea.width, captureArea.height);
    const jimg = new Jimp(screenData);
    for (var x = 0; x < screenData.width; x++) {
      for (var y = 0; y < screenData.height; y++) {
        var index = y * screenData.byteWidth + x * screenData.bytesPerPixel;
        var r = screenData.image[index];
        var g = screenData.image[index + 1];
        var b = screenData.image[index + 2];
        var num = r * 256 + g * 256 * 256 + b * 256 * 256 * 256 + 255;
        jimg.setPixelColor(num, x, y);
      }
    }
    await jimg.write(filename.value);
    log("create", `time: ${+new Date - +start}`);
  }
})();
