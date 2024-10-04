<script>
    import { organization } from '../../data.js';
    import { Button, Dropdown, DropdownItem, MenuButton, DropdownDivider, Label, Input, Modal, Toast, Badge, Spinner, Alert, Tooltip } from 'flowbite-svelte';
    import { fly } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import { invalidateAll } from '$app/navigation';
    import { base } from "$app/paths";
    // import { Button, Dropdown, DropdownItem } from 'flowbite-svelte';
    // import { ChevronDownSolid } from 'flowbite-svelte-icons';

    export let data;

    let deleteModal = false;
    let designDeleteModal = false;
    let groupName = null;
    let usedGroups = null;
    let loading = false;
    let selectedDesign;


    function goToDesign(id, type) {
        if (type == 'certificate') {
            goto(`/designs/certificate/${id}`);
        } else if (type == 'badge') {
            goto(`/designs/badge/${id}`);
        }
    }
    function adaptProperties(){
        
    }

    async function duplicateDesign(design) {
        let response = await fetch('/api/duplicate-design', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ designId: design.id }),
        });

        const result = await response.json();
        toastType = 'success';
        toastMessage = 'Design duplicated successfully';
        triggerToast();
        invalidateAll();
    }

    async function openDeleteDesign(design) {
        selectedDesign = design;
        let response = await fetch('/api/delete-design-check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ designId: design.id }),
        });

        const result = await response.json();
        if (result.message == 'Success') {
            deleteModal = true;
        } else if (result.message == 'Used') {
            groupName = design.name;
            usedGroups = result.groups;
            designDeleteModal = true;
        }
    }

    async function deleteDesign() {
        loading = true;
        let response = await fetch('/api/delete-design', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ designId: selectedDesign.id }),
        });

        const result = await response.json();
        loading = false;

        if (result.message == 'Success') {
            deleteModal = false;
            toastType = 'success';
            toastMessage = 'Design deleted successfully';
            triggerToast();
            invalidateAll();
        } else if (result.message == 'Used') {
            groupName = design.name;
            usedGroups = result.groups;
            deleteModal = false;
            designDeleteModal = true;
        }
    }

    let toastType = null;
    let toastMessage;

    const itemsPerPage = 9;
    let currentPage = 1;

    let searchQuery = '';
    let paginatedData = [];
    let filteredDesigns = [];

    $: {
        filteredDesigns = data.designs;
        updatePagination();
    }

    function updatePagination() {
        console.log(data)
        filteredDesigns = data.designs.filter((design) => {
			searchQuery = searchQuery.toLowerCase();
			let name = design.name.toLowerCase();
			return [name].some(string => string.includes(searchQuery));
        });

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        paginatedData = filteredDesigns.slice(startIndex, endIndex);
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
        const totalPages = Math.ceil(filteredDesigns.length / itemsPerPage);
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
</script>
<main class="p-4 md:ml-60 min-h-screen">
    {#if !data.designs.length}
    <div class="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden">
        <div class="flex flex-col items-center justify-between gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
            <img src="{base}/design.png" alt="Create Design" class="w-80">
            <div class="text-center">
                <h2 class="mb-3 text-2xl font-bold leading-tight text-gray-900 dark:text-white">Create your first design</h2>
                <p class="mb-5 text-base font-normal text-gray-500 dark:text-gray-400">It appears you haven't created any designs yet. <br> Let's create your first design.</p>
            </div>
            <div class="mb-4">
                <Button href="/designs/certificate/create"><i class="icon-plus me-1" /> Create Certificate</Button>
                <Button href="/designs/badge/create"><i class="icon-plus me-1" /> Create Badge</Button>
            </div>
        </div>
    </div>
    {:else}
    <div class="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden">
        <div class="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 p-4 border-b border-gray-200 dark:border-gray-700">
            <div class="w-full md:w-1/3">
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
            <div>
                <Button href="/designs/certificate/create"><i class="icon-plus me-1" /> Create Certificate</Button>
                <Button href="/designs/badge/create"><i class="icon-plus me-1" /> Create Badge</Button>
            </div>
        </div>
        <div class="overflow-x-auto">
            {#if paginatedData.length}
            <div class="grid grid-cols-3 gap-4 p-4">
                {#each paginatedData as design}
                    <div class="card overflow-hidden relative bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                        <!-- {#if design.used}
                            <Badge class="!p-1.5 absolute right-1 top-1 cursor-pointer z-10">IN USE</Badge>
                        {/if} -->
                        {#if design.status == 'Legacy'}
                            <Badge class="!p-1.5 absolute right-1 top-1 cursor-pointer z-10" color="yellow">LEGACY</Badge>
                        {/if}
                        <div class="image-wrapper p-2 bg-gray-100 dark:bg-gray-800 relative">
                            <img class="rounded-t-lg h-full w-full object-contain" src={design?.preview?.includes('https://')?design.preview+'?t='+new Date().getTime():design.preview} alt={design.name} />
                        </div>
                        <div class="p-5">
                            <!-- <small>{design.id}</small> -->
                            <h5 class="text-lg font-bold tracking-tight text-gray-900 dark:text-white">{design.name}</h5>
                        </div>
                        <div class="overlay absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center">
                            <div class="grid grid-cols-3">
                                {#if design.status == 'Legacy'}
                                    <button disabled class="mx-2 transition duration-300 ease-in-out hover:bg-gray-200 hover:shadow-lg hover:-translate-y-1 text-lg text-gray-900 bg-gray-100 border border-gray-300 rounded-full w-12 h-12">
                                        <i class="icon-pen"></i>
                                    </button>
                                    <Tooltip>Legacy design cannot be edited</Tooltip>
                                    <button disabled class="mx-2 transition duration-300 ease-in-out hover:bg-gray-200 hover:shadow-lg hover:-translate-y-1 text-lg text-gray-900 bg-gray-100 border border-gray-300 rounded-full w-12 h-12">
                                        <i class="icon-copy"></i> 
                                    </button>
                                    <Tooltip>Legacy design cannont be duplicated</Tooltip>
                                    <button on:click={()=>openDeleteDesign(design)} class="mx-2 transition duration-300 ease-in-out hover:bg-gray-200 hover:shadow-lg hover:-translate-y-1 text-lg text-gray-900 bg-gray-100 border border-gray-300 rounded-full w-12 h-12">
                                        <i class="icon-trash-can"></i>
                                    </button>
                                {:else}
                                    <button on:click={()=>goToDesign(design.id, design.type)} class="mx-2 transition duration-300 ease-in-out hover:bg-gray-200 hover:shadow-lg hover:-translate-y-1 text-lg text-gray-900 bg-gray-100 border border-gray-300 rounded-full w-12 h-12">
                                        <i class="icon-pen"></i>
                                    </button>
                                    <button on:click={()=>duplicateDesign(design)} class="mx-2 transition duration-300 ease-in-out hover:bg-gray-200 hover:shadow-lg hover:-translate-y-1 text-lg text-gray-900 bg-gray-100 border border-gray-300 rounded-full w-12 h-12">
                                        <i class="icon-copy"></i>
                                    </button>
                                    <button on:click={()=>openDeleteDesign(design)} class="mx-2 transition duration-300 ease-in-out hover:bg-gray-200 hover:shadow-lg hover:-translate-y-1 text-lg text-gray-900 bg-gray-100 border border-gray-300 rounded-full w-12 h-12">
                                        <i class="icon-trash-can"></i>
                                    </button>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
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
                <span class="font-semibold text-gray-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1} - {Math.min((currentPage - 1) * itemsPerPage + 1 + itemsPerPage - 1, filteredDesigns.length)}</span>
                of
                <span class="font-semibold text-gray-900 dark:text-white">{filteredDesigns.length}</span>
            </span>
            <ul class="inline-flex items-stretch -space-x-px">
                <li>
                    <button on:click={goToPreviousPage} disabled={currentPage === 1} class="flex items-center justify-center h-full py-1.5 px-3 ml-0 text-gray-500 bg-white rounded-l-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                        <span class="sr-only">Previous</span>
                        <i class="icon-chevron-left"></i>
                    </button>
                </li>
                {#each Array(Math.ceil(filteredDesigns.length / itemsPerPage)).fill() as _, index}
                    <button on:click={() => goToPage(index + 1)} class="flex items-center justify-center text-sm py-2 px-3 leading-tight  {currentPage == index + 1 ? 'text-white bg-primary-600 dark:bg-gray-500 dark:text-white' : 'text-gray-500 bg-white dark:bg-gray-800 dark:text-gray-400'} border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white">{index + 1}</button>
                {/each}
                <li>
                    <button on:click={goToNextPage} disabled={currentPage === Math.ceil(filteredDesigns.length / itemsPerPage)} class="flex items-center justify-center h-full py-1.5 px-3 leading-tight text-gray-500 bg-white rounded-r-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                        <span class="sr-only">Next</span>
                        <i class="icon-chevron-right"></i>
                    </button>
                </li>
            </ul>
        </nav>
    </div>
    {/if}
</main>

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

<Modal class="text-center" bind:open={deleteModal} size='xs'>
    <div class="d-block">
        <h3 class="mb-2 text-gray-500 dark:text-gray-300">Are you sure you want to delete this design?</h3>
        <p class="mb-4">This action cannot be undone.</p>
        <div class="flex justify-center items-center space-x-4">
            <button type="submit" on:click={deleteDesign} class="py-2 px-3 text-sm font-medium text-center text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-900">
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

<Modal title="Design cannot be deleted" bind:open={designDeleteModal} size='xs'>
    <p><strong>{groupName}</strong> is being used by <strong>{usedGroups}</strong> {usedGroups>1?'groups':'group'}.</p>
    <p>To delete this design, remove it from {usedGroups>1?'these':'this'} {usedGroups>1?'groups':'group'} first.</p>
</Modal>

<style>
    .image-wrapper {
        height: 220px;
    }

    @media (min-width:576px) {
        .image-wrapper {
            height: 300px;
        }
    }

    .card .overlay {
        display: none;
    }

    .card:hover .overlay {
        display: flex;
    }

    .btn {
    display: inline-block;
    background-color: #1D4ED8;
    color: #fff;
    padding: 8px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    text-decoration: none;
    font-size: 13px;
    margin-right: 8px;
  }
  
  .btn i {
    margin-right: 2px;
  }

  .btn:hover {
    background-color: #0056b3;
  }
</style>