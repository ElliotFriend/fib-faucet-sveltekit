import { error, json } from '@sveltejs/kit'
import { Server } from 'soroban-client'
import { PUBLIC_FIB_TOKEN_ID } from '$env/static/public'
import { prisma } from '$lib/server/prisma'

// One ledger every 5 seconds
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

/**
 *
 * @param {number} latestLedger
 * @returns {Promise<import('soroban-client').SorobanRpc.GetEventsResponse>}
 */
const getEventsFrom24HoursAgo = async (latestLedger) => {
    // const latestLedger = await server.getLatestLedger()
    return server.getEvents({
        // rounding up to the nearest 100s, because... (??)
        startLedger: Math.ceil((latestLedger - LEDGERS_IN_A_DAY) / 100) * 100,
        filters: filters,
    })
}

/** @type {import('./$types').RequestHandler} */
export async function GET() {
    try {
        // const latestEventIngested = await prisma.sorobanEvent.findFirst({
        //     orderBy: [
        //         {
        //             id: 'desc',
        //         },
        //     ],
        // })
        const latestLedgerIngested = await prisma.latestLedger.findFirst({
            orderBy: [
                {
                    ingested_date: 'desc',
                },
            ],
        })

        const latestLedger = await server.getLatestLedger()
        let events
        if (latestLedgerIngested?.ledger_number) {
            // pick up ingesting where we left off
            // console.log('i am finding events from:', latestEventIngested.id)
            /** @todo Figure out how to deal with a start ledger that is no longer held by the RPC server */
            try {
                events = await server.getEvents({
                    startLedger: latestLedgerIngested.ledger_number + 1,
                    filters: filters,
                })
            } catch (err) {
                // an error here is likely (definitely?) because the latestEventIngested is older than 24-hours(-ish)
                events = await getEventsFrom24HoursAgo(latestLedger.sequence)
            }
        } else {
            // const latestLedger = await server.getLatestLedger()
            // console.log(latestLedger)
            events = await getEventsFrom24HoursAgo(latestLedger.sequence)
            // console.log('events.events.length', events.events.length)
        }

        if (events.events?.length) {
            events.events.forEach(async (event) => {
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

        await prisma.latestLedger.create({
            data: {
                ledger_number: latestLedger.sequence,
            },
        })

        return json({
            ingested_events: events.events?.length || 0,
            latest_ledger: latestLedger.sequence,
        })
    } catch (err) {
        console.error('error on ingest', err)
        throw error(500, { message: 'error ingesting events' })
    }
}
