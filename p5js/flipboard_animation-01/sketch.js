// figure out the Y rotation
// detect the eyes and link to grid size?

let captureXStart = 100;
let captureXEnd = 799;
let captureYStart = 0;
let captureYEnd = 799;

let capture;

//let soundEffects = false;

let lastPlayed = 0;
let colorState = 0;
const PLAY_DELAY = 150; // time in milliseconds
let showWebcam = true;

let gridSize = 30;
let gridWidth;
let gridHeight;
let padding = 2;
let canvasSize = 800;
let cubeOpacity = 255;
let camScale = 2.5;

let cubes = [];

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
    this.cooldownTime = 100; // Adjust this to control the wait time
    this.lastGray = 0; // New attribute
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
        this.angle = this.targetAngle; // Ensure the angle always ends up at exactly 0 or 180 degrees
      }
    } else if (this.angle === this.targetAngle) {
      this.delay = 0; // Reset the delay when the cube has reached its target angle
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

    // Only adjust angle if grayscale value crosses a threshold
    if (
      (this.lastGray < 64 && gray >= 64) ||
      (this.lastGray < 128 && gray >= 128) ||
      (this.lastGray < 192 && gray >= 192) ||
      (this.lastGray >= 64 && gray < 64) ||
      (this.lastGray >= 128 && gray < 128) ||
      (this.lastGray >= 192 && gray < 192)
    ) {
      /*if (
        this.targetAngle !== angle &&
        millis() - lastPlayed > PLAY_DELAY &&
        soundEffects
      ) {
        flipSound.play();
        lastPlayed = millis();
      }*/
      this.delay = millis() + this.y; // Use this.y to create a vertical cascading effect
      this.targetAngle = angle;
    }

    this.lastGray = gray; // Remember this grayscale value for next frame
  }
}

function setup() {
  //flipSound = loadSound("flip_sound.ogg");
  createCanvas(800, 800, WEBGL);
  angleMode(DEGREES);
  ortho();

  // Make the capture size match the canvas size for simplicity
  capture = createCapture(VIDEO);
  capture.size(800, 800);
  capture.hide();

  // Adjust gridWidth and gridHeight to account for padding
  gridWidth = (width - padding * (gridSize + 1)) / gridSize;
  gridHeight = (height - padding * (gridSize + 1)) / gridSize;

  // Initialize the cubes
  initializeCubes();
}
function draw() {
  background(0, 0, 0, 0);

  croppedImage = capture.get(
    captureXStart,
    captureYStart,
    captureXEnd,
    captureYEnd
  );

  capture.loadPixels();

  for (let i = 0; i < cubes.length; i++) {
    let cube = cubes[i];

    // Inside your loop
    let xStart = map(
      cube.x - cube.halfLength,
      -width / 2,
      width / 2,
      captureXStart,
      captureXEnd
    );
    let xEnd = map(
      cube.x + cube.halfLength,
      -width / 2,
      width / 2,
      captureXStart,
      captureXEnd
    );
    let yStart = map(
      cube.y - cube.halfLength,
      -height / 2,
      height / 2,
      captureYStart,
      captureYEnd
    );
    let yEnd = map(
      cube.y + cube.halfLength,
      -height / 2,
      height / 2,
      captureYStart,
      captureYEnd
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

    // Calculate average color values
    let r = rSum / count;
    let g = gSum / count;
    let b = bSum / count;

    let gray = (r + g + b) / 3;

    // Set the cube to rotate based on grayscale value
    cube.setAngleFromGrayscale(gray);
    // Render the cube
    cube.draw();
  }

  if (showWebcam) {
    // only show the webcam feed if showWebcam is true
    push();
    translate(0, 0, 2); // Push the camera image towards the camera
    scale(1 / camScale, 1 / camScale); // Keep aspect ratio consistent

    image(
      croppedImage,
      canvasSize / 2 + canvasSize / camScale,
      canvasSize / 2 + canvasSize / camScale,
      canvasSize / camScale,
      canvasSize / camScale
    );
    pop();
  }
}

// The function for resizing the canvas when the window size changes
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initializeCubes();
}
function initializeCubes() {
  cubes = []; // Clear the old cubes array
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
      cubes.push(cube);
    }
  }
}

function mouseClicked() {
  showWebcam = !showWebcam; // toggle the visibility of the webcam image when the mouse is clicked
}
