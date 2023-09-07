import { prisma } from '$lib/server/prisma'

/** @type {import('./$types').RequestHandler} */
export async function GET() {
    let numEventsStored = await prisma.sorobanEvent.count()
    // let firstEvent = await prisma.sorobanEvent.findFirst()
    const firstEvent = await prisma.sorobanEvent.findFirst({
        orderBy: [{
            id: 'desc',
        }]
    })

    return new Response(JSON.stringify({
        num_events_stored: numEventsStored,
        first_event: firstEvent,
    }))
}
