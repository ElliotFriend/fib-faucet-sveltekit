<script>
    import "../app.postcss"

    import Navbar from "$lib/components/Navbar.svelte"
    import Footer from "$lib/components/Footer.svelte"
</script>

<div class="flex min-h-screen flex-col">

    <Navbar />

    <div class="grow">
        <main class="prose max-w-full p-6">
            <slot />
        </main>
    </div>

    <Footer />

</div>
