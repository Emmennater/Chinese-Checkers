
function mousePressed() {
  game.board.clicked();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  game.board.graphics.resize();
}

function keyPressed() {
  if (key == "b") {
    game.botdue = 3;
  }

  if (key == "a") {
    game.botdue = -10;
  }

  if (key == "c") {
    toggleSettings();
  }

  if (key == "r") {
    game.reset();
  }
  
  let num = parseFloat(key);
  if (!isNaN(num)) {
    num = constrain(num, 1, 9);
    game.ai.maxDepth = num;
  }
}
