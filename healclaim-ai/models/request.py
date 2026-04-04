from pydantic import BaseModel
from decimal import Decimal
from typing import Optional

class PredictionRequest(BaseModel):
    claim_id: str
    treatment_description: str
    claimed_amount: Decimal
    diagnosis_code: Optional[str] = ""
    admission_date: str
    discharge_date: str
    coverage_type: str
    max_coverage: Decimal