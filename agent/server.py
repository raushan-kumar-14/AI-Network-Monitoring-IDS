from flask import Flask, request, jsonify
from flask_cors import CORS
import threading

import config
from capture import start_capture, stop_capture, get_stats

app = Flask(__name__)
CORS(app)

capture_thread = None
capture_running = False


@app.post("/start")
def start():

    global capture_thread
    global capture_running

    if capture_running:
        return jsonify({"status": "already_running"})

    data = request.get_json()

    username = data.get("username")

    config.USERNAME = username

    capture_thread = threading.Thread(
        target=start_capture,
        daemon=True
    )

    capture_thread.start()

    capture_running = True

    return jsonify({
        "status": "started",
        "username": username
    })
    
@app.post("/stop")
def stop():

    global capture_running

    stop_capture()

    capture_running = False

    return jsonify({
        "status": "stopped"
    })

@app.get("/status")
def status():

    return jsonify({
        "running": capture_running
    })

@app.get("/stats")
def stats():
    return jsonify(get_stats())

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5050
    )
    