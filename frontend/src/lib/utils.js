import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatDateTime(date) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getDaysOverdue(dueDate) {
  const due = new Date(dueDate)
  const today = new Date()
  const diffTime = today - due
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
}

export function calculateRiskScore(userHistory) {
  if (!userHistory || userHistory.length === 0) return 0
  
  let lateReturns = 0
  let totalTransactions = userHistory.length
  
  userHistory.forEach(transaction => {
    if (transaction.returnDate && transaction.dueDate) {
      const due = new Date(transaction.dueDate)
      const returned = new Date(transaction.returnDate)
      if (returned > due) {
        lateReturns++
      }
    }
  })
  
  return Math.round((lateReturns / totalTransactions) * 100)
}

export function getRiskLevel(score) {
  if (score >= 70) return { level: 'high', color: 'text-red-500', bg: 'bg-red-500/10' }
  if (score >= 40) return { level: 'medium', color: 'text-amber-500', bg: 'bg-amber-500/10' }
  return { level: 'low', color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
}
