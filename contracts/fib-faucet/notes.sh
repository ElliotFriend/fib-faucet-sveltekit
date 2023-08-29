soroban lab token wrap \
    --network standalone \
    --source fibIssuer \
    --asset "FIB:$(soroban config identity address fibIssuer)"
# CBPGRYC5CEF5GXPYHYJS2AKCBSHTRWT753CFNLT33YVY4YKRJX6SOUDI

soroban contract invoke \
    --network standalone \
    --source fibIssuer \
    --id CBPGRYC5CEF5GXPYHYJS2AKCBSHTRWT753CFNLT33YVY4YKRJX6SOUDI \
    -- \
    name

soroban contract build

soroban contract deploy \
    --network standalone \
    --source fibIssuer \
    --wasm target/wasm32-unknown-unknown/release/soroban_fib_faucet_contract.wasm
# CDMKAOIZM24IF2J6LO43EIIV4NSMIQELTKRDRHB3VPBTVNXHX2XW7FYT

soroban contract invoke \
    --network standalone \
    --source fibMember1 \
    --id CDMKAOIZM24IF2J6LO43EIIV4NSMIQELTKRDRHB3VPBTVNXHX2XW7FYT \
    -- \
    is_open
# error: transaction simulation failed: HostError: Error(WasmVm, InternalError)
# DebugInfo not available

soroban contract invoke \
    --network standalone \
    --source fibIssuer \
    --id CDMKAOIZM24IF2J6LO43EIIV4NSMIQELTKRDRHB3VPBTVNXHX2XW7FYT \
    --fee 10000000 \
    -- \
    initialize \
    --admin $(soroban config identity address fibIssuer) \
    --token CBPGRYC5CEF5GXPYHYJS2AKCBSHTRWT753CFNLT33YVY4YKRJX6SOUDI \
    --open

soroban contract invoke \
    --network standalone \
    --source fibMember1 \
    --id CDMKAOIZM24IF2J6LO43EIIV4NSMIQELTKRDRHB3VPBTVNXHX2XW7FYT \
    -- \
    is_open

soroban contract invoke \
    --network standalone \
    --source fibMember1 \
    --id CDMKAOIZM24IF2J6LO43EIIV4NSMIQELTKRDRHB3VPBTVNXHX2XW7FYT \
    -- \
    signup \
    --member $(soroban config identity address fibMember1)
## ERRORED - needed a Stellar trustline on `fibMember1` first, then worked

soroban contract invoke \
    --network standalone \
    --source fibMember2 \
    --id CDMKAOIZM24IF2J6LO43EIIV4NSMIQELTKRDRHB3VPBTVNXHX2XW7FYT \
    -- \
    signup \
    --member $(soroban config identity address fibMember2)

soroban contract invoke \
    --network standalone \
    --source fibMember3 \
    --id CDMKAOIZM24IF2J6LO43EIIV4NSMIQELTKRDRHB3VPBTVNXHX2XW7FYT \
    -- \
    signup \
    --member $(soroban config identity address fibMember3)

soroban contract invoke \
    --network standalone \
    --source fibMember4 \
    --id CDMKAOIZM24IF2J6LO43EIIV4NSMIQELTKRDRHB3VPBTVNXHX2XW7FYT \
    -- \
    signup \
    --member $(soroban config identity address fibMember4)

soroban contract invoke \
    --network standalone \
    --source fibMember5 \
    --id CDMKAOIZM24IF2J6LO43EIIV4NSMIQELTKRDRHB3VPBTVNXHX2XW7FYT \
    -- \
    signup \
    --member $(soroban config identity address fibMember5)

soroban contract invoke \
    --network standalone \
    --source fibMember6 \
    --id CDMKAOIZM24IF2J6LO43EIIV4NSMIQELTKRDRHB3VPBTVNXHX2XW7FYT \
    -- \
    signup \
    --member $(soroban config identity address fibMember6)
