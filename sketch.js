function preload() {
  bgImg = loadImage("Assets/woodbg.jpg");
  whiteBall = loadImage("Assets/whitemarble.png");
  blackBall = loadImage("Assets/blackmarble.png");
  clickSound = loadSound("Assets/woodclick.wav");
}

function setup() {
  clickSound.amp(0.5);
  createCanvas(windowWidth, windowHeight);
  whiteBall.width = 50;
  whiteBall.height = 50;
  blackBall.width = 50;
  blackBall.height = 50;
  game = new Game();
  game.autobot = true;
  // background(40);
  // game.run();
}

function draw() {
  cursor("default");
  // background(40);
  imageMode(CORNER);
  image(bgImg, 0, 0, width, height);
  imageMode(CENTER);
  game.run();
}
