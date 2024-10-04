<script>
    import { page } from '$app/stores';
</script>

<main class="bg-gray-50 dark:bg-gray-900">
    <div class="flex flex-col justify-center items-center px-6 mx-auto h-screen xl:px-0 dark:bg-gray-900">
        <div class="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
            <div class="mx-auto max-w-screen-sm text-center">
                <h1 class="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-primary-600 dark:text-primary-500">{$page.status}</h1>
                <p class="mb-4 text-3xl tracking-tight font-bold text-gray-900 md:text-4xl dark:text-white">
                    {#if $page.status == 404}
                        Page not found.
                    {:else if $page.status == 500}
                        Our code went on a roller coaster ride
                    {:else}
                        {$page.error.message}
                    {/if}
                </p>
                <p class="mb-4 text-lg font-light text-gray-500 dark:text-gray-400">
                    {#if $page.status == 404}
                        Looks like we're lost in the digital realm. Let's navigate back to reality together!
                    {:else if $page.status == 500}
                        We're fixing it, promise! Meanwhile, let's share a virtual cup of coffee and wait for the digital dust to settle.
                    {:else}
                        {$page.error.message}
                    {/if}
                </p>
                <a href="/" class="inline-flex text-white bg-primary-600 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:focus:ring-primary-900 my-4">Back to dashboard</a>
                <button id="intercom-launcher" type="button" class="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700">Contact support</button>
            </div>   
        </div>
    </div>
</main>