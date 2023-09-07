#![no_std]

use soroban_sdk::{contract, contractimpl, contractmeta, contracttype, token, Address, Env};

const STROOP: i128 = 10_000_000;

#[derive(Clone)]
#[contracttype]
pub struct LastPayments {
    pub last: i128,
    pub last_last: i128,
}

#[derive(Clone)]
#[contracttype]
pub enum StorageKey {
    Admin,
    Token,
    Open,
    LastPayments,
    Member(Address),
}

contractmeta!(
    key = "Description",
    val = "Fibonacci faucet for distributing FIB tokens"
);

pub trait FibFaucetTrait {
    fn initialize(e: Env, admin: Address, token: Address, open: bool);
    fn open(e: Env);
    fn close(e: Env);
    fn is_open(e: Env) -> bool;
    fn signup(e: Env, member: Address);
}

#[contract]
struct FibFaucet;

#[contractimpl]
impl FibFaucetTrait for FibFaucet {
    fn initialize(e: Env, admin: Address, token: Address, open: bool) {
        if e.storage().instance().has(&StorageKey::Admin) {
            panic!("contract already initialized")
        }

        admin.require_auth();

        let last_payments = LastPayments {
            last: 0,
            last_last: 0,
        };

        let token_admin = token::AdminClient::new(&e, &token);
        token_admin.set_admin(&e.current_contract_address());

        e.storage().instance().set(&StorageKey::Admin, &admin);
        e.storage().instance().set(&StorageKey::Token, &token);
        e.storage().instance().set(&StorageKey::Open, &open);
        e.storage()
            .instance()
            .set(&StorageKey::LastPayments, &last_payments);
    }

    fn open(e: Env) {
        if !e.storage().instance().has(&StorageKey::Admin) {
            panic!("contract not initialized")
        };

        let admin: Address = e.storage().instance().get(&StorageKey::Admin).unwrap();
        admin.require_auth();

        e.storage().instance().set(&StorageKey::Open, &true);
    }

    fn close(e: Env) {
        if !e.storage().instance().has(&StorageKey::Admin) {
            panic!("contract not initialized")
        };

        let admin: Address = e.storage().instance().get(&StorageKey::Admin).unwrap();
        admin.require_auth();

        e.storage().instance().set(&StorageKey::Open, &false);
    }

    fn is_open(e: Env) -> bool {
        if !e.storage().instance().has(&StorageKey::Admin) {
            panic!("contract not initialized")
        };

        e.storage().instance().get(&StorageKey::Open).unwrap()
    }

    fn signup(e: Env, member: Address) {
        if !e.storage().instance().has(&StorageKey::Admin) {
            panic!("contract not initialized")
        };

        let open: bool = e.storage().instance().get(&StorageKey::Open).unwrap();
        if !open {
            panic!("faucet is closed")
        }

        if e.storage()
            .persistent()
            .has(&StorageKey::Member(member.clone()))
        {
            panic!("member already exists")
        }

        // member.require_auth();

        let LastPayments { last, last_last } = e
            .storage()
            .instance()
            .get(&StorageKey::LastPayments)
            .unwrap();

        let next_payment = if last + last_last > 0 {
            last + last_last
        } else {
            1
        };

        let last_payments = LastPayments {
            last_last: last,
            last: next_payment,
        };

        let token: Address = e.storage().instance().get(&StorageKey::Token).unwrap();
        // mint the token
        let next_stroops = next_payment * STROOP;
        token::AdminClient::new(&e, &token).mint(&member, &next_stroops);

        e.storage()
            .persistent()
            .set(&StorageKey::Member(member), &next_payment);
        e.storage()
            .instance()
            .set(&StorageKey::LastPayments, &last_payments);
    }
}

mod test;
