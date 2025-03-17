import logging
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, ContextTypes, filters
from flask import Flask
import os
import json

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

# Create Flask app
app = Flask(__name__)

# Bot configuration
BOT_TOKEN = "7909216903:AAGJXAo1nWT0Wqs6ohOdNaWwtejUEKcHtZs"
WEBAPP_URL = "https://wormgpt-frontend.onrender.com"
PORT = int(os.environ.get('PORT', 10000))

@app.route('/health')
def health():
    return {'status': 'alive'}

def init_bot():
    """Initialize the bot."""
    application = Application.builder().token(BOT_TOKEN).build()
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, web_app_data))
    application.add_error_handler(error_handler)
    return application

def run_bot():
    bot = init_bot()
    bot.run_polling(allowed_updates=Update.ALL_TYPES)

@app.before_first_request
def start_bot():
    import threading
    bot_thread = threading.Thread(target=run_bot)
    bot_thread.daemon = True
    bot_thread.start()
