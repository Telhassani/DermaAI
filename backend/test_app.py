from fastapi import FastAPI, Request
import uvicorn

app = FastAPI()

@app.post("/login")
async def login(request: Request):
    print("DEBUG: Login called", flush=True)
    body = await request.body()
    print(f"DEBUG: Body read: {len(body)} bytes", flush=True)
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
