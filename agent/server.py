from flask import Flask, request, jsonify
from flask_cors import CORS
import threading

import config
from capture import start_capture, stop_capture, get_stats

app = Flask(__name__)
CORS(app)

capture_thread = None



@app.post("/start")
def start():

    global capture_thread


    if capture_thread is not None and capture_thread.is_alive():
        return jsonify({"status": "already_running"})

    data = request.get_json()

    username = data.get("username")

    config.USERNAME = username

    capture_thread = threading.Thread(
        target=start_capture,
        daemon=True
    )

    capture_thread.start()

    

    return jsonify({
        "status": "started",
        "username": username
    })
    
@app.post("/stop")
def stop():

    stop_capture()

    return jsonify({
        "status": "stopped"
    })

@app.get("/status")
def status():
    return jsonify({
        "running": (
            capture_thread is not None
            and capture_thread.is_alive()
        )
    })

@app.route("/stats")
def stats():
    stats = get_stats()

    stats["thread_alive"] = (
        capture_thread is not None
        and capture_thread.is_alive()
    )

    return jsonify(stats)

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5050
    )
    