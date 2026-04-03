import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ClaimStatus } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString))
}

export function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

export const claimStatusConfig: Record<
  ClaimStatus,
  { label: string; color: string; bg: string }
> = {
  DRAFT:                  { label: 'Draft',               color: 'text-gray-600',    bg: 'bg-gray-100'    },
  PENDING_DECISION:       { label: 'Pending Decision',    color: 'text-teal-700',    bg: 'bg-teal-50'     },
  SUBMITTED_TO_INSURER:   { label: 'Submitted',           color: 'text-blue-700',    bg: 'bg-blue-50'     },
  UNDER_REVIEW:           { label: 'Under Review',        color: 'text-blue-700',    bg: 'bg-blue-50'     },
  DOCUMENTS_REQUESTED:    { label: 'Docs Requested',      color: 'text-amber-700',   bg: 'bg-amber-50'    },
  APPROVED:               { label: 'Approved',            color: 'text-green-700',   bg: 'bg-green-50'    },
  REJECTED:               { label: 'Rejected',            color: 'text-red-700',     bg: 'bg-red-50'      },
  CASH_PAID:              { label: 'Cash Paid',           color: 'text-gray-600',    bg: 'bg-gray-100'    },
}