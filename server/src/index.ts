import 'dotenv/config'

import { createApp } from './app'

const PORT = Number.parseInt(process.env.PORT ?? '4000', 10)
const app = createApp()

app.listen(PORT, () => {
  console.log(`Level API listening on http://localhost:${PORT}`)
})
