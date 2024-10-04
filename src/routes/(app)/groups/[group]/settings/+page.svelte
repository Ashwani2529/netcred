<script>
  import { page } from "$app/stores";
  import { writable } from "svelte/store";
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
  } from "flowbite-svelte";
  import { fly } from "svelte/transition";
  import {
    setAllValuesToNull,
    generatePageButtons,
    generateCSV,
  } from "../../../../helpers.js";
  import { Breadcrumb, BreadcrumbItem, Spinner, Badge } from "flowbite-svelte";
  import { invalidateAll } from "$app/navigation";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import Tags from "svelte-tags-input";

  export let data;

  let designModal = false;
  let selectedDesign = data.design;
  let group = data.group;
  if (!group.expiry) group.expiry = "-1";
  // let organization = data.organization;
  let pdffile = null;
  let viewOrClose = "Close";
  let pdfUrl = '';
  let tempurl = '';
  let toastType = null;
  let toastMessage;
  let loading = false;

  onMount(() => {
    // Set tempurl and pdfUrl to data.group.secondaryPage initially
    tempurl=group.secondaryPage;
    pdfUrl=group.secondaryPage;
  });

  function getBase64(image) {
    const reader = new FileReader();
    reader.readAsDataURL(image);
    reader.onload = (e) => {
      tempurl=e.target.result;
      pdfUrl=e.target.result;
    };
  }

  function handleFileChange(event) {
    pdffile = event.target.files[0];
    if (pdffile) {
      getBase64(pdffile);
    }
  }

  function handletempurl() {
    if (viewOrClose === "View") {
      viewOrClose = "Close";
      tempurl=pdfUrl;
    } else {
      viewOrClose = "View";
      tempurl="";
    }
  }
  async function updateGroup() {
    loading = true;
    try {
      let response = await fetch("/api/update-group", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          group: group,
          designId: selectedDesign.id,
          pdfUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toastType = "error";
        toastMessage = "Something went wrong";
        triggerToast();
      }

      if (response.ok) {
        if (window.analytics) {
          window.analytics.track("group-updated", {
            groupId: group.id,
            designId: selectedDesign.id,
          });
        }
        loading = false;
        toastType = "success";
        toastMessage = "Group updated successfully";
        triggerToast();
        setTimeout(() => {
          goto("/groups");
        }, 1500);
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
    loading = false;
  }

  function selectDesign(design) {
    selectedDesign = design;
    designModal = false;
  }

  function openModal() {
    designModal = true;
  }

  const itemsPerPage = 8;
  let currentPage = 1;

  let searchQuery = "";
  let paginatedData = [];
  let filteredDesigns = [];

  $: {
    filteredDesigns = data.designs;
    updatePagination();
  }

  function updatePagination() {
    filteredDesigns = data.designs.filter((design) => {
      searchQuery = searchQuery.toLowerCase();
      let name = design.name.toLowerCase();
      return [name].some((string) => string.includes(searchQuery));
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

<main class="p-4 md:ml-60 min-h-screen">
  <div
    class="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden"
  >
    <div
      class="flex-row items-center justify-between px-4 py-3 space-y-3 sm:flex sm:space-y-0 sm:space-x-4"
    >
      <div>
        <h5
          class="text-lg font-bold leading-none text-gray-900 dark:text-white"
        >
          <Breadcrumb>
            <BreadcrumbItem href="/groups" home>
              <svelte:fragment slot="icon">
                <svg width="0" height="0" xmlns="http://www.w3.org/2000/svg"
                ></svg>
              </svelte:fragment>Groups</BreadcrumbItem
            >
            <BreadcrumbItem>{data.group.name}</BreadcrumbItem>
          </Breadcrumb>
        </h5>
      </div>
      <div
        class="flex flex-col flex-shrink-0 space-y-3 md:flex-row md:items-center lg:justify-end md:space-y-0 md:space-x-3"
      >
        <a
          href="/groups/{$page.params.group}/credentials"
          type="button"
          class="flex items-center justify-center flex-shrink-0 px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg focus:outline-none hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
        >
          View credentials</a
        >
        <button
          on:click={updateGroup}
          disabled={!group.name || group?.description?.length > 280}
          type="button"
          class="flex items-center justify-center px-4 py-2 text-sm font-medium text-white rounded-lg bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800"
        >
          Update</button
        >
      </div>
    </div>
    <div
      class="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 px-4 py-3 border-t border-gray-200 dark:border-gray-600"
    >
      <div class="mt-4">
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-6 flex flex-col justify-between">
            <div class="space-y-5">
              <div>
                <label
                  for="group-name"
                  class="block text-sm font-medium text-gray-900 dark:text-white"
                  >Group Name</label
                >
                <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  Displayed in email and the credential page
                </p>
                <Input
                  type="text"
                  name="group-name"
                  id="group-name"
                  bind:value={group.name}
                  required
                />
              </div>
              <div>
                <label
                  for="language"
                  class="block text-sm font-medium text-gray-900 dark:text-white"
                  >Description (Optional)</label
                >
                <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  Provide more event details or describe recipients' actions to
                  earn the credential
                </p>
                <textarea
                  bind:value={group.description}
                  id="message"
                  rows="4"
                  class="{group?.description?.length > 280
                    ? 'bg-red-50 border-red-500 text-red-900'
                    : 'bg-gray-50 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600'} block p-2.5 w-full text-sm text-gray-900 rounded-lg dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                ></textarea>
                {#if group.description}
                  <span class="text-xs text-gray-500"
                    >{group?.description?.length}/280</span
                  >
                {/if}
              </div>
              <div>
                <label
                  for="skills"
                  class="block text-sm font-medium text-gray-900 dark:text-white"
                  >Skills (Optional)</label
                >
                <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  List the skills your recipients have acquired
                </p>
                <Tags bind:tags={group.skills} />
              </div>
            </div>
          </div>
          <div class="col-span-6">
            <div
              on:click={openModal}
              class="cursor-pointer relative flex flex-col justify-center items-center w-full aspect-[1.415/1] bg-gray-100 rounded dark:bg-gray-700 relative border border-gray-300 rounded-lg overflow-hidden"
            >
              <Badge
                border
                color="dark"
                large
                class="!p-1.5 absolute right-1 top-1 cursor-pointer z-10"
              >
                <i class="icon-pen dark:text-white"></i>
              </Badge>
              <img
                class="p-2 h-full w-full object-contain"
                src={selectedDesign.preview}
                alt={selectedDesign.name}
              />
            </div>
          </div>
        </div>
        <div class="space-y-3">
          <h5 class="font-medium text-gray-900 dark:text-white">
            Advanced options
          </h5>
          <div class="grid grid-cols-12 gap-4">
            <!-- <div class="col-span-6 flex flex-col justify-between">
                            <div class="space-y-5">
                                <div>
                                    <label for="issue-date" class="block text-sm font-medium text-gray-900 dark:text-white">Issue Date</label>
                                    <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">Set the issue date for the credential within the group</p>
                                    <select bind:value={issued} id="issue-date" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                                        <option value="-1" selected>Automatic</option>
                                        <option value="0">Manual</option>
                                    </select>
                                    {#if issued == '-1'}
                                    <div class="mt-2 p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400" role="alert">
                                        Issue date defaults to current date upon group creation
                                    </div>
                                    {/if}
                                    {#if issued == '0'}
                                    <div class="mt-2 p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400" role="alert">
                                        You can set a custom issue date for each credential in the spreadsheet
                                    </div>
                                    {/if}
                                </div>
                            </div>
                        </div> -->
            <div class="col-span-6 flex flex-col justify-between">
              <div class="space-y-5">
                <div>
                  <label
                    for="expiration-period"
                    class="block text-sm font-medium text-gray-900 dark:text-white"
                    >Expiration Period</label
                  >
                  <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    Set a period after which credentials will automatically
                    expire
                  </p>
                  <select
                    bind:value={group.expiry}
                    id="expiration-period"
                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  >
                    <option value="-1" selected>Never expire</option>
                    <option value="1">1 year</option>
                    <option value="2">2 years</option>
                    <option value="3">3 years</option>
                    <option value="4">4 years</option>
                    <option value="5">5 years</option>
                    <option value="10">10 years</option>
                  </select>
                  {#if group.expiry == "-1"}
                    <div
                      class="mt-2 p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-700 dark:text-blue-400"
                      role="alert"
                    >
                      Credentials will remain valid indefinitely but can be
                      manually changed anytime.
                    </div>
                    <!-- {:else if expiry == '0'}
                                    <div class="mt-2 p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400" role="alert">
                                        You can set a custom expiration date for each credential in the spreadsheet
                                    </div> -->
                  {:else}
                    <div
                      class="mt-2 p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400"
                      role="alert"
                    >
                      Credentials in this group auto-expire {group.expiry}
                      {parseInt(group.expiry) > 1 ? "years" : "year"} after issue
                      but can be manually changed anytime.
                    </div>
                  {/if}

                  <div class="flex items-center justify-center w-full">
                    <label
                      for="dropzone-file"
                      class="flex flex-col items-center justify-center w-full h-28 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                    >
                      <div
                        class="flex flex-col items-center justify-center pt-5 pb-6"
                      >
                        <svg
                          class="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 20 16"
                        >
                          <path
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                          />
                        </svg>
                        <p
                          class="mb-2 text-sm text-gray-500 dark:text-gray-400"
                        >
                          <span class="font-semibold">Click to upload</span> or drag
                          and drop
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          PDF files only
                        </p>
                      </div>
                      <input
                        id="dropzone-file"
                        type="file"
                        on:change={handleFileChange}
                        class="hidden"
                        accept=".pdf"
                      />
                    </label>
                  </div>
                  {#if tempurl !== ""}
                  <button
                    on:click={handletempurl}
                    class="bg-primary-600 text-white rounded-lg p-2.5 w-full mt-2"
                    >{viewOrClose} Uploaded PDF</button
                  >

                  
                    <iframe
                      src={tempurl}
                      width="100%"
                      height="300px"
                      frameborder="0"
                    ></iframe>
                  {/if}
                  <!-- <div class="overlay absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center">
                                        <div class="grid grid-cols-3">
        
                                                <button disabled class="mx-2 transition duration-300 ease-in-out hover:bg-gray-200 hover:shadow-lg hover:-translate-y-1 text-lg text-gray-900 bg-gray-100 border border-gray-300 rounded-full w-12 h-12">
                                                    <i class="icon-pen"></i>
                                                </button>
                                                
                                                <button disabled class="mx-2 transition duration-300 ease-in-out hover:bg-gray-200 hover:shadow-lg hover:-translate-y-1 text-lg text-gray-900 bg-gray-100 border border-gray-300 rounded-full w-12 h-12">
                                                    <i class="icon-copy"></i> 
                                                </button>
                                                
                                                <button on:click={()=>openDeleteDesign(design)} class="mx-2 transition duration-300 ease-in-out hover:bg-gray-200 hover:shadow-lg hover:-translate-y-1 text-lg text-gray-900 bg-gray-100 border border-gray-300 rounded-full w-12 h-12">
                                                    <i class="icon-trash-can"></i>
                                                </button>
                                    
                                                <button on:click={()=>goToDesign(design.id)} class="mx-2 transition duration-300 ease-in-out hover:bg-gray-200 hover:shadow-lg hover:-translate-y-1 text-lg text-gray-900 bg-gray-100 border border-gray-300 rounded-full w-12 h-12">
                                                    <i class="icon-pen"></i>
                                                </button>
                                                <button on:click={()=>duplicateDesign(design)} class="mx-2 transition duration-300 ease-in-out hover:bg-gray-200 hover:shadow-lg hover:-translate-y-1 text-lg text-gray-900 bg-gray-100 border border-gray-300 rounded-full w-12 h-12">
                                                    <i class="icon-copy"></i>
                                                </button>
                                                <button on:click={()=>openDeleteDesign(design)} class="mx-2 transition duration-300 ease-in-out hover:bg-gray-200 hover:shadow-lg hover:-translate-y-1 text-lg text-gray-900 bg-gray-100 border border-gray-300 rounded-full w-12 h-12">
                                                    <i class="icon-trash-can"></i>
                                                </button>
                                        
                                        </div>
                                    </div> -->
                </div>
              </div>
            </div>
          </div>
          <!-- <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-6 flex flex-col justify-between">
                            <div class="space-y-5">
                                <div>
                                    <label for="language" class="block text-sm font-medium text-gray-900 dark:text-white">Language (Credential)</label>
                                    <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">A viewer's internet browser settings will control the language of the credential page to ensure it is readable by the recipient and anyone they share it with.</p>
                                    <input type="text" name="language" id="language" class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 opacity-60" value="Automatic" disabled autocomplete="off">
                                </div>
                            </div>
                        </div>
                        <div class="col-span-6 flex flex-col justify-between">
                            <div class="space-y-5">
                                ------
                            </div>
                        </div>
                    </div> -->
        </div>
      </div>
    </div>
  </div>
</main>

<Modal id="designs" title="Designs" bind:open={designModal} size="xl">
  <div
    class="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden"
  >
    <div
      class="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 p-4 border-b border-gray-200 dark:border-gray-700"
    >
      <div class="w-full md:w-1/2">
        <form class="flex items-center">
          <label for="simple-search" class="sr-only">Search</label>
          <div class="relative w-full">
            <div
              class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
            >
              <i class="icon-magnifying-glass text-gray-500 dark:text-gray-400"
              ></i>
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
      <div>
        <div>
          <Button href="/designs/certificate/create"><i class="icon-plus me-1" /> Create Certificate</Button>
          <Button href="/designs/badge/create"><i class="icon-plus me-1" /> Create Badge</Button>
        </div>
      </div>
      <!-- <Dropdown>
                <DropdownItem href="/designs/create">Certificate Design</DropdownItem>
                <DropdownItem>Badge Design</DropdownItem>
            </Dropdown> -->
    </div>
    <div class="overflow-x-auto">
      <div class="grid grid-cols-4 gap-4 p-4">
        {#each paginatedData as design}
          <div
            on:click={() => selectDesign(design)}
            class="hover:cursor-pointer hover:shadow-xl card overflow-hidden relative bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
          >
            <div
              class="image-wrapper p-2 bg-gray-100 dark:bg-gray-800 relative"
            >
              <img
                class="rounded-t-lg h-full w-full object-contain"
                src={design?.preview?.includes("https://")
                  ? design.preview + "?t=" + new Date().getTime()
                  : design.preview}
                alt={design.name}
              />
            </div>
            <div class="p-5">
              <h5
                class="text-lg font-bold tracking-tight text-gray-900 dark:text-white"
              >
                {design.name}
              </h5>
            </div>
          </div>
        {/each}
      </div>
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
            filteredDesigns.length
          )}</span
        >
        of
        <span class="font-semibold text-gray-900 dark:text-white"
          >{filteredDesigns.length}</span
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
        {#each Array(Math.ceil(filteredDesigns.length / itemsPerPage)).fill() as _, index}
          <button
            on:click={() => goToPage(index + 1)}
            class="flex items-center justify-center text-sm py-2 px-3 leading-tight {currentPage ==
            index + 1
              ? 'text-white bg-primary-600 dark:bg-gray-500 dark:text-white'
              : 'text-gray-500 bg-white dark:bg-gray-800 dark:text-gray-400'} border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white"
            >{index + 1}</button
          >
        {/each}
        <li>
          <button
            on:click={goToNextPage}
            disabled={currentPage ===
              Math.ceil(filteredDesigns.length / itemsPerPage)}
            class="flex items-center justify-center h-full py-1.5 px-3 leading-tight text-gray-500 bg-white rounded-r-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <span class="sr-only">Next</span>
            <i class="icon-chevron-right"></i>
          </button>
        </li>
      </ul>
    </nav>
  </div>
</Modal>

<Toast
  transition={fly}
  params={{ x: 200 }}
  color={toastType == "success" ? "green" : "red"}
  position="top-right"
  open={toast}
  class="fixed"
>
  <svelte:fragment slot="icon">
    {#if toastType == "success"}
      <i class="icon-check"></i>
    {:else if toastType == "error"}
      <i class="icon-xmark"></i>
    {/if}
  </svelte:fragment>
  {toastMessage}
</Toast>

<style>
  canvas {
    border: 1px solid black;
    margin: 10px;
  }
  .onlyErrors .valid {
    display: none;
  }

  .table-under::-webkit-scrollbar {
    width: 12px;
  }

  .table-under::-webkit-scrollbar-track {
    background-color: #f9fafb;
    border-radius: 100px;
  }

  .table-under::-webkit-scrollbar-thumb {
    background-color: #c1c1c1;
    border-radius: 100px;
  }

  .table-under::-webkit-scrollbar-thumb:hover {
    background-color: #a1a1a1;
  }

  :global(#designs .p-6) {
    padding: 0px;
  }

  .image-wrapper {
    height: 220px;
  }

  @media (min-width: 576px) {
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
</style>
