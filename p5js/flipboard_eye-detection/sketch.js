let video;
let poseNet;
let poses = [];
let paused = true;

function preload() {
  myFont = loadFont("consolas.ttf");
}

function setup() {
  createCanvas(800, 600);
  video = createCapture(VIDEO);
  video.size(width, height);

  poseNet = ml5.poseNet(video, modelReady);

  poseNet.on("pose", function (results) {
    poses = results;
  });

  video.hide();
}

function modelReady() {
  // remove the status update line
}

function draw() {
  if (!paused) {
    background(0, 0, 0, 0);
    clear();
    tint(255, 51); // apply 20% opacity for the video
    image(video, 0, 0, width, height);
    noTint(); // reset opacity back to 100% for keypoints drawing
    drawKeypoints();
  } else {
    // Render the "- click to start -" message
    background(0,0,0,0); // Clear background
    fill(255); // White color
    textAlign(CENTER, CENTER);
    textFont(myFont);
    textSize(16); // Adjust as necessary
    text("- click to start -", width/2, height/2); // Center of the canvas because of WEBGL mode
  }
}

// A function to draw keypoints
function drawKeypoints() {
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i].pose;
    if (pose) {
      let leftEye = pose.keypoints.find((k) => k.part === "leftEye");
      let rightEye = pose.keypoints.find((k) => k.part === "rightEye");

      if (leftEye && rightEye && leftEye.position && rightEye.position) {
        // Draw eye keypoints
        noStroke();
        fill(255);
        ellipse(leftEye.position.x, leftEye.position.y, 15);
        ellipse(rightEye.position.x, rightEye.position.y, 15);
      }
    }
  }
}

function mouseClicked() {
  paused = !paused;
}

function modelReady() {
  select('#status').hide();
}

