// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'PATIENT' | 'HOSPITAL' | 'INSURER'

export type ClaimStatus =
  | 'DRAFT'
  | 'PENDING_DECISION'
  | 'SUBMITTED_TO_INSURER'
  | 'UNDER_REVIEW'
  | 'DOCUMENTS_REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CASH_PAID'

export type PaymentChoice = 'CASH' | 'INSURANCE'

export type DocumentType =
  | 'PAN_CARD'
  | 'AADHAAR'
  | 'POLICY_DOCUMENT'
  | 'HOSPITAL_BILL'
  | 'DISCHARGE_SUMMARY'
  | 'LAB_REPORT'
  | 'PRESCRIPTION'
  | 'DOCTOR_NOTES'
  | 'ACCREDITATION'

export type DocumentSource = 'PATIENT_PRE_UPLOAD' | 'HOSPITAL_UPLOAD'



// ─── Entity types ────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  role: UserRole
  isVerified: boolean
  createdAt: string
}

export interface PatientProfile {
  id: string
  userId: string
  fullName: string
  nationalId: string
  qrCodeToken: string
  activePolicyId: string | null
  activePolicyName: string | null
  insurerName: string | null
}

export interface HospitalProfile {
  id: string
  userId: string
  hospitalName: string
  registrationNo: string
  address: string
}

export interface InsurerProfile {
  id: string
  userId: string
  companyName: string
  registrationNo: string
}

export interface Policy {
  id: string
  insurerId: string
  insurerName: string | null
  policyName: string
  coverageType: string
  maxCoverage: number
  description: string | null
  s3KeyDocument: string | null
  isActive: boolean
  createdAt: string
}

export interface PatientDocument {
  id: string
  patientId: string
  docType: DocumentType
  s3Key: string
  fileName: string
  uploadedAt: string
}

export interface Claim {
  id: string
  patientId: string
  patientName: string
  hospitalId: string
  hospitalName: string
  insurerId: string | null
  insurerName: string | null
  policyId: string | null
  policyName: string | null
  status: ClaimStatus
  paymentChoice: PaymentChoice | null
  claimedAmount: number
  approvedAmount: number | null
  createdAt: string
  updatedAt: string
}

export interface ClaimDocument {
  id: string
  claimId: string
  uploadedBy: string
  uploadedByName: string
  docType: DocumentType
  source: DocumentSource
  s3Key: string
  fileName: string
  uploadedAt: string
}

export interface ClaimStatusHistory {
  id: string
  claimId: string
  fromStatus: ClaimStatus | null
  toStatus: ClaimStatus
  changedBy: string
  changedByName: string
  note: string | null
  changedAt: string
}

export interface AIPredictions {
  id: string
  claimId: string
  approvalLikelihood: number    // 0–1
  estimatedPayout: number       // in INR
  estimatedPayoutMin: number
  estimatedPayoutMax: number
  fraudScore: number            // 0–1
  costBenchmark: number         // avg cost for this treatment type
  generatedAt: string
}

export interface DocumentRequest {
  id: string
  claimId: string
  requestedBy: string
  requestedByName: string
  description: string
  status: 'PENDING' | 'FULFILLED'
  createdAt: string
}

// ─── API request / response ───────────────────────────────────────────────────

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  role: UserRole
  userId: string
}

export interface RegisterPatientRequest {
  email: string
  password: string
  fullName: string
  nationalId: string
}

export interface RegisterHospitalRequest {
  email: string
  password: string
  hospitalName: string
  registrationNo: string
  address: string
}

export interface RegisterInsurerRequest {
  email: string
  password: string
  companyName: string
  registrationNo: string
}

export interface ApiError {
  message: string
  status: number
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

export interface PresignedUrlResponse {
  uploadUrl: string
  s3Key: string
  expiresInSeconds: number
}