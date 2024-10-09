const robot = require("robotjs");
const tesseract = require("tesseract.js");
const fs = require("fs");
const { Jimp } = require("jimp");
const path = require("path");

const screenSize = robot.getScreenSize();
const captureArea = {
  x: 0,
  y: 0,
  width: screenSize.width,
  height: screenSize.height,
};

let filename = "screen.jpg";

// fs.readFile(path.join(__dirname, filename), (err, png) => {
//   if (err) return console.log(err);
//   tesseract
//     .recognize(png)
//     .then(({ data }) => {
//       console.log(data.text);
//     })
//     .catch((err) => {
//       // Handle errors
//     });
// });

// Create a new blank image, same size as Robotjs' one

(async () => {
  while (true) {
    const screenData = robot.screen.capture(
      captureArea.x,
      captureArea.y,
      captureArea.width,
      captureArea.height
    );
    let jimg = new Jimp(screenData);
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
    await jimg.write(filename);
    console.log("create");
  }
})();
