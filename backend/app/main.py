from fastapi import FastAPI

app = FastAPI(title="Mapa CU UACJ API")

@app.get("/")
def root():
    return {"mensaje": "API Mapa CU UACJ funcionando"}