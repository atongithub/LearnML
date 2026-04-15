from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
import numpy as np

# Initialize the FastAPI application
app = FastAPI()

# Add CORS middleware to allow cross-origin requests
# This is useful when the frontend is running on a different port or domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow requests from any origin
    allow_credentials=True,
    allow_methods=["*"], # Allow all HTTP methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"], # Allow all custom headers
)

# Define the schema for individual agent performance and neural network weights
class ResultData(BaseModel):
    score: float # The fitness score calculated for the agent
    dist: float # Distance metric, typically used for secondary sorting
    weights: List[List[List[float]]] # The multidimensional arrays representing the neural net weights

# Define the schema for receiving an entire generation's data
class F1GenerationData(BaseModel):
    generation: int # Current generation number
    results: List[ResultData] # List of results for all agents in the population

# Define the schema for receiving 2D points for clustering
class PointsData(BaseModel):
    points: List[List[float]] # A list of [x, y] coordinates

@app.post("/api/evolve/f1")
async def evolve_f1(data: F1GenerationData):
    """
    Receives the results of a single generation of agents.
    Performs sorting based on performance metrics and generates a new population
    using evolutionary strategies (elitism and mutation).
    """
    try:
        # If no results are passed, gracefully return an empty generation
        if not data.results:
            return {"next_generation": []}

        # Sort results: highest score first, then lowest distance structure to prioritize best agents
        sorted_results = sorted(data.results, key=lambda x: (x.score, -x.dist), reverse=True)
        
        # Take the most successful set of neural net weights
        best_weights = sorted_results[0].weights
        pop_size = len(data.results)
        
        # Define the mutation probability rate determining how much an agent's brain will be altered
        mutation_rate = 0.6 
        
        next_gen = []
        # Elitism: Keep the very best performing agent unmodified to ensure progress isn't lost
        next_gen.append({"weights": best_weights})
        
        # Produce offspring for the rest of the generation size target
        for i in range(1, pop_size):
            new_weights = []
            # Apply perturbations to the underlying mathematical network for optimization
            for layer_idx in range(len(best_weights)):
                parent_layer = np.array(best_weights[layer_idx])
                shape = parent_layer.shape
                # Apply random noise modification across the tensors driven by the mutation rate
                mutation = (np.random.rand(*shape) - 0.5) * mutation_rate
                child_layer = parent_layer + mutation
                new_weights.append(child_layer.tolist())
            next_gen.append({"weights": new_weights})

        # Return the newly generated weights format to the simulation logic
        return {"next_generation": next_gen}
    except Exception as e:
        # Prevent silent failures by logging Python exceptions to the API response
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/cluster/stars")
async def cluster_stars(data: PointsData):
    """
    Receives raw 2D spatial points, clusters them mathematically using the K-Means 
    Machine Learning algorithms (Scikit-Learn), and returns categorization labels + cluster centroid anchors.
    """
    try:
        from sklearn.cluster import KMeans
        import numpy as np
        
        # If there's barely enough data context to cluster, return all as group 0
        if len(data.points) < 3:
            return {"labels": [0] * len(data.points), "centroids": []}
            
        # Try finding optimal cluster centers between the requested number or the amount of points
        num_clusters = min(3, len(data.points))
        # Instantiate and fit the standard K-Means clustering algorithm, with n_init to search for optimized bounds
        kmeans = KMeans(n_clusters=num_clusters, n_init=10, random_state=42)
        # Classify and compute groupings immediately against provided data
        labels = kmeans.fit_predict(data.points)
        centroids = kmeans.cluster_centers_.tolist()
        return {"labels": labels.tolist(), "centroids": centroids}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mount static web directory files globally for directly serving the frontend UI
app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/js", StaticFiles(directory="js"), name="js")
# We'll serve index.html directly below as a separate route so it handles root dir requests properly

@app.get("/")
def serve_home():
    """ Return the base UI HTML template rendering all Machine Learning interfaces """
    return FileResponse("index.html")

# Initialize Python server execution protocol
if __name__ == "__main__":
    import uvicorn
    # Boot a local dev server interface wrapping the FastAPI app variable bound to open ports
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)