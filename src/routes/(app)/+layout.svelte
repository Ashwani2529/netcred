<svelte:head>
  <script>
    localStorage.getItem('color-theme') === 'dark' ||
    (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ? window.document.documentElement.classList.add('dark')
      : window.document.documentElement.classList.remove('dark');
  </script>
</svelte:head>
<script>
  import { Avatar, Dropdown, DropdownDivider, DropdownItem } from 'flowbite-svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { organization,theme } from '../data.js';
  import { generateInitials } from '../helpers.js';
  import { Tooltip } from 'flowbite-svelte';
  import { navigating } from '$app/stores';
  import { afterNavigate } from '$app/navigation';
  import { fade } from 'svelte/transition';
  import PageLoader from '$lib/PageLoader.svelte';

  $: activeUrl = $page.url.pathname;

  afterNavigate((event) => {
    if (window.analytics) {
      window.analytics.page({
        referrer: event?.from?.url?.href,
        url: event.to.url.href
      })
    }
  });

  export let data;
  
  let isDark = null;

  onMount(async () => {
    isDark = localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (window.Intercom) {
      window.Intercom('boot', {
        app_id: "jx8figbr",
        custom_launcher_selector: "#intercom-launcher",
        name: $organization.name,
        email: $organization.email,
        created_at: $organization.date_joined,
        user_id: $organization.id
      });
    }
    if (window.analytics) {
      window.analytics.identify($organization.id, {
        name: $organization.name,
        email: $organization.email
      });
    }
	});

  const toggleTheme = () => {
    isDark = window.document.documentElement.classList.toggle('dark');
    theme.set(isDark ? 'dark' : 'light');
    localStorage.setItem('color-theme', isDark ? 'dark' : 'light');
  };

  $: $organization = data.organization;

  function supportTriggered() {
    if (window.analytics) {
      window.analytics.track('support-triggered');
    }
  }

  function handleKeyDownTheme(event) {
        // Ensure the enter key is handled for accessibility
        if (event.key === 'Enter') {
            toggleTheme();
        }
    }

    function handleKeyUpTheme(event) {
        // Ensure the spacebar key is handled for accessibility
        if (event.key === ' ') {
            toggleTheme();
        }
    }
</script>

{#if $navigating}
  <PageLoader />
{/if}

<main class="md:hidden bg-gray-50 dark:bg-gray-900">
  <div class="flex flex-col justify-center items-center px-6 mx-auto h-screen xl:px-0 dark:bg-gray-900">
      <div class="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
          <div class="mx-auto max-w-screen-sm text-center">
              <p class="mb-4 text-3xl tracking-tight font-bold text-gray-900 md:text-4xl dark:text-white">
                Mobile Unsupported
              </p>
              <p class="mb-4 text-lg font-light text-gray-500 dark:text-gray-400">
                This page isn't available for mobile. Please visit from a desktop device.
              </p>
              <a href="https://netcredential.com" class="inline-flex text-white bg-primary-600 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:focus:ring-primary-900 my-4">Back to homepage</a>
          </div>   
      </div>
  </div>
</main>

<div class="md:block hidden antialiased bg-gray-50 dark:bg-gray-900">
  <aside id="default-sidebar" class="fixed top-0 left-0 z-40 w-60 h-screen transition-transform -translate-x-full sm:translate-x-0" aria-label="Sidenav">
  <div class="overflow-y-auto py-5 px-3 h-full bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <a href="/" class="flex flex-col pl-2 mb-5">
        <span class="text-2xl font-semibold text-primary-900 dark:text-white">NetCredential</span>
        <span class="text-xs font-medium dark:text-white -mt-1">v3.5.0</span>
      </a>
      <ul class="space-y-2">
          <li>
              <a href="/" class="{activeUrl === '/'?'bg-gray-100 dark:bg-gray-700':''} flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                  <i class="icon-grid-2 text-gray-400 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"></i>
                  <span class="ml-3">Dashboard</span>
              </a>
          </li>
          <li>
            <a href="/designs" class="{/^\/designs(\/.*)?$/.test(activeUrl)?'bg-gray-100 dark:bg-gray-700':''} flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                <i class="icon-paintbrush-pencil text-gray-400 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"></i>
                <span class="ml-3">Designs</span>
            </a>
          </li>
          <!-- <li>
            <a href="/create" class="{activeUrl === '/create'?'bg-gray-100 dark:bg-gray-700':''} flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                <i class="icon-circle-plus text-gray-400 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"></i>
                <span class="ml-3">Create Credential</span>
            </a>
          </li> -->
          <li>
            <a href="/groups" class="{/^\/groups(\/.*)?$/.test(activeUrl)?'bg-gray-100 dark:bg-gray-700':''} flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                <i class="icon-layer-group text-gray-400 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"></i>
                <span class="ml-3">Groups</span>
            </a>
          </li>
          <!-- <li>
            <a href="/credentials" class="{activeUrl === '/credentials'?'bg-gray-100 dark:bg-gray-700':''} flex items-center p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                <i class="icon-layer-group text-gray-400 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"></i>
                <span class="ml-3">Credentials</span>
            </a>
          </li> -->
      </ul>
      <ul class="pt-5 mt-5 space-y-2 border-t border-gray-200 dark:border-gray-700">
          <li>
              <a href="/billing" class="{activeUrl === '/billing'?'bg-gray-100 dark:bg-gray-700':''} flex items-center p-2 text-base font-normal text-gray-900 rounded-lg transition duration-75 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white group">
                  <i class="icon-credit-card text-gray-400 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"></i>
                  <span class="ml-3">Billing</span>
                  <span class="ml-auto bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300 s-qwgTbwBbb0Y4">{$organization.credits}</span>
              </a>
          </li>
          <li>
            <a href="/profile" class="{activeUrl === '/profile'?'bg-gray-100 dark:bg-gray-700':''} flex items-center p-2 text-base font-normal text-gray-900 rounded-lg transition duration-75 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white group">
                <i class="icon-user text-gray-400 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"></i>
                <span class="ml-3">Profile</span>
            </a>
          </li>
          <li>
            <a href="/integrations" class="{activeUrl === '/integrations'?'bg-gray-100 dark:bg-gray-700':''} flex items-center p-2 text-base font-normal text-gray-900 rounded-lg transition duration-75 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white group">
                <i class="icon-circle-nodes text-gray-400 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"></i>
                <span class="ml-3">Integrations</span>
            </a>
          </li>
          <li>
              <a on:click={supportTriggered} href="https://netcredential.com/help-center" target="_blank" class="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg transition duration-75 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white group">
                  <i class="icon-life-ring text-gray-400 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"></i>
                  <span class="ml-3">Support</span>
              </a>
          </li>
      </ul>
  </div>
  <div class="block absolute bottom-0 left-0 p-4 w-full bg-white dark:bg-gray-800 z-20 border-r border-gray-200 dark:border-gray-700">
      <!-- <div class="toggle bg-slate-100 dark:bg-gray-900 mb-4" on:click={toggleTheme}>
        <div class="icons text-dark dark:text-white">
          <svg class:active={isDark !== null && !isDark} width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M6.995 12C6.995 14.761 9.241 17.007 12.002 17.007C14.763 17.007 17.009 14.761 17.009 12C17.009 9.239 14.763 6.993 12.002 6.993C9.241 6.993 6.995 9.239 6.995 12ZM11 19H13V22H11V19ZM11 2H13V5H11V2ZM2 11H5V13H2V11ZM19 11H22V13H19V11Z"></path><path d="M5.63702 19.778L4.22302 18.364L6.34402 16.243L7.75802 17.657L5.63702 19.778Z"></path><path d="M16.242 6.34405L18.364 4.22205L19.778 5.63605L17.656 7.75805L16.242 6.34405Z"></path><path d="M6.34402 7.75902L4.22302 5.63702L5.63802 4.22302L7.75802 6.34502L6.34402 7.75902Z"></path><path d="M19.778 18.3639L18.364 19.7779L16.242 17.6559L17.656 16.2419L19.778 18.3639Z"></path></svg>
          <svg class:active={isDark !== null && isDark} width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 11.807C10.7418 10.5483 9.88488 8.94484 9.53762 7.1993C9.19037 5.45375 9.36832 3.64444 10.049 2C8.10826 2.38205 6.3256 3.33431 4.92899 4.735C1.02399 8.64 1.02399 14.972 4.92899 18.877C8.83499 22.783 15.166 22.782 19.072 18.877C20.4723 17.4805 21.4245 15.6983 21.807 13.758C20.1625 14.4385 18.3533 14.6164 16.6077 14.2692C14.8622 13.9219 13.2588 13.0651 12 11.807V11.807Z"></path></svg>
        </div>
      </div> -->
      
      <div
    class="toggle bg-slate-100 dark:bg-gray-900 mb-4"
    on:click={toggleTheme}
    on:keydown={(event) => handleKeyDownTheme(event)}
    on:keyup={(event) => handleKeyUpTheme(event)}
>
    <div class="icons text-dark dark:text-white">
        <svg class:active={isDark !== null && !isDark} width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.995 12C6.995 14.761 9.241 17.007 12.002 17.007C14.763 17.007 17.009 14.761 17.009 12C17.009 9.239 14.763 6.993 12.002 6.993C9.241 6.993 6.995 9.239 6.995 12ZM11 19H13V22H11V19ZM11 2H13V5H11V2ZM2 11H5V13H2V11ZM19 11H22V13H19V11Z"></path><path d="M5.63702 19.778L4.22302 18.364L6.34402 16.243L7.75802 17.657L5.63702 19.778Z"></path><path d="M16.242 6.34405L18.364 4.22205L19.778 5.63605L17.656 7.75805L16.242 6.34405Z"></path><path d="M6.34402 7.75902L4.22302 5.63702L5.63802 4.22302L7.75802 6.34502L6.34402 7.75902Z"></path><path d="M19.778 18.3639L18.364 19.7779L16.242 17.6559L17.656 16.2419L19.778 18.3639Z"></path>
        </svg>
        <svg class:active={isDark !== null && isDark} width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 11.807C10.7418 10.5483 9.88488 8.94484 9.53762 7.1993C9.19037 5.45375 9.36832 3.64444 10.049 2C8.10826 2.38205 6.3256 3.33431 4.92899 4.735C1.02399 8.64 1.02399 14.972 4.92899 18.877C8.83499 22.783 15.166 22.782 19.072 18.877C20.4723 17.4805 21.4245 15.6983 21.807 13.758C20.1625 14.4385 18.3533 14.6164 16.6077 14.2692C14.8622 13.9219 13.2588 13.0651 12 11.807V11.807Z"></path>
        </svg>
        </div>
    </div>
      <!-- ------- -->
      <div class="flex items-center space-x-3 avatar">
        {#if $organization.logo}
          <Avatar src={$organization.logo} border></Avatar>
        {:else}
          <Avatar border>{generateInitials($organization.name)}</Avatar>
        {/if}
        <div class="font-medium dark:text-white">
            <div class="truncate">{$organization.name}</div>
            <Tooltip>{$organization.name}</Tooltip>
            <a href="/logout" data-sveltekit-preload-data="off" data-sveltekit-reload class="text-sm text-gray-500 dark:text-gray-400 hover:underline" type="submit">Sign out</a>
        </div>
      </div>
  </div>
  </aside>

  <slot />
</div>

<style>
.toggle {
  width: 130px;
  border-radius: 40px;
  padding: 5px;
  position: relative;
  transition: background 0.5s ease;
  cursor: pointer;
  transform: scale(0.9);
  transform-origin: left;
  transform-box:fill-box;
}

.toggle .icons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.toggle .icons svg {
  height: 30px;
  width: 50%;
  border-radius: 40px;
  padding: 4px;
}

.toggle .icons svg.active {
  background: white;
}

.dark .toggle .icons svg.active {
  background: #2E3139;
}

.truncate {
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:global(.avatar img) {
  -o-object-fit: contain;
  object-fit: contain;
} 
</style>