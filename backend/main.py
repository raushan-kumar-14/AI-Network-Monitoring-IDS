from fastapi import FastAPI

app = FastAPI(
    title="AI Network Monitoring IDS",
    version="1.0.0"
)

@app.get("/")
def home():
    return {
        "message": "AI Network Monitoring & Intrusion Detection System Running"
    }