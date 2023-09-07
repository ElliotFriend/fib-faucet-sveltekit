<script>
    import { onMount } from "svelte"
    import { error } from "@sveltejs/kit"

    import freigtherApi from "@stellar/freighter-api"

    import { addFibTrustlineTransaction, submitTransaction, buildContractSignupTransaction } from "$lib/utils/stellar"
    import * as fibFaucetContract from 'fib-faucet-contract'

    const ASSET_CODE = 'FIB'
    const ASSET_ISSUER = 'GDWZ54JXFUHAXN4CX4M52EKT7QGF4V2L2JLFVS2NBF2QN6VV76WBTXQZ'

    let publicKey = ''
    let network = ''
    let hasTrustline = false
    let hasFibToken = false
    let isDoingSomething = false
    const getFreighterStuff = async () => {
        isDoingSomething = true
        if (await freigtherApi.isConnected()) {
            console.log("User has freighter!")
        }

        try {
            publicKey = await freigtherApi.getPublicKey()
            network = await freigtherApi.getNetwork()
        } catch (e) {
            isDoingSomething = false
            throw error(400, { message: `error retrieving public key: ${e}`})
        }
        isDoingSomething = false
    }

    const checkForFibTrustline = async () => {
        isDoingSomething = true
        let res = await fetch(`https://horizon-futurenet.stellar.org/accounts/${publicKey}`)
        let json = await res.json()

        json.balances.map((/** @type {import('soroban-client').SorobanRpc.Balance} */ balance) => {
            if (balance.asset_code === ASSET_CODE && balance.asset_issuer === ASSET_ISSUER) {
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

            // let something = await fibFaucetContract.signup(
            //     { member: publicKey }, {
            //         fee: 100,
            //     }
            // )
            // console.log('here is the CONTRACT_ID', fibFaucetContract.CONTRACT_ID)
            let something = await buildContractSignupTransaction(publicKey, network, fibFaucetContract.CONTRACT_ID)
            // let something = await fibFaucetContract.isOpen()
            console.log('here is something', something)

            let signedTxXDR = await freigtherApi.signTransaction(something, { network })
            console.log('here is signedTxXDR', signedTxXDR)

            let sendResponse = await submitTransaction(signedTxXDR, network)
            console.log('here is sendResponse', sendResponse)

            hasFibToken = true
        } catch (e) {
            console.log("error becoming a member:", e)
        }

        isDoingSomething = false
    }

    onMount(() => {
        getFreighterStuff().then(() => checkForFibTrustline())
    })
</script>

<h2>Become a Member</h2>

{#if hasFibToken}
    <p>Looks like you're already a <code>FIB</code> member. Thanks! Unfortunately, you can't join again. Sorry 'bout that...</p>
{:else}
    <p>Signup form goes here</p>
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
