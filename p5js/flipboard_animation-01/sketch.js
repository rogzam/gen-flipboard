let capture;

let lastPlayed = 0;
let showWebcam = true;

let gridSize = 30;
let gridWidth;
let gridHeight;
let padding = 2;
let canvasSize = 800;
let cubeOpacity = 255;
let camScale = 2.5;

let cubes = [];

let paused = false;

class RotatingCube {
  constructor(x, y, sideLength, depth) {
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.delay = 4;
    this.rotationSpeed = 16;
    this.targetAngle = 0;
    this.sideLength = sideLength;
    this.halfLength = sideLength / 2;
    this.depth = depth;
    this.halfDepth = depth / 2;
    this.cooldown = 0;
    this.cooldownTime = 100;
    this.lastGray = 0;
  }

  draw() {
    push();
    translate(this.x, this.y, -this.halfDepth);
    rotateX(this.angle);
    this.drawCube();
    pop();

    if (millis() > this.delay) {
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
    fill(195, cubeOpacity);
    vertex(-this.halfLength, -this.halfLength, this.halfDepth);
    vertex(this.halfLength, -this.halfLength, this.halfDepth);
    vertex(this.halfLength, this.halfLength, this.halfDepth);
    vertex(-this.halfLength, this.halfLength, this.halfDepth);

    fill(215, cubeOpacity);
    vertex(-this.halfLength, this.halfLength, -this.halfDepth);
    vertex(this.halfLength, this.halfLength, -this.halfDepth);
    vertex(this.halfLength, this.halfLength, this.halfDepth);
    vertex(-this.halfLength, this.halfLength, this.halfDepth);

    fill(235, cubeOpacity);
    vertex(-this.halfLength, -this.halfLength, -this.halfDepth);
    vertex(this.halfLength, -this.halfLength, -this.halfDepth);
    vertex(this.halfLength, this.halfLength, -this.halfDepth);
    vertex(-this.halfLength, this.halfLength, -this.halfDepth);

    fill(255, cubeOpacity);
    vertex(-this.halfLength, -this.halfLength, -this.halfDepth);
    vertex(this.halfLength, -this.halfLength, -this.halfDepth);
    vertex(this.halfLength, -this.halfLength, this.halfDepth);
    vertex(-this.halfLength, -this.halfLength, this.halfDepth);

    endShape();
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
      this.delay = millis() + this.y;
      this.targetAngle = angle;
    }

    this.lastGray = gray;
  }
}

function setup() {
  createCanvas(800, 800, WEBGL);
  angleMode(DEGREES);
  ortho();
  capture = createCapture(VIDEO);
  capture.size(800, 800);
  capture.hide();

  gridWidth = (width - padding * (gridSize + 1)) / gridSize;
  gridHeight = (height - padding * (gridSize + 1)) / gridSize;
  initializeCubes();
}

function draw() {
  if (!paused) {
    
  background(0, 0, 0, 0);
  croppedImage = capture.get(0, 0, 800, 800);
  capture.loadPixels();

  for (let cube of cubes) {
    let xStart = map(
      cube.x - cube.halfLength,
      -width / 2,
      width / 2,
      0,
      800
    );
    let xEnd = map(
      cube.x + cube.halfLength,
      -width / 2,
      width / 2,
      0,
      800
    );
    let yStart = map(
      cube.y - cube.halfLength,
      -height / 2,
      height / 2,
      0,
      800
    );
    let yEnd = map(
      cube.y + cube.halfLength,
      -height / 2,
      height / 2,
      0,
      800
    );
    let rSum = 0,
      gSum = 0,
      bSum = 0,
      count = 0;

    for (let x = floor(xStart); x <= floor(xEnd); x++) {
      for (let y = floor(yStart); y <= floor(yEnd); y++) {
        let index = 4 * (x + capture.width * y);
        rSum += capture.pixels[index];
        gSum += capture.pixels[index + 1];
        bSum += capture.pixels[index + 2];
        count++;
      }
    }

    let gray = (rSum + gSum + bSum) / (3 * count);
    cube.setAngleFromGrayscale(gray);
    cube.draw();
  }

  if (showWebcam) {
    push();
    translate(0, 0, 2);
    scale(1 / camScale, 1 / camScale);
    image(croppedImage, canvasSize / 2 + canvasSize / camScale, canvasSize / 2 + canvasSize / camScale, canvasSize / camScale, canvasSize / camScale);
    pop();
  }
}
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initializeCubes();
}

function initializeCubes() {
  cubes = [];
  let totalPadding = (gridSize + 1) * padding;
  let cubeSize = (width - totalPadding) / gridSize;

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      let cubeX = map(i, 0, gridSize - 1, -width / 2 + cubeSize / 2 + padding, width / 2 - cubeSize / 2 - padding);
      let cubeY = map(j, 0, gridSize - 1, -height / 2 + cubeSize / 2 + padding, height / 2 - cubeSize / 2 - padding);
      let cubeZ = 0;
      cubes.push(new RotatingCube(cubeX, cubeY, cubeSize, cubeSize));
    }
  }
}

function mouseClicked() {
  paused = !paused;
}
