import logging
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, ContextTypes, filters
from flask import Flask
import threading
import os

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

app = Flask(__name__)

# Bot configuration
BOT_TOKEN = "7909216903:AAGJXAo1nWT0Wqs6ohOdNaWwtejUEKcHtZs"
WEBAPP_URL = "https://wormgpt-frontend.onrender.com"
PORT = int(os.environ.get('PORT', 10000))

@app.route('/health')
def health():
    return {'status': 'alive'}

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [[InlineKeyboardButton(
        "🤖 Open Flash 2.0", 
        web_app=WebAppInfo(url=WEBAPP_URL)
    )]]
    await update.message.reply_text(
        "Welcome! Click the button below to open Flash 2.0:",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

def run_bot():
    """Start the bot."""
    application = Application.builder().token(BOT_TOKEN).build()
    application.add_handler(CommandHandler("start", start_command))
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    # Start bot in a thread
    bot_thread = threading.Thread(target=run_bot)
    bot_thread.daemon = True  # Make thread a daemon so it exits when main thread exits
    bot_thread.start()
    
    # Run Flask app
    app.run(host='0.0.0.0', port=PORT)
