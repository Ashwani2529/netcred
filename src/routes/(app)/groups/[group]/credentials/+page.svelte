<script>
    import { base } from "$app/paths";
    import { page } from "$app/stores";
    import { Button, Dropdown, DropdownItem, MenuButton, DropdownDivider, Label, Input, Modal, Toast } from 'flowbite-svelte';
    import { fly } from 'svelte/transition';
    import { setAllValuesToNull, generatePageButtons, generateCSV } from "../../../../helpers.js";
    import { Breadcrumb, BreadcrumbItem, Spinner, Badge } from 'flowbite-svelte';
    import { invalidateAll } from '$app/navigation';
    import { onMount } from 'svelte';
    import {
        generateRandomID,
        capitalizeFirstLetter,
        po,
        cloneDeep,
        moveItem
    } from "$lib/helpers.js";
    import { Tooltip } from 'flowbite-svelte';

    export let data;

    let pageButtons = [];
    let deleteModal = false;
    let renewModal = false;
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
    let expiryModal = false;
    let expiry;
    let action = 'add';
    let status = {};
    let whenExpiry;
    let selectedCredential;

    $: {
        filteredGroups = data.credentials;
        status = filteredGroups.reduce((acc, curr) => {
            acc[curr.status] = acc[curr.status] ? acc[curr.status] + 1 : 1;
            return acc;
        }, {});
        updatePagination();
    }

    onMount(async () => {
        recipient = {
            "id": null,
            "org_id": null,
            "group_id": null,
            "recipient_email": null,
            "recipient_name": null,
            "issued": null,
            "expiry": null,
            "status": null,
            "created_at": null,
            "updated_at": null,
            "delivered_at": null,
            "opened_at": null,
            "clicked_at": null,
            "viewed_at": null,
            "shared_at": null
        };
        if (data.design.attributes) {
            const valuesToRemove = ['[recipient.name]', '[credential.id]', '[issuer.name]', '[group.name]', '[credential.issued]', '[credential.expiry]'];
            let attributes = data.design.attributes.filter(item => !valuesToRemove.includes(item)).map(item => item);
            recipient.extra = attributes.reduce((obj, item) => ({ ...obj, [item]: null }), {});
        } else {
            recipient.extra = filteredGroups[0].extra;
        }
        console.log(recipient.extra);
        // recipient = {
        //     "id": null,
        //     "org_id": null,
        //     "group_id": null,
        //     "recipient_email": null,
        //     "recipient_name": null,
        //     "issued": null,
        //     "expiry": null,
        //     "status": null,
        //     "created_at": null,
        //     "updated_at": null,
        //     "delivered_at": null,
        //     "opened_at": null,
        //     "clicked_at": null,
        //     "viewed_at": null,
        //     "shared_at": null
        // };
        // if (data.design.attributes) {
        //     const valuesToRemove = ['[recipient.name]', '[credential.id]', '[issuer.name]', '[group.name]', '[credential.issued]', '[credential.expiry]'];
        //     let attributes = data.design.attributes.filter(item => !valuesToRemove.includes(item)).map(item => item);
        //     recipient.extra = attributes.reduce((obj, item) => ({ ...obj, [item]: null }), {});
        // } else {
        //     recipient.extra = filteredGroups[0].extra;
        // }
        // console.log("Extra", recipient.extra);
        // const interval = setInterval(() => {
		// 	invalidateAll();
		// }, 15000);

		// return () => {
		// 	clearInterval(interval);
		// };
	});

    function setDateInputValue(dateObject) {
        const day = String(dateObject.getDate()).padStart(2, '0');
        const month = String(dateObject.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const year = dateObject.getFullYear();
        const dateString = `${day}/${month}/${year}`;
        return dateString;
    }

    let openRecipientModal = (rec, act) => {
        action = act;
        recipient = action === 'add' ? setAllValuesToNull(recipient) : rec;
        try {
            recipient.issued = recipient.issued.toISOString().slice(0, 10);
        } catch(e) {}
        if (action == 'add') recipient.issued = (new Date()).toISOString().slice(0, 10);
        recipientModal = true;
    }

    let openDeleteModal = (rec) => {
        selectedCredential = rec;
        deleteModal = true;
    }

    let openExpiryModal = (rec) => {
        selectedCredential = rec;
        whenExpiry = 'never';
        expiry = (new Date()).toISOString().slice(0, 10);
        expiryModal = true;
    }

    let openRenewModal = (rec) => {
        selectedCredential = rec;
        whenExpiry = 'never';
        expiry = (new Date()).toISOString().slice(0, 10);
        renewModal = true;
    }
    
    let exportData = () => {
        if (!recipient.extra) recipient.extra = {};
        let header = ['Name', 'Email', 'Issued', 'Expiry', ...Object.keys(recipient.extra), 'Status', 'Credential'];
        let arr = data.credentials.map(function(row) {
            if (data.organization.whitelabel && data.organization.whitelabel.active) {
                return [row.recipient_name, row.recipient_email, row.issued.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }), row.expiry?row.expiry.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '-', ...Object.values(row.extra), row.status, data.organization.whitelabel.domain+'/'+row.id];
            } else {
                return [row.recipient_name, row.recipient_email, row.issued.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }), row.expiry?row.expiry.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '-', ...Object.values(row.extra), row.status, 'https://verify.netcredential.com/'+row.id];
            }
        });
        arr.unshift(header);
        generateCSV(arr, data.group.name);
        if (window.analytics) {
            window.analytics.track('export-triggered', {
                group: data.group.name,
                group_id: data.group.id,
                group_recipients: data.credentials.length
            });
        }
    }

    function updatePagination(type = "search") {
        if (type == "search") {
            searchFilter();
        } else if (type == "tag") {
            tagFilter();
        }
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        paginatedData = filteredGroups.slice(startIndex, endIndex);
        pageButtons = generatePageButtons(filteredGroups, itemsPerPage, currentPage);
    }

    let activeTag = 'All';
    function filter(tag) {
        document.getElementById("simple-search").value = "";
        activeTag = tag;
        if (activeTag == "All") {
            searchQuery = '';
            searchFilter();
            updatePagination();
        } else {
            currentPage = 1;
            updatePagination("tag");
        }
    }

    function tagFilter() {
        filteredGroups = data.credentials.filter((group) => {
            return group.status == activeTag;
        });
    }

    function handleSearch(event) {
        searchQuery = event.target.value;
        activeTag = '';
        currentPage = 1;
        updatePagination();
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
    let loadingExpiry = false;
    let loadingRenew = false;

    async function addCredential() {
        let form = document.getElementById("recipientForm");
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        loading = true;
        try {
            let response = await fetch('/api/add-recipient', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ group: data.group, recipient: recipient }),
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
                toastText = 'Successfully added credential';
                toastType = 'success';
                triggerToast();
                invalidateAll();
                if (window.analytics) {
                    window.analytics.track('credential-added', {
                        group: data.group.name,
                        group_id: data.group.id,
                        recipient: { recipient_name: recipient.recipient_name, recipient_email: recipient.recipient_email, extra: recipient.extra }
                    });
                }
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }
        loading = false;
    }

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
                body: JSON.stringify({ group: data.group, recipient: { id: recipient.id, recipient_name: recipient.recipient_name, recipient_email: recipient.recipient_email, extra: recipient.extra, issued: recipient.issued } }),
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
                toastText = 'Successfully updated credential';
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
                body: JSON.stringify({ group: data.group.id, recipient: selectedCredential.id }),
            });
            loading = false;
            const result = await response.json();

            if (!response.ok) {
                if (data.error) {
                    toastText = result.error;
                } else {
                    toastText = 'Something went wrong';
                }
                toastType = 'error';
                triggerToast();
            }

            if (response.ok) {
                deleteModal = false;
                toastText = 'Successfully deleted credential';
                toastType = 'success';
                triggerToast();
                invalidateAll();
                if (window.analytics) {
                    window.analytics.track('credential-deleted', {
                        group: data.group.name,
                        group_id: data.group.id,
                        recipient: selectedCredential.id
                    });
                }
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }
        loading = false;
    }

    async function renewCredential() {
        loadingRenew = true;
        try {
            let response = await fetch('/api/renew-credential', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ credential: selectedCredential, whenExpiry: whenExpiry, expiry: expiry }),
            });
            loading = false;
            const result = await response.json();

            if (!response.ok) {
                toastText = 'Something went wrong';
                toastType = 'error';
                triggerToast();
            }

            if (response.ok) {
                toastText = 'Credential expiry updated';
                toastType = 'success';
                triggerToast();
                renewModal = false;
                invalidateAll();
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }
        loadingRenew = false;
    }

    async function setExpiry() {
        loadingExpiry = true;
        try {
            let response = await fetch('/api/set-expiry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ credential: selectedCredential, whenExpiry: whenExpiry, expiry: expiry }),
            });
            loading = false;
            const result = await response.json();

            if (!response.ok) {
                toastText = 'Something went wrong';
                toastType = 'error';
                triggerToast();
            }

            if (response.ok) {
                toastText = 'Credential expiry updated';
                toastType = 'success';
                triggerToast();
                expiryModal = false;
                invalidateAll();
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }
        loadingExpiry = false;
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
        // toastText = 'Credential deleted successfully';
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

    function truncateWithEllipsis(text, maxLength) {
        if (text.length > maxLength) {
            return text.substring(0, maxLength) + '...';
        }
        return text;
    }
</script>

<main class="p-4 md:ml-60 min-h-screen">
    <div class="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden">
        <div class="flex-row items-center justify-between px-4 py-3 space-y-3 sm:flex sm:space-y-0 sm:space-x-4">
            <div>
                <h5 class="text-lg font-bold leading-none text-gray-900 dark:text-white">
                    <Breadcrumb>
                        <BreadcrumbItem href="/groups" home>
                            <svelte:fragment slot="icon">
                                <svg width="0" height="0" xmlns="http://www.w3.org/2000/svg"></svg>
                            </svelte:fragment>Groups</BreadcrumbItem>
                        <BreadcrumbItem>{data.group.name}</BreadcrumbItem>
                    </Breadcrumb>
                </h5>
            </div>
            <div class="flex flex-col flex-shrink-0 space-y-3 md:flex-row md:items-center lg:justify-end md:space-y-0 md:space-x-3">
                <button on:click={()=>openRecipientModal(null, 'add')}
                    type="button"
                    class="flex items-center justify-center px-4 py-2 text-sm font-medium text-white rounded-lg bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800"
                    >
                    <i class="icon-plus mr-2"></i>
                    Add recipient</button
                >
                <a
                    href='/groups/{$page.params.group}/settings'
                    type="button"
                    class="flex items-center justify-center flex-shrink-0 px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                    >
                    <i class="icon-gear mr-2"></i>
                    Group settings</a
                >
                <button on:click={exportData}
                    type="button"
                    class="flex items-center justify-center flex-shrink-0 px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                    >
                    <i class="icon-file-export mr-2"></i>
                    Export</button
                >
            </div>
        </div>
        <div class="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 px-4 py-3 border-t border-gray-200 dark:border-gray-600">
            <div class="w-full md:w-1/2">
                <form class="flex items-center">
                    <label for="simple-search" class="sr-only">Search</label>
                    <div class="relative w-full">
                        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <i class="icon-magnifying-glass text-gray-500 dark:text-gray-400"></i>
                        </div>
                        <input
                            on:input={handleSearch}
                            type="text"
                            id="simple-search"
                            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                            placeholder="Search"
                            required=""
                        />
                    </div>
                </form>
            </div>
            <div class="w-full md:w-auto flex flex-col md:flex-row space-y-2 md:space-y-0 items-stretch md:items-center justify-end md:space-x-3 flex-shrink-0">
                <div class="flex items-center space-x-2 w-full md:w-auto">
                    <button on:click={()=>filter('All')} type="button" class="{activeTag=='All'?'text-white bg-blue-700 hover:bg-blue-800 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800':'text-gray-900 bg-white border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700'} inline-flex items-center px-5 py-2.5 text-xs font-medium text-center rounded-full focus:ring-4 focus:outline-none">
                        All
                        {#if Object.keys(status).length}
                            <span class="inline-flex items-center justify-center ml-2 text-xs font-semibold text-blue-800 bg-blue-200 rounded-lg p-0.5 min-w-[1rem] min-h-[1rem]">
                                {Object.values(status).reduce((acc, value) => acc + value, 0)}
                            </span>
                        {/if}
                    </button>
                    <!-- Active Class: text-white bg-blue-700 hover:bg-blue-800 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 -->
                    <!-- <button type="button" class="text-gray-900 bg-white inline-flex items-center px-5 py-2.5 text-xs font-medium text-center rounded-full focus:ring-4 focus:outline-none border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">
                        Viewed
                        <span class="inline-flex items-center justify-center w-4 h-4 ml-2 text-xs font-semibold text-blue-800 bg-blue-200 rounded-full">
                          2
                        </span>
                    </button> -->
                    <!-- <button type="button" class="text-yellow-400 hover:text-white dark:border-yellow-300 dark:text-yellow-300 dark:hover:text-white dark:hover:bg-yellow-400 dark:focus:ring-yellow-900 bg-white inline-flex items-center px-5 py-2.5 text-xs font-medium text-center rounded-full focus:ring-4 focus:outline-none border border-yellow-400 hover:bg-yellow-500 focus:ring-yellow-300 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:border-yellow-300 dark:text-yellow-300 dark:hover:text-white dark:hover:bg-yellow-400 dark:focus:ring-yellow-900">
                        Expired
                        <span class="inline-flex items-center justify-center w-4 h-4 ml-2 text-xs font-semibold text-blue-800 bg-yellow-200 rounded-full">
                          2
                        </span>
                    </button> -->
                    {#if 'Failed' in status}
                    <button on:click={()=>filter('Failed')} type="button" class="{activeTag=='Failed'?'text-white bg-blue-700 hover:bg-blue-800 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800':'text-gray-900 bg-white border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700'} inline-flex items-center px-5 py-2.5 text-xs font-medium text-center rounded-full focus:ring-4 focus:outline-none focus:z-10 focus:ring-4">
                        Failed
                        {#if Object.keys(status).length}
                            <span class="inline-flex items-center justify-center ml-2 text-xs font-semibold text-red-800 bg-red-200 rounded-lg p-0.5 min-w-[1rem] min-h-[1rem]">
                                {status.Failed}
                            </span>
                        {/if}
                    </button>
                    {/if}
                </div>
            </div>
        </div>
        <div class="overflow-x-auto">
            {#if paginatedData.length}
            <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" class="px-4 py-3">Credential ID</th>
                        <th scope="col" class="px-4 py-3">Name</th>
                        <th scope="col" class="px-4 py-3">Email</th>
                        <th scope="col" class="px-4 py-3">Issue date</th>
                        <th scope="col" class="px-4 py-3">Expiry date</th>
                        <th scope="col" class="px-4 py-3">Status</th>
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
                                <td class="px-4 py-3">
                                    <span>{truncateWithEllipsis(group.recipient_email, 24)}</span>
                                    <Tooltip>{group.recipient_email}</Tooltip>
                                </td>
                                <td class="px-4 py-3"
                                    >{group.issued?group.issued.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }):group.created_at.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</td
                                >
                                <td class="px-4 py-3">
                                    {group.expiry?group.expiry.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '-' }</td>
                                <td class="px-4 py-3">
                                    <div class="flex space-x-4">
                                        {#if group.status == 'expired'}
                                            <i class="flex-1 text-sm icon-clock-three text-red-600"></i>
                                            <Tooltip>Credential is expired</Tooltip>
                                        {/if}
                                        <i class="flex-1 text-sm icon-file-certificate {group.created_at?'text-green-600':''}"></i>
                                        <Tooltip>Credential {group.created_at?'':'not'} published</Tooltip>
                                        {#if group.status.toLowerCase() == 'failed'}
                                            <i class="flex-1 text-sm icon-envelope text-orange-800"></i>
                                            <Tooltip>Email bounced</Tooltip>
                                        {:else if group.delivered_at && !group.opened_at}
                                            <i class="flex-1 text-sm icon-envelope text-green-600"></i>
                                            <Tooltip>Email delivered</Tooltip>
                                        {:else if group.opened_at}
                                            <i class="flex-1 text-sm icon-envelope-open text-green-600"></i>
                                            <Tooltip>Email opened</Tooltip>
                                        {:else}
                                            <i class="flex-1 text-sm icon-envelope text-yellow-600"></i>
                                            <Tooltip>Email queued</Tooltip>
                                        {/if}
                                        <i class="flex-1 text-sm icon-eye {group.clicked_at?'text-green-600':''}"></i>
                                        <Tooltip>Credential {group.clicked_at?'':'not'} viewed</Tooltip>
                                        <i class="flex-1 text-sm icon-bullseye {group.shared_at?'text-green-600':''}"></i>
                                        <Tooltip>Credential {group.shared_at?'':'not'} engaged</Tooltip>
                                    </div>
                                    <!-- {#if group.status.toLowerCase() == 'queued'}
                                        <Badge color="yellow" class="capitalize">{group.status}</Badge>
                                    {:else if group.status.toLowerCase() == 'delivered'}
                                        <Badge color="green" class="capitalize">{group.status}</Badge>
                                    {:else if group.status.toLowerCase() == 'opened'}
                                        <Badge color="green" class="capitalize">{group.status}</Badge>
                                    {:else if group.status.toLowerCase() == 'clicked'}
                                        <Badge color="green" class="capitalize">{group.status}</Badge>
                                    {:else if group.status.toLowerCase() == 'expired'}
                                        <Badge color="red" class="capitalize bg-orange-100">{group.status}</Badge>
                                    {:else if group.status.toLowerCase() == 'failed'}
                                        <Badge color="red" class="capitalize">{group.status}</Badge>
                                    {:else}
                                        <Badge class="capitalize">{group.status}</Badge>
                                    {/if} -->
                                </td>
                                <td class="px-4 py-3 flex items-center justify-end">
                                    {#if group.status.toLowerCase() == 'expired'}
                                        <Button on:click={()=>openRenewModal(group)} size='xs' color='alternative' class="me-2 text-teal-500 border-teal-500 hover:text-teal-500">Renew</Button>
                                    {/if}
                                    {#if data.organization.whitelabel && data.organization.whitelabel.active}
                                        <Button size='xs' color='alternative' href="{data.organization.whitelabel.domain}/{group.id}" target="_blank">Recipient View <i class="ms-2 text-sm icon-arrow-up-right"></i></Button>
                                    {:else}
                                        <Button size='xs' color='alternative' href="https://verify.netcredential.com/{group.id}" target="_blank">Recipient View <i class="ms-2 text-xs icon-arrow-up-right"></i></Button>
                                    {/if}
                                    <MenuButton class="ms-3 dots-menu-{group.id} dark:text-white" />
                                    <Dropdown triggeredBy=".dots-menu-{group.id}" placement="left" style="z-index: 10;">
                                        <DropdownItem on:click={()=>openRecipientModal(group, 'view')}>Credential Details</DropdownItem>
                                        {#if group.status.toLowerCase() != 'expired'}
                                        <DropdownItem on:click={()=>openRecipientModal(group, 'update')}>Edit Credential</DropdownItem>
                                        <DropdownDivider/>
                                        <DropdownItem class="text-yellow-700 dark:text-yellow-100" on:click={()=>openExpiryModal(group)}>Expire</DropdownItem>
                                        {/if}
                                        <DropdownDivider/>
                                        <!-- <DropdownItem>Expire</DropdownItem> -->
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
        <nav
            class="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0 p-4"
            aria-label="Table navigation"
        >
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
</main>

<Modal title="Renew Credential" bind:open={renewModal}>
    <p>This credential is already expired. Renew it by changing its expiry date.</p>
    <form>
        <h3 class="mb-4 font-semibold text-gray-900 dark:text-white">When should this credential expire?</h3>
        <ul class="items-center w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg sm:flex dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <li class="w-full border-b border-gray-200 sm:border-b-0 sm:border-r dark:border-gray-600">
                <div class="flex items-center ps-3">
                    <input bind:group={whenExpiry} id="horizontal-list-radio-license" type="radio" value="never" name="list-radio" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500">
                    <label for="horizontal-list-radio-license" class="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">Never</label>
                </div>
            </li>
            <li class="w-full border-b border-gray-200 sm:border-b-0 sm:border-r dark:border-gray-600">
                <div class="flex items-center ps-3">
                    <input bind:group={whenExpiry} id="horizontal-list-radio-id" type="radio" value="later" name="list-radio" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500">
                    <label for="horizontal-list-radio-id" class="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">A later date</label>
                </div>
            </li>
        </ul>
        {#if whenExpiry == 'later'}
            <input bind:value={expiry} class="mt-3 block w-full p-2.5 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-500 text-sm rounded-lg" type="date">
        {/if}
    </form>
    
    <svelte:fragment slot='footer'>
        <Button on:click={renewCredential}>
            {#if loadingRenew}
                <Spinner size="5" color="white" />
            {:else}
                Renew
            {/if}
        </Button>
    </svelte:fragment>
</Modal>

<Modal title="Set Expiry Date" bind:open={expiryModal}>
    <p>Expired credentials are clearly marked as “expired” on the credential page. Recipients will receive an email notification about their credential expiring.</p>
    <form>
        <h3 class="mb-4 font-semibold text-gray-900 dark:text-white">When should this credential expire?</h3>
        <ul class="items-center w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg sm:flex dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <li class="w-full border-b border-gray-200 sm:border-b-0 sm:border-r dark:border-gray-600">
                <div class="flex items-center ps-3">
                    <input bind:group={whenExpiry} id="expiry-never" type="radio" value="never" name="expiry-never" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500">
                    <label for="expiry-never" class="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">Never</label>
                </div>
            </li>
            <li class="w-full border-b border-gray-200 sm:border-b-0 sm:border-r dark:border-gray-600">
                <div class="flex items-center ps-3">
                    <input bind:group={whenExpiry} id="horizontal-list-radio-license" type="radio" value="immediate" name="list-radio" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500">
                    <label for="horizontal-list-radio-license" class="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">Immediately</label>
                </div>
            </li>
            <li class="w-full border-b border-gray-200 sm:border-b-0 sm:border-r dark:border-gray-600">
                <div class="flex items-center ps-3">
                    <input bind:group={whenExpiry} id="horizontal-list-radio-id" type="radio" value="later" name="list-radio" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500">
                    <label for="horizontal-list-radio-id" class="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">A later date</label>
                </div>
            </li>
        </ul>
        {#if whenExpiry == 'later'}
            <input bind:value={expiry} class="mt-3 block w-full p-2.5 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-500 text-sm rounded-lg" type="date">
        {/if}
    </form>
    
    <svelte:fragment slot='footer'>
        <Button on:click={setExpiry}>
            {#if loadingExpiry}
                <Spinner size="5" color="white" />
            {:else}
                Set
            {/if}
        </Button>
    </svelte:fragment>
</Modal>

<Modal class="capitalize modal" title="{action} recipient" bind:open={recipientModal}>
    <form id="recipientForm">
        <label class="text-sm font-medium block text-gray-900 dark:text-gray-300 space-y-2">
            <span>Name</span>
            <input bind:value={recipient.recipient_name} required disabled={action=='view'} class="block w-full p-2.5 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-500 text-sm rounded-lg" type="text">
        </label>
        <label class="mt-2 text-sm font-medium block text-gray-900 dark:text-gray-300 space-y-2 mt-5">
            <span>Email</span>
            <input bind:value={recipient.recipient_email} required disabled={action=='view'} class="block w-full p-2.5 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-500 text-sm rounded-lg" type="email">
        </label>
        <!-- Show the date properly -->
        <label class="mt-2 text-sm font-medium block text-gray-900 dark:text-gray-300 space-y-2 mt-5">
            <span>Issued</span>
            <input bind:value={recipient.issued} required disabled={action=='view'} class="block w-full p-2.5 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-500 text-sm rounded-lg" type="date">
        </label>
        {#if recipient.extra}
            {#each Object.keys(recipient.extra) as label}
                <label class="mt-2 text-sm font-medium block text-gray-900 dark:text-gray-300 space-y-2 mt-5 empty:p-0">
                    <span>{label.replace( "custom.", "" ).replace( "credential.", "" ).replace( /_/g, " " ).replace(/\[|\]/g, "").split(" ").map(capitalizeFirstLetter).join( " " )}</span>
                    <input bind:value={recipient.extra[label]} required disabled={action=='view'} class="block w-full p-2.5 focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-500 dark:focus:ring-primary-500 bg-gray-50 text-gray-900 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-500 text-sm rounded-lg" type="text">
                </label>
            {/each}
        {/if}
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
</Modal>

<Modal class="text-center" bind:open={deleteModal} size='xs'>
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
</Modal>

<Toast transition={fly} params="{{x: 200}}" color={toastType=='success'?'green':'red'} position="top-right" open={toast} class="fixed">
    <svelte:fragment slot="icon">
        {#if toastType == 'success'}
            <i class="icon-check"></i>
        {:else if toastType == 'error'}
            <i class="icon-xmark"></i>
        {/if}
    </svelte:fragment>
    {toastText}
</Toast>