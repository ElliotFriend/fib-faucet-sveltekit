<script>
    import { onMount } from "svelte"
    import { error } from "@sveltejs/kit"

    import freigtherApi from "@stellar/freighter-api"

    import { PUBLIC_FIB_ASSET_CODE, PUBLIC_FIB_ASSET_ISSUER } from "$env/static/public"
    import { addFibTrustlineTransaction, submitTransaction } from "$lib/soroban/transactions"
    import * as fibFaucetContract from 'fib-faucet-contract'
    import { invalidate } from "$app/navigation"

    let publicKey = ''
    let network = ''
    let hasTrustline = false
    let hasFibToken = false
    let isDoingSomething = false

    const getFreighterStuff = async () => {
        isDoingSomething = true

        if (await freigtherApi.isConnected()) {
            try {
                publicKey = await freigtherApi.getPublicKey()
                network = await freigtherApi.getNetwork()
                await checkForFibTrustlineAndBalance()
            } catch (err) {
                isDoingSomething = false
                throw error(400, { message: `error retrieving public key: ${err}`})
            }
        }

        isDoingSomething = false
    }

    const checkForFibTrustlineAndBalance = async () => {
        isDoingSomething = true
        /** @todo re-write this using the getLedgerEntries thing for the balance of the user. right? */
        let res = await fetch(`https://horizon-futurenet.stellar.org/accounts/${publicKey}`)
        let json = await res.json()

        json.balances.map((/** @type {import('stellar-sdk').Horizon.BalanceLine} */ balance) => {
            if ('asset_code' in balance && balance.asset_code === PUBLIC_FIB_ASSET_CODE && balance.asset_issuer === PUBLIC_FIB_ASSET_ISSUER) {
                hasTrustline = true
                if (parseFloat(balance.balance) > 0) {
                    hasFibToken = true
                }
            }
        })
        isDoingSomething = false
    }

    const addTrustline = async () => {
        isDoingSomething = true
        try {
            let txXDR = await addFibTrustlineTransaction(publicKey, network)
            let signedTxXDR = await freigtherApi.signTransaction(txXDR, { network })
            console.log('here is signedTxXDR', signedTxXDR)
            let sendResponse = await submitTransaction(signedTxXDR, network)
            console.log('here is sendResponse', sendResponse)
            if (sendResponse.status === 'SUCCESS') {
                hasTrustline = true
            }
        } catch (/** @type {any} */ e) {
            isDoingSomething = false
            throw error(e.status ?? 400, { message: e.body.message ?? `error adding trustline: ${e}`})
        }
        isDoingSomething = false
    }

    const becomeMember = async () => {
        isDoingSomething = true

        try {
            await fibFaucetContract.signup(
                { member: publicKey }, {
                    fee: 100,
                }
            )
            hasFibToken = true
            await fetch('/api/ingest')
            await invalidate('/api/retrieve')
        } catch (err) {
            console.log("error becoming a member:", err)
            isDoingSomething = false
            throw error(400, { message: 'error signing up' })
        }

        isDoingSomething = false
    }

    onMount(() => getFreighterStuff())
</script>

<h2>Become a Member</h2>

{#if hasFibToken}
    <p>Looks like you're already a <code>FIB</code> member. Thanks!</p>
    <p>Unfortunately, you can't join again. Sorry 'bout that...</p>
{:else}
    {#if publicKey && !hasTrustline}
    <button class="btn btn-primary" on:click={addTrustline} disabled={isDoingSomething}>
        Add <code>FIB</code> Trustline
        {#if isDoingSomething}<span class="loading loading-spinner loading-sm"></span>{/if}
    </button>
    {:else if publicKey && hasTrustline}
    <button class="btn btn-primary" on:click={becomeMember} disabled={isDoingSomething}>
        Become a <code>FIB</code> Member!
        {#if isDoingSomething}<span class="loading loading-spinner loading-sm"></span>{/if}
    </button>
    {:else}
    <button class="btn btn-primary" on:click={getFreighterStuff} disabled={isDoingSomething}>
        Connect Freighter
        {#if isDoingSomething}<span class="loading loading-spinner loading-sm"></span>{/if}
    </button>
    {/if}
{/if}
