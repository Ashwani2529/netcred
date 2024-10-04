<script>
    import { onMount } from 'svelte';
    import { enhance } from "$app/forms";
    import { Alert, Spinner } from "flowbite-svelte";
    export let form;
    
    let formLoading = false;
    let email;
    let state = 'forgot';

    $: {
        if (form && form.state == 'forgot' && form.success) {
            state = 'reset';
        }
    }

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
            {#if state == 'forgot'}
            <div class="p-6 space-y-4 md:space-y-6 sm:p-8">
                <h1 class="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white"  >
                    Forgot your password?
                </h1>
                <p
                    class="text-base font-normal text-gray-500 dark:text-gray-400"
                >
                    Don't fret! Just type in your email and we will send you a
                    code to reset your password!
                </p>
                <form
                    class="space-y-4 md:space-y-6"
                    method="POST"
                    action="?/forgot"
                    use:enhance={() => {
                        formLoading = true;
                        return async ({ update }) => {
                            await update({ reset: false });
                            formLoading = false;
                        };
                    }}
                >
                    {#if form?.error}
                        <Alert color="red">
                            {form.error}
                        </Alert>
                    {/if}
                    <div>
                        <label
                            for="email"
                            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                            >Your email</label
                        >
                        <input
                            type="email"
                            name="email"
                            id="email"
                            class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            required
                            bind:value={email}
                        />
                    </div>
                    <button
                        type="submit"
                        class="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                    >
                        {#if formLoading}
                            <Spinner size="5" color="white" />
                        {:else}
                            Reset password
                        {/if}
                    </button>
                    <p
                        class="text-sm font-light text-gray-500 dark:text-gray-400"
                    >
                        Already have an account? <a
                            href="/login"
                            class="font-medium text-primary-600 hover:underline dark:text-primary-500"
                            >Login here</a
                        >
                    </p>
                </form>
            </div>
            {:else if state == 'reset'}
            <div class="p-6 space-y-4 md:space-y-6 sm:p-8">
                <h1 class="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white"  >
                    Enter your new password
                </h1>
                <p class="text-base font-normal text-gray-500 dark:text-gray-400">
                    We've sent a 6-digit code to your email for verification. Enter it below with your new password to proceed.
                </p>
                <form
                    class="space-y-4 md:space-y-6"
                    method="POST"
                    action="?/reset"
                    use:enhance={() => {
                        formLoading = true;
                        return async ({ update }) => {
                            await update({ reset: false });
                            formLoading = false;
                        };
                    }}
                    >
                    {#if form?.error}
                        <Alert color="red">
                            {form.error}
                        </Alert>
                    {/if}
                    <div>
                        <label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">New password</label>
                        <input type="password" name="password" id="password" class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required/>
                        <input type="email" name="email" value={email} required hidden/>
                    </div>
                    <div>
                        <label for="code" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Verification code</label>
                        <input type="number" name="code" class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required/>
                    </div>
                    <button type="submit" class="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">
                        {#if formLoading}
                            <Spinner size="5" color="white" />
                        {:else}
                            Reset password
                        {/if}
                    </button>
                    <p class="text-sm font-light text-gray-500 dark:text-gray-400">
                        <span on:click={()=>state='forgot'} class="font-medium text-primary-600 hover:underline dark:text-primary-500 cursor-pointer">Go back</span>
                    </p>
                </form>
            </div>
            {/if}
        </div>
    </div>
</main>