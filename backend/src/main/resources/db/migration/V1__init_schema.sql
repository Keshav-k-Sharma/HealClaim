-- =========================================================
-- HealClaim Init Schema  (Flyway: V1__init_schema.sql)
-- =========================================================

-- ---------------------------------------------------------
-- Custom ENUM types
-- ---------------------------------------------------------
CREATE TYPE user_role AS ENUM ('PATIENT', 'HOSPITAL', 'INSURER');

CREATE TYPE claim_status AS ENUM (
    'DRAFT',
    'PENDING_DECISION',
    'SUBMITTED_TO_INSURER',
    'UNDER_REVIEW',
    'DOCUMENTS_REQUESTED',
    'APPROVED',
    'REJECTED',
    'CASH_PAID'
);

CREATE TYPE document_type AS ENUM (
    'PAN_CARD',
    'AADHAAR',
    'POLICY_DOCUMENT',
    'HOSPITAL_BILL',
    'DISCHARGE_SUMMARY',
    'LAB_REPORT',
    'PRESCRIPTION',
    'DOCTOR_NOTES',
    'ACCREDITATION'
);

CREATE TYPE document_source AS ENUM ('PATIENT_PRE_UPLOAD', 'HOSPITAL_UPLOAD');
CREATE TYPE payment_choice  AS ENUM ('CASH', 'INSURANCE');
CREATE TYPE request_status  AS ENUM ('PENDING', 'FULFILLED');

-- ---------------------------------------------------------
-- users
-- ---------------------------------------------------------
CREATE TABLE users (
    id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email              VARCHAR(255) UNIQUE NOT NULL,
    password_hash      VARCHAR(255) NOT NULL,
    role               user_role    NOT NULL,
    is_verified        BOOLEAN      DEFAULT FALSE,
    verification_token VARCHAR(255),
    created_at         TIMESTAMP    DEFAULT NOW()
);

-- ---------------------------------------------------------
-- insurer_profiles
-- (defined before policies so the FK in policies can reference it)
-- ---------------------------------------------------------
CREATE TABLE insurer_profiles (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name    VARCHAR(255) NOT NULL,
    registration_no VARCHAR(100) NOT NULL,
    created_at      TIMESTAMP    DEFAULT NOW()
);

-- ---------------------------------------------------------
-- policies
-- (defined before patient_profiles so the FK in patient_profiles can reference it inline)
-- ---------------------------------------------------------
CREATE TABLE policies (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    insurer_id      UUID          NOT NULL REFERENCES insurer_profiles(id) ON DELETE CASCADE,
    policy_name     VARCHAR(255)  NOT NULL,
    coverage_type   VARCHAR(100)  NOT NULL,
    max_coverage    DECIMAL(15,2) NOT NULL,
    description     TEXT,
    s3_key_document VARCHAR(500),
    is_active       BOOLEAN       DEFAULT TRUE,
    created_at      TIMESTAMP     DEFAULT NOW()
);

-- ---------------------------------------------------------
-- patient_profiles
-- ---------------------------------------------------------
CREATE TABLE patient_profiles (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID         UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name        VARCHAR(255) NOT NULL,
    national_id      VARCHAR(100) NOT NULL,
    qr_code_token    VARCHAR(255) UNIQUE NOT NULL,
    active_policy_id UUID         REFERENCES policies(id) ON DELETE SET NULL,
    created_at       TIMESTAMP    DEFAULT NOW()
);

-- ---------------------------------------------------------
-- hospital_profiles
-- ---------------------------------------------------------
CREATE TABLE hospital_profiles (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hospital_name   VARCHAR(255) NOT NULL,
    registration_no VARCHAR(100) NOT NULL,
    address         TEXT         NOT NULL,
    created_at      TIMESTAMP    DEFAULT NOW()
);

-- ---------------------------------------------------------
-- patient_documents
-- ---------------------------------------------------------
CREATE TABLE patient_documents (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id  UUID          NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
    doc_type    document_type NOT NULL,
    s3_key      VARCHAR(500)  NOT NULL,
    file_name   VARCHAR(255)  NOT NULL,
    uploaded_at TIMESTAMP     DEFAULT NOW()
);

-- ---------------------------------------------------------
-- claims
-- ---------------------------------------------------------
CREATE TABLE claims (
    id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id            UUID          NOT NULL REFERENCES patient_profiles(id),
    hospital_id           UUID          NOT NULL REFERENCES hospital_profiles(id),
    insurer_id            UUID          REFERENCES insurer_profiles(id),
    policy_id             UUID          REFERENCES policies(id),
    status                claim_status  NOT NULL DEFAULT 'DRAFT',
    payment_choice        payment_choice,
    treatment_description TEXT          NOT NULL,
    admission_date        DATE          NOT NULL,
    discharge_date        DATE          NOT NULL,
    diagnosis_code        VARCHAR(50),
    claimed_amount        DECIMAL(15,2) NOT NULL,
    approved_amount       DECIMAL(15,2),
    created_at            TIMESTAMP     DEFAULT NOW(),
    updated_at            TIMESTAMP     DEFAULT NOW()
);

-- Auto-update updated_at on every UPDATE (Hibernate @UpdateTimestamp + DB-level safety net)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_claims_updated_at
    BEFORE UPDATE ON claims
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------
-- claim_documents
-- ---------------------------------------------------------
CREATE TABLE claim_documents (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id    UUID            NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    uploaded_by UUID            NOT NULL REFERENCES users(id),
    doc_type    document_type   NOT NULL,
    source      document_source NOT NULL,
    s3_key      VARCHAR(500)    NOT NULL,
    file_name   VARCHAR(255)    NOT NULL,
    uploaded_at TIMESTAMP       DEFAULT NOW()
);

-- ---------------------------------------------------------
-- claim_status_history
-- ---------------------------------------------------------
CREATE TABLE claim_status_history (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id    UUID         NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    from_status claim_status,
    to_status   claim_status NOT NULL,
    changed_by  UUID         NOT NULL REFERENCES users(id),
    note        TEXT,
    changed_at  TIMESTAMP    DEFAULT NOW()
);

-- ---------------------------------------------------------
-- document_requests
-- ---------------------------------------------------------
CREATE TABLE document_requests (
    id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id     UUID           NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    requested_by UUID           NOT NULL REFERENCES users(id),
    description  TEXT           NOT NULL,
    status       request_status DEFAULT 'PENDING',
    created_at   TIMESTAMP      DEFAULT NOW()
);

-- ---------------------------------------------------------
-- ai_predictions
-- ---------------------------------------------------------
CREATE TABLE ai_predictions (
    id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id             UUID          UNIQUE NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    approval_likelihood  DECIMAL(4,3),
    estimated_payout     DECIMAL(15,2),
    estimated_payout_min DECIMAL(15,2),
    estimated_payout_max DECIMAL(15,2),
    fraud_score          DECIMAL(4,3),
    cost_benchmark       DECIMAL(15,2),
    reasoning            TEXT,
    generated_at         TIMESTAMP     DEFAULT NOW()
);

-- ---------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------

-- users: email already has an implicit UNIQUE index
-- verification_token lookup used by AuthService.verifyEmail()
CREATE INDEX idx_users_verification_token ON users(verification_token)
    WHERE verification_token IS NOT NULL;

-- patient_profiles
CREATE INDEX idx_patient_qr ON patient_profiles(qr_code_token);

-- patient_documents
CREATE INDEX idx_patient_docs ON patient_documents(patient_id);

-- claims — single-column (list by owner, filter by status)
CREATE INDEX idx_claims_patient  ON claims(patient_id);
CREATE INDEX idx_claims_hospital ON claims(hospital_id);
CREATE INDEX idx_claims_insurer  ON claims(insurer_id);
CREATE INDEX idx_claims_status   ON claims(status);

-- claims — composite (supports findByHospitalAndStatus / findByInsurerAndStatus queries)
CREATE INDEX idx_claims_hospital_status ON claims(hospital_id, status);
CREATE INDEX idx_claims_insurer_status  ON claims(insurer_id,  status);

-- claim_documents
CREATE INDEX idx_claim_docs ON claim_documents(claim_id);

-- claim_status_history
CREATE INDEX idx_status_history ON claim_status_history(claim_id);

-- document_requests (supports findByClaimOrderByCreatedAtDesc + findByClaimAndStatus)
CREATE INDEX idx_doc_requests_claim        ON document_requests(claim_id);
CREATE INDEX idx_doc_requests_claim_status ON document_requests(claim_id, status);