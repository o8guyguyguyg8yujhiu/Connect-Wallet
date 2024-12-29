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
import uuid

# Настройки
TELEGRAM_TOKEN = "7836466566:AAGPBD_PvhOovgk3P5_4kXOVxAYvTtbnEW0"
REDIS_HOST = "localhost"
REDIS_PORT = 6379
REACT_URL = "https://ee42-24-150-119-126.ngrok-free.app"

# Инициализация Redis
redis_client = redis.StrictRedis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

# Инициализация FastAPI
app = FastAPI()

# Настройка логирования
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ee42-24-150-119-126.ngrok-free.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware для CSP
@app.middleware("http")
async def add_csp_header(request, call_next):
    nonce = str(uuid.uuid4())  # Генерация уникального nonce
    response = await call_next(request)
    response.headers["Content-Security-Policy"] = (
        f"script-src 'self' 'nonce-{nonce}' 'wasm-unsafe-eval';"
    )
    return response

# Обработка preflight-запросов OPTIONS
@app.options("/{path:path}")
async def preflight_handler(path: str):
    return {"status": "success", "message": "Preflight request allowed"}

# FastAPI для получения данных от React
@app.post("/wallet")
async def save_wallet(request: Request):
    try:
        data = await request.json()
        telegram_id = data.get("telegram_id")
        wallet_address = data.get("wallet_address")

        if telegram_id and wallet_address:
            redis_client.set(f"user_wallet:{telegram_id}", wallet_address)
            redis_client.set(f"user_wallet:{telegram_id}:status", "VERIFIED")
            logging.info(f"Saved wallet for telegram_id {telegram_id} with address {wallet_address}")
            return {"status": "success", "message": "Wallet saved successfully"}
        logging.warning("Invalid data received")
        return {"status": "error", "message": "Invalid data"}
    except Exception as e:
        logging.error(f"Error in /wallet: {e}")
        return {"status": "error", "message": "Server error"}

# FastAPI для проверки статуса кошелька
@app.get("/wallet/status/{telegram_id}")
async def get_wallet_status(telegram_id: str):
    try:
        status = redis_client.get(f"user_wallet:{telegram_id}:status")
        if status:
            logging.info(f"Status for telegram_id {telegram_id}: {status}")
            return {"status": "success", "wallet_status": status}
        logging.warning(f"No status found for telegram_id {telegram_id}")
        return {"status": "error", "message": "No wallet status found"}
    except Exception as e:
        logging.error(f"Error in /wallet/status/{telegram_id}: {e}")
        return {"status": "error", "message": "Server error"}

# Функция обработки команды /start
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    telegram_id = update.effective_user.id
    react_link = f"{REACT_URL}?telegram_id={telegram_id}"

    # Сохранение Telegram ID в Redis с ключом "PENDING"
    redis_client.set(f"user_wallet:{telegram_id}", "PENDING")
    redis_client.set(f"user_wallet:{telegram_id}:status", "PENDING")
    logging.info(f"Saved Telegram ID {telegram_id} with status PENDING")

    # Отправка ссылки пользователю
    await update.message.reply_text(
        f"Привет! Перейди по этой ссылке для верификации кошелька: {react_link}"
    )

# Главная функция для запуска Telegram-бота
async def run_telegram_bot():
    application = ApplicationBuilder().token(TELEGRAM_TOKEN).build()
    application.add_handler(CommandHandler("start", start))

    logging.info("Telegram bot is running...")
    await application.run_polling()

# Запуск FastAPI и Telegram-бота
def start_fastapi():
    logging.info("FastAPI server is running...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

if __name__ == "__main__":
    # Устранение конфликта с существующим циклом событий
    nest_asyncio.apply()

    # Запуск FastAPI в отдельном потоке
    fastapi_thread = threading.Thread(target=start_fastapi)
    fastapi_thread.start()

    # Запуск Telegram-бота в текущем цикле событий
    asyncio.run(run_telegram_bot())
