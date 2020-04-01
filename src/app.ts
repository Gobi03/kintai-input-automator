import { App } from '@slack/bolt'

const myToken = process.env.SLACK_BOT_TOKEN
const mySigningSecret = process.env.SLACK_SIGNING_SECRET

const boltApp = new App({
    token: myToken,
    signingSecret: mySigningSecret,
})

const kintaiChannelId = process.env.KINTAI_CHANNEL_ID!
const myUserId = process.env.USER_ID

const shukkinWords = ['はじ', ':rimohaji:']
const taikinWords = ['おわ', ':rimoowa:', '退勤', ':taikin_shimasu:']
const kyuukeiWords = ['休憩', '再開', '復帰']

type Msg = {
    client_msg_id: string
    type: string
    text: string
    user: string
    ts: string
    team: string
    blocks: any[]
}

export type data = {
    shukkinTime: string | undefined
    taikinTime: string | undefined
    kyuukeiTimes: string[]
}

const dateToSeconds = (date: Date): string => String(date.getTime() / 1000)

const prettyPrintTime = (timestamp: string): string => {
    const time = new Date(Number(timestamp) * 1000)
    return `${time.getHours()}:${time.getMinutes()}`
}

export async function fetchConversationsHistory(
    year: number,
    month: number,
    day: number
): Promise<data | undefined> {
    try {
        const startTime = new Date(year, month - 1, day, 5)
        const endTime = new Date(year, month - 1, day, 23)

        const result = await boltApp.client.conversations.history({
            token: myToken,
            channel: kintaiChannelId,
            oldest: dateToSeconds(startTime),
            latest: dateToSeconds(endTime),
        })

        const messages = result.messages as Msg[]
        const myMessages: { text: string; ts: string }[] = messages
            .filter(m => m.user === myUserId)
            .map(m => {
                return {
                    text: m.text,
                    ts: prettyPrintTime(m.ts),
                }
            })

        const response: data = {
            shukkinTime: undefined,
            taikinTime: undefined,
            kyuukeiTimes: [],
        }

        for (const { text, ts } of myMessages.reverse()) {
            if (shukkinWords.some(word => text.includes(word)))
                response.shukkinTime = ts
            else if (taikinWords.some(word => text.includes(word)))
                response.taikinTime = ts
            else if (kyuukeiWords.some(word => text.includes(word)))
                response.kyuukeiTimes.push(ts)
        }

        console.log(myMessages)
        console.log(JSON.stringify(response, null, 4))
        return response
    } catch (error) {
        console.error(JSON.stringify(error, null, 4))
        return undefined
    }
}
