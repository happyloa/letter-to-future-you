export interface Letter {
  id: string
  recipient_email: string
  subject: string
  content: string
  delivery_date: number
  status: 'pending' | 'sent' | 'failed'
  is_public: number
  created_at: number
}

export interface CreateLetterRequest {
  recipient_email: string
  subject: string
  content: string
  delivery_date: number
  is_public?: boolean
}
