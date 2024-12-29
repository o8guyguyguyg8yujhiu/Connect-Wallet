require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const redis = require("redis");

const app = express();
const port = process.env.PORT || 8000;

// Создаем клиент Redis
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379", // Укажите URL для вашего Redis
});

redisClient.on("error", (err) => console.error("Redis error:", err));
redisClient.connect().then(() => console.log("Connected to Redis"));

// Middleware для парсинга JSON
app.use(bodyParser.json());

// Эндпоинт для сохранения данных
app.post("/save-user", async (req, res) => {
  const { telegramId, walletAddress } = req.body;

  if (!telegramId || !walletAddress) {
    return res.status(400).json({ error: "Missing telegramId or walletAddress" });
  }

  try {
    // Сохраняем данные в Redis
    await redisClient.set(
      `user:${telegramId}`,
      JSON.stringify({ telegramId, walletAddress })
    );
    res.status(200).json({ message: "Data saved successfully" });
  } catch (err) {
    console.error("Error saving data to Redis:", err);
    res.status(500).json({ error: "Failed to save data" });
  }
});

// Эндпоинт для получения данных (по необходимости)
app.get("/get-user/:telegramId", async (req, res) => {
  const { telegramId } = req.params;

  try {
    const data = await redisClient.get(`user:${telegramId}`);
    if (!data) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(JSON.parse(data));
  } catch (err) {
    console.error("Error retrieving data from Redis:", err);
    res.status(500).json({ error: "Failed to retrieve data" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
