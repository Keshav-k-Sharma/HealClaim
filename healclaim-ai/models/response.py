from pydantic import BaseModel
from decimal import Decimal
from typing import Optional

class PredictionResponse(BaseModel):
    approval_likelihood: Decimal
    estimated_payout: Decimal
    estimated_payout_min: Decimal
    estimated_payout_max: Decimal
    fraud_score: Decimal
    cost_benchmark: Decimal
    reasoning: str