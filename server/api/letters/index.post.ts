import { defineEventHandler, readBody, createError } from 'h3'
import type { CreateLetterRequest, Letter } from '../../types'

export default defineEventHandler(async (event) => {
  const body = await readBody<CreateLetterRequest>(event)

  // Basic validation
  if (!body.recipient_email || !body.subject || !body.content || !body.delivery_date) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields',
    })
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(body.recipient_email)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid email format',
    })
  }

  // Validate delivery date is in the future
  const now = Math.floor(Date.now() / 1000)
  // Converting input delivery_date (assuming ms or s) to seconds if needed or use as is.
  // Spec says "Unix Timestamp, UTC" which usually means seconds for SQLite/D1 often, but JS uses ms.
  // We assume the frontend sends a timestamp.
  // If the frontend sends ISO string, we need to parse it.
  // Let's assume the frontend sends Unix Timestamp (seconds or milliseconds).
  // The schema says INTEGER.
  // Standard Unix Timestamp is seconds.

  let deliveryDateSeconds = body.delivery_date
  // If the timestamp is in milliseconds (huge number), convert to seconds.
  if (deliveryDateSeconds > 10000000000) {
    deliveryDateSeconds = Math.floor(deliveryDateSeconds / 1000)
  }

  if (deliveryDateSeconds <= now) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Delivery date must be in the future',
    })
  }

  const id = crypto.randomUUID()
  const createdAt = now
  const isPublic = body.is_public ? 1 : 0
  const status = 'pending'

  // Access D1 database
  // Assuming the binding name is 'DB' as is common convention or based on "NuxtHub" defaults.
  // In NuxtHub, it might be `hub.database()`, but here we assume standard Cloudflare binding on `event.context.cloudflare.env`.
  const db = event.context.cloudflare?.env?.DB

  if (!db) {
    // If running in development without bindings properly mocked or set up
    console.error('Database binding not found')
    throw createError({
      statusCode: 500,
      statusMessage: 'Database connection error',
    })
  }

  try {
    const query = `
      INSERT INTO letters (id, recipient_email, subject, content, delivery_date, status, is_public, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `

    await db.prepare(query)
      .bind(id, body.recipient_email, body.subject, body.content, deliveryDateSeconds, status, isPublic, createdAt)
      .run()

    return {
      success: true,
      id: id
    }
  } catch (error) {
    console.error('Failed to insert letter:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to save letter',
    })
  }
})
