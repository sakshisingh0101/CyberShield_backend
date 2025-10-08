# # ml_backend/main.py
# from fastapi import FastAPI, Request
# from fastapi.middleware.cors import CORSMiddleware
# import pandas as pd
# import numpy as np
# import joblib

# # Load trained KMeans model
# kmeans = joblib.load("ml_service/model/kmeans_model.pkl")

# app = FastAPI()

# # Allow Node.js frontend to call this API
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # Replace "*" with your frontend URL in production
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# @app.post("/predict")
# async def predict(req: Request):
#     """
#     Expects JSON array of ATMs:
#     [
#       {"Bank_Branch": "ATM1", "lat": 28.65, "lon": 77.1, "risk_score": 0.5},
#       ...
#     ]
#     """
#     data = await req.json()
#     df = pd.DataFrame(data)
    
#     # Generate cluster ids using deployed model
#     df['cluster_id'] = kmeans.predict(df[['lat','lon']])
    
#     # Build hotspots JSON
#     hotspots = []
#     for cluster in df['cluster_id'].unique():
#         members = df[df['cluster_id']==cluster]
#         hotspot = {
#             "polygon": members[['lat','lon']].values.tolist(),
#             "cluster_score": round(members['risk_score'].mean(), 2),
#             "member_atms": members['Bank_Branch'].tolist()
#         }
#         hotspots.append(hotspot)
    
#     response = {
#         "hotspots": hotspots,
#         "atms": df.to_dict(orient='records'),
#         "alerts": [{"atm_id": df.iloc[0]['Bank_Branch'], "action": "Send Alert"}]
#     }
    
#     return response


from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import joblib

# Load trained KMeans model
kmeans = joblib.load("ml_service/model/kmeans_model.pkl")

app = FastAPI()

# Allow Node.js frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace "*" with your frontend origin
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

    if df.empty:
        return {"hotspots": [], "alerts": [], "atms": []}

    # Cluster ATMs using pre-trained KMeans
    df['cluster_id'] = kmeans.predict(df[['lat', 'lon']])

    # Define adaptive threshold (for classification, not filtering)
    threshold = max(0.3, round(df['risk_score'].mean(), 2))

    hotspots = []
    alerts = []

    for cluster in df['cluster_id'].unique():
        members = df[df['cluster_id'] == cluster]
        cluster_score = round(members['risk_score'].mean(), 2)

        hotspot = {
            "polygon": members[['lat', 'lon']].values.tolist(),
            "cluster_score": cluster_score,
            "member_atms": members['Bank_Branch'].tolist(),
        }
        hotspots.append(hotspot)

    # 🔥 Send alerts for ALL ATMs, tagging them as high or low risk
    for _, row in df.iterrows():
        alerts.append({
            "atm_id": row['Bank_Branch'],
            "risk_score": row['risk_score'],
            "cluster_id": int(row['cluster_id']),
            "action": "Send Alert",
            "severity": "HIGH" if row['risk_score'] >= threshold else "LOW",
            "reason": (
                "High risk score above threshold"
                if row['risk_score'] >= threshold
                else "Below risk threshold (monitor only)"
            )
        })

    # Sort by risk for clarity
    alerts = sorted(alerts, key=lambda x: x['risk_score'], reverse=True)

    response = {
        "hotspots": hotspots,
        "atms": df.to_dict(orient='records'),
        "alerts": alerts  # now includes all ATMs
    }

    return response

