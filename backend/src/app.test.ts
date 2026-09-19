import { describe, expect, it } from 'vitest'
import { app } from './app.js'

describe('app', () => {
  it('GET / returns greeting text', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('Hello Hono!')
  })

  it('GET /api/hello returns JSON message', async () => {
    const res = await app.request('/api/hello')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ message: 'Hello from the Hono backend!' })
  })
})