<script>
    import { createEventDispatcher } from "svelte";
    import {
        Button,
        Dropdown,
        DropdownItem,
        MenuButton,
        DropdownDivider,
        Label,
        Input,
        Modal,
        Toast,
        Spinner
    } from "flowbite-svelte";

    let searchQuery = "";

    export let columns;
    export let data;
    export let actions;

    const dispatch = createEventDispatcher();

    let filteredData = data.credentials;
    const itemsPerPage = 2;
    let currentPage = 1;
    let paginatedData = [];
    let pageButtons = [];
    let isFullDataLoaded = false;
    let isSearchFullDataLoaded = false;
    let totalData = 0;
    let isSearchData = false;
    let isLoading = false;

    updatePagination();

    async function handleSearch(event) {
        searchQuery = event.target.value;
        currentPage = 1;

        try {
            const formData = new FormData();
            formData.append("searchInput", searchQuery);
            formData.append("action", "first_page");
            let response = await fetch(`/credentials/?/tableSearch`, {
                method: "POST",
                body: formData,
            });
            if (response.ok) {
                let resp = await response.json();
                let _resp_data = JSON.parse(resp.data);
                let dataCount = _resp_data[3];
                let nextCursor = _resp_data[2];
                let result_data = JSON.parse(_resp_data[1]);
                data.credentials = result_data;
                data.next = nextCursor;
                totalData = dataCount;
                updatePagination("search", totalData);
                isSearchData = true;
                isFullDataLoaded = false;
            } else {
                console.error("Failed to fetch data:", response.statusText);
            }
            pageButtons = generatePageButtons(
                filteredData,
                itemsPerPage,
                currentPage,
            );
        } catch (error) {
            console.error("Failed to fetch data:", error);
        }
    }

    // Function to navigate to a specific page
    const goToPage = async (page) => {
        if (searchQuery == "" || searchQuery == null || searchQuery == undefined) {
            isSearchData = false;
        }
        currentPage = page;
        let totalPage = Math.ceil(totalData / itemsPerPage);
        if (isSearchData == false) {
            if (currentPage == totalPage && isFullDataLoaded == false) {
                isLoading = true;
                for (let i = 0; i <= totalData / itemsPerPage - 1; i++) {
                    const formData = new FormData();
                    formData.append("next", data.next);
                    formData.append("action", "next_page");
                    let response = await fetch(`/credentials/?/paginate`, {
                        method: "POST",
                        body: formData,
                    });
                    if (response.ok) {
                        let resp = await response.json();
                        let _resp_data = JSON.parse(resp.data);
                        let nextCursor = _resp_data[3];
                        let result_data = JSON.parse(_resp_data[2]);
                        data.credentials = [
                            ...data.credentials,
                            ...result_data,
                        ];
                        data.next = nextCursor;
                        totalData = data.totalNo;
                        updatePagination();
                    } else {
                        console.error(
                            "Failed to fetch data:",
                            response.statusText,
                        );
                    }
                    pageButtons = generatePageButtons(
                        filteredData,
                        itemsPerPage,
                        currentPage,
                    );
                }
                isLoading = false;
                isFullDataLoaded = true;
            }
            isLoading = true;
            const formData = new FormData();
            formData.append("next", data.next);
            formData.append("action", "next_page");
            let response = await fetch(`/credentials/?/paginate`, {
                method: "POST",
                body: formData,
            });
            if (response.ok) {
                let resp = await response.json();
                let _resp_data = JSON.parse(resp.data);
                let nextCursor = _resp_data[3];
                let result_data = JSON.parse(_resp_data[2]);
                data.credentials = [...data.credentials, ...result_data];
                data.next = nextCursor;
                totalData = data.totalNo;
                updatePagination();
            } else {
                console.error("Failed to fetch data:", response.statusText);
            }
            isLoading = false;
            pageButtons = generatePageButtons(
                filteredData,
                itemsPerPage,
                currentPage,
            );
        } else {
            if (currentPage == totalPage && isSearchFullDataLoaded == false) {
                isLoading = true;
                for (let i = 0; i <= totalData / itemsPerPage - 1; i++) {
                    const formData = new FormData();
                    formData.append("searchInput", searchQuery);
                    formData.append("next", data.next);
                    formData.append("action", "next_page");
                    let response = await fetch(`/credentials/?/tableSearch`, {
                        method: "POST",
                        body: formData,
                    });
                    if (response.ok) {
                        let resp = await response.json();
                        let _resp_data = JSON.parse(resp.data);
                        let nextCursor = _resp_data[2];
                        let result_data = JSON.parse(_resp_data[1]);
                        data.credentials = [...data.credentials, ...result_data];
                        data.next = nextCursor;
                        updatePagination("search", totalData);
                        isSearchData = true;
                    } else {
                        console.error(
                            "Failed to fetch data:",
                            response.statusText,
                        );
                    }
                    pageButtons = generatePageButtons(
                        filteredData,
                        itemsPerPage,
                        currentPage,
                    );
                }
                isLoading = false;
                isSearchFullDataLoaded == true;
            }
            isLoading = true;
            const formData = new FormData();
            formData.append("searchInput", searchQuery);
            formData.append("next", data.next);
            formData.append("action", "next_page");
            let response = await fetch(`/credentials/?/tableSearch`, {
                method: "POST",
                body: formData,
            });
            if (response.ok) {
                let resp = await response.json();
                let _resp_data = JSON.parse(resp.data);
                let nextCursor = _resp_data[2];
                let result_data = JSON.parse(_resp_data[1]);
                data.credentials = [...data.credentials, ...result_data];
                data.next = nextCursor;
                updatePagination("search", totalData);
                isSearchData = true;
            } else {
                console.error("Failed to fetch data:", response.statusText);
            }
            isLoading = false;
            pageButtons = generatePageButtons(
                filteredData,
                itemsPerPage,
                currentPage,
            );
        }
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
        const totalPages = Math.ceil(totalData / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            goToPage(currentPage);
        }
    };

    // .toLowerCase() line-74 before include
    function updatePagination(action = null, dataCount = null) {
        filteredData = data.credentials.filter((d) => {
            for (const column in columns) {
                if (
                    columns[column].searchable &&
                    String(d[column]).includes(searchQuery)
                ) {
                    return true;
                }
            }
            return false;
        });
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        paginatedData = filteredData.slice(startIndex, endIndex);
        if (action == "search") {
            totalData = dataCount;
        } else {
            totalData = data.totalNo;
        }
        pageButtons = generatePageButtons(
            filteredData,
            itemsPerPage,
            currentPage,
        );
    }

    function generatePageButtons(filteredGroups, itemsPerPage, currentPage) {
        const totalPages = Math.ceil(totalData / itemsPerPage);
        // const totalPages = Math.ceil(filteredGroups / itemsPerPage);
        let pageButtons = [];

        // Always show the first page
        if (currentPage > 1) {
            pageButtons.push({ page: 1 });
            if (currentPage > 2) {
                pageButtons.push({ separator: true });
            }
        }

        // Add the current page button
        pageButtons.push({ page: currentPage });

        // Add the next page button if there's one more page
        if (currentPage < totalPages) {
            pageButtons.push({ page: currentPage + 1 });
        }

        // If there's still another page after the next one, add the last page with a separator if needed
        if (currentPage + 1 < totalPages) {
            if (currentPage + 1 < totalPages - 1) {
                pageButtons.push({ separator: true });
            }
            pageButtons.push({ page: totalPages });
        }

        return pageButtons;
    }
</script>

<div
    class="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 px-4 py-3"
>
    <div class="w-full md:w-1/2">
        <div class="flex items-center">
            <label for="simple-search" class="sr-only">Search</label>
            <div class="relative w-full">
                <div
                    class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
                >
                    <i
                        class="icon-magnifying-glass text-gray-500 dark:text-gray-400"
                    ></i>
                </div>
                <input
                    type="text"
                    id="simple-search"
                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    placeholder="Search"
                    required=""
                    name="searchInput"
                    on:input={handleSearch}
                />
            </div>
        </div>
    </div>
</div>

<div class="overflow-x-auto">
    {#if isLoading == true}
        <div class="flex items-center items-center justify-center">
            <!-- <div class="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden"> -->
                <Spinner size={8} />
            <!-- </div> -->
        </div>
        {:else}
    <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead
            class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400"
        >
            <tr>
                {#each Object.entries(columns) as [key, { label }]}
                    <th scope="col" class="px-4 py-3">{label}</th>
                {/each}
                {#if Object.keys(actions).length}
                    <th scope="col" class="px-4 py-3">
                        <span class="sr-only">Actions</span>
                    </th>
                {/if}
            </tr>
        </thead>
        {#if paginatedData.length > 0}
            <tbody>
                {#each paginatedData as d, i}
                    <tr class="border-b dark:border-gray-700">
                        {#each Object.entries(columns) as [key, { format }]}
                            {#if format}
                                <td class="px-4 py-3">{@html format(d[key])}</td
                                >
                            {:else}
                                <td class="px-4 py-3">{d[key]}</td>
                            {/if}
                        {/each}
                        {#if Object.keys(actions).length}
                            <td class="px-4 py-3 flex items-center justify-end">
                                <MenuButton
                                    class="dots-menu-{i} dark:text-white"
                                />
                                <Dropdown
                                    triggeredBy=".dots-menu-{i}"
                                    placement="left"
                                    style="z-index: 10;"
                                >
                                    {#each Object.entries(actions) as [key, { label, separator }]}
                                        {#if separator}
                                            <DropdownDivider />
                                        {/if}
                                        <DropdownItem
                                            on:click={() =>
                                                dispatch("action", {
                                                    event: "view",
                                                    row: d,
                                                })}>{label}</DropdownItem
                                        >
                                    {/each}
                                </Dropdown>
                            </td>
                        {/if}
                    </tr>
                {/each}
            </tbody>
        {/if}
    </table>
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
                filteredData.length,
            )}</span
        >
        of
        <!-- <span class="font-semibold text-gray-900 dark:text-white"
            >{filteredData.length}</span
        > -->
        <span class="font-semibold text-gray-900 dark:text-white"
            >{totalData}</span
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
                disabled={currentPage === Math.ceil(totalData / itemsPerPage)}
                class="flex items-center justify-center h-full py-1.5 px-3 leading-tight text-gray-500 bg-white rounded-r-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
                <i class="icon-chevron-right"></i>
            </button>
        </li>
    </ul>
</nav>
