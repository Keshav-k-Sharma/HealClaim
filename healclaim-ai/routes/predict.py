from fastapi import APIRouter, HTTPException
from models.request import PredictionRequest
from models.response import PredictionResponse
from services.gemini_service import get_predictions
import logging

logger = APIRouter()
router = APIRouter(prefix="", tags=["predictions"])


@router.post("/predict", response_model=PredictionResponse)
async def predict(req: PredictionRequest):
    try:
        result = await get_predictions(req)
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        logging.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail="Prediction service unavailable.")


@router.post("/predict/batch", response_model=list[PredictionResponse])
async def predict_batch(requests: list[PredictionRequest]):
    results = []
    for req in requests:
        try:
            result = await get_predictions(req)
            results.append(result)
        except Exception as e:
            logging.error(f"Batch prediction error for {req.claim_id}: {str(e)}")
    return results