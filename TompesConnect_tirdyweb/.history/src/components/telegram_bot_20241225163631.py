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
import secrets
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Environment variables and configuration
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN", "7836466566:AAGPBD_PvhOovgk3P5_4kXOVxAYvTtbnEW0")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REACT_URL = os.getenv("REACT_URL", "https://5f23-24-150-119-126.ngrok-free.app")
PORT = int(os.getenv("PORT", 8000))

# Initialize Redis
try:
    redis_client = redis.StrictRedis(
        host=REDIS_HOST, 
        port=REDIS_PORT, 
        decode_responses=True,
        socket_timeout=5
    )
    redis_client.ping()  # Test connection
    logger.info("Redis connection established successfully")
except redis.ConnectionError as e:
    logger.error(f"Failed to connect to Redis: {e}")
    raise

# Initialize FastAPI
app = FastAPI(title="Telegram Bot API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# CSP Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    
    # Generate nonce for inline scripts
    nonce = secrets.token_hex(16)
    
    # Comprehensive CSP header
    csp_directives = [
        "default-src 'self'",
        f"script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' 'nonce-{nonce}'",
        "style-src 'self' 'unsafe-inline'",
        f"connect-src 'self' {REACT_URL} *",
        "img-src 'self' data: blob: *",
        f"frame-src 'self' {REACT_URL}",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'"
    ]
    
    response.headers["Content-Security-Policy"] = "; ".join(csp_directives)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    return response

# Health check endpoint
@app.get("/health")
async def health_check():
    try:
        # Check Redis connection
        redis_client.ping()
        return {
            "status": "healthy",
            "redis": "connected",
            "timestamp": asyncio.get_event_loop().time()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": asyncio.get_event_loop().time()
        }

# Wallet endpoint
@app.post("/wallet")
async def save_wallet(request: Request):
    logger.info("Received wallet request")
    try:
        data = await request.json()
        logger.info(f"Received wallet data: {data}")
        
        telegram_id = data.get("telegram_id")
        wallet_address = data.get("wallet_address")
        
        if not telegram_id or not wallet_address:
            logger.error("Missing required fields")
            return {
                "status": "error",
                "message": "Missing required fields: telegram_id and wallet_address are required"
            }, 400
            
        # Save to Redis with error handling
        try:
            redis_client.set(f"user_wallet:{telegram_id}", wallet_address)
            logger.info(f"Successfully saved wallet for user {telegram_id}")
        except redis.RedisError as e:
            logger.error(f"Redis error: {e}")
            return {"status": "error", "message": "Database error"}, 500
        
        return {"status": "success", "message": "Wallet saved successfully"}
        
    except Exception as e:
        logger.error(f"Error processing wallet request: {str(e)}")
        return {"status": "error", "message": str(e)}, 500

# Telegram bot command handlers
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        telegram_id = update.effective_user.id
        react_link = f"{REACT_URL}?telegram_id={telegram_id}"

        # Save Telegram ID in Redis
        try:
            redis_client.set(f"user_wallet:{telegram_id}", "PENDING")
            logger.info(f"Saved Telegram ID {telegram_id} with status PENDING")
        except redis.RedisError as e:
            logger.error(f"Redis error in start command: {e}")
            await update.message.reply_text(
                "Sorry, there was an error processing your request. Please try again later."
            )
            return

        await update.message.reply_text(
            f"Hello! Please verify your wallet using this link: {react_link}"
        )
    except Exception as e:
        logger.error(f"Error in start command: {e}")
        await update.message.reply_text(
            "Sorry, an error occurred. Please try again later."
        )

async def run_telegram_bot():
    try:
        application = ApplicationBuilder().token(TELEGRAM_TOKEN).build()
        application.add_handler(CommandHandler("start", start))
        
        logger.info("Telegram bot is starting...")
        await application.run_polling()
    except Exception as e:
        logger.error(f"Error running Telegram bot: {e}")
        raise

def start_fastapi():
    try:
        logger.info(f"Starting FastAPI server on port {PORT}...")
        config = uvicorn.Config(
            app=app,
            host="0.0.0.0",
            port=PORT,
            log_level="info",
            reload=False
        )
        server = uvicorn.Server(config)
        server.run()
    except Exception as e:
        logger.error(f"Error starting FastAPI server: {e}")
        raise

if __name__ == "__main__":
    try:
        # Apply nest_asyncio to avoid event loop conflicts
        nest_asyncio.apply()
        
        # Start FastAPI in a separate thread
        fastapi_thread = threading.Thread(target=start_fastapi, daemon=True)
        fastapi_thread.start()
        
        # Run Telegram bot in the main thread
        asyncio.run(run_telegram_bot())
    except KeyboardInterrupt:
        logger.info("Shutting down services...")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        raise
