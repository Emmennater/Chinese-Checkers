class Game {
  constructor() {
    this.board = new Board();
    this.ai = new Minimax(this.board);
    this.easyPlace = false;
    this.botdue = -1;
  }

  run() {
    this.board.actions();
    Animator.update();
    this.board.draw();
    this.updateBot();
    Animator.draw();
  }

  reset() {
    this.board.init();
    this.board.setup();
    this.board.control.initAllReferences();
    this.board.graphics.lastPath = null;
    this.board.winner = null;
    this.botdue = -1;
    Animator.busy = false;
    Animator.path = null;
  }
  
  updateBot() {
    if (Animator.busy) return;

    if (this.botdue == 0 || this.botdue == -10) {
      this.ai.bestMove(this.board);
    }
    
    if (this.botdue > -1) {
      this.botdue--;
      cursor("wait");
    }
  }
}

class Board {
  constructor() {
    this.size = 13;
    this.cols = [];
    this.teams = 2;
    this.winner = null;
    this.init();
    this.setup(this.teams);
    this.control = new BoardBehavior(this);
    this.graphics = new BoardGraphics(this);
    this.control.initAllReferences();
  }

  init() {
    // Initialize board positions
    let lens = [1, 2, 3, 4, 13, 12, 11, 10, 9, 10, 11, 12, 13, 4, 3, 2, 1];
    this.cols = Array(lens.length);
    for (let i = 0; i < lens.length; i++) {
      this.cols[i] = Array(lens[i]);
      for (let j = 0; j < lens[i]; j++) {
        this.cols[i][j] = new Hole(i, j, this);
      }
    }
  }

  setup(teams = 2) {
    // Put balls in starting locations
    this.teamBalls = Array(teams);

    // Left
    if (teams < 1) return;
    this.teamBalls[0] = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < this.cols[i].length; j++) {
        const hole = this.cols[i][j];
        hole.ball = new Ball(hole, 0);
        this.teamBalls[0].push(hole.ball);
      }
    }

    // Right
    if (teams < 2) return;
    this.teamBalls[1] = [];
    for (let i = 13; i < 17; i++) {
      for (let j = 0; j < this.cols[i].length; j++) {
        const hole = this.cols[i][j];
        hole.ball = new Ball(hole, 1);
        this.teamBalls[1].push(hole.ball);
      }
    }

    // Top left
    if (teams < 3) return;
    this.teamBalls[2] = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4 - i; j++) {
        this.cols[4 + i][j].ball = new Ball(this.cols[4 + i][j], 2);
        this.teamBalls[2].push(this.cols[4 + i][j].ball);
      }
    }

    // Bottom left
    if (teams < 4) return;
    this.teamBalls[3] = [];
    for (let i = 0; i < 4; i++) {
      const col = this.cols[4 + i];
      for (let j = 0; j < 4 - i; j++) {
        col[col.length - j - 1].ball = new Ball(col[col.length - j - 1], 3);
        this.teamBalls[3].push(col[col.length - j - 1].ball);
      }
    }

    // Top right
    if (teams < 5) return;
    this.teamBalls[4] = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < i + 1; j++) {
        this.cols[9 + i][j].ball = new Ball(this.cols[4 + i][j], 4);
        this.teamBalls[4].push(this.cols[9 + i][j].ball);
      }
    }

    // Bottom right
    if (teams < 6) return;
    this.teamBalls[5] = [];
    for (let i = 0; i < 4; i++) {
      const col = this.cols[9 + i];
      for (let j = 0; j < i + 1; j++) {
        col[col.length - j - 1].ball = new Ball(col[col.length - j - 1], 5);
        this.teamBalls[5].push(col[col.length - j - 1].ball);
      }
    }
  }

  clicked() {
    if (Animator.busy) return;

    // Reset highlighted
    for (let rows of this.cols) {
      for (let hole of rows) {
        hole.highlight = false;
      }
    }

    for (let rows of this.cols) {
      for (let hole of rows) {
        hole.clicked();
      }
    }

    this.control.updateClick();
  }

  actions() {
    for (let rows of this.cols) {
      for (let hole of rows) {
        hole.actions();
      }
    }
  }

  draw() {
    this.graphics.draw();
  }
}

class BoardGraphics {
  constructor(board) {
    this.board = board;
    this.margin = 10;
    this.padding = 4;
    this.lastPath = null;
    this.resize();
  }

  resize() {
    this.scl = min(width * 0.9, height * 1.1);
  }

  getLoc(c, r) {
    const hole = this.board.cols[c][r];
    const space = (this.scl - this.margin) / this.board.cols.length;

    let shift = (c % 2) / 2;
    let xoff = -floor(this.board.cols.length / 2) * space;
    let yoff = shift * space;
    let x = hole.px * space + width / 2 + xoff;
    let y = hole.py * space + height / 2 + yoff;

    // const x = hole.px * (s + gap);
    // const y = hole.py * (s + gap);
    return { x: x, y: y, s: space - this.padding };
  }

  draw() {
    // Display the board
    const s = this.scl;
    const cols = this.board.cols;

    // Holes and Balls
    for (let i = 0; i < cols.length; i++) {
      const row = cols[i];
      for (let j = 0; j < row.length; j++) {
        let hole = cols[i][j];

        const loc = this.getLoc(i, j);

        hole.draw(loc.x, loc.y, loc.s);
      }
    }

    // Path
    if (this.lastPath != null) {
      fill(255, 0, 0, 150);
      stroke(255, 0, 0, 150);
      strokeWeight(2);
      let loc1;
      for (let i = 0; i < this.lastPath.length - 1; i++) {
        const hole0 = this.lastPath[i];
        const hole1 = this.lastPath[i + 1];
        const loc0 = this.getLoc(hole0.c, hole0.r);
        loc1 = this.getLoc(hole1.c, hole1.r);

        line(loc0.x, loc0.y, loc1.x, loc1.y);
        ellipse(loc0.x, loc0.y, 5);
        
      }
      
      ellipse(loc1.x, loc1.y, 5);
    }

    // Statistics
    fill(10, 200);
    stroke(150, 250);
    strokeWeight(2);
    textFont("monospace");
    textSize(26);
    textStyle(BOLD);
    textAlign(LEFT, TOP);
    text(
`Eval: ${game.ai.evaluation * game.ai.winSide}
Depth: ${game.ai.maxDepth}
Permutations: ${game.ai.permutations}
`, 4, 4);
    
    // Turn / Win Text
    let turnText = "WHITE";
    textAlign(CENTER, TOP);
    textSize(50);
    fill(255);
    stroke(0, 200);
    strokeWeight(5);

    if (this.board.winner != null) {
      // Winner
      let WINNER = "WHITE";
      if (this.board.winner < 0) {
        WINNER = "BLACK";
        fill(0);
        stroke(255, 200);
      }
      turnText = WINNER + " WINS!";
    } else if (this.board.control.turn == 0) {
      // Black turn
      turnText = "BLACK";
      fill(0);
      stroke(255, 200);
    }
    
    text(turnText, width/2, 6);
    
    // Border
    // noFill();
    // stroke(255, 0, 0);
    // strokeWeight(2);
    // rect(-s/2, -s/2, s, s);
  }
}

class BoardBehavior {
  constructor(board) {
    this.board = board;
    this.selected = null;
    this.prevSelected = null;
    this.turn = 1;
  }

  initAllReferences() {
    for (let rows of this.board.cols) {
      for (let hole of rows) {
        hole.initReferences();
      }
    }
  }

  getNeighbors(c, r) {
    const cols = this.board.cols;
    const moves = Array(6);
    const px = cols[c][r].px;
    const py = cols[c][r].py;

    function addMove(C, R) {
      if (cols[C] == null) return null;
      // Undo the shift
      let shift = px != C ? -C % 2 : 0;
      let R2 = R + floor(cols[C].length / 2) + shift;
      if (cols[C][R2] == null) return null;

      // Add if not occupied
      // let hole = cols[C][R2];
      // if (hole.ball) return null;

      return { c: C, r: R2 };
    }

    moves[0] = addMove(px - 1, py);
    moves[1] = addMove(px - 1, py + 1);
    moves[2] = addMove(px + 1, py);
    moves[3] = addMove(px + 1, py + 1);
    moves[4] = addMove(px, py - 1);
    moves[5] = addMove(px, py + 1);

    return moves;
  }

  clearVisited() {
    for (let col of this.board.cols) {
      for (let hole of col) {
        hole.visited = false;
      }
    }
  }
  
  getJumps(c, r) {
    const cols = this.board.cols;
    const moves = Array(6);
    const px = cols[c][r].px;
    const py = cols[c][r].py;

    // C = column
    // R = row
    // SC = start column
    function addMove(C, R, SC) {
      if (cols[C] == null) return null;

      // Undo the shift
      let shift = SC != C ? -1 : 0;
      let R2 = R + floor(cols[C].length / 2) + shift;
      if (cols[C][R2] == null) return null;

      return { c: C, r: R2 };
    }

    moves[0] = addMove(px - 2, py, px);
    moves[1] = addMove(px - 2, py + 2, px);
    moves[2] = addMove(px + 2, py, px);
    moves[3] = addMove(px + 2, py + 2, px);
    moves[4] = addMove(px, py - 2, px);
    moves[5] = addMove(px, py + 2, px);

    return moves;
  }

  getMovesTo(
    hole,
    moves = [],
    jumpOnly = false,
    path = [],
    to = null
  ) {
    let found = false;
    for (let i = 0; i < hole.neighbors.length; i++) {
      let move = hole.neighbors[i];

      if (move != null) {
        move = this.board.cols[move.c][move.r];
      }

      if (move != null && move.ball != null) {
        // Jump
        move = hole.jumps[i];
        if (move == null) continue;
        move = this.board.cols[move.c][move.r];
        if (move.visited) continue;
        if (move.ball != null) continue;

        path.push(move);
        if (move == to) {
          found = true;
          break;
        }

        // Add to visited
        move.visited = true;

        // Try visiting more
        let result = this.getMovesTo(move, moves, true, path, to);
        if (result !== false) {
          found = true;
          break;
        }

        path.pop();

        continue;
      } else if (jumpOnly) {
        continue;
      }

      if (move == null) continue;
      if (move.ball == null) {
        path.push(move);
        if (move == to) return path;
        path.pop();
      }
    }

    if (!found) return false;
    return path;
  }

  getMoves(hole, moves = [], jumpOnly = false) {
    // Loop over every neighboring hole
    for (let i = 0; i < hole.neighbors.length; i++) {
      let move = hole.neighbors[i];

      // Move exists
      if (move == null) continue;
      move = this.board.cols[move.c][move.r];

      // Ball in the way
      if (move.ball != null) {
        
        // Jump
        move = hole.jumps[i];
        if (move == null) continue;
        
        move = this.board.cols[move.c][move.r];
        if (move.visited) continue;
        if (move.ball != null) continue;

        // Add to visited
        move.visited = true;
        moves.push(move);

        // Try visiting more
        this.getMoves(move, moves, true);

        continue;
      } else if (jumpOnly) {
        continue;
      } else {
        moves.push(move);
      }
    }

    return moves;
  }

  canMoveTo(from, to) {
    if (
      this.selected == null ||
      this.prevSelected == null ||
      this.prevSelected.ball == null ||
      this.prevSelected == this.selected ||
      to.ball != null
    )
      return false;

    if (game.easyPlace) return true;
    
    // Check for correct turn
    if (this.prevSelected.ball.team != this.turn) return false;

    // Look for possible move
    for (let move of from.moves) {
      const hole2 = this.board.cols[move.c][move.r];
      if (to == hole2) return true;
    }

    return false;
  }

  updateClick() {
    // Moving the ball
    if (this.canMoveTo(this.prevSelected, this.selected)) {
      this.playMove({from:this.prevSelected, to:this.selected});
      
      if (game.autobot) {
        game.botdue = 3;
      }
    }

    this.prevSelected = this.selected;
  }

  playMove(move) {
    if (!move) return;
    if (this.board.winner != null) return;
    let path = this.getMovesTo(move.from, [], false, [move.from], move.to);
    this.clearVisited();
    this.board.graphics.lastPath = path;

    Animator.animatePath(path);
    
    this.board.control.turn = (this.board.control.turn + 1) % this.board.teams;
  }

  checkForWin() {
    this.board.winner = game.ai.getWinState(this.board);
  }
}

class Hole {
  constructor(c, r, board) {
    this.c = c;
    this.r = r;

    this.board = board;
    this.ball = null;

    this.selected = false;
    this.hovered = false;
    this.highlight = false;

    this.init();
  }

  init() {
    // Calculate position
    const row = this.board.cols[this.c];
    // shift = 0;
    this.px = this.c;
    this.py = this.r - floor(row.length / 2);
  }

  initReferences() {
    // Neighbors
    this.neighbors = this.board.control.getNeighbors(this.c, this.r);

    // Jumps
    this.jumps = this.board.control.getJumps(this.c, this.r);
  }

  clicked() {
    this.selected = this.hovered;

    if (this.selected) {
      this.board.control.selected = this;

      // Display moves
      if (this.ball == null) return;
      this.moves = this.board.control.getMoves(this);
      this.board.control.clearVisited();
      for (let pos of this.moves) {
        if (pos == null) continue;
        const hole = this.board.cols[pos.c][pos.r];
        hole.highlight = true;
      }
    }
  }

  actions() {
    const s = this.board.scl;
    this.hovered = false;

    // if (this.ball == null) return;

    let loc = this.board.graphics.getLoc(this.c, this.r);
    let d = dist(mouseX, mouseY, loc.x, loc.y);
    if (d < loc.s / 2) {
      this.hovered = true;
      if (game.botdue == -1) cursor("pointer");
    }
  }

  draw(x, y, s) {
    // Style
    fill(0, 50);
    strokeWeight(3);

    if (this.selected) {
      stroke(255);
    } else if (this.hovered) {
      fill(50, 50);
      stroke(255, 100);
    } else {
      strokeWeight(2);
      stroke(0, 100);
    }

    // Draw the hole
    ellipse(x, y, s);

    // Draw ball
    if (this.ball != null) {
      this.ball.draw(x, y, s * 0.8);
    }

    // Highlight
    if (this.highlight) {
      fill(0, 90);
      noStroke();
      ellipse(x, y, s / 2);
    }
  }
}

class Ball {
  constructor(hole, team = 0) {
    this.hole = hole;
    this.team = team;
    this.lerpx = null;
    this.lerpy = null;
    this.lerpt = 0;
    this.animate = false;
  }

  draw(x, y, s, animate = false) {
    
    if (this.animate) {
      let loc0 = this.hole.board.graphics.getLoc(this.hole.c, this.hole.r);
      let loc1 = this.hole.board.graphics.getLoc(this.lerpx, this.lerpy);
      x = lerp(loc0.x, loc1.x, this.lerpt);
      y = lerp(loc0.y, loc1.y, this.lerpt);
      s = loc0.s * (0.8 + Math.sin(this.lerpt * Math.PI) * 0.2);
    } else if (animate) {
      return;
    }

    // fill(getTeamColor(this.team));
    // noStroke();
    // ellipse(x, y, s);
    if (!this.animate || animate) {
      image(getTeamImage(this.team), x, y, s, s);
    }
  }
}

class Animator {
  static busy = false;
  static speed = 0.05;
  static path = null;
  static t = 0;

  static animatePath(path) {
    this.t = 0;
    this.path = path.slice();
    this.busy = true;
    // clickSound.play();
  }

  static update() {
    if (this.busy < 0) this.busy++;

    const path = this.path;
    if (path == null) return;
    path[0].ball.animate = true;

    // Increment time
    this.t += this.speed;
    this.t = constrain(this.t, 0, 1);

    if (this.t >= 1) {
      path[0].ball.animate = false;
      path[1].ball = path[0].ball;
      path[1].ball.hole = path[1];
      path[0].ball = null;
      path.shift();
      if (path.length <= 1) {
        this.path = null;
        this.busy = -1;
        game.board.control.checkForWin();
        clickSound.amp(0.5);
        clickSound.play();
      } else {
        clickSound.amp(0.15);
        clickSound.play();
        this.t = 0;
      }
    } else {
      // Set ball location
      path[0].ball.animate = true;
      path[0].ball.lerpx = path[1].c;
      path[0].ball.lerpy = path[1].r;
      path[0].ball.lerpt = this.t;
    }

  }

  static draw() {
    if (this.path == null) return;
    if (this.path)
    this.path[0].ball.draw(null, null, null, true);
  }
}

function getTeamColor(team) {
  switch (team) {
    case 0:
      return color(0, 0, 0);
    case 1:
      return color(255, 255, 255);
    case 2:
      return color(0, 0, 255);
    case 3:
      return color(0, 255, 0);
    case 4:
      return color(255, 0, 0);
    case 5:
      return color(220, 20, 220);
    default:
      return color(255);
  }
}

function getTeamImage(team) {
  switch (team) {
    case 0: return blackBall;
    case 1: return whiteBall;
  }
}

/*



























*/
