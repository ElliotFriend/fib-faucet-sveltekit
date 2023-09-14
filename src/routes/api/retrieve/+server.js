import { prisma } from '$lib/server/prisma'
import { error, json } from '@sveltejs/kit'
import { PUBLIC_FIB_TOKEN_ID } from '$env/static/public'
import { MERCURY_AUTH_EMAIL, MERCURY_AUTH_PASSWORD, MERCURY_GRAPHQL_URL } from '$env/static/private'

/**
 * Authenticate with Mercury, receiving a JWT in response
 * @returns {Promise<string>} JWT Token to use in requests to the Mercury event ingestion service.
 */
const authenticateWithMercury = async () => {
    let query = `mutation AuthenticateMutation($input: AuthenticateInput!) {
        authenticate(input: $input) {
            clientMutationId
            jwtToken
        }
    }`
    let res = await fetch(MERCURY_GRAPHQL_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query,
            variables: {
                input: {
                    email: MERCURY_AUTH_EMAIL,
                    password: MERCURY_AUTH_PASSWORD,
                },
            },
        }),
    })
    let json = await res.json()

    return json.data.authenticate.jwtToken
}

/** @type {import('./$types').RequestHandler} */
export async function GET() {
    let query = `query FibMintEventsQuery {
        allContractEvents {
            edges {
                node {
                    id
                    topic3
                    data
                    ledgerTimestamp
                }
            }
        }
    }`
    try {
        let mercuryAuthToken = await authenticateWithMercury()
        let mercuryRes = await fetch(MERCURY_GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${mercuryAuthToken}`,
            },
            body: JSON.stringify({ query }),
        })
        let mercuryJson = await mercuryRes.json()

        let mintEvents = mercuryJson.data.allContractEvents.edges.map(
            (/** @type {{"node": Object}} */ edge) => {
                return { ...edge.node }
            }
        )
        // let numEventsStored = await prisma.sorobanEvent.count()
        // let firstEvent = await prisma.sorobanEvent.findFirst()
        // const mintEvents = await prisma.sorobanEvent.findMany({
        //     where: {
        //         AND: {
        //             contract_id: {
        //                 equals: PUBLIC_FIB_TOKEN_ID,
        //             },
        //             topic_1: {
        //                 equals: 'AAAADwAAAARtaW50',
        //             },
        //         },
        //     },
        //     orderBy: [
        //         {
        //             id: 'desc',
        //         },
        //     ],
        // })

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
            mint_events: mintEvents,
        })
    } catch (/** @type {any} */ err) {
        throw error(500, { message: err.toString() || 'error retrieving ingested events' })
    }
}
