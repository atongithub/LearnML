from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any

app = FastAPI(title="The AI Codex API")

# Add CORS so frontend can communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SketchData(BaseModel):
    image_data: str

class PointsData(BaseModel):
    points: List[List[float]]

class F1GenerationData(BaseModel):
    generation: int
    scores: List[float]
    population: List[Dict[str, Any]]

@app.post("/api/cluster/stars")
async def cluster_stars(data: PointsData):
    """
    Receives points, clusters via K-Means (Scikit-Learn), and returns labels + centroids.
    """
    try:
        from sklearn.cluster import KMeans
        import numpy as np
        
        if len(data.points) < 3:
            return {"labels": [0] * len(data.points), "centroids": []}
            
        num_clusters = min(3, len(data.points))
        kmeans = KMeans(n_clusters=num_clusters, n_init=10, random_state=42)
        labels = kmeans.fit_predict(data.points)
        centroids = kmeans.cluster_centers_.tolist()
        return {"labels": labels.tolist(), "centroids": centroids}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/evolve/f1")
async def evolve_f1(data: F1GenerationData):
    """
    Receives scores and current generation, returns next generation weights.
    Simple Genetic Algorithm: Selection, Crossover, Mutation.
    """
    try:
        import numpy as np
        if not data.population or len(data.scores) != len(data.population):
            return {"next_generation": data.population}

        pop_size = len(data.population)
        
        # Sort by scores (highest first). If scores are all zero, keep as is
        sorted_indices = np.argsort(data.scores)[::-1]
        
        # Select top 2 as parents
        parent1 = data.population[sorted_indices[0]]['weights']
        parent2 = data.population[sorted_indices[1]]['weights']
        
        next_gen = []
        # Keep best performing member (Elitism)
        next_gen.append({"weights": parent1})
        
        for i in range(1, pop_size):
            # Crossover
            child_weights = []
            for j in range(len(parent1)):
                if np.random.rand() > 0.5:
                    child_weights.append(parent1[j])
                else:
                    child_weights.append(parent2[j])
            
            # Mutation
            mutation_rate = 0.1
            for j in range(len(child_weights)):
                if np.random.rand() < mutation_rate:
                    # slight random adjustment
                    child_weights[j] += np.random.randn() * 0.5
                    
            next_gen.append({"weights": child_weights})

        return {"next_generation": next_gen}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/js", StaticFiles(directory="js"), name="js")
# We'll serve index.html separately so it handles root dir properly

@app.get("/")
def serve_home():
    return FileResponse("index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
