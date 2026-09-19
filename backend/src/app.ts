import { Hono } from 'hono'

export const app = new Hono()

app.get('/', (c) => c.text('Hello Hono!'))

app.get('/api/hello', (c) => c.json({ message: 'Hello from the Hono backend!' }))