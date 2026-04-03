from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import predict
import uvicorn

app = FastAPI(
    title="HealClaim AI Service",
    description="Gemini-powered insurance claim predictions",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "healclaim-ai"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)