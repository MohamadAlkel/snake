const express = require("express");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(bodyParser.json());

const defaultFirstMoveX = 1;

let gameState = {
  gameId: "",
  width: 0,
  height: 0,
  score: 0,
  fruit: { x: 0, y: 0 },
  snake: { x: 0, y: 0, velX: defaultFirstMoveX, velY: 0 },
};

function generateRandomPosition(maxX, maxY) {
  const x = Math.floor(Math.random() * maxX);
  const y = Math.floor(Math.random() * maxY);
  return { x, y };
}

app.get("/new", (req, res) => {
  const { w, h } = req.query;

  const width = parseInt(w);
  const height = parseInt(h);

  if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
    return res.status(400).json({ error: "Invalid width or height." });
  }

  gameState = {
    gameId: uuidv4(),
    width: width,
    height: height,
    score: 0,
    fruit: generateRandomPosition(width, height),
    snake: { x: 0, y: 0, velX: 1, velY: 0 },
  };

  res.status(200).json(gameState);
});

app.post("/validate", (req, res) => {
  const { state, ticks } = req.body;

  if (
    !state ||
    !ticks ||
    !state.gameId ||
    !state.width ||
    !state.height ||
    state.score < 0 ||
    !state.fruit ||
    !state.snake
  ) {
    return res.status(400).json({ error: "Invalid request body." });
  }

  if (state.gameId !== gameState.gameId) {
    return res.status(404).json({ error: "Game not found." });
  }

  let snakeX = gameState.snake.x;
  let snakeY = gameState.snake.y;
  let validMove = false;
  const allowedMovment = [0, 1, -1];

  for (let i = 0; i < ticks.length; i++) {
    const { velX, velY } = ticks[i];
    const { preVelX, preVelY } = ticks[i - 1] || {
      preVelX: gameState.snake.velX,
      preVelY: gameState.snake.velY,
    };

    if (velX === -preVelX && velY === -preVelY) {
      return res.status(418).json({ error: "180-degree Invalid move." });
    }

    if (!allowedMovment.includes(velX) || !allowedMovment.includes(velY)) {
      return res
        .status(418)
        .json({ error: "Invalid move: velX and velY must be 0, 1, or -1." });
    }

    if (velX === 0 && velY === 0) {
      return res.status(418).json({
        error: "Invalid move: can not stop the move",
      });
    }

    if (velY !== 0 && velX !== 0) {
      return res.status(418).json({
        error: "Can not move x and y in same time.",
      });
    }

    // first move
    if (i === 0) {
      snakeX += defaultFirstMoveX;
    }

    snakeX += velX;
    snakeY += velY;

    if (
      snakeX < 0 ||
      snakeX >= gameState.width ||
      snakeY < 0 ||
      snakeY >= gameState.height
    ) {
      return res.status(418).json({ error: "Game over, snake out of bounds." });
    }

    if (snakeX === gameState.fruit.x && snakeY === gameState.fruit.y) {
      validMove = true;
      break;
    }
  }

  if (!validMove) {
    return res.status(404).json({ error: "Fruit not found in ticks." });
  }

  gameState.score++;
  gameState.fruit = generateRandomPosition(gameState.width, gameState.height);
  gameState.snake.x = 0;
  gameState.snake.y = 0;
  gameState.snake.velX = 1;
  gameState.snake.velY = 0;

  res.status(200).json(gameState);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
