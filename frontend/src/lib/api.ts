import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios'
import type {
  ApiError,
  LoginRequest,
  LoginResponse,
  RegisterPatientRequest,
  RegisterHospitalRequest,
  RegisterInsurerRequest,
  PatientProfile,
  HospitalProfile,
  InsurerProfile,
  Claim,
  ClaimDocument,
  ClaimStatusHistory,
  AIPredictions,
  PatientDocument,
  DocumentRequest,
  Policy,
  PresignedUrlResponse,
} from './types'

// ─── Axios instance ───────────────────────────────────────────────────────────

const BASE_URL ="https://w9kabl1z9b.execute-api.ap-south-1.amazonaws.com/Prod/api" 

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

// Attach JWT on every request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token')
      if (token) config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (err) => Promise.reject(err)
)

// Normalize errors + handle 401
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    const data = err.response?.data as Record<string, unknown> | undefined
    const apiError: ApiError = {
      message: (data?.message as string) ?? 'An unexpected error occurred.',
      status: err.response?.status ?? 0,
      errors: data?.errors as Record<string, string[]> | undefined,
    }
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(apiError)
  }
)

// ─── S3 direct upload helper ──────────────────────────────────────────────────

export async function uploadFileToS3(presignedUrl: string, file: File): Promise<void> {
  await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (data: LoginRequest) =>
    api.post('/auth/login', data).then((r) => r.data.data as LoginResponse),

  registerPatient: (data: RegisterPatientRequest) =>
    api.post('/auth/register/patient', data).then((r) => r.data),

  registerHospital: (data: RegisterHospitalRequest) =>
    api.post('/auth/register/hospital', data).then((r) => r.data),

  registerInsurer: (data: RegisterInsurerRequest) =>
    api.post('/auth/register/insurer', data).then((r) => r.data),

  verify: (token: string) =>
    api.get(`/auth/verify?token=${token}`).then((r) => r.data),
}

// ─── Patient ─────────────────────────────────────────────────────────────────

export const patientApi = {
  getProfile: () =>
    api.get('/patients/me').then((r) => r.data.data as PatientProfile),

  getQRToken: () =>
    api.get('/patients/qr').then((r) => r.data.data as { qrCodeToken: string }),

  getClaims: () =>
    api.get('/claims/mine').then((r) => r.data.data as Claim[]),

  uploadDocument: async (docType: string, file: File): Promise<PatientDocument> => {
    // Step 1 — get presigned PUT URL from backend
    const presignRes = await api.get('/patients/documents/presign', {
      params: {
        docType,
        fileName: file.name,
        contentType: file.type,
      },
    })
    const { uploadUrl, s3Key } = presignRes.data.data as PresignedUrlResponse

    // Step 2 — upload file directly to S3
    await uploadFileToS3(uploadUrl, file)

    // Step 3 — confirm upload to backend so it saves the record
    const confirmRes = await api.post('/patients/documents/confirm', null, {
      params: { docType, s3Key, fileName: file.name },
    })
    return confirmRes.data.data as PatientDocument
  },

  getDocuments: () =>
    api.get('/patients/documents').then((r) => r.data.data as PatientDocument[]),

  makeDecision: (claimId: string, choice: 'CASH' | 'INSURANCE') =>
    api
      .post(`/claims/${claimId}/decision`, { choice })
      .then((r) => r.data.data as Claim),

  getAvailablePolicies: () =>
    api.get('/patients/policies/available')
      .then((r) => r.data.data as Policy[]),

  linkPolicy: (policyId: string) =>
    api.put('/patients/me/policy', null, { params: { policyId } })
      .then((r) => r.data.data as PatientProfile),
}

// ─── Hospital ─────────────────────────────────────────────────────────────────

export const hospitalApi = {
  getProfile: () =>
    api.get('/hospitals/me').then((r) => r.data.data as HospitalProfile),

  lookupPatient: (qrToken: string) =>
    api
      .get('/patients/by-qr', { params: { token: qrToken } })
      .then((r) => r.data.data as PatientProfile),

  createClaim: (data: {
    patientQrToken: string
    treatmentDescription: string
    admissionDate: string
    dischargeDate: string
    claimedAmount: number
    diagnosisCode?: string
  }) => api.post('/claims', data).then((r) => r.data.data as Claim),

  getClaims: () =>
    api.get('/claims').then((r) => r.data.data as Claim[]),

  uploadClaimDocument: async (
    claimId: string,
    docType: string,
    file: File
  ): Promise<ClaimDocument> => {
    // Step 1 — presign
    const presignRes = await api.post(
      `/claims/${claimId}/documents/presign`,
      null,
      { params: { fileName: file.name, contentType: file.type } }
    )
    const { uploadUrl, s3Key } = presignRes.data.data as PresignedUrlResponse

    // Step 2 — upload to S3
    await uploadFileToS3(uploadUrl, file)

    // Step 3 — confirm
    const confirmRes = await api.post(
      `/claims/${claimId}/documents/confirm`,
      null,
      {
        params: {
          docType,
          s3Key,
          fileName: file.name,
          source: 'HOSPITAL_UPLOAD',
        },
      }
    )
    return confirmRes.data.data as ClaimDocument
  },

  submitBundle: (claimId: string) =>
    api.post(`/claims/${claimId}/submit`).then((r) => r.data.data as Claim),

  fulfillDocumentRequest: async (
    claimId: string,
    requestId: string,
    file: File
  ): Promise<void> => {
    // Step 1 — presign
    const presignRes = await api.post(
      `/claims/${claimId}/documents/presign`,
      null,
      { params: { fileName: file.name, contentType: file.type } }
    )
    const { uploadUrl, s3Key } = presignRes.data.data as PresignedUrlResponse

    // Step 2 — upload to S3
    await uploadFileToS3(uploadUrl, file)

    // Step 3 — confirm document upload
    await api.post(`/claims/${claimId}/documents/confirm`, null, {
      params: {
        docType: 'DOCTOR_NOTES',
        s3Key,
        fileName: file.name,
        source: 'HOSPITAL_UPLOAD',
      },
    })

    // Step 4 — mark document request as fulfilled
    await api.post(
      `/claims/${claimId}/document-requests/${requestId}/fulfill`
    )
  },
}

// ─── Insurer ─────────────────────────────────────────────────────────────────

export const insurerApi = {
  getProfile: () =>
    api.get('/insurers/me').then((r) => r.data.data as InsurerProfile),

  getClaims: () =>
    api.get('/claims').then((r) => r.data.data as Claim[]),

  updateClaimStatus: (
    claimId: string,
    data: {
      status: 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW'
      note?: string
      approvedAmount?: number
    }
  ) =>
    api
      .put(`/claims/${claimId}/status`, data)
      .then((r) => r.data.data as Claim),

  requestDocuments: (claimId: string, description: string) =>
    api
      .post(`/claims/${claimId}/document-requests`, { description })
      .then((r) => r.data.data as DocumentRequest),

  getPolicies: () =>
    api.get('/policies').then((r) => r.data.data as Policy[]),

  createPolicy: (data: {
    policyName: string
    coverageType: string
    maxCoverage: number
    description?: string
    isActive: boolean
  }) => api.post('/policies', data).then((r) => r.data.data as Policy),

  uploadPolicyDocument: async (
    policyId: string,
    file: File
  ): Promise<Policy> => {
    // Step 1 — presign
    const presignRes = await api.post(
      `/policies/${policyId}/document/presign`,
      null,
      { params: { fileName: file.name, contentType: file.type } }
    )
    const { uploadUrl, s3Key } = presignRes.data.data as PresignedUrlResponse

    // Step 2 — upload to S3
    await uploadFileToS3(uploadUrl, file)

    // Step 3 — confirm
    const confirmRes = await api.post(
      `/policies/${policyId}/document/confirm`,
      null,
      { params: { s3Key } }
    )
    return confirmRes.data.data as Policy
  },
}

// ─── Shared (all roles) ───────────────────────────────────────────────────────

export const claimsApi = {
  getById: (claimId: string) =>
    api.get(`/claims/${claimId}`).then((r) => r.data.data as Claim),

  getDocuments: (claimId: string) =>
    api
      .get(`/claims/${claimId}/documents`)
      .then((r) => r.data.data as ClaimDocument[]),

  getStatusHistory: (claimId: string) =>
    api
      .get(`/claims/${claimId}/history`)
      .then((r) => r.data.data as ClaimStatusHistory[]),

  getPredictions: (claimId: string) =>
    api
      .get(`/claims/${claimId}/predictions`)
      .then((r) => r.data.data as AIPredictions),

  getDocumentRequests: (claimId: string) =>
    api
      .get(`/claims/${claimId}/document-requests`)
      .then((r) => r.data.data as DocumentRequest[]),
}

export const documentApi = {
  getViewUrl: (s3Key: string) =>
    api.get('/documents/view-url', { params: { s3Key } })
      .then((r) => r.data.data as { url: string; expiresInSeconds: string }),
}

export default api