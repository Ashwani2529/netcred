<script>
    import { base } from "$app/paths";
    import { organization } from '../../data.js';
    import { Button, Dropdown, DropdownItem, MenuButton, DropdownDivider, Label, Input, Modal, Toast, Badge, Spinner, Alert } from 'flowbite-svelte';
    import { fly } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import { Tooltip } from 'flowbite-svelte';
    import { invalidateAll } from '$app/navigation';

    export let data;

    let selectedGroup = null;
    let toastType = null;
    let toastMessage;
    let loading = false;
    let deleteModal = false;
    let deleteModalEmpty = false;

    async function deleteGroup() {
        loading = true;
        try {
            let response = await fetch('/api/delete-group', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ group: selectedGroup.id }),
            });
            loading = false;
            const result = await response.json();

            if (!response.ok) {
                if (result.error) {
                    toastMessage = result.error;
                } else {
                    toastMessage = 'Something went wrong';
                }
                toastType = 'error';
                triggerToast();
            }

            if (response.ok) {
                deleteModalEmpty = false;
                toastMessage = 'Successfully deleted group';
                toastType = 'success';
                triggerToast();
                invalidateAll();
                if (window.analytics) {
                    window.analytics.track('group-deleted', {
                        group: selectedGroup.name,
                        group_id: selectedGroup.id
                    });
                }
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }
        loading = false;
    }

    function openDeleteModal(group) {
        selectedGroup = group;
        if (group.total_credentials) {
            deleteModal = true;
        } else {
            deleteModalEmpty = true;
        }
    }

    const itemsPerPage = 10;
    let currentPage = 1;

    let searchQuery = '';
    let paginatedData = [];
    let filteredGroups = [];

    $: {
        filteredGroups = data.groups;
        updatePagination();
    }

    function updatePagination() {
        filteredGroups = data.groups.filter((group) => {
			searchQuery = searchQuery.toLowerCase();
			let id = group.id.toLowerCase();
			let name = group.name.toLowerCase();
			// let status = group.status.toLowerCase();
			let timestamp = group.timestamp.toLocaleString("en-IN", {"dateStyle": "long", "timeStyle": "short"}).toLowerCase();
			return [id, name, timestamp].some(string => string.includes(searchQuery));
        });

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        paginatedData = filteredGroups.slice(startIndex, endIndex);
    }

    function handleSearch(event) {
        searchQuery = event.target.value;
        currentPage = 1;
        updatePagination();
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
        const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            updatePagination();
        }
    }

    // Toast Function
    let toast = false;
    let counter = 3;
    let toastTimeout;
    function triggerToast() {
        if (toast) {
            closeToast();
        }
        toast = true;
        counter = 3;
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

    function truncateWithEllipsis(text, maxLength) {
        if (text.length > maxLength) {
            return text.substring(0, maxLength) + '...';
        }
        return text;
    }

    function copyId(content) {
        const textarea = document.createElement('textarea');
        textarea.value = content;
        document.body.appendChild(textarea);
        
        textarea.select();
        document.execCommand('copy');

        document.body.removeChild(textarea);
    }
</script>
<main class="p-4 md:ml-60 min-h-screen">
    {#if !data.groups.length}
    <div class="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden">
        <div class="flex flex-col items-center justify-between gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
            <img src="{base}/folder.png" alt="Create Group" class="w-80">
            <div class="text-center">
                <h2 class="mb-3 text-2xl font-bold leading-tight text-gray-900 dark:text-white">Create your first group</h2>
                <p class="mb-5 text-base font-normal text-gray-500 dark:text-gray-400">It appears you haven't created any groups yet. <br> Let's create your first group.</p>
            </div>
            <div class="mb-4">
                <Button href="/groups/create"><i class="icon-plus me-1" /> Create Group</Button>
            </div>
        </div>
    </div>
    {:else}
    <div class="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden">
        <div class="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 p-4 border-b border-gray-200 dark:border-gray-700">
            <div class="w-full md:w-1/2">
                <form class="flex items-center">
                    <label for="simple-search" class="sr-only">Search</label>
                    <div class="relative w-full">
                        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <i class="icon-magnifying-glass text-gray-500 dark:text-gray-400"></i>
                        </div>
                        <input on:input={handleSearch} type="text" id="simple-search" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="Search" required="">
                    </div>
                </form>
            </div>
            <a href="/groups/create" type="button" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"><i class="icon-plus me-1"/> Create Group</a>
        </div>
        <div class="overflow-x-auto">
            {#if paginatedData.length}
            <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" class="px-4 py-3">ID</th>
                        <th scope="col" class="px-4 py-3">Group Name</th>
                        <th scope="col" class="px-4 py-3">Updated</th>
                        <th scope="col" class="px-4 py-3">Credentials</th>
                        <!-- <th scope="col" class="px-4 py-3">Status</th> -->
                        <th scope="col" class="px-4 py-3">
                            <span class="sr-only">Actions</span>
                        </th>
                    </tr>
                </thead>
                {#if data.groups.length > 0}
                <tbody>
                    {#each paginatedData as group}
                    <tr class="border-b dark:border-gray-700">
                        <td class="px-4 py-3 cursor-copy">
                            <span on:click={()=>copyId(group.id)}>{truncateWithEllipsis(group.id, 14)}</span>
                            <Tooltip>{group.id}</Tooltip>
                        </td>
                        <td class="px-4 py-3">{group.name}</td>
                        <td class="px-4 py-3">{group.timestamp.toLocaleString("en-IN", {"dateStyle": "long", "timeStyle": "short"})}</td>
                        <td class="px-4 py-3">{group.total_credentials}</td>
                        <!-- <td class="px-4 py-3">
                            {#if group.status == 'Processed'}
                                <Badge color="green">{group.status}</Badge>
                            {:else if group.status == 'Created'}
                                <Badge color="blue">{group.status}</Badge>
                            {:else}
                                {group.status}
                            {/if}
                        </td> -->
                        <td class="px-4 py-3 flex items-center justify-end">
                            <Button class='me-2' href="/groups/{group.id}/credentials" color='alternative' size='xs'>View Credentials</Button>
                            <MenuButton class="dots-menu-{group.id} dark:text-white" />
                            <Dropdown triggeredBy=".dots-menu-{group.id}" placement="left" style="z-index: 10;">
                                <DropdownItem href="/groups/{group.id}/settings">Group Settings</DropdownItem>
                                <DropdownDivider/>
                                <DropdownItem class="text-red-700" on:click={() => openDeleteModal(group)}>Delete</DropdownItem>
                            </Dropdown>
                        </td>
                    </tr>
                    {/each}
                </tbody>
                {/if}
            </table>
            {:else}
            <div class="flex flex-col items-center justify-between gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
                <img src="{base}/no-result.png" alt="Create Design" class="w-80">
                <div class="text-center">
                    <h2 class="mb-3 text-2xl font-bold leading-tight text-gray-900 dark:text-white">No results found</h2>
                    <p class="mb-5 text-base font-normal text-gray-500 dark:text-gray-400">Try refining your search criteria</p>
                </div>
            </div>
            {/if}
        </div>
        <nav class="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0 p-4" aria-label="Table navigation">
            <span class="text-sm font-normal text-gray-500 dark:text-gray-400">
                Showing
                <span class="font-semibold text-gray-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1} - {Math.min((currentPage - 1) * itemsPerPage + 1 + itemsPerPage - 1, filteredGroups.length)}</span>
                of
                <span class="font-semibold text-gray-900 dark:text-white">{filteredGroups.length}</span>
            </span>
            <ul class="inline-flex items-stretch -space-x-px">
                <li>
                    <button on:click={goToPreviousPage} disabled={currentPage === 1} class="flex items-center justify-center h-full py-1.5 px-3 ml-0 text-gray-500 bg-white rounded-l-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                        <span class="sr-only">Previous</span>
                        <i class="icon-chevron-left"></i>
                    </button>
                </li>
                {#each Array(Math.ceil(filteredGroups.length / itemsPerPage)).fill() as _, index}
                    <button on:click={() => goToPage(index + 1)} class="flex items-center justify-center text-sm py-2 px-3 leading-tight  {currentPage == index + 1 ? 'text-white bg-primary-600 dark:bg-gray-500 dark:text-white' : 'text-gray-500 bg-white dark:bg-gray-800 dark:text-gray-400'} border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white">{index + 1}</button>
                {/each}
                <li>
                    <button on:click={goToNextPage} disabled={currentPage === Math.ceil(filteredGroups.length / itemsPerPage)} class="flex items-center justify-center h-full py-1.5 px-3 leading-tight text-gray-500 bg-white rounded-r-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                        <span class="sr-only">Next</span>
                        <i class="icon-chevron-right"></i>
                    </button>
                </li>
            </ul>
        </nav>
    </div>
    {/if}
</main>

<Modal class="text-center" bind:open={deleteModalEmpty} size='xs'>
    <div class="d-block">
        <h3 class="mb-2 text-gray-500 dark:text-gray-300">Are you sure you want to delete this group?</h3>
        <p class="mb-4">This action cannot be undone.</p>
        <div class="flex justify-center items-center space-x-4">
            <button type="submit" on:click={deleteGroup} class="py-2 px-3 text-sm font-medium text-center text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-900">
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
</Modal>

<Modal title="Group cannot be deleted" class="text-center" bind:open={deleteModal} size='xs'>
    <p>This group has <strong>{selectedGroup.total_credentials}</strong> {selectedGroup.total_credentials>1?'credentials':'credential'}. To delete this group, You have to delete all of the credentials in it first.</p>
</Modal>

<Toast transition={fly} params="{{x: 200}}" color={toastType=='success'?'green':'red'} position="top-right" open={toast} class="fixed">
    <svelte:fragment slot="icon">
        {#if toastType == 'success'}
            <i class="icon-check"></i>
        {:else if toastType == 'error'}
            <i class="icon-xmark"></i>
        {/if}
    </svelte:fragment>
    {toastMessage}
</Toast>