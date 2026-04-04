import os
import json
import re
from decimal import Decimal
from dotenv import load_dotenv
import google.generativeai as genai
from models.request import PredictionRequest
from models.response import PredictionResponse

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.0-flash")


def build_prompt(req: PredictionRequest) -> str:
    # Calculate hospital days
    from datetime import date
    try:
        admission  = date.fromisoformat(req.admission_date)
        discharge  = date.fromisoformat(req.discharge_date)
        stay_days  = (discharge - admission).days
    except Exception:
        stay_days = 1

    return f"""
You are an expert medical insurance claim analyst for the Indian healthcare market.
Analyze the following insurance claim and provide predictions.

CLAIM DETAILS:
- Treatment: {req.treatment_description}
- Diagnosis Code (ICD-10): {req.diagnosis_code or "Not provided"}
- Claimed Amount: ₹{req.claimed_amount}
- Hospital Stay: {stay_days} days ({req.admission_date} to {req.discharge_date})
- Policy Coverage Type: {req.coverage_type}
- Maximum Policy Coverage: ₹{req.max_coverage}

INSTRUCTIONS:
Analyze this claim and return ONLY a valid JSON object with exactly these fields:

{{
  "approval_likelihood": <float between 0.0 and 1.0>,
  "estimated_payout": <float in INR, realistic payout amount>,
  "estimated_payout_min": <float in INR, minimum likely payout>,
  "estimated_payout_max": <float in INR, maximum likely payout>,
  "fraud_score": <float between 0.0 and 1.0, where 0=no fraud, 1=definite fraud>,
  "cost_benchmark": <float in INR, average market cost for this treatment type>,
  "reasoning": "<2-3 sentence plain English explanation of your assessment>"
}}

SCORING GUIDELINES:
- approval_likelihood: Consider diagnosis clarity, claimed amount vs coverage, stay duration
- fraud_score: Consider if claimed amount is unusually high, stay duration anomalies, vague descriptions
- estimated_payout: Should not exceed max_coverage (₹{req.max_coverage})
- cost_benchmark: Use realistic Indian hospital market rates for this treatment
- reasoning: Be specific, mention the treatment type and key factors

Return ONLY the JSON object, no markdown, no explanation outside the JSON.
""".strip()


def parse_response(text: str) -> dict:
    # Strip markdown code blocks if present
    text = text.strip()
    text = re.sub(r"```(?:json)?", "", text).strip()

    # Extract JSON object
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError("No JSON object found in Gemini response")

    return json.loads(match.group())


async def get_predictions(req: PredictionRequest) -> PredictionResponse:
    prompt = build_prompt(req)

    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.2,         # Low temperature for consistent predictions
            max_output_tokens=1024,
        )
    )

    raw = response.text
    data = parse_response(raw)

    # Clamp values to valid ranges
    approval   = max(0.0, min(1.0, float(data.get("approval_likelihood", 0.5))))
    fraud      = max(0.0, min(1.0, float(data.get("fraud_score", 0.1))))
    payout     = float(data.get("estimated_payout", float(req.claimed_amount) * 0.8))
    payout_min = float(data.get("estimated_payout_min", payout * 0.7))
    payout_max = float(data.get("estimated_payout_max", payout * 1.15))
    benchmark  = float(data.get("cost_benchmark", float(req.claimed_amount)))
    reasoning  = str(data.get("reasoning", "Assessment based on provided claim details."))

    # Ensure payout does not exceed max coverage
    max_cov    = float(req.max_coverage)
    payout     = min(payout,     max_cov)
    payout_max = min(payout_max, max_cov)

    return PredictionResponse(
        approval_likelihood = Decimal(str(round(approval, 3))),
        estimated_payout    = Decimal(str(round(payout, 2))),
        estimated_payout_min= Decimal(str(round(payout_min, 2))),
        estimated_payout_max= Decimal(str(round(payout_max, 2))),
        fraud_score         = Decimal(str(round(fraud, 3))),
        cost_benchmark      = Decimal(str(round(benchmark, 2))),
        reasoning           = reasoning,
    )