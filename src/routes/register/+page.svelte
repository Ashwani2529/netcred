<script>
    import { onMount } from 'svelte';
    import { Spinner } from 'flowbite-svelte';
    import { enhance } from '$app/forms';
    import { Alert } from "flowbite-svelte";
    export let form;

    let loading = false;

    onMount(async () => {
        if (window.analytics) {
            window.analytics.page({
                url: window.location.href
            })
        }
	});
</script>

<main class="bg-gray-50 dark:bg-gray-900">
    <div class="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <a href="https://netcredential.com" class="flex pl-2 mb-5">
            <span class="self-center text-3xl font-semibold whitespace-nowrap text-primary-900 dark:text-white">NetCredential</span>
        </a>
        <div class="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
            <div class="p-6 space-y-4 md:space-y-6 sm:p-8">
                <h1 class="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                    Create an account
                </h1>
                <form class="space-y-4 md:space-y-6" method="POST"
                use:enhance={() => {
                    loading = true;
                    return async ({ update }) => {
                        await update({ reset: false });
                        loading = false;
                    };
                }}>
                    {#if form?.error}
                        <Alert color="red">
                            {form.error}
                        </Alert>
                    {/if}
                    <div>
                        <label for="organization" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Organization Name</label>
                        <input type="text" name="organization" id="organization" class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required>
                    </div>
                    <div>
                        <label for="email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
                        <input type="email" name="email" id="email" class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required>
                    </div>
                    <div>
                        <label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
                        <input type="password" name="password" id="password" class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required>
                    </div>
                    <div class="text-sm">
                        <label for="terms" class="font-light text-gray-500 dark:text-gray-300">By continuing, you agree to the <a class="font-medium text-primary-600 hover:underline dark:text-primary-500" href="https://netcredential.com/terms-and-conditions">Terms and Conditions</a></label>
                    </div>
                    <button disabled={loading} type="submit" class="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">
                        {#if loading}
                            <Spinner size="5" color="white" />
                        {:else}
                            Sign up
                        {/if}
                    </button>
                    <p class="text-sm font-light text-gray-500 dark:text-gray-400">
                        Already have an account? <a href="/login" class="font-medium text-primary-600 hover:underline dark:text-primary-500">Login here</a>
                    </p>
                </form>
            </div>
        </div>
    </div>
</main>