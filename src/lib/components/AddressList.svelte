<script>
    import { page } from '$app/stores'
    import { xdr, Address, scValToBigInt } from 'soroban-client'
</script>

<div class="overflow-x-auto">
    <table class="table">
      <!-- head -->
      <thead>
        <tr>
          <th></th>
          <th>Address</th>
          <th>Minted</th>
        </tr>
      </thead>
      <tbody>
        {#each $page.data.events.events as event}
            {@const memberAddress = Address.fromScVal(xdr.ScVal.fromXDR(event.topic_3, 'base64')).toString()}
            {@const amountMinted = scValToBigInt(xdr.ScVal.fromXDR(event.value, 'base64')) / BigInt(10000000)}
            <tr>
            <td>
                <div class="flex items-center space-x-3">
                <div class="avatar">
                    <div class="not-prose w-12 rounded-full">
                        <img
                            src={`https://id.lobstr.co/${memberAddress}.png`}
                            alt="Stellar Identicon"
                        />
                    </div>
                </div>
                </div>
            </td>
            <td><code>{memberAddress}</code></td>
            <td>{amountMinted} FIB</td>
            </tr>
        {/each}
      </tbody>
    </table>
  </div>
