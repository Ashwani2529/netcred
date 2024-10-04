<script>
    import { onMount } from 'svelte';
    import { enhance } from '$app/forms';
    import { Alert, Spinner } from "flowbite-svelte";
    export let form;
    let formLoading1 = false;
    let formLoading2 = false;

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
                    Sign in to your account
                </h1>
                <form class="space-y-4 md:space-y-6" method="POST" action="?/login" use:enhance={() => {
                    formLoading1 = true;
                    return async ({ update }) => {
                        await update({ reset: false });
                        formLoading1 = false;
                    };
                }}>
                    {#if form?.error}
                        <Alert color="red">
                            {form.error}
                        </Alert>
                    {/if}
                    <div>
                        <label for="email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
                        <input type="email" name="email" id="email" class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required>
                    </div>
                    <div>
                        <label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
                        <input type="password" name="password" id="password" class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required>
                    </div>
                    <button disabled={formLoading1} type="submit" class="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">
                        {#if formLoading1}
                            <Spinner size="5" color="white" />
                        {:else}
                            Sign in
                        {/if}
                    </button>
                    </form>
                    <!-- <div class="flex justify-center items-center">
                        <h1>Sign in with</h1>
                    </div>
                    <div class="flex flex-row justify-center items-center">
                        <form class="auth-form basis-1/6" method="post" action="?/OAuth2" use:enhance={() => {
                            formLoading2 = true;
                            return async ({ update }) => {
                                await update({ reset: false });
                                formLoading2 = false;
                            };
                        }}>
                            <button disabled={formLoading2} type="submit" class="border font-medium rounded-lg text-sm p-2.5">
                                {#if formLoading2}
                                <Spinner size="5" color="white" />
                                {:else}
                                    <svg class="w-5 h-5 text-primary-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                        <path fill-rule="evenodd" d="M12.037 21.998a10.313 10.313 0 0 1-7.168-3.049 9.888 9.888 0 0 1-2.868-7.118 9.947 9.947 0 0 1 3.064-6.949A10.37 10.37 0 0 1 12.212 2h.176a9.935 9.935 0 0 1 6.614 2.564L16.457 6.88a6.187 6.187 0 0 0-4.131-1.566 6.9 6.9 0 0 0-4.794 1.913 6.618 6.618 0 0 0-2.045 4.657 6.608 6.608 0 0 0 1.882 4.723 6.891 6.891 0 0 0 4.725 2.07h.143c1.41.072 2.8-.354 3.917-1.2a5.77 5.77 0 0 0 2.172-3.41l.043-.117H12.22v-3.41h9.678c.075.617.109 1.238.1 1.859-.099 5.741-4.017 9.6-9.746 9.6l-.215-.002Z" clip-rule="evenodd"/>
                                    </svg>
                                {/if}
                            </button>
                        </form>
                        <form class="auth-form basis-1/7" method="post" action="?/signInWithMicrosoft" use:enhance={() => {
                            formLoading2 = true;
                            return async ({ update }) => {
                                await update({ reset: false });
                                formLoading2 = false;
                            };
                        }}>
                            <button disabled={formLoading2} type="submit" class="border font-medium rounded-lg text-sm p-2.5">
                                {#if formLoading2}
                                <Spinner size="5" color="white" />
                                {:else}
                                <svg class="w-5 h-5" style="overflow:visible;enable-background:new 0 0 32 32" viewBox="0 0 32 32" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><g id="Microsoft_1_"><g id="Microsoft"><g id="Blue_x5F_Square"><rect height="15" style="fill:#51AED9;" width="15" y="17"/></g><g id="Yellow_x5F_Square"><rect height="15" style="fill:#FEC327;" width="15" x="17" y="17"/></g><g id="Green_x5F_Square"><rect height="15" style="fill:#34B67A;" width="15" x="17"/></g><g id="Orange_x5F_Square"><rect height="15" style="fill:#F15723;" width="15"/></g></g></g></g></svg>
                                {/if}
                            </button>
                        </form>
                    </div> -->
                    <p class="text-sm font-light text-gray-500 dark:text-gray-400">
                        Don't have an account yet? <a href="/register" class="font-medium text-primary-600 hover:underline dark:text-primary-500">Sign up</a>
                    </p>
                    <a href="/forgot-password" class="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500">Forgot password?</a>
            </div>
        </div>
    </div>
</main>