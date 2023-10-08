let images = [];
let canvases = [];
let currentIndex = 0;
let currentCanvas;
let imageOrder = [0, 1, 2, 3]; // initial order
let lastPoint;
let currentColor;
let currentStrokeWidth;
let lineStyle;
let history = []; // To store previous states for undo
let imgWidth, imgHeight;
let originalIndexes = [];
let nextPieceButton;
let assembleButton;
let colorPicker;
let strokeWidthDropdown;
let lineTypeRadio;
let toggleBackgroundCheckbox;
// Add any other controls you have here...

// Global variables to help keep track of the final assembled state
let assembledCanvasWithBg;
let assembledCanvasWithoutBg;
let showBackgroundImages = true; //If things somehow break, check if this corresponds to the current default set in HTML of the input option.

function preload() {
  // REPLACE WITH YOUR IMAGE PATHS
  images.push(loadImage("img1.png"));
  images.push(loadImage("img2.png"));
  images.push(loadImage("img3.png"));
  images.push(loadImage("img4.png"));
}

function setup() {
  let canvas = createCanvas(400, 400);
  canvas.parent("canvasContainer"); // This attaches the canvas to the specific div

  shuffleImages();
  currentCanvas = createGraphics(400, 400);

  background(255); // Set the background
  drawImageCentered(images[currentIndex]); // Draw the initial image

  // Controls
  nextPieceButton = select("#nextBtn");
  assembleButton = select("#assembleBtn");
  colorPicker = select("#colorPicker");
  strokeWidthDropdown = select("#strokeWidthPicker");
  lineTypeRadio = select("#lineStyle");
  toggleBackgroundCheckbox = select("#toggleBackground");

  // Initialize color, strokeWidth and lineStyle
  currentColor = document.getElementById("colorPicker").value;
  currentStrokeWidth = document.getElementById("strokeWidthPicker").value;
  lineStyle = document.querySelector('input[name="lineStyle"]:checked').value;

  // Add event listeners
  document.getElementById("colorPicker").addEventListener("input", (event) => {
    currentColor = event.target.value;
  });
  document
    .getElementById("strokeWidthPicker")
    .addEventListener("change", (event) => {
      currentStrokeWidth = event.target.value;
    });
  document.querySelectorAll('input[name="lineStyle"]').forEach((radio) => {
    radio.addEventListener("change", (event) => {
      lineStyle = event.target.value;
    });
  });

  lastPoint = createVector(-1, -1); // Initialize lastPoint

  document.querySelector("canvas").style.border = "3px solid black"; // Ensure canvas has a border

  document
    .getElementById("toggleBackground")
    .addEventListener("change", function () {
      assemblePieces();
    });
}

function shuffleImages() {
  for (let i = 0; i < images.length; i++) {
    originalIndexes.push(i);
  }

  let currentIndex = images.length,
    randomIndex,
    tempValue;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // Shuffle images
    tempValue = images[currentIndex];
    images[currentIndex] = images[randomIndex];
    images[randomIndex] = tempValue;

    // Shuffle indexes accordingly
    tempValue = originalIndexes[currentIndex];
    originalIndexes[currentIndex] = originalIndexes[randomIndex];
    originalIndexes[randomIndex] = tempValue;
  }
}

function draw() {
  if (mouseIsPressed) {
    if (lastPoint.x === -1 && lastPoint.y === -1) {
      // Save the current state when starting a new stroke
      history.push(currentCanvas.get());
      if (history.length > 10) {
        // Limit the history to the last 10 strokes
        history.shift();
      }
    }

    currentCanvas.stroke(currentColor);
    currentCanvas.strokeWeight(currentStrokeWidth);

    if (lineStyle === "tapered" && lastPoint.x !== -1 && lastPoint.y !== -1) {
      let d = dist(mouseX, mouseY, lastPoint.x, lastPoint.y);
      let sw = map(d, 0, 20, 1, currentStrokeWidth);
      sw = constrain(sw, 1, currentStrokeWidth);
      currentCanvas.strokeWeight(sw);
    }

    currentCanvas.line(mouseX, mouseY, pmouseX, pmouseY);

    drawImageCentered(images[currentIndex]);
    image(currentCanvas, 0, 0);

    lastPoint.set(mouseX, mouseY);
  } else {
    lastPoint.set(-1, -1);
  }
}

// Listen for keypress events
function keyPressed() {
  if (keyCode === 90 && keyIsDown(CONTROL)) {
    // "Z" and Control key
    undo();
  }
}

function undo() {
  if (history.length > 0) {
    let previousState = history.pop(); // Get the last saved state
    currentCanvas.clear();
    currentCanvas.image(previousState, 0, 0); // Copy the previous state onto the currentCanvas
    image(images[currentIndex], 0, 0); // Redraw the background image
    image(currentCanvas, 0, 0); // Redraw the canvas from the history
  }
}

function nextPiece() {
  // Save current drawn canvas
  canvases.push(currentCanvas.get());

  // Increment to next image
  currentIndex++;

  if (currentIndex >= images.length) {
    // If we've shown all images, disable the Next button and enable the Assemble button
    document.getElementById("nextBtn").disabled = true;
    document.getElementById("assembleBtn").disabled = false;
    return;
  }

  currentCanvas.clear();
  drawImageCentered(images[currentIndex]);
}

function assemblePieces() {
  // Calculate desired sizes based on the window's height
  imgWidth = images[0].width * ((windowHeight * 0.25) / images[0].height);
  imgHeight = windowHeight * 0.25;

  createCanvas(imgWidth * 2, imgHeight * 2);
  assembledCanvas = createGraphics(imgWidth * 2, imgHeight * 2);

  for (let i = 0; i < images.length; i++) {
    // Get the position based on the original order
    let x = (originalIndexes[i] % 2) * imgWidth;
    let y = Math.floor(originalIndexes[i] / 2) * imgHeight;

    // Draw the background images if the option is enabled
    if (showBackgroundImages) {
      assembledCanvas.image(images[i], x, y, imgWidth, imgHeight);
    }

    // Overlay the user drawings
    assembledCanvas.image(canvases[i], x, y, imgWidth, imgHeight);
  }

  image(assembledCanvas, 0, 0);

  // Check if buttons are initialized before accessing them
  if (nextPieceButton) {
    nextPieceButton.attribute("disabled", "");
  }
  if (assembleButton) {
    assembleButton.removeAttribute("disabled");
  }

  // Disable the "Next Piece" button and enable the "Assemble" button
  nextPieceButton.attribute("disabled", "");
  assembleButton.removeAttribute("disabled");

  // Listen for changes in the checkbox and redraw the assembled canvas
  document
    .getElementById("toggleBackground")
    .addEventListener("change", function () {
      showBackgroundImages = this.checked;
      drawAssembledCanvas();
      redraw();
    });

  noLoop();
}

function drawAssembledCanvas() {
  // Draw images (background) on the version with backgrounds
  assembledCanvasWithBg.clear();
  assembledCanvasWithBg.image(images[0], 0, 0, imgWidth, imgHeight);
  assembledCanvasWithBg.image(images[1], imgWidth, 0, imgWidth, imgHeight);
  assembledCanvasWithBg.image(images[2], 0, imgHeight, imgWidth, imgHeight);
  assembledCanvasWithBg.image(
    images[3],
    imgWidth,
    imgHeight,
    imgWidth,
    imgHeight
  );

  for (let i = 0; i < 4; i++) {
    let destX = (i % 2) * imgWidth;
    let destY = Math.floor(i / 2) * imgHeight;

    assembledCanvasWithBg.image(canvases[i], destX, destY, imgWidth, imgHeight);
    assembledCanvasWithoutBg.image(
      canvases[i],
      destX,
      destY,
      imgWidth,
      imgHeight
    );
  }

  // Display the assembled canvas based on the toggle's state
  if (showBackgroundImages) {
    image(assembledCanvasWithBg, 0, 0, width, height);
  } else {
    image(assembledCanvasWithoutBg, 0, 0, width, height);
  }
}

// Helper function to draw the image centered and scaled uniformly
function drawImageCentered(img) {
  if (!img) return;

  let scaleRatio = Math.min(width / img.width, height / img.height);
  let newWidth = img.width * scaleRatio;
  let newHeight = img.height * scaleRatio;
  let xOffset = (width - newWidth) / 2;
  let yOffset = (height - newHeight) / 2;

  image(img, xOffset, yOffset, newWidth, newHeight);
}

function windowResized() {
  let newWidth = constrain(windowWidth, 400, 600); // Minimum 400, maximum 600
  let newHeight = constrain(windowHeight, 400, 600); // Minimum 400, maximum 600

  resizeCanvas(newWidth, newHeight);

  if (assembledCanvas) {
    assemblePieces();
  } else {
    background(255);
    drawImageCentered(images[currentIndex]);
    image(currentCanvas, 0, 0);
  }
}
