#![cfg(test)]
extern crate std;

use super::*;
// use soroban_sdk::testutils::{Address as _, AuthorizedFunction, AuthorizedInvocation, Ledger};
// use soroban_sdk::{symbol_short, token, vec, Address, Env};
// use token::AdminClient as TokenAdminClient;
// use token::Client as TokenClient;

// fn create_token_contract<'a>(e: &Env, admin: &Address) -> (TokenClient<'a>, TokenAdminClient<'a>) {
//     let contract_address = e.register_stellar_asset_contract(admin.clone());
//     (
//         TokenClient::new(e, &contract_address),
//         TokenAdminClient::new(e, &contract_address),
//     )
// }

// fn create_fib_faucet_contract<'a>(e: &Env) -> FibFaucetClient<'a> {
//     FibFaucetClient::new(e, &e.register_contract(None, FibFaucet {}))
// }

// struct FibFaucetTest<'a> {
//     env: Env,
//     admin_address: Address,
//     member_addresses: [Address; 3],
//     token: TokenClient<'a>,
//     contract: FibFaucetClient<'a>,
// }

// impl<'a> FibFaucetTest<'a> {
//     fn setup() -> Self {
//         let env = Env::default();
//         env.mock_all_auths();

//         env.ledger().with_mut(|li| {
//             li.timestamp = 12345;
//         });

//         let admin_address = Address::random(&env);
//         let member_addresses = [
//             Address::random(&env),
//             Address::random(&env),
//             Address::random(&env),
//         ];

//         let token_admin = Address::random(&env);

//         let (token, token_admin_client) = create_token_contract(&env, &token_admin);
//         token_admin_client.mint(&admin_address, &1000);

//         let contract = create_fib_faucet_contract(&env);
//         FibFaucetTest {
//             env,
//             admin_address,
//             member_addresses,
//             token,
//             contract
//         }
//     }
// }

// #[test]
// fn test_init_with_open() {
//     let test = FibFaucetTest::setup();
//     test.contract.initialize(
//         &test.admin_address,
//         &test.token.address,
//         &true);

//     let is_open = test.contract.is_open();
//     assert_eq!(is_open, true);
// }

use soroban_sdk::{testutils::Address as _, Address, Env};

use crate::{FibFaucet, FibFaucetClient};

#[test]
fn test_faucet_init_opened() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_address = env.register_contract(None, FibFaucet);
    let client = FibFaucetClient::new(&env, &contract_address);

    let issuer = Address::random(&env);
    let token_address = env.register_stellar_asset_contract(issuer.clone());

    client.initialize(&issuer, &token_address, &true);

    assert!(client.is_open());

    client.close();
    assert!(!client.is_open());

    client.open();
    assert!(client.is_open());
}

#[test]
fn test_faucet_init_closed() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_address = env.register_contract(None, FibFaucet);
    let client = FibFaucetClient::new(&env, &contract_address);

    let issuer = Address::random(&env);

    let token_address = env.register_stellar_asset_contract(issuer.clone());
    // let token_client = token::Client::new(&env, &token_address);
    // let token_admin = token::AdminClient::new(&env, &token_address);

    client.initialize(&issuer, &token_address, &false);

    assert!(!client.is_open());

    client.open();
    assert!(client.is_open());

    client.close();
    assert!(!client.is_open());
}

#[test]
#[should_panic(expected = "contract already initialized")]
fn test_faucet_cannot_be_initialized_again() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_address = env.register_contract(None, FibFaucet);
    let client = FibFaucetClient::new(&env, &contract_address);

    let issuer = Address::random(&env);

    let token_address = env.register_stellar_asset_contract(issuer.clone());
    // let token_client = token::Client::new(&env, &token_address);
    // let token_admin = token::AdminClient::new(&env, &token_address);

    client.initialize(&issuer, &token_address, &false);
    client.initialize(&issuer, &token_address, &true);
}

#[test]
#[should_panic(expected = "contract not initialized")]
fn test_faucet_cannot_be_opened_before_initialized() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_address = env.register_contract(None, FibFaucet);
    let client = FibFaucetClient::new(&env, &contract_address);

    client.open();
}

#[test]
#[should_panic(expected = "contract not initialized")]
fn test_faucet_cannot_be_closed_before_initialized() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_address = env.register_contract(None, FibFaucet);
    let client = FibFaucetClient::new(&env, &contract_address);

    client.close();
}

#[test]
#[should_panic(expected = "contract not initialized")]
fn test_cannot_check_status_before_initialized() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_address = env.register_contract(None, FibFaucet);
    let client = FibFaucetClient::new(&env, &contract_address);

    client.is_open();
}

#[test]
fn test_normal_operation() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_address = env.register_contract(None, FibFaucet);
    let client = FibFaucetClient::new(&env, &contract_address);

    let issuer = Address::random(&env);

    let token_address = env.register_stellar_asset_contract(issuer.clone());
    let token_client = token::Client::new(&env, &token_address);
    // let token_admin = token::AdminClient::new(&env, &token_address);

    client.initialize(&issuer, &token_address, &true);

    let member1 = Address::random(&env); // 1
    let member2 = Address::random(&env); // 1
    let member3 = Address::random(&env); // 2
    let member4 = Address::random(&env); // 3
    let member5 = Address::random(&env); // 5
    let member6 = Address::random(&env); // 8

    client.signup(&member1);
    assert_eq!(token_client.balance(&member1), 1 * STROOP);

    client.signup(&member2);
    assert_eq!(token_client.balance(&member2), 1 * STROOP);

    client.signup(&member3);
    assert_eq!(token_client.balance(&member3), 2 * STROOP);

    client.signup(&member4);
    assert_eq!(token_client.balance(&member4), 3 * STROOP);

    client.signup(&member5);
    assert_eq!(token_client.balance(&member5), 5 * STROOP);

    client.signup(&member6);
    assert_eq!(token_client.balance(&member6), 8 * STROOP);
}

#[test]
#[should_panic(expected = "member already exists")]
fn test_member_cannot_signup_again() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_address = env.register_contract(None, FibFaucet);
    let client = FibFaucetClient::new(&env, &contract_address);

    let issuer = Address::random(&env);

    let token_address = env.register_stellar_asset_contract(issuer.clone());

    client.initialize(&issuer, &token_address, &true);

    let member1 = Address::random(&env); // 1
    let member2 = Address::random(&env); // 1
    let member3 = Address::random(&env); // 2

    client.signup(&member1);
    client.signup(&member2);
    client.signup(&member3);

    client.signup(&member1);
}

#[test]
#[should_panic(expected = "contract not initialized")]
fn test_member_cannot_signup_before_initialized() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_address = env.register_contract(None, FibFaucet);
    let client = FibFaucetClient::new(&env, &contract_address);

    let member1 = Address::random(&env); // 1
    client.signup(&member1);
}

#[test]
#[should_panic(expected = "faucet is closed")]
fn test_member_cannot_signup_while_closed() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_address = env.register_contract(None, FibFaucet);
    let client = FibFaucetClient::new(&env, &contract_address);

    let issuer = Address::random(&env);

    let token_address = env.register_stellar_asset_contract(issuer.clone());

    client.initialize(&issuer, &token_address, &false);

    let member1 = Address::random(&env); // 1

    client.signup(&member1);
}

#[test]
#[should_panic(expected = "faucet is closed")]
fn test_member_cannot_signup_while_closed_after_opened() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_address = env.register_contract(None, FibFaucet);
    let client = FibFaucetClient::new(&env, &contract_address);

    let issuer = Address::random(&env);

    let token_address = env.register_stellar_asset_contract(issuer.clone());

    client.initialize(&issuer, &token_address, &true);

    let member1 = Address::random(&env); // 1
    let member2 = Address::random(&env); // 1

    client.signup(&member1);

    client.close();

    client.signup(&member2);
}
