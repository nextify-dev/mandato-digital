const express = require('express')
const cors = require('cors')
const fetch = require('node-fetch')

const app = express()
const port = 3000

app.use(express.json())
app.use(cors())

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend funcionando com Realtime Database!' })
})

app.listen(port, () => {
  console.log(`Proxy rodando em http://localhost:${port}`)
})
