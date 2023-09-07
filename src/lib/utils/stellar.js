import { error } from '@sveltejs/kit'
import {
    Address,
    Asset,
    TransactionBuilder,
    Server,
    Networks,
    Operation,
    TimeoutInfinite,
    Contract,
} from 'soroban-client'

const RPC_SERVER_URL = 'https://rpc-futurenet.stellar.org'
const HORIZON_SERVER_URL = 'https://horizon-futurenet.stellar.org'
const ASSET_CODE = 'FIB'
const ASSET_ISSUER = 'GDWZ54JXFUHAXN4CX4M52EKT7QGF4V2L2JLFVS2NBF2QN6VV76WBTXQZ'

/**
 * @param {string} pubkey
 * @param {string} network
 * @returns {Promise<string>}
 */
export const addFibTrustlineTransaction = async (pubkey, network) => {
    const server = new Server(RPC_SERVER_URL)
    let account = await server.getAccount(pubkey)
    console.log('here is account', account)

    let tx = new TransactionBuilder(account, {
        fee: '100000',
        networkPassphrase:
            network === 'TESTNET'
                ? Networks.TESTNET
                : network === 'PUBLIC'
                ? Networks.PUBLIC
                : network === 'FUTURENET'
                ? Networks.FUTURENET
                : Networks.STANDALONE,
    })
        .addOperation(
            Operation.changeTrust({
                asset: new Asset(ASSET_CODE, ASSET_ISSUER),
            })
        )
        .setTimeout(TimeoutInfinite)
        .build()

    console.log('here is tx', tx)

    return tx.toXDR()
}

/**
 * @param {string} transactionXDR
 * @param {('PUBLIC'|'TESTNET'|'FUTURENET'|'STANDALONE')} network
 */
export const submitTransaction = async (transactionXDR, network) => {
    const server = new Server(RPC_SERVER_URL)
    const transaction = TransactionBuilder.fromXDR(transactionXDR, Networks[network])

    try {
        let sendResult = await server.sendTransaction(transaction)
        console.log('here is sendResult', sendResult)
        // return result
        if (sendResult.status === 'PENDING') {
            console.log('polling for transaction status')
            let txResult = await server.getTransaction(sendResult.hash)

            while (txResult.status === 'NOT_FOUND') {
                console.log('polling for transaction status')
                txResult = await server.getTransaction(sendResult.hash)
                await new Promise((resolve) => setTimeout(resolve, 1000))
            }

            return txResult
        } else {
            throw error(400, { message: `Unable to send transaction: ${sendResult.status}` })
        }
    } catch (e) {
        console.log('some error submitting', e)
        throw error(400, { message: `something went wrong: ${e}` })
    }
}

/**
 * @param {string} pubkey
 * @param {string} network
 * @param {string} contractAddress
 */
export const buildContractSignupTransaction = async (pubkey, network, contractAddress) => {
    const contract = new Contract(contractAddress)
    const server = new Server(RPC_SERVER_URL)
    let account = await server.getAccount(pubkey)
    // console.log('here is account', account)

    let networkPassphrase =
        network === 'TESTNET'
            ? Networks.TESTNET
            : network === 'PUBLIC'
            ? Networks.PUBLIC
            : network === 'FUTURENET'
            ? Networks.FUTURENET
            : Networks.STANDALONE

    let tx = new TransactionBuilder(account, {
        fee: '10000000',
        networkPassphrase,
    })
        .addOperation(contract.call('signup', ...[new Address(pubkey).toScVal()]))
        .setTimeout(TimeoutInfinite)
        .build()

    console.log('here is tx.toXDR()', tx.toXDR())

    let preparedTransaction = await server.prepareTransaction(tx, networkPassphrase)
    console.log('here is preparedTransaction', preparedTransaction)
    return preparedTransaction.toXDR()

    // let simulatedTransaction = await server.simulateTransaction(tx)
    // console.log('here is simulatedTransaction', simulatedTransaction)

    // return simulatedTransaction
}

/**
 * Here is a successful transaction for an account invoking the "signup" function
 * AAAAAgAAAAC78UVXKy91K2c4w/b0v+T3pZTp54y3hwUuaaZx1ahxxwACUSwACkJDAAAAAwAAAAAAAAAAAAAAAQAAAAAAAAAYAAAAAAAAAAMAAAASAAAAAYoJ69cvMqeXT6XiAHRm1OjKhF4kaXFeD7/FJMXALoj2AAAADwAAAAZzaWdudXAAAAAAABIAAAAAAAAAALvxRVcrL3UrZzjD9vS/5PellOnnjLeHBS5ppnHVqHHHAAAAAAAAAAEAAAAAAAAAAgAAAAYAAAAB30Kx5Bfi7EAY9sP9FUob3WRW/sx4+K3wplvY/3kyVHMAAAAUAAAAAQAAAAAAAAAHzQk6Ax5prBazlN0z8Zx6bJ0KliYDMcBqFh4rTw373twAAAAAAAAAAwAAAAEAAAAAu/FFVysvdStnOMP29L/k96WU6eeMt4cFLmmmcdWocccAAAABRklCAAAAAADtnvE3LQ4Lt4K/Gd0RU/wMXldL0lZay00JdQb6tf+sGQAAAAYAAAABignr1y8yp5dPpeIAdGbU6MqEXiRpcV4Pv8UkxcAuiPYAAAAQAAAAAQAAAAIAAAAPAAAABk1lbWJlcgAAAAAAEgAAAAAAAAAAu/FFVysvdStnOMP29L/k96WU6eeMt4cFLmmmcdWocccAAAABAAAAAAAAAAYAAAABignr1y8yp5dPpeIAdGbU6MqEXiRpcV4Pv8UkxcAuiPYAAAAUAAAAAQAAAAAAPPadAAAW4AAAA6QAAAmwAAAAAAAAAeUAAAAB1ahxxwAAAEAvH9WQ4T+ye2e9JQQR5kezVJGndn8Mu8w6L2FZvL/gzONPppEb3NwSS97MwscRq7msVSFH3zCPgg7RZb7+HG0D
 *
 * - operations[0]
 *   - invoke host function op, invoke contract [3]
 *     - 0 - [scvAddress]
 *       - address: [scAddressTypeContract]
 *         - contractId: ignr1y8yp5dPpeIAdGbU6MqEXiRpcV4Pv8UkxcAuiPY=
 *     - 1 - [scvSymbol]
 *       - sym: c21nbnVw
 *     - 2 - [scvAddress]
 *       - address: [scAddressTypeAccount]
 *         - accountId: [publicKeyTypeEd25519]
 *           - ed25519: GC57CRKXFMXXKK3HHDB7N5F74T32LFHJ46GLPBYFFZU2M4OVVBY4OQPB
 *   - auth - Array[0]
 * - footprint
 *   - readOnly [2]
 *     - 0 - [contractData]
 *       - contract, contractId: 30Kx5Bfi7EAY9sP9FUob3WRW/sx4+K3wplvY/3kyVHM=
 *       - key: [scvLedgerKeyContractInstance]
 *       - durability: [object Object]
 *       - bodyType: [object Object]
 *     - 1 - [contractCode], contractCode
 *       - hash: zQk6Ax5prBazlN0z8Zx6bJ0KliYDMcBqFh4rTw373tw=
 *       - bodyType: [object Object]
 *   - readWrite [3]
 *     - 0 - [trustline], trustLine
 *       - accountId, ed25519: GC57CRKXFMXXKK3HHDB7N5F74T32LFHJ46GLPBYFFZU2M4OVVBY4OQPB
 *       - asset: [assetTypeCreditAlphanum4], alphaNum4
 *         - assetCode: FIB
 *         - issuer, ed25519: GDWZ54JXFUHAXN4CX4M52EKT7QGF4V2L2JLFVS2NBF2QN6VV76WBTXQZ
 *     - 1 - [contractData], contractData
 *       - contract, contractId: ignr1y8yp5dPpeIAdGbU6MqEXiRpcV4Pv8UkxcAuiPY=
 *       - key: [scvVec], vec: Array[2]
 *         - 0 - [scvSymbol]
 *           - sym: TWVtYmVy
 *         - 1 - [scvAddress], address, accountId, ed25519: GC57CRKXFMXXKK3HHDB7N5F74T32LFHJ46GLPBYFFZU2M4OVVBY4OQPB
 *       - durability: [object Object]
 *       - bodyType: [object Object]
 *     - 2 - [contractData], contractData
 *       - contract, contractId: ignr1y8yp5dPpeIAdGbU6MqEXiRpcV4Pv8UkxcAuiPY=
 *       - key: [scvLedgerKeyContractInstance]
 *       - durability: [object Object]
 *       - bodyType: [object Object]
 */
