from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

APP_NAME = os.getenv("APP_NAME")
APP_VERSION = os.getenv("APP_VERSION")
DATABASE_URL = os.getenv("DATABASE_URL")
MODEL_PATH = os.getenv("MODEL_PATH")
DATASET_PATH = os.getenv("DATASET_PATH")
DEBUG = os.getenv("DEBUG")