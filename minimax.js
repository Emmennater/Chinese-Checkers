
class Minimax {
  constructor(board) {
    this.maxDepth = 3;
    this.maxPermutations = 5000000;
    this.permutations = 0;
    this.evaluation = 0;
    this.movesPlayed = 0;
    this.maximizingTeam = 0;
    this.winSide = 1;
    this.tree = new Tree();
  }
  
  playMove(board, move) {
    this.movesPlayed++;
    move.to.ball = move.from.ball;
    move.to.ball.hole = move.to;
    move.from.ball = null;
  }
  
  unplayMove(board, move) {
    this.movesPlayed--;
    move.from.ball = move.to.ball;
    move.from.ball.hole = move.from;
    move.to.ball = null;
  }
  
  getBallScore(board, ball) {
    const SIGNED_SIDE = (ball.team * 2 - 1);
    let score = 0;
    
    // Target point for each team
    let target = null;
    switch (ball.team) {
      case 0: target = [16, 0]; break;
      case 1: target = [0, 0]; break;
    }
    let targetHole = board.cols[target[0]][target[1]];
    
    // Calculate distance to target
    // let d = dist(
    //   ball.hole.px, ball.hole.py,
    //   targetHole.px, targetHole.py
    // );
    let d = Math.abs(targetHole.px - ball.hole.px);
    d += Math.abs(targetHole.py - ball.hole.py) / 2;
    
    // Set score relative to distance
    score = 16 - d;
    
    // Count neighbors
    let teamates = 0;
    for (let neighbor of ball.hole.neighbors) {
      if (neighbor == null) continue;
      const hole = board.cols[neighbor.c][neighbor.r];
      if (hole.ball == null) continue;
      if (hole.ball.team == ball.team) teamates++;
      score += 0.1;
    }

    const WEIGHT = 0.75;
    // if (this.maximizingTeam == 0)
    if (teamates == 0) {
      score -= d * WEIGHT;
    }
    
    return {
      score: score * SIGNED_SIDE,
      dist: d
    };
  }
  
  getBoardScore(board, prnt = false) {
    let totalScore = 0;

    // Get score of all balls
    for (let i=0; i<board.teamBalls.length; i++) {
      const totalBalls = 10;
      const SIGNED_SIDE = (i * 2 - 1); // only works with 2 teams
      let distScore = 0;
      let totalDist = 0;
      let dists = [];

      // Get score of each ball
      for (let ball of board.teamBalls[i]) {
        let data = this.getBallScore(board, ball);
        totalScore += data.score;
        totalDist += data.dist;
        dists.push(data.dist);
      }
      
      // Calculate dist score
      // const avgDist = totalDist / totalBalls;
      // const WEIGHT = 0.75;
      // let stragglers = 0;
      // if (prnt) print("average dist: ", avgDist);
      // for (let d of dists) {
        // Scores greater than average receive higher scores
        // Vise - versa
        // Test for outliers
        // if (d - avgDist > 4) {
        //   distScore += d - avgDist;
        //   stragglers++;
        // }
      // }
      
      // if (prnt) print(round(distScore * SIGNED_SIDE * 100) / 100);

      // totalScore += (distScore * SIGNED_SIDE * WEIGHT) / (1 + stragglers);
    }
    
    return round(totalScore * 1000) / 1000;
  }
  
  getPossibleMoves(board, turn) {
    
    let balls = board.teamBalls[turn];
    let allMoves = [];
    
    // Looks good (gather possible moves)
    for (let ball of balls) {
      let moves = board.control.getMoves(ball.hole);
      board.control.clearVisited();
      // let score0 = this.getBallScore(board, ball);
      for (let move of moves) {
        // move.ball = ball;
        // let score1 = this.getBallScore(board, move.ball);
        // move.ball = null;
        allMoves.push({from:ball.hole, to:move, /*scoreDiff: score1 - score0*/});
      }
    }
    
    /*allMoves.sort(function(a, b) {
      return b.scoreDiff - a.scoreDiff;
    });*/
    
    return allMoves;
  }
  
  getWinState(board) {
    // Might not be worth calculating this
    
    // +1 (white wins)
    // -1 (black wins)
    // 0 (draw)
    // null (continue)
    // win score: 141.784 points
    
    // All balls on winning side
    
    // Black win
    let blackExists = false;
    let full = true;
    for (let i=13; i<17; i++) {
      for (let hole of board.cols[i]) {
        if (!hole.ball) {
          full = false;
          break;
        } else {
          if (hole.ball.team == 0) blackExists = true;
        }
      }
    }
    if (full && blackExists) return -1;

    // White win (all full and at least one white)
    let whiteExists = false;
    full = true;
    for (let i=0; i<4; i++) {
      for (let hole of board.cols[i]) {
        if (!hole.ball) {
          full = false;
          break;
        } else {
          if (hole.ball.team == 1) whiteExists = true;
        }
      }
    }
    if (full && whiteExists) return 1;
    
    // let win = true;
    // for (let ball of board.teamBalls[0]) {
    //   if (ball.hole.c < 13) {
    //     win = false;
    //     break;
    //   }
    // }
    // if (win) return -1;
    // win = true;
    // for (let ball of board.teamBalls[1]) {
    //   if (ball.hole.c > 3) {
    //     win = false;
    //     break;
    //   }
    // }
    // if (win) return 1;
    
    return null;
  }
  
  minimax(board, turn, depth, alpha, beta) {
    this.permutations++;
    
    let winner = this.getWinState(board); // [win, winner, points]
    let maximizing = turn == this.maximizingTeam;
    
    // Winner
    if (winner != null) {
      // positive : same team
      // negative : opposite team
      return [winner * (10000 - this.movesPlayed) * this.winSide];
    }
    
    // Max depth / permutations reached
    if (depth >= this.maxDepth || this.permutations > this.maxPermutations) {
      return [this.getBoardScore(board) * this.winSide];
    }
    
    let moves = this.getPossibleMoves(board, turn);
    
    // Next turn
    turn = (turn + 1) % board.teams;
    
    if (maximizing) {
      let maxEval = -Infinity, maxAlpha = false;
      let bestMove;
      
      // Further analysis
      for (let i=0; i<moves.length; i++) {
        let move = moves[i];
        
        // Play move
        this.playMove(board, move);
        
        // Calculate next position
        let result = this.minimax(board, turn, depth + 1, alpha, beta);
        let score = result[0];
        
        // Unplay move
        this.unplayMove(board, move);
        
        // Calculate score
        if (score > maxEval) {
          maxEval = score;
          bestMove = move;
        }
        maxEval = max(maxEval, score);
        alpha = max(alpha, score);
        if (beta <= alpha) break;
        
        // if (score > maxEval) {
        //   maxEval = score;
        //   bestMove = move;
        //   if (maxAlpha || score > alpha) {
        //     alpha = score;
        //     maxAlpha = true;
        //     if (beta <= alpha) {
        //       print("pruned!");
        //       break;
        //     }
        //   }
        // }
      }
      
      // Return score
      return [maxEval, bestMove];
    } else {
      let minEval = Infinity, minBeta = false;
      let bestMove;
      for (let i=0; i<moves.length; i++) {
        let move = moves[i];
        
        // Play move
        this.playMove(board, move);
        
        // Calculate next position
        let result = this.minimax(board, turn, depth + 1, alpha, beta);
        let score = result[0];
        
        // Unplay move
        this.unplayMove(board, move);
        
        // Calculate score
        if (score < minEval) {
          minEval = score;
          bestMove = move;
        }
        minEval = min(minEval, score);
        beta = min(beta, score);
        if (beta <= alpha) break;
        
        // if (score < minEval) {
        //   minEval = score;
        //   bestMove = move;
        //   if (minBeta || score > beta) {
        //     beta = score;
        //     minBeta = true;
        //     if (beta <= alpha) break;
        //   }
        // }
      }
      
      // Return score
      return [minEval, bestMove];
    }
  }
  
  bestMove(board) {
    let turn = board.control.turn;
    let topMove = {score:-Infinity};
    this.permutations = 0;
    this.maximizingTeam = turn;
    this.winSide = (turn * 2 - 1);
    
    let result = this.minimax(board, turn, 0, -Infinity, Infinity);
    
    game.board.control.playMove(result[1]);
    this.evaluation = result[0];
    // this.playMove(board, result[1]);
    // board.control.turn = (turn + 1) % board.teams;
  }
  
}

class Tree {
  constructor(parent = null, move = null, moves = null) {
    this.branches = [];
    this.parent = parent;
    this.currentBranch = this;
    this.move = move;
    this.moves = moves;
    this.score = null;
  }
  
  createBranch(move, moves) {
    this.currentBranch.branches.push(new Tree(this, move, moves));
  }
  
  seekBranch(i, move, moves) {
    if (i >= this.currentBranch.branches.length)
      this.createBranch(move, moves);
    
    // Go down the tree
    this.currentBranch = this.currentBranch.branches[i];
  }
  
  bubble() {
    // Go up the tree
    this.currentBranch = this.currentBranch.parent;
  }
  
  setStats(score) {
    this.currentBranch.score = score;
  }
  
}

/*


    /* OLD:
    // Horizontal travel distance
    if (ball.team == 0) {
      score = ball.hole.c;
      
      // Past column 12
      // if (ball.hole.c > 12) score = 10;
      // else score = ball.hole.c / 12 * 6;
    } else {
      score = 16 - ball.hole.c;
    }
    
















*/
