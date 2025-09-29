export type AppItem = {
    id: string
    company: string
    role: string
    link?: string
    deadline?: string // ISO string
    status?: 'SAVED' | 'APPLIED' | 'OA' | 'INTERVIEW' | 'REJECTED' | 'OFFER'
  }
  