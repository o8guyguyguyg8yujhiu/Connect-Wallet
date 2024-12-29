from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes
from fastapi import FastAPI, Request
import redis
import uvicorn
import asyncio
import threading
import nest_asyncio
from fastapi.middleware.cors import CORSMiddleware
import logging

# Настройки
TELEGRAM_TOKEN = "7836466566:AAGPBD_PvhOovgk3P5_4kXOVxAYvTtbnEW0"
REDIS_HOST = "localhost"
REDIS_PORT = 6379
REACT_URL = "https://90a9-24-150-119-126.ngrok-free.app"

# Инициализация Redis
redis_client = redis.StrictRedis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

# Инициализация FastAPI
app = FastAPI()

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI для получения данных от React
@app.post("/wallet")
async def save_wallet(request: Request):
    try:
        data = await request.json()
        telegram_id = data.get("telegram_id")
        wallet_address = data.get("wallet_address")

        if telegram_id and wallet_address:
            # Сохранение данных в Redis
            redis_client.set(telegram_id, wallet_address)
            logger.info(f"Saved wallet for telegram_id {telegram_id}")
            return {"status": "success", "message": "Wallet saved successfully"}
        return {"status": "error", "message": "Invalid data"}
    except Exception as e:
        logger.error(f"Error in /wallet: {e}")
        return {"status": "error", "message": "Server error"}

# Функция обработки команды /start
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    telegram_id = update.effective_user.id
    react_link = f"{REACT_URL}?telegram_id={telegram_id}"

    # Сохранение Telegram ID в Redis
    redis_client.set(telegram_id, "PENDING")  # Статус PENDING до получения кошелька

    # Отправка ссылки пользователю
    logger.info(f"Sent verification link to user {telegram_id}")
    await update.message.reply_text(
        f"Привет! Перейди по этой ссылке для верификации кошелька: {react_link}"
    )

# Главная функция для запуска Telegram-бота
async def run_telegram_bot():
    application = ApplicationBuilder().token(TELEGRAM_TOKEN).build()
    application.add_handler(CommandHandler("start", start))

    logger.info("Telegram bot is running...")
    await application.run_polling()

# Запуск FastAPI и Telegram-бота
def start_fastapi():
    logger.info("FastAPI server is running...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

if __name__ == "__main__":
    # Устранение конфликта с существующим циклом событий
    nest_asyncio.apply()

    # Запуск FastAPI в отдельном потоке
    fastapi_thread = threading.Thread(target=start_fastapi)
    fastapi_thread.start()

    # Запуск Telegram-бота в текущем цикле событий
    loop = asyncio.get_event_loop()
    loop.run_until_complete(run_telegram_bot())
