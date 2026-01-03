import { defineEventHandler, createError } from 'h3'
import { Resend } from 'resend'
import type { Letter } from '../../types'

type D1DatabaseLike = {
  prepare: (query: string) => {
    bind: (...args: any[]) => {
      all: <T>() => Promise<{ results?: T[] }>
      run: () => Promise<unknown>
    }
  }
}

type Env = {
  RESEND_API_KEY: string
  RESEND_FROM_EMAIL: string
  DB: D1DatabaseLike
}

export default defineEventHandler(async (event) => {
  const env = event.context.cloudflare?.env as Partial<Env> | undefined

  if (!env?.DB) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Database binding not found. Bind D1 as "DB" to use this endpoint.',
    })
  }

  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Resend environment variables (RESEND_API_KEY, RESEND_FROM_EMAIL) are not configured.',
    })
  }

  const db = env.DB
  const resend = new Resend(env.RESEND_API_KEY)
  const now = Math.floor(Date.now() / 1000)

  const pending = await db
    .prepare(
      `SELECT id, recipient_email, subject, content FROM letters WHERE status = 'pending' AND delivery_date <= ? ORDER BY delivery_date ASC LIMIT 50`
    )
    .bind(now)
    .all<Letter>()

  const letters = pending.results ?? []

  if (!letters.length) {
    return {
      processed: 0,
      sent: 0,
      failed: 0,
      message: 'No pending letters ready to send.',
    }
  }

  let sent = 0
  let failed = 0

  for (const letter of letters) {
    try {
      await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: letter.recipient_email,
        subject: letter.subject,
        text: letter.content,
      })

      await db.prepare(`UPDATE letters SET status = 'sent' WHERE id = ?`).bind(letter.id).run()
      sent += 1
    } catch (error) {
      console.error('Failed to send letter', letter.id, error)
      await db.prepare(`UPDATE letters SET status = 'failed' WHERE id = ?`).bind(letter.id).run()
      failed += 1
    }
  }

  return {
    processed: letters.length,
    sent,
    failed,
  }
})
