
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
  
  let num = parseFloat(key);
  if (!isNaN(num)) {
    num = constrain(num, 1, 9);
    game.ai.maxDepth = num;
  }
}
