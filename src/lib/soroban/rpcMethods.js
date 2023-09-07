export async function getLatestLedger() {
    return fetch('https://rpc-futurenet.stellar.org:443', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: '0112358',
            method: 'getLatestLedger',
        }),
    })
        .then(async (res) => {
            if (res.ok) {
                return res.json()
            } else {
                throw await res.json()
            }
        })
        .then((res) => {
            if (res.result) {
                return res.result
            } else {
                throw res.error
            }
        })
}

/**
 * @param {string|number} cursor
 * @param {number} limit
 */
export async function getEvents(cursor, limit = 100) {
    return fetch('https://rpc-futurenet.stellar.org:443', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: '0112358',
            method: 'getEvents',
            params: {
                startLedger: typeof cursor === 'number' ? cursor.toString() : undefined,
                filters: [
                    {
                        type: 'contract',
                        contractIds: [],
                        topics: [['*', '*', '*', '*']],
                    },
                ],
                pagination: {
                    limit,
                    cursor: typeof cursor === 'string' ? cursor : undefined,
                },
            },
        }),
    })
        .then(async (res) => {
            if (res.ok) {
                return res.json()
            } else {
                throw await res.json()
            }
        })
        .then((res) => {
            if (res.result) {
                return res.result
            } else {
                throw res.error
            }
        })
}
