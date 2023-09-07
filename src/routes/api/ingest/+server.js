import { error } from '@sveltejs/kit'
// import { getLatestLedger, getEvents } from '$lib/soroban/rpcMethods'
import { Server } from 'soroban-client'
import { PUBLIC_FIB_TOKEN_ID, PUBLIC_XLM_TOKEN_ID } from '$env/static/public'
import { prisma } from '$lib/server/prisma'

const LEDGERS_IN_A_DAY = 12 * 60 * 24
const server = new Server('https://rpc-futurenet.stellar.org')

/** @type {import('soroban-client').SorobanRpc.EventFilter[]} */
const filters = [
    {
        type: 'contract',
        contractIds: [PUBLIC_FIB_TOKEN_ID],
        topics: [['*', '*', '*', '*']],
    },
]

/** @type {import('./$types').RequestHandler} */
export async function GET() {
    try {
        const latestEventIngested = await prisma.sorobanEvent.findFirst({
            orderBy: [
                {
                    id: 'desc',
                },
            ],
        })

        let events
        if (latestEventIngested?.ledger) {
            // pick up ingesting where we left off
            // console.log('i am finding events from:', latestEventIngested.id)
            events = await server.getEvents({
                startLedger: latestEventIngested.ledger + 1,
                filters: filters,
            })
        } else {
            const latestLedger = await server.getLatestLedger()
            // console.log(latestLedger)
            events = await server.getEvents({
                startLedger: Math.ceil((latestLedger.sequence - LEDGERS_IN_A_DAY) / 100) * 100,
                filters: filters,
            })
            // console.log('events.events.length', events.events.length)
        }

        if (events.events?.length) {
            events.events.forEach(async (event) => {
                console.log(event.id)
                await prisma.sorobanEvent.create({
                    data: {
                        id: event.id,
                        type: event.type,
                        ledger: parseInt(event.ledger),
                        contract_id: event.contractId,
                        topic_1: event.topic[0] || null,
                        topic_2: event.topic[1] || null,
                        topic_3: event.topic[2] || null,
                        topic_4: event.topic[3] || null,
                        value: event.value.xdr,
                    },
                })
            })
        }

        return new Response(
            JSON.stringify({
                ingested_events: events.events?.length || 0,
            })
        )
    } catch (err) {
        console.error('error on ingest', err)
        throw error(500, { message: 'error ingesting events' })
    }
}
