import { data, fetchConversationsHistory } from './app'

type Event = { params: { path: { year: string; month: string; day: string } } }

export const handler = async (event: Event): Promise<data | undefined> => {
    const pathParam = event.params.path
    return fetchConversationsHistory(
        Number(pathParam.year),
        Number(pathParam.month),
        Number(pathParam.day)
    )
}
