<script>
    import { enhance } from '$app/forms';
    import { Toast, Spinner } from "flowbite-svelte";
    import { fly } from 'svelte/transition';
    import { onMount } from 'svelte';
	import { invalidate, invalidateAll } from '$app/navigation';

    onMount(() => {
		const interval = setInterval(() => {
			invalidateAll();
		}, 5000);

		return () => {
			clearInterval(interval);
		};
	});

    export let data;
    let loading = false;

    let timeLeft = 10;

    function timer() {
        loading = true;
        timeLeft = 10;
        let interval = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
            } else {
                timeLeft = 0;
                clearInterval(interval);
                loading = false;
            }
        }, 1000);
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

<main class="bg-gray-50 dark:bg-gray-900">
    <div class="flex flex-col justify-center items-center px-6 mx-auto h-screen xl:px-0 dark:bg-gray-900">
        <div class="block md:max-w-md">
            <img src="/vectors/verify-email.svg" alt="Verify Email" class="w-60">
        </div>
        <div class="text-center xl:max-w-4xl">
            <h1 class="mb-3 text-2xl font-bold leading-tight text-gray-900 sm:text-4xl lg:text-4xl dark:text-white">Verify your email</h1>
            <p class="mb-5 text-base font-normal text-gray-500 md:text-lg dark:text-gray-400">Hey! We have sent a verification email to <strong>{data.organization.email}</strong>. <br/> Please confirm to proceed.</p>
            <form method="POST"
                use:enhance={() => {
                    timer();
                    return async ({ update }) => {
                        await update({ reset: false });
                        triggerToast();
                    };
                }}>
                <button disabled={loading} type="submit" class="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center mr-3 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">
                    {#if loading}
                        Email Sent ({timeLeft})
                    {:else}
                        Resend Email
                    {/if}
                </button>
                <button id="intercom-launcher" class="font-medium text-gray-600 dark:text-gray-500 hover:underline">Need help?</button>
            </form>
        </div>
    </div>
</main>

<Toast transition={fly} params="{{x: 200}}" color="green" position="top-right" open={toast} class="fixed">
    <svelte:fragment slot="icon">
      <i class="icon-check"></i>
    </svelte:fragment>
    Verification email sent successfully!
</Toast>