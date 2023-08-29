#!/bin/bash

set -e

NETWORK="$1"

SOROBAN_RPC_HOST="$2"

# PATH=./target/bin:$PATH

if [[ -f "./.soroban-fib-faucet" ]]; then
    echo "Removing previous deployments"

    rm -rf ./.soroban-fib-faucet
    rm -rf ./.soroban
fi

if [[ "$SOROBAN_RPC_HOST" == "" ]]; then
    # If soroban-cli is called inside the soroban-preview docker container,
    # it can call the stellar standalone container just using its name "stellar"
    if [[ "$IS_USING_DOCKER" == "true" ]]; then
        SOROBAN_RPC_HOST="http://stellar:8000"
        SOROBAN_RPC_URL="$SOROBAN_RPC_HOST"
    elif [[ "$NETWORK" == "futurenet" ]]; then
        SOROBAN_RPC_HOST="https://rpc-futurenet.stellar.org:443"
        SOROBAN_RPC_URL="$SOROBAN_RPC_HOST"
    else
        # assumes standalone on quickstart, which has the soroban/rpc path
        SOROBAN_RPC_HOST="http://localhost:8000"
        SOROBAN_RPC_URL="$SOROBAN_RPC_HOST/soroban/rpc"
    fi
else
    SOROBAN_RPC_URL="$SOROBAN_RPC_HOST"
fi

case "$1" in
standalone)
    SOROBAN_NETWORK_PASSPHRASE="Standalone Network ; February 2017"
    FRIENDBOT_URL="$SOROBAN_RPC_HOST/friendbot"
    ;;
futurenet)
    SOROBAN_NETWORK_PASSPHRASE="Test SDF Future Network ; October 2022"
    FRIENDBOT_URL="https://friendbot-futurenet.stellar.org/"
    ;;
*)
    echo "Usage: $0 standalone|futurenet [rpc-host]"
    exit 1
    ;;
esac

echo "Using $NETWORK network"
echo "  RPC URL: $SOROBAN_RPC_URL"
echo "  Friendbot URL: $FRIENDBOT_URL"

echo Add the $NETWORK network to cli client
soroban config network add \
    --rpc-url "$SOROBAN_RPC_URL" \
    --network-passphrase "$SOROBAN_NETWORK_PASSPHRASE" "$NETWORK"

echo Add $NETWORK to .soroban-fib-faucet for use with npm scripts
mkdir -p .soroban-fib-faucet
echo $NETWORK > ./.soroban-fib-faucet/network
echo $SOROBAN_RPC_URL > ./.soroban-fib-faucet/rpc-url
echo "$SOROBAN_NETWORK_PASSPHRASE" > ./.soroban-fib-faucet/passphrase

if !(soroban config identity ls | grep fibIssuer 2>&1 >/dev/null); then
    echo Create the fibIssuer identity
    soroban config identity generate fibIssuer
fi
FIB_ADMIN_ADDRESS="$(soroban config identity address fibIssuer)"

# This will fail if the account already exists, but it'll still be fine.
echo Fund fibIssuer account from friendbot
curl --silent -X POST "$FRIENDBOT_URL?addr=$FIB_ADMIN_ADDRESS" >/dev/null

ARGS="--network $NETWORK --source fibIssuer"

echo Build contracts
make build

echo Wrap the FIB Stellar asset
FIB_TOKEN_ADDRESS="$(
    soroban lab token wrap $ARGS \
        --asset "FIB:$FIB_ADMIN_ADDRESS"
)"

echo Deploy the fib faucet contract
FIB_FAUCET_ADDRESS="$(
    soroban contract deploy $ARGS \
        --wasm target/wasm32-unknown-unknown/release/soroban_fib_faucet_contract.wasm
)"

echo "Contract deployed succesfully with ID: $FIB_FAUCET_ADDRESS"
echo "$FIB_FAUCET_ADDRESS" > .soroban-fib-faucet/fib_faucet_id

echo Make the faucet contract the admin for the token contract
soroban contract invoke $ARGS \
    --id $FIB_TOKEN_ADDRESS \
    -- \
    set_admin \
    --new_admin $FIB_FAUCET_ADDRESS

echo "Initializing the faucet contract"
soroban contract invoke $ARGS \
    --id $FIB_FAUCET_ADDRESS \
    -- \
    initialize \
    --admin $(soroban config identity address fibIssuer) \
    --token $FIB_TOKEN_ADDRESS \
    --open

echo "Done"
