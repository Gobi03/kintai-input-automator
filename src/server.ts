import express from 'express'
import { fetchConversationsHistory } from './app'

const app = express()

app.use((_, res, next) => {
    res.header(
        'Access-Control-Allow-Origin',
        'https://opthd--teamspirit.visualforce.com'
    )
    next()
})

app.get('/', (req, res) => {
    res.contentType('application/json')
    fetchConversationsHistory(
        Number(req.query.year),
        Number(req.query.month),
        Number(req.query.day)
    ).then(ch => res.json(ch))
})

app.get('/:year(\\d+)/:month(\\d+)/:day(\\d+)/', (req, res) => {
    res.contentType('application/json')
    fetchConversationsHistory(
        Number(req.params.year),
        Number(req.params.month),
        Number(req.params.day)
    ).then(ch => res.json(ch))
})

const port = 3000
app.listen(port, () => {
    console.log(`Running at Port ${port}...`)
})
