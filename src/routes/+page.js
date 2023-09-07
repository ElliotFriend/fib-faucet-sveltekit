// import { prisma } from '$lib/server/prisma'

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
    const res = await fetch('/api/retrieve')
    return {
        events: await res.json(),
    }
}
