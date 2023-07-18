let angle = 270;
let targetAngle = 0;
let halfLength = 50;
let halfDepth = 50;
let gradientHeight = halfLength * 6;
let gradientY = 150;
let gradientSpeed = 1.2;
let gradientDirection = -1;

function setup() {
  createCanvas(800, 300, WEBGL);
  angleMode(DEGREES);
  noStroke();
}

function draw() {
  clear();
  background(0, 0, 0, 0);
  let block = floor((gradientY + gradientHeight / 2) / (gradientHeight / 4));
  block = constrain(block, 0, 3);
  targetAngle = block * 90;

  if (random() < 0.01) {
    gradientSpeed = random(0.8, 2);
  }

  if (random() < 0.01) {
    gradientDirection *= -1;
  }

  if (angle != targetAngle) {
    if ((angle - targetAngle + 360) % 360 > 180) {
      angle = (angle + 2) % 360;
    } else {
      angle = (angle - 2) % 360;
    }
  }

  push();
  translate(-halfLength * 3, 0, 0);
  rotateX(angle);
  beginShape(QUADS);
  noStroke();
  fill(195, 255);
  vertex(-halfLength, -halfLength, halfDepth);
  vertex(halfLength, -halfLength, halfDepth);
  vertex(halfLength, halfLength, halfDepth);
  vertex(-halfLength, halfLength, halfDepth);
  fill(215, 255);
  vertex(-halfLength, halfLength, -halfDepth);
  vertex(halfLength, halfLength, -halfDepth);
  vertex(halfLength, halfLength, halfDepth);
  vertex(-halfLength, halfLength, halfDepth);
  fill(235, 255);
  vertex(-halfLength, -halfLength, -halfDepth);
  vertex(halfLength, -halfLength, -halfDepth);
  vertex(halfLength, halfLength, -halfDepth);
  vertex(-halfLength, halfLength, -halfDepth);
  fill(255, 255);
  vertex(-halfLength, -halfLength, -halfDepth);
  vertex(halfLength, -halfLength, -halfDepth);
  vertex(halfLength, -halfLength, halfDepth);
  vertex(-halfLength, -halfLength, halfDepth);
  endShape();
  pop();

  push();
  translate(halfLength * 3, 0, 0);
  noFill();
  fill(255, 255);
  rect(-halfLength, gradientY - gradientHeight / 2, halfLength * 2, gradientHeight / 4 - 4);
  fill(235, 255);
  rect(-halfLength, gradientY - gradientHeight / 2 + gradientHeight / 4, halfLength * 2, gradientHeight / 4 - 4);
  fill(215, 255);
  rect(-halfLength, gradientY - gradientHeight / 2 + gradientHeight / 2, halfLength * 2, gradientHeight / 4 - 4);
  fill(195, 255);
  rect(-halfLength, gradientY - gradientHeight / 2 + (3 * gradientHeight) / 4, halfLength * 2, gradientHeight / 4 - 4);
  strokeWeight(2);
  stroke(255, 255, 255);
  line(-halfLength - 12, -halfLength + 40, -halfLength - 12, halfLength);
  line(halfLength + 12, -halfLength + 40, halfLength + 12, halfLength);
  pop();

  gradientY += gradientSpeed * gradientDirection;

  if (gradientY > gradientHeight / 2) {
    gradientDirection *= -1;
    gradientY = gradientHeight / 2;
    gradientSpeed = random(0.8, 2);
  } else if (gradientY < -gradientHeight / 2 + halfLength) {
    gradientDirection *= -1;
    gradientY = -gradientHeight / 2 + halfLength;
    gradientSpeed = random(0.8, 3);
  }
}

