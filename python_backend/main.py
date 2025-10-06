# ml_backend/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import joblib

# Load trained KMeans model
kmeans = joblib.load("ml_service/model/kmeans_model.pkl")

app = FastAPI()

# Allow Node.js frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace "*" with your frontend URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict")
async def predict(req: Request):
    """
    Expects JSON array of ATMs:
    [
      {"Bank_Branch": "ATM1", "lat": 28.65, "lon": 77.1, "risk_score": 0.5},
      ...
    ]
    """
    data = await req.json()
    df = pd.DataFrame(data)
    
    # Generate cluster ids using deployed model
    df['cluster_id'] = kmeans.predict(df[['lat','lon']])
    
    # Build hotspots JSON
    hotspots = []
    for cluster in df['cluster_id'].unique():
        members = df[df['cluster_id']==cluster]
        hotspot = {
            "polygon": members[['lat','lon']].values.tolist(),
            "cluster_score": round(members['risk_score'].mean(), 2),
            "member_atms": members['Bank_Branch'].tolist()
        }
        hotspots.append(hotspot)
    
    response = {
        "hotspots": hotspots,
        "atms": df.to_dict(orient='records'),
        "alerts": [{"atm_id": df.iloc[0]['Bank_Branch'], "action": "Send Alert"}]
    }
    
    return response
