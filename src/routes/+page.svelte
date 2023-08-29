<script>
    import AddressList from "$lib/components/AddressList.svelte"
    import SignupForm from "$lib/components/SignupForm.svelte"
</script>

<h1>Welcome to the Fibonacci Faucet</h1>
<p>Signup now to become a member and receive your <code>FIB</code> token!</p>

<div class="flex flex-col w-full lg:flex-row">
    <div class="grid flex-grow card bg-base-300 rounded-box place-items-center">
        <div class="p-3">
            <h2>Current Members</h2>
            <AddressList />
        </div>
    </div>
    <div class="divider lg:divider-horizontal"></div>
    <div class="grid flex-grow card bg-base-300 rounded-box place-items-center">
        <div class="p-3">
            <SignupForm />
        </div>
    </div>
  </div>
