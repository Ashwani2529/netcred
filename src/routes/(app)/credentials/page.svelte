<!-- <script>    
    import { page } from "$app/stores";
    import { Button, Dropdown, DropdownItem, MenuButton, DropdownDivider, Label, Input, Modal, Toast } from 'flowbite-svelte';
    import { fly } from 'svelte/transition';
    import { setAllValuesToNull, generatePageButtons, generateCSV } from "../../helpers.js";
    import { Breadcrumb, BreadcrumbItem, Spinner, Badge } from 'flowbite-svelte';
    import { invalidateAll } from '$app/navigation';
    import { onMount } from 'svelte';
    import { enhance } from '$app/forms';

    export let data;

    let pageButtons = [];
    let deleteModal = false;
    const itemsPerPage = 10;
    let currentPage = 1;
    let searchQuery = "";
    // let groups = [];
    let paginatedData = [];
    let filteredGroups = [];    
    let recipient = {};
    let toastText = '';
    let toastType = null;
    let recipientModal = false;
    let action = 'update';

    $: {
        filteredGroups = data.credentials;
        status = filteredGroups.reduce((acc, curr) => {
            acc[curr.status] = acc[curr.status] ? acc[curr.status] + 1 : 1;
            return acc;
        }, {});
        updatePagination();
    }

    onMount(async () => {
        recipient = filteredGroups[0];

        // const interval = setInterval(() => {
		// 	invalidateAll();
		// }, 15000);

		// return () => {
		// 	clearInterval(interval);
		// };
	});

    let openRecipientModal = (rec, act) => {
        action = act;
        recipient = action === 'add' ? setAllValuesToNull(recipient) : rec;
        recipientModal = true;
    }

    function updatePagination() {
        searchFilter();
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        paginatedData = filteredGroups.slice(startIndex, endIndex);
        pageButtons = generatePageButtons(filteredGroups, itemsPerPage, currentPage);
    }

    function handleSearch(event) {
        // document.getElementById("searchForm").submit();
        // searchQuery = event.target.value;
        // currentPage = 1;
        // updatePagination();
    }

    function searchFilter() {
        filteredGroups = data.credentials.filter((group) => {
            searchQuery = searchQuery.toLowerCase();
            let id = group.id.toLowerCase();
            let name = group.recipient_name.toLowerCase();
            let email = group.recipient_email.toLowerCase();
            let status = group.status.toLowerCase();
            let timestamp = group.created_at
                .toLocaleString("en-IN", {
                    dateStyle: "long",
                    timeStyle: "short",
                })
                .toLowerCase();
            return [id, name, email, status, timestamp].some((string) =>
                string.includes(searchQuery)
            );
        });
    }

    let loading = false;

    async function updateCredential() {
        let form = document.getElementById("recipientForm");
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        loading = true;
        try {
            let response = await fetch('/api/update-recipient', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ group: data.credentials.group, recipient: { id: recipient.id, recipient_name: recipient.recipient_name, recipient_email: recipient.recipient_email, extra: recipient.extra } }),
            });
            const result = await response.json();

            loading = false;
            recipientModal = false;

            if (!response.ok) {
                if (result.error) {
                    toastText = result.error;
                } else {
                    toastText = 'Something went wrong';
                }
                toastType = 'error';
                triggerToast();
            }

            if (response.ok) {
                toastText = 'Successfully updated credential!';
                toastType = 'success';
                triggerToast();
                invalidateAll();
                if (window.analytics) {
                    window.analytics.track('credential-updated', {
                        group: data.group.name,
                        group_id: data.group.id,
                        recipient: { id: recipient.id, recipient_name: recipient.recipient_name, recipient_email: recipient.recipient_email, extra: recipient.extra }
                    });
                }
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }
        loading = false;
    }

    async function deleteCredential() {
        loading = true;
        try {
            let response = await fetch('/api/delete-recipient', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ group: group.id, recipient: recipient.id }),
            });
            loading = false;
            const data = await response.json();

            if (!response.ok) {
                if (data.error) {
                    toastText = data.error;
                } else {
                    toastText = 'Something went wrong';
                }
                toastType = 'error';
                triggerToast();
            }

            if (response.ok) {
                deleteModal = false;
                toastText = 'Successfully deleted credential!';
                toastType = 'success';
                triggerToast();
                invalidateAll();
                if (window.analytics) {
                    window.analytics.track('credential-deleted', {
                        group: data.group.name,
                        group_id: data.group.id,
                        recipient: recipient.id
                    });
                }
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }
        loading = false;
    }

    // Function to navigate to a specific page
    const goToPage = (page) => {
        currentPage = page;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        paginatedData = filteredGroups.slice(startIndex, endIndex);
        pageButtons = generatePageButtons(filteredGroups, itemsPerPage, currentPage);
    };

    // Function to navigate to the previous page
    const goToPreviousPage = () => {
        if (currentPage > 1) {
            currentPage--;
            goToPage(currentPage);
        }
    };

    // Function to navigate to the next page
    const goToNextPage = () => {
        const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            goToPage(currentPage);
        }
    };

    // Toast Function
    let toast = false;
    let counter = 5;
    let toastTimeout;
    function triggerToast() {
        // toastText = 'Credential deleted successfully!';
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
</script> -->

<!-- <main class="p-4 md:ml-64 min-h-screen">
    <div class="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden">
        <div class="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 px-4 py-3">
            <div class="w-full md:w-1/2">
                <form class="flex items-center" method="POST" action="?/search" id="searchForm" use:enhance>
                    <label for="simple-search" class="sr-only">Search</label>
                    <div class="relative w-full">
                        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <i class="icon-magnifying-glass text-gray-500 dark:text-gray-400"></i>
                        </div>
                        <input
                            type="text"
                            id="simple-search"
                            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                            placeholder="Search"
                            required=""
                            name="searchInput"
                        />
                    </div>
                    <button type="submit">Search</button>
                </form>
            </div>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" class="px-4 py-3">ID</th>
                        <th scope="col" class="px-4 py-3">Name</th>
                        <th scope="col" class="px-4 py-3">Email</th>
                        <th scope="col" class="px-4 py-3">Issued</th>
                        <th scope="col" class="px-4 py-3">Status</th>
                        <th scope="col" class="px-4 py-3">Group</th>
                        <th scope="col" class="px-4 py-3">
                            <span class="sr-only">Actions</span>
                        </th>
                    </tr>
                </thead>
                {#if data.credentials.length > 0}
                    <tbody>
                        {#each paginatedData as group}
                            <tr class="border-b dark:border-gray-700">
                                <td class="px-4 py-3">{group.id}</td>
                                <td class="px-4 py-3"
                                    >{group.recipient_name}</td
                                >
                                <td class="px-4 py-3"
                                    >{group.recipient_email}</td
                                >
                                <td class="px-4 py-3"
                                    >{group.created_at.toLocaleString(
                                        "en-IN",
                                        {
                                            dateStyle: "long",
                                            timeStyle: "short",
                                        }
                                    )}</td
                                >
                                <td class="px-4 py-3">
                                    {#if group.status.toLowerCase() == 'queued'}
                                        <Badge color="yellow" class="capitalize">{group.status}</Badge>
                                    {:else if group.status.toLowerCase() == 'delivered'}
                                        <Badge color="green" class="capitalize">{group.status}</Badge>
                                    {:else if group.status.toLowerCase() == 'opened'}
                                        <Badge color="green" class="capitalize">{group.status}</Badge>
                                    {:else if group.status.toLowerCase() == 'clicked'}
                                        <Badge color="green" class="capitalize">{group.status}</Badge>
                                    {:else if group.status.toLowerCase() == 'failed'}
                                        <Badge color="red" class="capitalize">{group.status}</Badge>
                                    {:else}
                                        <Badge class="capitalize">{group.status}</Badge>
                                    {/if}
                                </td>
                                <td class="px-4 py-3"><a href="/groups/${group.group_id}">{group.group.name}</a></td>
                                <td class="px-4 py-3 flex items-center justify-end">
                                    <MenuButton class="dots-menu-{group.id} dark:text-white" />
                                    <Dropdown triggeredBy=".dots-menu-{group.id}" placement="left" style="z-index: 10;">
                                        <DropdownItem href="/verify/{group.id}" target="_blank">View</DropdownItem>
                                        <DropdownItem on:click={()=>openRecipientModal(group, 'view')}>Details</DropdownItem>
                                        <DropdownItem on:click={()=>openRecipientModal(group, 'update')}>Update</DropdownItem>
                                        <DropdownDivider/>
                                        Commented-- <DropdownItem>Expire</DropdownItem>
                                        <DropdownItem class="text-red-700" on:click={() => deleteModal = true}>Delete</DropdownItem>
                                    </Dropdown>
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
                <span class="font-semibold text-gray-900 dark:text-white"
                    >{(currentPage - 1) * itemsPerPage + 1} - {Math.min(
                        (currentPage - 1) * itemsPerPage + 1 + itemsPerPage - 1,
                        filteredGroups.length
                    )}</span
                >
                of
                <span class="font-semibold text-gray-900 dark:text-white"
                    >{filteredGroups.length}</span
                >
            </span>
            <ul class="inline-flex items-stretch -space-x-px">
                <li>
                    <button
                        on:click={goToPreviousPage}
                        disabled={currentPage === 1}
                        class="flex items-center justify-center h-full py-1.5 px-3 ml-0 text-gray-500 bg-white rounded-l-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                    >
                        <span class="sr-only">Previous</span>
                        <i class="icon-chevron-left"></i>
                    </button>
                </li>
                {#each pageButtons as button}
                    {#if button.page}
                        <button
                            on:click={() => goToPage(button.page)}
                            class="flex items-center justify-center text-sm py-2 px-3 leading-tight {currentPage ===
                            button.page
                                ? 'text-white bg-primary-600 dark:bg-gray-500 dark:text-white'
                                : 'text-gray-500 bg-white dark:bg-gray-800 dark:text-gray-400'} border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white"
                            >{button.page}</button
                        >
                    {:else if button.separator}
                        <button
                            disabled
                            class="flex items-center justify-center text-sm py-2 px-3 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                            >...</button
                        >
                    {/if}
                {/each}
                <li>
                    <button
                        on:click={goToNextPage}
                        disabled={currentPage ===
                            Math.ceil(filteredGroups.length / itemsPerPage)}
                        class="flex items-center justify-center h-full py-1.5 px-3 leading-tight text-gray-500 bg-white rounded-r-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                    >
                        <i class="icon-chevron-right"></i>
                    </button>
                </li>
            </ul>
        </nav>
    </div>
</main> -->

<!-- <Modal class="capitalize modal" title="{action} recipient" bind:open={recipientModal}>
    <form id="recipientForm">
        <label class="text-sm font-medium block text-gray-900 dark:text-gray-300 space-y-2">
            <span>Name</span>
            <input bind:value={recipient.recipient_name} required disabled={action=='view'} class="block w-full p-2.5 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-500 text-sm rounded-lg" type="text">
        </label>
        <label class="mt-2 text-sm font-medium block text-gray-900 dark:text-gray-300 space-y-2">
            <span>Email</span>
            <input bind:value={recipient.recipient_email} required disabled={action=='view'} class="block w-full p-2.5 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-500 text-sm rounded-lg" type="email">
        </label>
        {#each Object.keys(recipient.extra) as label}
            <label class="mt-2 text-sm font-medium block text-gray-900 dark:text-gray-300 space-y-2 empty:p-0">
                <span>{label}</span>
                <input bind:value={recipient.extra[label]} required disabled={action=='view'} class="block w-full p-2.5 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-500 text-sm rounded-lg" type="text">
            </label>
        {/each}
    </form>
    
    <svelte:fragment slot='footer'>
        {#if action == 'add'}
            <Button on:click={addCredential}>
                {#if loading}
                    <Spinner size="5" color="white" />
                {:else}
                    Add
                {/if}
            </Button>
        {:else if action == 'update'}
            <Button on:click={updateCredential}>
                {#if loading}
                    <Spinner size="5" color="white" />
                {:else}
                    Update
                {/if}
            </Button>
        {/if}
    </svelte:fragment>
</Modal> -->

<!-- <Modal class="text-center" bind:open={deleteModal} size='xs'>
    <div class="d-block">
        <h3 class="mb-2 text-gray-500 dark:text-gray-300">Are you sure you want to delete this credential?</h3>
        <p class="mb-4">This action cannot be undone.</p>
        <div class="flex justify-center items-center space-x-4">
            <button type="submit" on:click={deleteCredential} class="py-2 px-3 text-sm font-medium text-center text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-900">
                {#if loading}
                    <Spinner size="5" color="white" />
                {:else}
                    Yes, I'm sure
                {/if}
            </button>
            <button on:click={()=>deleteModal=false} type="button" class="py-2 px-3 text-sm font-medium text-gray-500 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-primary-300 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600">
                No, cancel
            </button>
        </div>
    </div>
</Modal> -->

<!-- <Toast transition={fly} params="{{x: 200}}" color={toastType=='success'?'green':'red'} position="top-right" open={toast} class="fixed">
    <svelte:fragment slot="icon">
        {#if toastType == 'success'}
            <i class="icon-check"></i>
        {:else if toastType == 'error'}
            <i class="icon-xmark"></i>
        {/if}
    </svelte:fragment>
    {toastText}
</Toast> -->