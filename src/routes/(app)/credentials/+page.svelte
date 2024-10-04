<script>    
    import { page } from "$app/stores";
    import { Button, Dropdown, DropdownItem, MenuButton, DropdownDivider, Label, Input, Modal, Toast } from 'flowbite-svelte';
    import { fly } from 'svelte/transition';
    import { setAllValuesToNull, generateCSV } from "../../helpers.js";
    import { Breadcrumb, BreadcrumbItem, Spinner, Badge } from 'flowbite-svelte';
    import { invalidateAll } from '$app/navigation';
    import { onMount } from 'svelte';
    import { enhance } from '$app/forms';
    import Table from './Table.svelte';

    export let data;
    
    let deleteModal = false;
    
    let recipient = {};
    let toastText = '';
    let toastType = null;
    let recipientModal = false;
    let action = 'update';

    let columns = {
        id: {
            label: 'ID',
            type: 'text',
            searchable: true
        },
        recipient_name: {
            label: 'Name',
            type: 'text',
            searchable: true
        },
        recipient_email: {
            label: 'Email',
            type: 'text',
            searchable: true
        },
        created_at: {
            label: 'Issued',
            type: 'timestamp',
            searchable: true,
            format: (value) => {
                return value.toLocaleString( "en-IN", { dateStyle: "long", timeStyle: "short", } );
            }
        },
        status: {
            label: 'Status',
            type: 'text',
            searchable: true,
            format: (value) => {
                return `<span class="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">${value}</span>`;
            }
        },
        // group_id: {
        //     label: 'Group',
        //     type: 'text',
        //     searchable: true
        // },
        group_name: {
            label: 'Group',
            type: 'text',
            searchable: true
        },
    }

    let actions = {
        'view': {
            label: 'View',
            color: 'blue'
        },
        'details': {
            label: 'Details',
            color: 'blue'
        },
        'update': {
            label: 'Update',
            color: 'blue'
        },
        'delete': {
            label: 'Delete',
            color: 'blue',
            separator: true
        }
    }

    let handleActions = (event) => {
        event = event.detail;
        if (event.event == 'view') {
            window.open(`/verify/${event.row.id}`, '_blank');
        }
    }

    onMount(async () => {
        // recipient = filteredGroups[0];

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
</script>

<main class="p-4 md:ml-64 min-h-screen">
    <div class="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden">
        <Table columns={columns} data={{"credentials": data.credentials,"totalNo": data.no_of_credentials, "next": data.pg_next}} actions={actions} on:action={handleActions}/>
    </div>
</main>

<Modal class="capitalize modal" title="{action} recipient" bind:open={recipientModal}>
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