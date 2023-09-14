import { prisma } from '$lib/server/prisma'
import { error, json } from '@sveltejs/kit'
import { PUBLIC_FIB_TOKEN_ID } from '$env/static/public'

/** @type {import('./$types').RequestHandler} */
export async function GET() {
    try {
        // let numEventsStored = await prisma.sorobanEvent.count()
        // let firstEvent = await prisma.sorobanEvent.findFirst()
        const mintEvents = await prisma.sorobanEvent.findMany({
            where: {
                AND: {
                    contract_id: {
                        equals: PUBLIC_FIB_TOKEN_ID,
                    },
                    topic_1: {
                        equals: 'AAAADwAAAARtaW50',
                    },
                },
            },
            orderBy: [
                {
                    id: 'desc',
                },
            ],
        })

        const latestLedgerIngested = await prisma.latestLedger.findFirst({
            orderBy: {
                ingested_date: 'desc',
            },
        })

        if (!mintEvents) throw 'no matching ingested events to retrieve'

        // console.log('firstEvent topic_1', xdr.ScVal.fromXDR(firstEvent.topic_1, 'base64').value()?.toString())
        // console.log('firstEvent.topic_1', mintEvents.topic_1)
        // console.log('firstEvent.topic_2', mintEvents.topic_2)
        // console.log('firstEvent.topic_3', mintEvents.topic_3)
        // console.log('firstEvent.topic_4', mintEvents.topic_4)
        // console.log('firstEvent.value', mintEvents.value)
        return json({
            latest_ledger_ingested: latestLedgerIngested?.ledger_number ?? undefined,
            events: mintEvents,
        })
    } catch (/** @type {any} */ err) {
        throw error(500, { message: err.toString() || 'error retrieving ingested events' })
    }
}
