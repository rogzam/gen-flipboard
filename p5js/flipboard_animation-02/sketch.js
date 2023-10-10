let capture;

let recalculationCounter = 0;
let recalculationInterval = 14;

let gridSizeChangeThreshold = 5;

let rawWidth, rawHeight;
let minDimension = null;
let cropXStart, cropYStart;

let awSize = 800;
let paused = true;

let showWebcam = false;

let gridSize = 34;
let gridWidth;
let gridHeight;
let padding = 1.5;
let cubeOpacity = 255;
let camScale = 5;

let cubes = [];

let video;
let poseNet;
let poses = [];

class RotatingCube {
  constructor(x, y, sideLength, depth) {
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.delay = 1;
    this.rotationSpeed = 16; // Matched to second code snippet
    this.targetAngle = 0;
    this.sideLength = sideLength;
    this.halfLength = sideLength / 2;

    this.depth = depth;
    this.halfDepth = depth / 2;
    this.cooldown = 0;
    this.cooldownTime = 30;
    this.lastGray = 0;
  }

  isRed() {
    return this.angle % 360 === 180;
  }

  draw() {
    push();
    translate(this.x, this.y, -this.halfDepth);

    rotateX(this.angle);
    this.drawCube();
    pop();

    if (millis() > this.delay) {
      // Rotate towards target angle
      if (abs(this.targetAngle - this.angle) > this.rotationSpeed) {
        if (this.targetAngle > this.angle) {
          this.angle += this.rotationSpeed;
        } else {
          this.angle -= this.rotationSpeed;
        }
      } else {
        this.angle = this.targetAngle;
      }
    } else if (this.angle === this.targetAngle) {
      this.delay = 0;
    }

    if (this.cooldown > 0) {
      this.cooldown--;
    }
  }

  drawCube() {
    beginShape(QUADS);

    noStroke();
    //stroke(105);

    fill(195, cubeOpacity); //1 Darkest
    vertex(-this.halfLength, -this.halfLength, this.halfDepth);
    vertex(this.halfLength, -this.halfLength, this.halfDepth);
    vertex(this.halfLength, this.halfLength, this.halfDepth);
    vertex(-this.halfLength, this.halfLength, this.halfDepth);

    fill(215, cubeOpacity); // 2
    vertex(-this.halfLength, this.halfLength, -this.halfDepth);
    vertex(this.halfLength, this.halfLength, -this.halfDepth);
    vertex(this.halfLength, this.halfLength, this.halfDepth);
    vertex(-this.halfLength, this.halfLength, this.halfDepth);

    fill(235, cubeOpacity); // 3
    vertex(-this.halfLength, -this.halfLength, -this.halfDepth);
    vertex(this.halfLength, -this.halfLength, -this.halfDepth);
    vertex(this.halfLength, this.halfLength, -this.halfDepth);
    vertex(-this.halfLength, this.halfLength, -this.halfDepth);

    fill(255, cubeOpacity); // Ligther
    vertex(-this.halfLength, -this.halfLength, -this.halfDepth);
    vertex(this.halfLength, -this.halfLength, -this.halfDepth);
    vertex(this.halfLength, -this.halfLength, this.halfDepth);
    vertex(-this.halfLength, -this.halfLength, this.halfDepth);

    endShape();
  }

  contains(mx, my) {
    return (
      mx > this.x - this.halfLength + width / 2 &&
      mx < this.x + this.halfLength + width / 2 &&
      my > this.y - this.halfLength + height / 2 &&
      my < this.y + this.halfLength + height / 2
    );
  }
  setAngleFromGrayscale(gray) {
    let angle;
    if (gray < 64) {
      angle = 0;
    } else if (gray < 128) {
      angle = 90;
    } else if (gray < 192) {
      angle = 180;
    } else {
      angle = 270;
    }

    if (
      (this.lastGray < 64 && gray >= 64) ||
      (this.lastGray < 128 && gray >= 128) ||
      (this.lastGray < 192 && gray >= 192) ||
      (this.lastGray >= 64 && gray < 64) ||
      (this.lastGray >= 128 && gray < 128) ||
      (this.lastGray >= 192 && gray < 192)
    ) {
      this.targetAngle = angle;
    }

    this.lastGray = gray;
  }
}

function modelReady() {
  //console.log("Model is ready");
}

function setup() {
  createCanvas(awSize, awSize, WEBGL);
  angleMode(DEGREES);
  ortho();

  capture = createCapture(VIDEO, onCaptureReady);
  capture.hide();

  video = capture;
  poseNet = ml5.poseNet(video, modelReady);
  poseNet.on("pose", function (results) {
    poses = results;
  });
  video.hide();

  gridWidth = (width - padding * (gridSize + 1)) / gridSize;
  gridHeight = (height - padding * (gridSize + 1)) / gridSize;

  initializeCubes();
}

function draw() {
  if (!paused) {
    if (minDimension === null) {
      return;
    }
    background(0,0,0,0);

    let croppedImage;

    if (rawWidth && rawHeight) {
      croppedImage = capture.get(
        cropXStart,
        cropYStart,
        minDimension,
        minDimension
      );
      croppedImage.resize(awSize, awSize);
      croppedImage.filter(GRAY);
    }

    capture.loadPixels();

    for (let i = 0; i < cubes.length; i++) {
      let cube = cubes[i];

      let xStart = map(
        cube.x - cube.halfLength,
        -width / 2,
        width / 2,
        cropXStart,
        cropXStart + minDimension
      );

      let xEnd = map(
        cube.x + cube.halfLength,
        -width / 2,
        width / 2,
        cropXStart,
        cropXStart + minDimension
      );

      let yStart = map(
        cube.y - cube.halfLength,
        -height / 2,
        height / 2,
        cropYStart,
        cropYStart + minDimension
      );

      let yEnd = map(
        cube.y + cube.halfLength,
        -height / 2,
        height / 2,
        cropYStart,
        cropYStart + minDimension
      );

      let rSum = 0,
        gSum = 0,
        bSum = 0,
        count = 0;

      for (let x = floor(xStart); x <= floor(xEnd) && x < capture.width; x++) {
        for (
          let y = floor(yStart);
          y <= floor(yEnd) && y < capture.height;
          y++
        ) {
          let reversedX = capture.width - x - 1;
          let index = 4 * (reversedX + capture.width * y);
          let rPixel = capture.pixels[index];
          let gPixel = capture.pixels[index + 1];
          let bPixel = capture.pixels[index + 2];
          if (isNaN(rPixel) || isNaN(gPixel) || isNaN(bPixel)) {
            console.log(`x: ${x}`);
            console.log(`y: ${y}`);
            console.log(`reversedX: ${reversedX}`);
            console.log(`index: ${index}`);
            console.log(`rPixel: ${rPixel}`);
            console.log(`gPixel: ${gPixel}`);
            console.log(`bPixel: ${bPixel}`);
          }
          rSum += rPixel;
          gSum += gPixel;
          bSum += bPixel;
          count++;
        }
      }

      let r = rSum / count;
      let g = gSum / count;
      let b = bSum / count;

      let gray = (r + g + b) / 3;

      cube.setAngleFromGrayscale(gray);

      cube.draw();
    }

    if (showWebcam && croppedImage) {
      push();
      translate(0, 0, 2);
      scale(-1, 1); // Flip the x-axis
      image(
        croppedImage,
        -awSize / 2,
        -awSize / 2,
        awSize / camScale,
        awSize / camScale
      );
      pop();
    }
    drawKeypoints();
  } else {
    // Render the "- click to start -" message
    background(0,0,0,0); // Clear background
    fill(255); // White color
    textAlign(CENTER, CENTER);
    textFont(myFont);
    textSize(16); // Adjust as necessary
    text("- click to start -", 0, 0); // Center of the canvas because of WEBGL mode
  }
}

function onCaptureReady() {
  rawWidth = capture.width;
  rawHeight = capture.height;
  minDimension = Math.min(rawWidth, rawHeight);
  cropXStart = (rawWidth - minDimension) / 2;
  cropYStart = (rawHeight - minDimension) / 2;
}

function preload() {
  myFont = loadFont("consolas.ttf");
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initializeCubes();
}
function initializeCubes() {
  let lastCubesData = new Map();
  for (let cube of cubes) {
    let data = {
      lastGray: cube.lastGray,
      targetAngle: cube.targetAngle,
      angle: cube.angle,
    };
    lastCubesData.set(`${cube.x},${cube.y}`, data);
  }

  cubes = [];
  let totalPadding = (gridSize + 1) * padding;
  let cubeSize = (width - totalPadding) / gridSize;

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      let cubeX = map(
        i,
        0,
        gridSize - 1,
        -width / 2 + cubeSize / 2,
        width / 2 - cubeSize / 2
      );
      let cubeY = map(
        j,
        0,
        gridSize - 1,
        -height / 2 + cubeSize / 2,
        height / 2 - cubeSize / 2
      );
      let cube = new RotatingCube(cubeX, cubeY, cubeSize, cubeSize);

      // Restore the last grayscale and angle if available
      if (lastCubesData.has(`${cube.x},${cube.y}`)) {
        let data = lastCubesData.get(`${cube.x},${cube.y}`);
        cube.lastGray = data.lastGray;
        cube.targetAngle = data.targetAngle;
        cube.angle = data.angle;
      }

      cubes.push(cube);
    }
  }
}

function mouseClicked() {
  paused = !paused;
}

function drawKeypoints() {
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i].pose;
    if (pose) {
      let leftEye = pose.keypoints.find((k) => k.part === "leftEye");
      let rightEye = pose.keypoints.find((k) => k.part === "rightEye");

      if (leftEye && rightEye && leftEye.position && rightEye.position) {
        let scaleFactor = awSize / minDimension;
        let adjustment = awSize / 2; // Adjustment due to centering
        let leftEyeX =
          (awSize - leftEye.position.x) * scaleFactor - awSize / 2 - adjustment;
        let leftEyeY = leftEye.position.y * scaleFactor - awSize / 2;
        let rightEyeX =
          (awSize - rightEye.position.x) * scaleFactor -
          awSize / 2 -
          adjustment;
        let rightEyeY = rightEye.position.y * scaleFactor - awSize / 2;

        //fill(200, 200, 200);
        //ellipse(leftEyeX, leftEyeY, 22);
        //ellipse(rightEyeX, rightEyeY, 22);

        let eyeDistance = round(dist(leftEyeX, leftEyeY, rightEyeX, rightEyeY));

        // print the eyeDistance and gridSize
        //console.log(`Eye Distance: ${eyeDistance}, Grid: ${gridSize}`);

        if (recalculationCounter % recalculationInterval === 0) {
          let newGridSize = round(map(eyeDistance, 20, 120, 8, 50));
          newGridSize = constrain(newGridSize, 8, 50);

          if (abs(newGridSize - round(gridSize)) >= gridSizeChangeThreshold) {
            gridSize = newGridSize;
            initializeCubes();
          }
        }
      }
    }
  }
  recalculationCounter++;
}
