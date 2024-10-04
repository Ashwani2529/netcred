<svelte:head>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</svelte:head>
<script>
    import { Card, Button, GradientButton, Input, ButtonGroup, Toast, CloseButton, Badge } from "flowbite-svelte";
    import { fly } from 'svelte/transition';
    import { currencytoSymbol } from '../../helpers.js';
    import { generate } from '../../generateReceipt.js';
    import { organization } from '../../data.js';
    import { Spinner } from 'flowbite-svelte';
    import { invalidateAll } from '$app/navigation';
    import { Popover } from 'flowbite-svelte';
    import { slide } from 'svelte/transition';

    export let data;

    const itemsPerPage = 5;
    let currentPage = 1;

    // let invoices = [];
    let paginatedData = [];
    let filteredInvoices = [];

    let buyMode = false;
    let loading = false;

    let credits = null;
    const apiKey = 'rzp_live_PnUXISqkE0UKm1';
    
    async function createOrder() {
        loading = true;
        credits = parseInt(credits);
        let amount = credits * $organization.pricing;
        if (window.analytics) {
            window.analytics.track('purchase-init', {
                credits: credits,
                amount: amount,
                currency: $organization.currency,
            });
        }
        fetch('/api/create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount, currency: $organization.currency }),
        }).then((response) => response.json()).then((data) => {
            const options = {
                key: apiKey,
                amount: data.amount,
                currency: data.currency,
                name: 'NetCredential',
                description: 'Credits',
                image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IArs4c6QAADPdJREFUeF7tnHtwVNUdx7+/c3aT8Civ0ZLdBI2KimgHKxV0rE98tEitFaOjaLKbQKxaaKfWio6t0dpqnSrqWFAEdhGlFMZHK0WLitD6aqcoo7a+EHkkuyBpFRAK2XvOr3M2AfZxk+zjLrmWe//d8/ie3+f+zjn39ztnCd7jKguQq9R4YuABcdlL4AHxgLjMAi6T43mIB8RlFnCZHM9DPCAus4DL5Hge4gFxmQVcJsfzEA+IyyzgMjmeh3hAXGYBl8nxPMQD4jILuEyO5yEeEJdZwGVyPA/xgLjMAi6T43mIB8RlFnCZHM9DPCAus4DL5HgeUhSQZoHgB0NglQ2EEOWQygLKdqHVagOiuwtpukcgsjI0ngUNz2pcs6WBZdgcXV9Ix3nVOezKwTJRPpEJfVPraSVWYMvcd/NqK//ChJrQwDILw5TGUcw8miBOYmAEEYYB8Ns2ybydiVoIWMeEd0jTagFsSCR8rWj77FNgibKr1zOQQP0SkLjUprJpcJZS1nRsWbAz/3HmUSMYGiGBVQB9NbUWs75Gx+fPzqOl/IoGrzhEoOJKAsaBcQK6A9BzywqgTwFey4w3BdFSq0y/gvXpnlQMECNhh2I9AfH5f+lZTxElDjSQ6to+QvedQhB3AagAIIpQb1eVAShivGUR1yEWfX9voWKBAMR/V9Dj0frYvx0Wvb+5AwWkJlThaxffZPAtAM4sAYg0EzHhXS3pu9g4b51zQAAwMEvHPpkGrLRKAuVAAKkJDfIl6CfMuBbAkDzGsZuBzwHsAbiMQF8B0D+H+ooJd+tK/+1YPTvhKBAA20GYpFojS3MQkn+RkgOplTLQfx4IdT2IM+vmNgDPQmOpKve/ig2z41l1hkwagPI+o3ywTmcS4wH+BgAfAJlSdpuPfGP2tD76YWr94qes/a29qJQ1CVsWfJq/xXuoUUog1XVVUvtmAFzbjYotAFaC9RKVkMvRNm9HXmMc1hCUljobJM5j4GQCjibgASsWuTGzHSeBJJhxu45HfpmX2FwKlwrI4KaBsq91D5gbM97evaoYzKtI8J0Wl7+O2OxducjtukyTH0HrSEk4VRH9ES1z/+MEkHYGbyLQUVkdMywlfCej9dE1xQnPqF0iIDJY3wiIhzunk0zJCTAtVrS1CbFniwSRuzUK8ZD/Amhk4FYCRmZ3xa+q9rJatNnMrbnrSi9ZCiCByaMlqecBHJL9YvF2IsywYjV3AM26UNmF1CsECBPzeItouwTMgMyuIvVpZ9BtOrbuN47tupwGMmTSAFlRvgzg0+yMRsz3W9bOn2Hrki8KMWoxdQoBApC+XLWWPy2CibsI+FH2/MutCmIcYvM+KEbcvrrOAiFZFa4DYyaQHorp7O8NVcZnZ35BOzKOHBopDAhzk4pHH0UwNEIwLSbC12ymrudVYmetI2+Zk0BMXMwqWwDQhZmaGfhYaz73gMTnuoBTEBBmvkHHo/cBTLKqsRbMv7dpXzPh57rVgV2Xk0Aq68ZIIVcA6Jeh2WLmm3Q8OqPjW7d3noKAEHCbFYvcsVeyDITng3CVTahhoxC4LNES+VtRw3MQiAg2/JbA19l4x780eGJqXKkozQVWLhTIPVYsctO+PgONhwvSzxBwYoYOs0NZpMq4sag52Skgh9b2l/7+Jm50qM0UO1PFdk7rKixeoH3zrlYQEAAPqVhk6v7emoUMfhIGxAM2U0E7gJCKRX6Xt7q9FRwCIqvCE8B41nZnBZxmxSKvFazRoYqFApmjYpEpaRqGXt1PSt8iABOytBG2KfjGICNuk/MYnAISDD0E0PU2/W5SscNrDvQ3RxcvRvdmkXYJKqYFKj4vOxAXbDhWgl8EUJ3dKi1Rvt3XYOPCz3IG4aSHjKwtk5/3fxWACfSlPcR40IpHfpi3rhJUKNBDeJGKRa+w09O561oIsIlupj67AJ6iYtGFeY/DCQ+pDNVIgRUAHZHZvxJ8IVqiy/LWVYIKBQKhJSo27zJbPTWhQbKdTHzIRE/TMm0MflsrdV7eEWEngFSFTpFMTwOoTHcPJJSgGmyaFyuBffNusjAgzE+qeNQuz94hoKruVMnyD3a7GWYs1HF/CNiflOlRtQNAOhZ0egzgwan9MdCiK/wnYN1sk+fo9adAIHhKxSMTu1FPIhi+kYBf25RhaITV5sj8nEfvBJBAwyQQP5K5C2TgLd1OZ+ad48hZfH4FSwUEOKvZJz/YsBSECzIlJY0g+HK0RD/KSa4DQEQg3ESEBwGUp/XJWKW0dWHJT87kNFD0/H9Z9rusHj2ko/vq8FihsYiAmgwjWCz4Qd0avSEnnU4ACTZcT2ATFsk8R/VnBf8lxSefchpJj4VK5yHJrpuFCK5vJpA5xZGaTzbRIqWgxyI+f3WPKh0BEp5GjHtBydz2/oewTNGgS9Eyw+R5ev0pMRCzrIcqhZ+WEjDaZur6WMM6B7EFG7u1hDNAfkDAfQe5h3SaORA+SQAvE2FAhuE5+VFWztO7jXU5AaQq3GT6ylpDCCuVZU04ONaQFOuLQPhmItxpExFuIxYTrfjcrk8/OgBEVtbXQYhZmUkpZqzWVp+zsHXmAc8O2s0KpZ+y9vYaDA+TwBMATs8SYnY6CfpOl1vPwOTjJKmVAAo+2ysDDd8DcQTAwNT+GdigK/yj/t+/Q2zhy2D4IgBP2hy50cx8v47b77rKKsMjlcDLxQDxVYfOYk2LbT5Wdyv4hyE2u63XV3SUettrM0IZDM0FEAYo0zt3EfhiKxY1wcn0jJ0DUxYqwyOlSB7KMFcI0h7FfAbi0b8elEAwfOoAuXPHCyAak7nAA1iulFWXFeuqbhwutX4FwNC06Saf6wiDQoNEX3qdgBGZhietb7M2z9+XAe1NMAduDUkZpQzWXwRQFKC0uBKAdmb+qY5HTaJr/xNoPFySfiMzMJjn/RCSwQZz9OdbWdtv5tU6Hs0Ky/cGmF4BguraPlL3mwlQyGbQOxRbYxFf8N6+32pClbKdzAdksGAPMccTgw3TGWzufGQxUUoehS1zPukNCKl99g4Qo6Cq7hjB8iWyS2YRVimFWmyObE2K7Qjpv5OZ+MrTQ8xH6onST2/ZGZ3BN+tY9O6DF4gZ+dC6c6WQz4Mywipm6tJ8q95cc28yrVoTqpDtZA7dHVaMh3SEcjb8024dAfCa0rh430vQS2R6z0OSAzaHI9Y/DFBD5laYgY+0Epd0Xuo0pw3XgnFkcUAAEQxNJ9CvsnaYZO598BTVGl3SSyyS3fYyEPNl0TBK+LCYwMdkGkIznua4/3KTzBLB8BoCRhULBJX1x0shlmeuR53trlCxzeOB5/b0FpTeBwImEWy8jsAP2RjBfDD+2Oy6ZCC8EpS897fvyXsNMTWDTX0lJ2Z1cVtKM/gXOhZtPoiBABjd5JexxDMgjLcxRIuCuEiCmwE2X/rFATFzY2XDtyHYHLYYlN0fMxRdobb4n8orzewQQRd4SOdIqhuHC63+RKDMqcvc63scxP3BlJY2LshDOnZtFXIPPdLNncINgJiqYnNtD9U5ZHvbZtwDBCARDF1LEOYQd2aa1QLBRGPT3uiCgSR3eFf3E9L3HtmEUjottRMQV6nY3GdKCSCzbTcBASrDh0rBjwN0fi5GKApI8kOx/nyGjAIc6KI/zcBMSTQn0Tr3bXMpPxddPZeplQgOLrdLG7sLiBlJoH60hFiB7GRW1jiLBYLhU8vFrp2TCXxvVuJqf2+KwB8z8IIi/QRaK/5R0NpSXdvHryqOV+Q7hRhjAV6u4tEF7vaQTnWiKvR9YjI3nLp9YYoGsq+/+huIhTmylJ73t3nVmelDIZRJIbxkfZF4E8P7dyS29p4MMInqbZsEdgSqpNTHd1yDJnN1bmzqESRmfauOz8+6sew+DzGDM9eV+7Q/AZDZdXWp0SkgpksZDDWAcSso+6hpN1OQmdLMWeVdYCQ6Iw59qWOts/+XoM7GvlxAAPIFG8YxkltTm7scHaNyEojZevs3t4/WbNLMNK7ndaC4El82IMnR+qpC9zPTtK68xFEgKfYVgfomImGOLpnocrdvemFYmBm4xS6Y6c4pa+8ok1NX4jkAp9oNvFRAkn0Fw8ME+GICzmGIUQQ2h/16tFd30xsY5m9H3ifwGiF9kfaWOW/nvaijqm6C0PLo1IqaeC1i0QPz0RSYfJyAdYFNyhda84vYEjVh+dI9g5sGok97QGpxBAt9BjF9nYFjiZLeU2bfsfEAaiNgA4PXguldEnqNsmgjNLZia00b0Gz7z0nFEC+dEb4ULTf5MVQMhv5iALTPBxIMmWiHtHYgFv+80D9N8IC4DL4HxAPiMgu4TI7nIR4Ql1nAZXI8D/GAuMwCLpPjeYgHxGUWcJkcz0M8IC6zgMvkeB7iAXGZBVwmx/MQD4jLLOAyOZ6HeEBcZgGXyfE8xAPiMgu4TI7nIR4Ql1nAZXI8D3EZkP8BohZVv9dchoAAAAAASUVORK5CYII=',
                prefill: {
                    email: $organization.email,
                    // contact: localStorage.getItem("rzp_checkout_user_id")?localStorage.getItem("rzp_checkout_user_id"):"9999999999"
                },
                order_id: data.id,
                handler: function (response) {
                    loading = false;
                    // console.log(response);
                    if (response.razorpay_payment_id) {
                        console.log('Payment Successful!');
                        if (window.analytics) {
                            window.analytics.track('purchase-success', {
                                credits: credits,
                                amount: amount,
                                currency: $organization.currency,
                            });
                        }
                        fetch('/api/order-success', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ amount, credits, currency: $organization.currency, order_id: response.razorpay_order_id, payment_id: response.razorpay_payment_id, signature:response.razorpay_signature }),
                        }).then((response) => response.json()).then((data) => {
                            if (window.analytics) {
                                window.analytics.track('purchase-verified', {
                                    credits: credits,
                                    amount: amount,
                                    currency: $organization.currency,
                                });
                            }
                            triggerToast();
                            buyMode = false;
                            invalidateAll();
                        });
                    } else {
                        console.log('Payment Failed!');
                        if (window.analytics) {
                            window.analytics.track('purchase-failed', {
                                credits: credits,
                                amount: amount,
                                currency: $organization.currency,
                            });
                        }
                    }
                },
            };
            const rzp = new Razorpay(options);
            rzp.open();
        }).catch((error) => {
            console.error('Error creating order:', error);
        });
    }

    $: {
        filteredInvoices = data.invoices;
        updatePagination();
    }

    function updatePagination() {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        paginatedData = filteredInvoices.slice(startIndex, endIndex);
    }

    function goToPage(page) {
        currentPage = page;
        updatePagination();
    }

    function goToPreviousPage() {
        if (currentPage > 1) {
            currentPage--;
            updatePagination();
        }
    }

    function goToNextPage() {
        const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            updatePagination();
        }
    }

    function processId(id, timestamp) {
        const datetime = new Date(timestamp);
        const month = datetime.getMonth() + 1;
        const year = datetime.getFullYear();
        return `NC/${String(month).padStart(2, '0')}/${String(year).slice(2, 4)}/${String(id).padStart(5, '0')}`;
    }

    // Toast Function
    let toast = false;
    let counter = 5;
    let toastTimeout;
    function triggerToast() {
        if (toast) {
            closeToast();
        }
        toast = true;
        counter = 5;
        timeout();
    }

    function closeToast() {
        toast = false;
        clearTimeout(toastTimeout);
    }

    function timeout() {
        if (--counter > 0) {
            toastTimeout = setTimeout(timeout, 1000);
        } else {
            closeToast();
        }
    }
</script>
<main class="p-4 md:ml-60 min-h-screen">
    <div class="grid grid-cols-2 gap-4 mb-4">
        <Card class="max-w-full relative">
            <p class="font-normal text-gray-700 dark:text-gray-400 leading-tight mb-2">
                Current Plan
                <span class="ml-1 bg-blue-100 text-blue-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                    {currencytoSymbol($organization.currency)}{$organization.pricing}{$organization.plan == 'unlimited'?'/month':'/credit'}
                </span>
            </p>
            <!-- <Button outline color="dark" size="xs" class="absolute top-3 right-3">Change plan</Button> -->
            <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center">
                {#if $organization.plan == 'unlimited'}
                    Unlimited Plan
                {:else}
                    Pay-As-You-Go
                {/if}
            </h5>
        </Card>
        <Card class="max-w-full relative">
            <p class="font-normal text-gray-700 dark:text-gray-400 leading-tight mb-2">
                {#if buyMode}
                    Buy Credits
                    <span class="ml-1 bg-blue-100 text-blue-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                        {currencytoSymbol($organization.currency)}{$organization.pricing*credits}
                    </span>
                {:else}
                    Available Credits
                {/if}
            </p>
            {#if buyMode}
                <CloseButton class="absolute top-3 right-3" on:click={()=>buyMode=!buyMode}/>
                <ButtonGroup class="w-full">
                    <Input type="text" placeholder="Enter credits" size="sm" bind:value={credits}></Input>
                    <GradientButton color="blue" shadow style="white-space: nowrap;" on:click={createOrder} disabled={!credits}>
                        Buy Now
                    </GradientButton>
                </ButtonGroup>
            {:else}
                {#if $organization.plan == 'unlimited'}
                    <i class="icon-infinity text-4xl font-bold text-gray-900 dark:text-white"></i>
                {:else}
                    {#if $organization.country == 'India' && !$organization.state}
                        <GradientButton shadow color="blue" size="sm" class="cursor-not-allowed opacity-50 absolute top-3 right-3">Add credits</GradientButton>
                        <Popover class="w-72 text-sm font-light text-gray-500 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400" placement="left-start" transition={slide}>
                            <div class="p-3 space-y-3">
                                <h3 class="font-semibold text-gray-900 dark:text-white">Add state to enable billing</h3>
                                <a href="/profile" class="hover:underline flex items-center font-medium text-primary-600 dark:text-primary-500 dark:hover:text-primary-600 hover:text-primary-700">
                                Add now
                                </a>
                            </div>
                        </Popover>
                    {:else}
                        <GradientButton on:click={()=>buyMode=!buyMode} shadow color="blue" size="sm" class="absolute top-3 right-3">Add credits</GradientButton>
                    {/if}
                    <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{$organization.credits}</h5>
                {/if}
            {/if}
        </Card>
      </div>

    <div class="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden">
        <caption class="py-3 px-4 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
            Invoices
        </caption>
        <div class="overflow-x-auto">
            <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" class="px-4 py-3">ID</th>
                        <th scope="col" class="px-4 py-3">Credits</th>
                        <th scope="col" class="px-4 py-3">Amount</th>
                        <th scope="col" class="px-4 py-3">Type</th>
                        <th scope="col" class="px-4 py-3">Timestamp</th>
                        <th scope="col" class="px-4 py-3">Status</th>
                        <th scope="col" class="px-4 py-3">
                            <span class="sr-only">Action</span>
                        </th>
                    </tr>
                </thead>
                {#if filteredInvoices.length > 0}
                <tbody>
                    {#each paginatedData as invoice}
                    <tr class="border-b dark:border-gray-700">
                        <td class="px-4 py-3">{processId(invoice.id, invoice.timestamp)}</td>
                        <td class="px-4 py-3">{invoice.credits}</td>
                        {#if invoice.type == "Joining Bonus" || invoice.type == "Bonus"}
                            <td class="px-4 py-3">-</td>
                        {:else}
                            <td class="px-4 py-3">{invoice.amount} {invoice.currency}</td>
                        {/if}
                        <td class="px-4 py-3"><Badge color={invoice.type=="Joining Bonus"||invoice.type=="Bonus"?'purple':'blue'}>{invoice.type}</Badge></td>
                        <td class="px-4 py-3">{invoice.timestamp.toLocaleString("en-IN", {"dateStyle": "long", "timeStyle": "short"})}</td>
                        <td class="px-4 py-3"><Badge color="green">{invoice.status}</Badge></td>
                        <td class="px-4 py-3 flex items-center justify-end">
                            {#if invoice.type != "Joining Bonus" && invoice.type != "Bonus"}
                            <Button color="light" size="sm" on:click={()=>generate(invoice)}>Download</Button>
                            {/if}
                        </td>
                    </tr>
                    {/each}
                </tbody>
                {/if}
            </table>
        </div>
        <nav class="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0 p-4" aria-label="Table navigation">
            <span class="text-sm font-normal text-gray-500 dark:text-gray-400">
                Showing
                <span class="font-semibold text-gray-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1} - {Math.min((currentPage - 1) * itemsPerPage + 1 + itemsPerPage - 1, filteredInvoices.length)}</span>
                of
                <span class="font-semibold text-gray-900 dark:text-white">{filteredInvoices.length}</span>
            </span>
            <ul class="inline-flex items-stretch -space-x-px">
                <li>
                    <button on:click={goToPreviousPage} disabled={currentPage === 1} class="flex items-center justify-center h-full py-1.5 px-3 ml-0 text-gray-500 bg-white rounded-l-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                        <span class="sr-only">Previous</span>
                        <i class="icon-chevron-left"></i>
                    </button>
                </li>
                {#each Array(Math.ceil(filteredInvoices.length / itemsPerPage)).fill() as _, index}
                    <button on:click={() => goToPage(index + 1)} class="flex items-center justify-center text-sm py-2 px-3 leading-tight  {currentPage == index + 1 ? 'text-white bg-primary-600 dark:bg-gray-500 dark:text-white' : 'text-gray-500 bg-white dark:bg-gray-800 dark:text-gray-400'} border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white">{index + 1}</button>
                {/each}
                <li>
                    <button on:click={goToNextPage} disabled={currentPage === Math.ceil(filteredInvoices.length / itemsPerPage)} class="flex items-center justify-center h-full py-1.5 px-3 leading-tight text-gray-500 bg-white rounded-r-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                        <i class="icon-chevron-right"></i>
                    </button>
                </li>
            </ul>
        </nav>
    </div>
</main>

<Toast transition={fly} params="{{x: 200}}" color="green" position="top-right" open={toast} class="fixed">
    <svelte:fragment slot="icon">
      <i class="icon-check"></i>
    </svelte:fragment>
    Payment completed successfully!
</Toast>