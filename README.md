<div align="center">

<br/>

```
██╗  ██╗███████╗ █████╗ ██╗      ██████╗██╗      █████╗ ██╗███╗   ███╗
██║  ██║██╔════╝██╔══██╗██║     ██╔════╝██║     ██╔══██╗██║████╗ ████║
███████║█████╗  ███████║██║     ██║     ██║     ███████║██║██╔████╔██║
██╔══██║██╔══╝  ██╔══██║██║     ██║     ██║     ██╔══██║██║██║╚██╔╝██║
██║  ██║███████╗██║  ██║███████╗╚██████╗███████╗██║  ██║██║██║ ╚═╝ ██║
╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝ ╚═════╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝     ╚═╝
```

**Paperless medical insurance claims, simplified.**

*Connecting patients, hospitals, and insurers — built for developing nations.*

<br/>

<img width="1920" height="1080" alt="Screenshot 2026-04-03 193440" src="https://github.com/user-attachments/assets/00df8c9a-9a5c-464b-8ce8-e87ab2e85a00" />
<img width="1920" height="1080" alt="Screenshot 2026-04-03 193452" src="https://github.com/user-attachments/assets/1d13c2f5-ab73-4691-867e-592df798cf89" />
<img width="1920" height="1080" alt="Screenshot 2026-04-04 100257" src="https://github.com/user-attachments/assets/27880ae0-8a26-42b3-a4ae-6e0a2adb784b" />
<img width="1920" height="1080" alt="Screenshot 2026-04-04 131753" src="https://github.com/user-attachments/assets/5bc743f3-841d-4cff-af69-8d062af7c2bf" />
<img width="1920" height="1080" alt="Screenshot 2026-04-04 100358" src="https://github.com/user-attachments/assets/127b1bc2-6b1f-4bf6-80c4-88f71e10609f" />






<br/>

</div>

---

## 👥 Team

| Name | Role | GitHub |
|---|---|---|
| **Keshav K Sharma** | Frontend Development | [@Keshav-k-Sharma](https://github.com/Keshav-k-Sharma) |
| **Pranjal Garg** | Backend Development | [@pranjal-garg](https://github.com/pranjal-garg) |
| **Adwaith** | AI Service & Gemini Integration | [@Adwaith-J](https://github.com/Adwaith-J)|
| **Niranjana** | UI/UX Design | [@NiranjanaKrishnaK](https://github.com/NiranjanaKrishnaK)   |

---

---

## 🩺 The Problem

In developing nations, medical insurance claims are broken:

- Patients carry **physical documents** to every hospital visit
- Claims take **weeks or months** to process manually
- Patients have **zero visibility** into their claim status
- **No fraud detection** on submitted claims
- Hospitals, insurers, and patients operate in **complete silos**

---

## ✨ What HealClaim Does

```
Patient registers once → uploads documents → gets a QR code

         At the hospital
         ──────────────
         Hospital scans QR → all docs load instantly
         Hospital uploads bills + reports → submits bundle
                        ↓
         Patient notified → chooses: Cash or Insurance
                        ↓
         AI reads actual documents → generates predictions
                        ↓
         Insurer reviews → approves in one click
```

---

## 🏗 Architecture

```
┌────────────────────────────────────┐
│         Vercel — Next.js           │
│  Patient · Hospital · Insurer UI   │
└──────────────┬─────────────────────┘
               │ JWT Auth
               ▼
┌────────────────────────────────────┐
│         EC2 — Spring Boot :8080    │  ──→  Supabase PostgreSQL
│         Business Logic + Auth      │
│         Claim Workflow Engine      │  ──→  AWS S3 (documents)
└──────────────┬─────────────────────┘
               │ Internal HTTP
               ▼
┌────────────────────────────────────┐
│         EC2 — FastAPI :8000        │
│         Gemini 2.0 Flash           │
│         Document Analysis + AI     │
└────────────────────────────────────┘
```

> Each service is responsible for one thing. Spring Boot owns business logic. FastAPI owns AI inference. If the AI service is down, claims still process — predictions just show as pending.

---

## 🤖 AI Predictions

Gemini **reads the actual uploaded documents** — not just form fields.

| What it reads | What it checks |
|---|---|
| Hospital bill PDF | Line items vs claimed amount |
| Discharge summary | Diagnosis matches ICD-10 code |
| Policy document | Exclusions, sub-limits, co-payment clauses |
| Lab reports | Test results support the diagnosis |

**Four predictions generated for all three roles simultaneously:**

| Metric | Description |
|---|---|
| Approval likelihood | 0–100% probability of approval |
| Estimated payout | Settlement amount with min/max range |
| Fraud score | Document anomaly detection |
| Cost benchmark | Average market cost for this treatment in India |

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind v4, Zustand |
| **Backend** | Spring Boot 3.5, Java 21, Spring Security, JJWT |
| **AI Service** | FastAPI, Python 3.12, Gemini 2.0 Flash, PyMuPDF, boto3 |
| **Database** | PostgreSQL on Supabase |
| **Storage** | AWS S3 with presigned URLs (files never touch the server) |
| **Deployment** | Vercel (frontend) · EC2 t2.medium (backend + AI) |

---

## 🚀 Running Locally

**Prerequisites:** Java 21, Node.js 18+, Python 3.12+, Maven

```bash
# 1. Frontend
cd healclaim-frontend && npm install && npm run dev
# → http://localhost:3000

# 2. Spring Boot
cd backend && ./mvnw spring-boot:run
# → http://localhost:8080

# 3. FastAPI AI Service
cd healclaim-ai
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# → http://localhost:8000


**Load demo data:**

cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=seed
```

## 📁 Project Structure
```

HealClaim-Project/
├── healclaim-frontend/
│   └── src/
│       ├── app/(auth)/          # Login, register, verify
│       ├── app/(patient)/       # Patient dashboard + flows
│       ├── app/(hospital)/      # Hospital dashboard + flows
│       ├── app/(insurer)/       # Insurer dashboard + flows
│       ├── components/common/   # Shared UI components
│       ├── lib/                 # api.ts · types.ts · utils.ts
│       └── store/               # Zustand auth store
│
├── backend/
│   └── src/main/java/com/healclaim/backend/
│       ├── controller/          # REST endpoints
│       ├── service/             # Business logic
│       ├── entity/              # JPA entities
│       ├── security/            # JWT filter
│       └── config/              # S3, Security, WebClient
│
└── healclaim-ai/
    ├── routes/predict.py        # /predict endpoint
    └── services/
        ├── gemini_service.py    # Gemini integration
        ├── s3_service.py        # Document fetching
        └── document_processor.py # PDF → base64
```



<div align="center">

*Built with ❤️ for a hackathon · *

</div>
