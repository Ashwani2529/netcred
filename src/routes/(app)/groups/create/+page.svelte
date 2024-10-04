<script>
    import { base } from "$app/paths";
    import { organization} from '../../../data.js';
    import * as XLSX from 'xlsx';
    import papa from 'papaparse';
    import { Input, Label, ButtonGroup, Helper, Tooltip, Spinner, Toast, Card, StepIndicator, Badge, Toggle, Hr, P, Button, Modal } from 'flowbite-svelte';
    import {
        generateRandomID,
        capitalizeFirstLetter,
        po,
        cloneDeep,
        moveItem
    } from "$lib/helpers.js";
    import { fly } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import JSConfetti from 'js-confetti';
    import Tags from "svelte-tags-input";
    let designModal = false;

    export let data;
    let selectedDesign = null;
    let manualPage=false;

    const jsConfetti = new JSConfetti();

    function openModal() {
        designModal = true;
    }

    function selectDesign(design) {
        selectedDesign = design;
        designModal = false;
    }

    let currentStep = 1;
    let toastType = null;
    let pdfUrl = '';
    let tempurl='';
    let pdffile=null;
    let viewOrClose='View';
    let fileInput;
    let files;
    let recipients = [];

    // let firstRowHeader = true;
    let onlyErrors = false;
    let errors = [];

    let heads = [];
    let dynamicVariables = ['name', 'email', '[credential.issued]', '[credential.expiry]'];
    let missingVariables = [];

    const valuesToRemove = ['[recipient.name]', '[credential.id]', '[issuer.name]', '[group.name]', '[credential.issued]', '[credential.expiry]'];
    const optionalValues = ['[credential.issued]', '[credential.expiry]'];

    let Name = "";
  let Email = "";
  let records = [];
  let attributes = [];
  let newRecord = {};

//   onMount(() => {
//     attrs.subscribe(value => {
//       attributes = value;
//       // Initialize newRecord with dynamic attributes
//       newRecord = attributes.reduce((acc, attr) => {
//         acc[attr] = "";
//         return acc;
//       }, {});
//     });
//   });

  function addRecord() {
    const record = {
      Name,
      Email,
      ...attributes.reduce((acc, attr) => {
        acc[attr] = newRecord[attr] || "";
        return acc;
      }, {})
    };
    records = [...records, record];
    Name = "";
    Email = "";
    // Reset newRecord values
    newRecord = attributes.reduce((acc, attr) => {
      acc[attr] = "";
      return acc;
    }, {});
  }

  function handleDelete(index) {
    records = records.filter((_, i) => i !== index);
  }

 function createRecipients() {
    //create a CSV file and pass it to Process file function
    const headers = ["Name", "Email", ...attributes];
    const csv = [headers, ...records.map(record => headers.map(header => record[header]))]
      .map(row => row.join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const file = new File([blob], "recipients.csv", { type: "text/csv" });
    
    manualPage=false;
    processFile(file);
  }

    // onMount(async () => {
    //     let val;
    //     boolAttrs.subscribe(value => {
    //         val = value;
    //     });
    //     if(val===true){
    //         attrs.subscribe(value => {
    //             recipients = value;
    //         });
    //         console.log(recipients);
    //         processStep();
    //     }
    //     });
    // function getBase64(image) {
    //     const reader = new FileReader();
    //     reader.readAsDataURL(image);
    //     reader.onload = e => {
    //         pdfUrl = e.target.result;
    //     };
    // }

    // function handleFileChange(event) {
    //     pdffile = event.target.files[0];
    //     if (pdffile) {
    //         getBase64(pdffile);
    //     }
    //     isEmpty = false;
    // }

    function handletempurl(){
        //alternatively change bool of tempurl
        if(tempurl!==''){
            viewOrClose='View';
        tempurl='';}
        else{
            viewOrClose='Close';
            tempurl=pdfUrl;
        }
    }

    function manualForm(){
        if (selectedDesign.attributes) {
            const valuesToRemove = ['[recipient.name]', '[credential.id]', '[issuer.name]', '[group.name]', '[credential.issued]', '[credential.expiry]'];
            attributes = selectedDesign.attributes.filter(item => !valuesToRemove.includes(item)).map(item => item.replace("custom.", "").replace(/_/g, " ").replace(/\[|\]/g, "")).map(capitalizeFirstLetter);
           
            newRecord = attributes.reduce((acc, attr) => {
                acc[attr] = "";
                return acc;
            }, {});
            manualPage=true;
        }
    }
        function processFile(f) {
        //if the file type is csv directly parseCSV
        if (f.type === 'text/csv') {
            parseCSV(f);
        } else {

      const reader = new FileReader();
        reader.onload = function(e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.SheetNames[0];
            const csvData = XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheet]);
            parseCSV(csvData);
            
        };
        reader.readAsArrayBuffer(f);
    }
}

       function parseCSV(csvData) {
        if (selectedDesign.attributes) {
            let array = selectedDesign.attributes;
            array = array.filter(item => !valuesToRemove.includes(item));
            dynamicVariables = dynamicVariables.concat(array);
        }
        papa.parse(csvData, {
            header: false,
            skipEmptyLines: 'greedy',
            complete: function (results) {
                let _recipients = results.data;
                let _heads = _recipients[0];
                for (let i = 0; i < _heads.length; i++) {
                    _heads[i] = {var: dynamicVariables[i], value: _heads[i]};
                }
                heads = _heads;
                _recipients = _recipients.slice(1);
                for (let i = 0; i < _recipients.length; i++) {
                    for (let j = 0; j < _recipients[i].length; j++) {
                        let varType;
                        if (heads[j].var === '[credential.issued]' || heads[j].var === '[credential.expiry]') {
                            varType = 'date';
                        } else if (heads[j].var === 'email') {
                            varType = 'email';
                        } else {
                            varType = 'text';
                        }
                        
                        _recipients[i][j] = {type: varType, valid: true, value: _recipients[i][j].trim()};
                    }
                }
                recipients = _recipients;
                validateData();
            }
        });
    };

    function validateData() {
        errors = [];
        for (let i = 0; i < recipients.length; i++) {
            for (let j = 0; j < recipients[i].length; j++) {
                let varType;
                if (heads[j].var === '[credential.issued]' || heads[j].var === '[credential.expiry]') {
                    varType = 'date';
                } else if (heads[j].var === 'email') {
                    varType = 'email';
                } else {
                    varType = 'text';
                }
                recipients[i][j] = {type: varType, valid: recipients[i][j].value !== '', value: recipients[i][j].value}
                if (recipients[i][j].type == 'email') {
                    let valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipients[i][j].value);
                    recipients[i][j] = {type: recipients[i][j].type, valid: valid, value: recipients[i][j].value};
                }
                if (recipients[i][j].type == 'date') {
                    let valid = /^\d{4}-\d{2}-\d{2}$/.test(recipients[i][j].value);
                    // let valid = false;

                    // if (isValidFormat) {
                    //     const [day, month, year] = recipients[i][j].value.split('/');
                    //     const date = new Date(year, month - 1, day); // months are 0-indexed in JavaScript Date
                    //     valid = date && date.getDate() == day && date.getMonth() == month - 1 && date.getFullYear() == year;
                    // }

                    recipients[i][j] = {type: recipients[i][j].type, valid: valid, value: recipients[i][j].value};
                }
                if(!recipients[i][j].valid) errors.push(i);
            }
        }
        missingVariables = dynamicVariables.filter(variable => !heads.some(item => item.var === variable)).filter(item => !optionalValues.includes(item));
    }

    function invalidate(v) {
        for (let i = 0; i < heads.length; i++) {
            if (heads[i] != v && v.var != 'Assign attribute') {
                if (heads[i].var == v.var) heads[i].var = 'Assign attribute';
            }
        }
        validateData();
    }
    let errorGroupName = false;
    let errorDesign = false;

    let groupName;
    let identifier;
    let expiry = "-1";
    let certificateSendDate = "Immediate";
    let description = '';
    let skills = [];
    let criteria = [];
    let type = 'certificate';
    let designId;

    // let isEmpty = false; uncomment this when pdf upload is used

    function processStep() {

        errorGroupName = false;
        errorDesign = false;
        // if (!pdfUrl) isEmpty = true; uncomment this when pdf upload is used
        if (groupName && selectedDesign && description.length <= 280) {
            currentStep++;
        } else {
            if (!groupName) errorGroupName = true;
            if (!selectedDesign) errorDesign = true;
            if (tasks.length === 0) errorTasks = true;
        }
    }

    function downloadTemplate() {
        let csvContent = "data:text/csv;charset=utf-8," + "Name,Email\n";
        if (selectedDesign.attributes) {
            const valuesToRemove = ['[recipient.name]', '[credential.id]', '[issuer.name]', '[group.name]', '[credential.issued]', '[credential.expiry]'];
            let attributes = selectedDesign.attributes.filter(item => !valuesToRemove.includes(item)).map(item => item.replace("custom.", "").replace(/_/g, " ").replace(/\[|\]/g, "")).map(capitalizeFirstLetter);
            csvContent = "data:text/csv;charset=utf-8," + "Name,Email,"+attributes.join(",")+"\n";
        }
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "template.csv");
        document.body.appendChild(link);
        link.click();
    }

    let toastMessage;
    let loading = false;

    async function createCredentials() {
        loading = true;
        try {
            const mappedRecipients = recipients.map(recipient => {
                const mappedRecipient = {};
                heads.forEach(({ var: key, _ }, index) => {
                    if (key != 'Assign attribute') {
                        mappedRecipient[key] = recipient[index].value;
                    }
                });
                return mappedRecipient;
            });
            if (window.analytics) {
                window.analytics.track('credential-init', {
                    group: groupName,
                    designId: selectedDesign.id,
                    recipients: mappedRecipients.length
                });
            }
           
            let response = await fetch('/api/create-credentials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ group: groupName, type: type, expiry: expiry, designId: selectedDesign.id, recipients: mappedRecipients, description: description, skills: skills, sendingSchedule: certificateSendDate, identifier: identifier}),
            });
            function storeCertificateData() {
        criteria.tasks = tasks;
        criteria.selected=task.selected; 
        criteria.text=task.text;
        criteria.required=task.required;
        // certificateData.date = currentDate;
        // ...
        console.log("Certificate criteria:",criteria);
        
    }

            const data = await response.json();

            if (!response.ok) {
                if (data.error) {
                    toastMessage = data.error;
                } else {
                    toastMessage = 'Something went wrong';
                }
                toastType = 'error';
                triggerToast();
                if (window.analytics) {
                    window.analytics.track('credential-error', {
                        group: groupName,
                        designId: selectedDesign.id,
                        recipients: mappedRecipients.length,
                        error: toastMessage
                    });
                }
            }

            if (response.ok) {
                if (window.analytics) {
                    window.analytics.track('credential-created', {
                        group: groupName,
                        designId: selectedDesign.id,
                        recipients: mappedRecipients.length,
                    });
                }
                loading = false;
                toastType = 'success';
                toastMessage = 'Credentials created successfully';
                triggerToast();
                await jsConfetti.addConfetti();
                goto("/groups/"+data.groupId+"/credentials");
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }
        loading = false;
    }

    const itemsPerPage = 10;
    let currentPage = 1;

    let searchQuery = '';
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

    // let certDateTime = false;
    // let certSchedStat = "Immediate";
    // function handleCertSchedStat() {
    //     if (certDateTime == true) {
    //         certSchedStat = "Custom Date/Time";
    //     } else {
    //         certSchedStat = "Immediate";
    //         certificateSendDate = "Immediate";
    //     }
    // }
    import { onMount } from 'svelte';

// let textInput = '';
// let textInputs = '';
let tasks = [];

function closeModal() {
  // Function to close modal
  // No changes here, kept for consistency
}

// function acceptData() {
//   // Function to accept data from form
//   if (formValidation()) {
//     const selectedOption = document.getElementById("list").value;
//     const data = {
//       text: textInput,
//       required: document.querySelector('.tick').checked ? 'Required' : '',
//       selected: selectedOption
//     };
//     createTasks(data);
//     clearInputs();
//     closeModal();
//   }
// }

function formValidation() {
  // Function for form validation
  if (textInput.trim() === '') {
    alert("Please fill the 'CISSP' field.");
    return false;
  }
  return true;
}

function createTasks(data) {
  // Function to create tasks
  tasks = [...tasks, data];
}

function clearInputs() {
  // Function to clear input fields
  textInput = '';
  textInputs = '';
}

function deleteTask(index) {
  // Function to delete a task
  tasks.splice(index, 1);
  tasks = [...tasks]; 
}

onMount(() => {
  // Function called on component mount
  // No changes here, kept for consistency
});
</script>
{#if manualPage===false}?
<main class="p-4 md:ml-60 min-h-screen">
    <div class="p-4 bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden">
        <div class="flex w-full">
            <Badge color="dark" class="mr-2">Step {currentStep} / 2</Badge>
            <h2 class="text-xl tracking-tight font-extrabold text-gray-900 dark:text-white">
                {#if currentStep == 1}
                    Group Information
                {:else if currentStep == 2}
                    Recipient Data
                {/if}
            </h2>
            <!-- <span class="ml-auto bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                Available Credits: {$organization.credits}
            </span> -->
            <!-- {#if currentStep == 2}
            <button type="button" on:click={()=>manualForm()} class="ml-[67%] text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-3 py-1.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Fill Manually</button>
            {/if} -->
        </div>
       
        <Hr/>
        {#if currentStep == 1}
        <div class="mt-4">
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6 flex flex-col justify-between">
                    <div class="space-y-5">
                    <div>
                        <label for="group-name" class="block text-sm font-medium text-gray-900 dark:text-white">Group Name</label>
                        <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">Displayed in email and the credential page</p>
                        <Input type="text" name="group-name" id="group-name" color={errorGroupName && !groupName?'red':'base'} bind:value={groupName} required/>
                    </div>
                    <div>
                        <label for="group-name" class="block text-sm font-medium text-gray-900 dark:text-white">Identifier (Optional)</label>
                        <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">To identify your group on the dashboard - ex. a course code</p>
                        <Input type="text" name="identifier" id="identifier" bind:value={identifier}/>
                    </div>
                    <div>
                        <label for="description" class="block text-sm font-medium text-gray-900 dark:text-white">Description (Optional)</label>
                        <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">Provide more event details or describe recipients' actions to earn the credential</p>
                        <textarea bind:value={description} id="description" rows="4" class="{description.length>280?'bg-red-50 border-red-500 text-red-900':'bg-gray-50 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600'} block p-2.5 w-full text-sm text-gray-900  rounded-lg dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"></textarea>
                        {#if description}
                            <span class="text-xs text-gray-500">{description.length}/280</span>
                        {/if}
                    </div>
                    <div>
                        <label for="skills" class="block text-sm font-medium text-gray-900 dark:text-white">Skills (Optional)</label>
                        <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">List the skills your recipients have acquired</p>
                        <Tags bind:tags={skills}/>
                    </div>
                    </div>
                </div>
                <div class="col-span-6">
                    <div on:click={openModal} class="{errorDesign && !selectedDesign?'bg-red-50 dark:bg-gray-700 border-red-500 dark:border-red-400':''} cursor-pointer relative flex flex-col justify-center items-center w-full aspect-[1.415/1] bg-gray-100 rounded dark:bg-gray-700 relative border {designId?'':'border-dashed'} border-gray-300 rounded-lg overflow-hidden">
                        <Badge border color="dark" large class="!p-1.5 absolute right-1 top-1 cursor-pointer z-10">
                            <i class="icon-pen dark:text-white"></i>
                        </Badge>
                        {#if selectedDesign}
                            <img class="p-2 h-full w-full object-contain" src={selectedDesign.preview} alt={selectedDesign.name} />
                        {:else}
                            <svg width="150" height="150" class="text-gray-300" fill="currentColor" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 64 64" style="enable-background:new 0 0 64 64;" xml:space="preserve"> <g id="certificate-03"> <g> <path fill="currentColor" d="M46.462,44.634H0.691C0.309,44.634,0,44.325,0,43.944V7.038c0-0.381,0.309-0.691,0.691-0.691 h58.201c0.381,0,0.691,0.309,0.691,0.691V29.3h-1.381V7.728H1.381v35.525h45.081V44.634z"/> <path fill="currentColor" d="M43.34,40.824H9.639c-0.381,0-0.691-0.309-0.691-0.691c0-2.279-1.854-4.132-4.132-4.132 c-0.381,0-0.691-0.309-0.691-0.691v-19.64c0-0.381,0.309-0.691,0.691-0.691c2.279,0,4.132-1.854,4.132-4.133 c0-0.381,0.309-0.691,0.691-0.691h40.304c0.381,0,0.691,0.309,0.691,0.691c0,2.279,1.854,4.133,4.133,4.133 c0.381,0,0.691,0.309,0.691,0.691v10.837h-1.381v-10.19c-2.489-0.312-4.468-2.291-4.78-4.78H10.286 c-0.312,2.489-2.29,4.468-4.78,4.78v18.345c2.489,0.312,4.468,2.29,4.78,4.78H43.34V40.824z"/> <rect x="9.639" y="21.894" fill="currentColor" width="40.304" height="1.381"/> <rect x="9.639" y="26.296" fill="currentColor" width="36.636" height="1.381"/> <rect x="9.639" y="30.697" fill="currentColor" width="31.501" height="1.381"/> <rect x="19.455" y="16.759" fill="currentColor" width="20.672" height="1.381"/> <path fill="currentColor" d="M54.654,47.453c-2.119,0-4.193-0.729-5.841-2.053c-2.226-1.782-3.504-4.44-3.504-7.292 c0-5.15,4.192-9.341,9.345-9.341S64,32.958,64,38.108c0,2.852-1.278,5.509-3.505,7.293C58.826,46.743,56.806,47.453,54.654,47.453 z M54.654,30.148c-4.391,0-7.964,3.571-7.964,7.96c0,2.43,1.089,4.695,2.987,6.215c1.404,1.129,3.171,1.75,4.977,1.75 c1.833,0,3.554-0.605,4.976-1.749c1.9-1.521,2.989-3.786,2.989-6.216C62.619,33.719,59.046,30.148,54.654,30.148z"/> <path fill="currentColor" d="M54.654,44.74c-1.504,0-2.976-0.518-4.145-1.457c-1.58-1.264-2.486-3.15-2.486-5.174 c0-3.655,2.975-6.628,6.631-6.628s6.631,2.973,6.631,6.628c0,2.023-0.906,3.909-2.487,5.175 C57.615,44.236,56.181,44.74,54.654,44.74z M54.654,32.862c-2.895,0-5.25,2.354-5.25,5.247c0,1.602,0.718,3.095,1.969,4.096 c0.926,0.744,2.09,1.153,3.281,1.153c1.208,0,2.342-0.399,3.279-1.152c1.253-1.003,1.97-2.496,1.97-4.097 C59.904,35.216,57.549,32.862,54.654,32.862z"/> <path fill="currentColor" d="M60.063,57.653c-0.165,0-0.327-0.059-0.456-0.172l-4.953-4.352l-4.953,4.352 c-0.204,0.179-0.494,0.222-0.74,0.111c-0.247-0.112-0.406-0.358-0.406-0.629v-12.1h1.381v10.574l4.262-3.745 c0.261-0.229,0.651-0.229,0.912,0l4.262,3.745V44.862h1.381v12.1c0,0.271-0.159,0.517-0.406,0.629 C60.257,57.632,60.16,57.653,60.063,57.653z"/> <path fill="currentColor" d="M56.879,41.75c-0.11,0-0.22-0.026-0.321-0.079l-1.903-1.001l-1.903,1.001 c-0.232,0.122-0.514,0.102-0.727-0.053c-0.212-0.154-0.319-0.416-0.275-0.675l0.363-2.119l-1.54-1.501 c-0.188-0.184-0.256-0.458-0.175-0.708c0.081-0.25,0.297-0.432,0.557-0.47l2.128-0.309l0.952-1.928 c0.233-0.471,1.006-0.471,1.239,0l0.952,1.928l2.128,0.309c0.26,0.038,0.476,0.22,0.557,0.47c0.081,0.25,0.013,0.524-0.175,0.708 l-1.54,1.501l0.363,2.119c0.044,0.259-0.062,0.521-0.275,0.675C57.165,41.705,57.022,41.75,56.879,41.75z M54.654,39.199 c0.11,0,0.221,0.026,0.321,0.079l0.986,0.519l-0.188-1.098c-0.038-0.224,0.036-0.452,0.199-0.611l0.798-0.778l-1.103-0.16 c-0.225-0.033-0.419-0.174-0.52-0.378l-0.493-0.999l-0.493,0.999c-0.101,0.204-0.295,0.345-0.52,0.378l-1.103,0.16l0.798,0.778 c0.163,0.159,0.237,0.387,0.199,0.611l-0.188,1.098l0.986-0.519C54.434,39.226,54.544,39.199,54.654,39.199z"/> </g> </g> <g id="Layer_1"> </g> </svg>
                        {/if}
                    </div>
                    <!-- <ul class="mt-3 items-center w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg sm:flex dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <li class="w-full border-b border-gray-200 sm:border-b-0 sm:border-r dark:border-gray-600">
                            <div class="flex items-center ps-3">
                                <input bind:group={type} id="certificate" type="radio" value="certificate" name="type" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500">
                                <label for="horizontal-list-radio-license" class="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">Certificate</label>
                            </div>
                        </li>
                        <li class="w-full border-b border-gray-200 sm:border-b-0 sm:border-r dark:border-gray-600">
                            <div class="flex items-center ps-3">
                                <input disabled bind:group={type} id="badge" type="radio" value="badge" name="type" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500">
                                <label for="horizontal-list-radio-id" class="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">Badge</label>
                            </div>
                        </li>
                    </ul> -->
                </div>
            </div>
            {#if false}
            <div class="space-y-3">
                <h5 class="font-medium text-gray-900 dark:text-white">Advanced options</h5>
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
                                <label for="expiration-period" class="block text-sm font-medium text-gray-900 dark:text-white">Expiration Period</label>
                                <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">Set a period after which credentials will automatically expire</p>
                                <select bind:value={expiry} id="expiration-period" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                                    <option value="-1" selected>Never expire</option>
                                    <option value="1">1 year</option>
                                    <option value="2">2 years</option>
                                    <option value="3">3 years</option>
                                    <option value="4">4 years</option>
                                    <option value="5">5 years</option>
                                    <option value="10">10 years</option>
                                </select>
                                {#if expiry == '-1'}
                                <div class="mt-2 p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-700 dark:text-blue-400" role="alert">
                                    Credentials will remain valid indefinitely but can be manually changed anytime.
                                </div>

                                <!-- <div class="flex items-center justify-center w-full">
                                    <label for="dropzone-file" class="flex flex-col items-center justify-center w-full h-28 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                                        <div class="flex flex-col items-center justify-center pt-5 pb-6">
                                            <svg class="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                            </svg>
                                            <p class="mb-2 text-sm text-gray-500 dark:text-gray-400"><span class="font-semibold">Click to upload</span> or drag and drop</p>
                                            <p class="text-xs text-gray-500 dark:text-gray-400">PDF files only</p>
                                        </div>
                                        <input id="dropzone-file" type="file" on:change={handleFileChange} class="hidden" accept=".pdf" />
                                    </label>
                                </div> -->
                                <!-- <div class="flex items-center justify-center w-full">
                                    <label 
                                        for="dropzone-file" 
                                        class={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 ${isEmpty ? 'border-red-500 bg-red-50' : 'border-gray-300 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600'}`}
                                    >
                                        <div class="flex flex-col items-center justify-center pt-5 pb-6">
                                            <svg class="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                            </svg>
                                            <p class="mb-2 text-sm text-gray-500 dark:text-gray-400"><span class="font-semibold">Click to upload</span> or drag and drop</p>
                                            <p class="text-xs text-gray-500 dark:text-gray-400">PDF files only</p>
                                        </div>
                                        <input id="dropzone-file" type="file" on:change={handleFileChange} class="hidden" accept=".pdf" />
                                    </label>
                                </div> -->
                                
                                <!-- {#if pdffile!==null}
                               <button on:click={()=>handletempurl()} class="bg-primary-600 text-white rounded-lg p-2.5 w-full mt-2">{viewOrClose} Uploaded PDF</button>
                                {/if}
                                {#if tempurl!=='' }
                                <iframe src="{pdfUrl}" width="100%" height="300px" frameborder="0"></iframe>
                                {/if} -->

                                <!-- {:else if expiry == '0'}
                                <div class="mt-2 p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400" role="alert">
                                    You can set a custom expiration date for each credential in the spreadsheet
                                </div> -->
                                {:else}
                                <div class="mt-2 p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400" role="alert">
                                    Credentials in this group auto-expire {expiry} {parseInt(expiry)>1?'years':'year'} after issue but can be manually changed anytime.
                                </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                    <!-- <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                     <div class="container">
                        <div class="app">
                            <div class="mb-6">
                                <label for="default-input" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">CISSP</label>
                                <input type="text" id="default-input" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" bind:value={textInput}>
                            </div>
                            <div class="form flex justify-between items-center"> 
                                <div class="dropdown mb-3 mr-3"> 
                                    <select class="dropdown-menu bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" id="list">
                                        <option value="first">First</option>
                                        <option value="second">Second</option>
                                        <option value="third">Third</option>
                                        <option value="fourth">Fourth</option>
                                    </select>
                                </div>
                                <label class="inline-flex items-center cursor-pointer">
                                    <input type="checkbox" value="" class="sr-only peer tick">
                                    <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Set As Required</span>
                                </label>
                                
                            </div>
                            <button type="button" class="btn btn-add" on:click={acceptData}>Add</button>
                            <button on:click={storeCertificateData} class="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:bg-green-600 transition duration-300 ease-in-out">Save Certificate Data</button>

                        </div>                    
                        <div id="tasks">
                            {#each tasks as task, index}
                                <div class="task">
                                    <span class="fw-bold">Certificate: {task.selected}</span><br>
                                    <span class="small text-bold">CISSP: {task.text}</span><br>
                                    <span class="small text-secondary">Required: {task.required}</span><br>
                                    <button class="delete-task" on:click={() => deleteTask(index)}>Delete</button>
                                </div>
                            {/each}
                        </div>
                    </div> 
                    </div> -->
                    
                 
                      
                    <!-- <div class="col-span-6 flex flex-col justify-between">
                        <div class="space-y-5">
                            <div>
                                <label for="expiration-period" class="block text-sm font-medium text-gray-900 dark:text-white">Delivery Schedule</label>
                                <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">Set a period after which certificate will be automatically send</p>
                                <div class="flex items-center h-10">
                                    <div class="basis-[37%]">
                                        <Toggle bind:checked={certDateTime} on:change={handleCertSchedStat}>{certSchedStat}</Toggle>
                                    </div>
                                    
                                    {#if certDateTime}
                                        <div class="basis-[60%]">
                                            <input bind:value={certificateSendDate} type="datetime-local" id="certDelivDateTime" name="certDelivDateTime">
                                        </div>
                                    {/if}
                                </div>
    
                                {#if certDateTime === false}
                                <div class="mt-2 p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-700 dark:text-blue-400" role="alert">
                                    Certificate will be send immediately if toggle is of
                                </div>
                                {:else}
                                <div class="mt-2 p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400" role="alert">
                                    Certificate will be send according to the set date/time if toggle is on
                                </div>
                                {/if}
                            </div>
                        </div>   
                    </div> -->
                    
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
            {/if}
        </div>
        {:else if currentStep == 2}
            {#if recipients.length == 0}
                <div class="mt-4 py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6 border border-gray-200 rounded">
                    <div class="flex flex-col items-center">
                        <h2 class="mb-4 text-2xl tracking-tight font-bold text-gray-900 dark:text-white">Upload a spreadsheet of your recipients’ information</h2>
                        <p class="text-gray-500 sm:text-lg dark:text-gray-400">We accept CSV, XLS, XLSX format</p>
                        <p class="mb-8 text-gray-500 sm:text-lg dark:text-gray-400">Max file size: 20 MB</p>
                        <button id="upload-spreadsheet" on:click={() => fileInput.click()} class="flex items-center justify-center px-4 py-2.5 text-base font-medium text-center text-white bg-primary-700 rounded-lg hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-900">
                            <i class="icon-upload mr-2"></i>
                            Upload Spreadsheet
                        </button>
                        <Hr class="my-8" width="w-64">or</Hr>
                        <button on:click={downloadTemplate} class="flex items-center justify-center px-4 py-2.5 text-base font-medium text-center text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
                            <i class="icon-download mr-2"></i>
                            Download Spreadsheet Template
                        </button>  
                    </div>
                </div>
            {:else}
                <div class="overflow-x-auto">
                    <!-- <Toggle checked={firstRowHeader} on:change={()=>firstRowHeader=!firstRowHeader}>First row is a header</Toggle> -->
                    <div class="flex justify-between my-4">
                        <div>
                            <span class="mr-2 text-gray-900 dark:text-white">
                                <Badge rounded large class="!p-1.5 !font-semibold w-6 h-6">
                                    <i class="icon-files"></i>
                                </Badge>
                                {recipients.length} records
                            </span>
                            <span class="mr-2 text-gray-900 dark:text-white">
                                <Badge color="green" rounded large class="!p-1.5 !font-semibold w-6 h-6">
                                    <i class="icon-check"></i>
                                </Badge>
                                {recipients.length - errors.length} valid
                            </span>
                            <span class="mr-2 text-gray-900 dark:text-white">
                                <Badge color="red" rounded large class="!p-1.5 !font-semibold w-6 h-6">
                                    <i class="icon-xmark"></i>
                                </Badge>
                                {errors.length} error
                            </span>
                        </div>
                        <Toggle checked={onlyErrors} on:change={()=>onlyErrors=!onlyErrors}>Only show rows with errors</Toggle>
                    </div>
                    <div class="table-under overflow-y-auto" style="max-height: calc(100vh - 5rem - 160px)">
                        <table class="w-full text-xs w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead class="sticky top-0 text-xs text-gray-700 bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th scope="col" class="px-4 py-3"></th>
                                    {#each heads as head}
                                        <th scope="col" class="px-4 py-3">
                                            {head.value}
                                            <i class="icon-arrow-right-long inline mx-1"></i>
                                            <select bind:value={head.var} on:change={()=>invalidate(head)} class="text-xs capitalize inline bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                                                <option selected>Assign attribute</option>
                                                {#each dynamicVariables as variable}
                                                    {#if variable.includes("custom.") || variable.includes("issued") || variable.includes("expiry")}
                                                        <option value={variable}>{variable.replace( "custom.", "" ).replace( "credential.", "" ).replace( /_/g, " " ).replace(/\[|\]/g, "").split(" ").map(capitalizeFirstLetter).join( " " )}</option>
                                                    {:else}
                                                        <option value={variable}>{variable}</option>
                                                    {/if}
                                                {/each}
                                            </select>
                                        </th>
                                    {/each}
                                </tr>
                            </thead>
                            <tbody class:onlyErrors={onlyErrors}>
                                {#each recipients as recipient, i}
                                <tr class="border-b dark:border-gray-700 {errors.includes(i) ? 'error' : 'valid'}">
                                    <td class="px-4 py-3">{i+1}</td>
                                    {#each recipient as cell}
                                        <td class="px-4 py-3 {cell.valid?'':'bg-red-100 dark:bg-red-500 dark:text-white'}" contenteditable="true" bind:innerText={cell.value} on:focusout={validateData}>{cell.value}</td>
                                    {/each}
                                </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                </div>
            {/if}
        {/if}

        <div class="flex mt-4">
            {#if currentStep > 1}
            <button on:click={()=>currentStep -= 1} class="flex items-center justify-center px-4 py-2.5 text-base font-medium text-center text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
                <i class="icon-chevron-left mr-2"></i>
                Group Information
            </button>
            {/if}
            {#if currentStep  == 2 && recipients.length}
            <button on:click={() => fileInput.click()} class="ml-2 flex items-center justify-center px-4 py-2.5 text-base font-medium text-center text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
                Re-upload
            </button>
            {/if}
            {#if currentStep == 2}
            <div class="ml-auto flex items-center justify-center">
                {#if recipients.length > $organization.credits}
                    <div class="mr-3 flex items-center gap-2 rounded-lg overflow-hidden border">
                        <div class="rounded-lg inline-flex items-center justify-center shrink-0 text-orange-500 bg-orange-100 dark:bg-orange-700 dark:text-orange-200 w-8 h-8"><i class="icon-triangle-exclamation"></i></div>
                        <span class="dark:text-white pr-2">You don't have enough credits</span>
                    </div>
                {/if}
                {#if errors.length}
                    <div class="mr-3 flex items-center gap-2 rounded-lg overflow-hidden border">
                        <div class="rounded-lg inline-flex items-center justify-center shrink-0 text-orange-500 bg-orange-100 dark:bg-orange-700 dark:text-orange-200 w-8 h-8"><i class="icon-triangle-exclamation"></i></div>
                        <span class="dark:text-white pr-2">Cells have errors</span>
                    </div>
                {/if}
                {#if recipients.length > 1000}
                    <div class="mr-3 flex items-center gap-2 rounded-lg overflow-hidden border">
                        <div class="rounded-lg inline-flex items-center justify-center shrink-0 text-orange-500 bg-orange-100 dark:bg-orange-700 dark:text-orange-200 w-8 h-8"><i class="icon-triangle-exclamation"></i></div>
                        <span class="dark:text-white pr-2">We have a limit of 1000 credentials</span>
                    </div>
                {/if}
                {#if missingVariables.length}
                    <div class="mr-3 flex items-center gap-2 rounded-lg overflow-hidden border">
                        <div class="rounded-lg inline-flex items-center justify-center shrink-0 text-orange-500 bg-orange-100 dark:bg-orange-700 dark:text-orange-200 w-8 h-8"><i class="icon-triangle-exclamation"></i></div>
                        <span class="dark:text-white pr-2">{missingVariables.length} required attribute{missingVariables.length>1?'s':''} missing</span>
                    </div>
                    <Tooltip>Missing attribute <br>
                        <ul class="space-y-1 list-disc list-inside capitalize">
                            {#each missingVariables as variable}
                                {#if variable.includes("custom.")}
                                    <li>{variable.replace( "custom.", "" ).replace( /_/g, " " ).replace(/\[|\]/g, "").split(" ").map(capitalizeFirstLetter).join( " " )}</li>
                                {:else}
                                    <li>{variable}</li>
                                {/if}
                            {/each}
                        </ul>
                    </Tooltip>
                {/if}
                <button id="send-credentials" disabled={!($organization.credits >= recipients.length && recipients.length && !missingVariables.length && !errors.length)} on:click={createCredentials} class="px-4 py-2.5 text-base font-medium text-center text-white bg-primary-700 rounded-lg hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-900">
                    {#if loading}
                            <Spinner size="5" color="white" />
                    {:else}
                        Send Credentials
                    {/if}
                </button>
            </div>
            {:else}
            <button on:click={processStep} id="recipient-data" class="ml-auto flex items-center justify-center px-4 py-2.5 text-base font-medium text-center text-white bg-primary-700 rounded-lg hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-900">
                Recipient Data
                <i class="ml-2 icon-chevron-right"></i>
            </button>
            {/if}
        </div>
    </div>
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

<Modal id="designs" title="Designs" bind:open={designModal} size='xl' autoclose>
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
            <div class="mb-4">
                <Button href="/designs/certificate/create"><i class="icon-plus me-1" /> Create Certificate</Button>
                <Button href="/designs/badge/create"><i class="icon-plus me-1" /> Create Badge</Button>
            </div>
            <!-- <Dropdown>
                <DropdownItem href="/designs/create">Certificate Design</DropdownItem>
                <DropdownItem>Badge Design</DropdownItem>
            </Dropdown> -->
        </div>
        <div class="overflow-x-auto">
            <div class="grid grid-cols-4 gap-4 p-4">
                {#each paginatedData as design}
                    <div on:click={()=>selectDesign(design)} class="hover:cursor-pointer hover:shadow-xl card overflow-hidden relative bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
                        <div class="image-wrapper p-2 bg-gray-100 dark:bg-gray-800 relative">
                            <img class="rounded-t-lg h-full w-full object-contain" src={design?.preview?.includes('https://')?design.preview+'?t='+new Date().getTime():design.preview} alt={design.name} />
                        </div>
                        <div class="p-5">
                            <h5 class="text-lg font-bold tracking-tight text-gray-900 dark:text-white">{design.name}</h5>
                        </div>
                    </div>
                {/each}
            </div>
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
</Modal>

<input type="file" class="hidden" accept=".csv,.xls,.xlsx" bind:files bind:this={fileInput} on:change={() => processFile(files[0])}>

{:else}
<main class="p-4 md:ml-60 min-h-screen">
    <div class="p-4 flex flex-col h-screen">
      <div class="block-1 mt-6 mb-4 ml-4">
        <h1 class="tracking-tight text-xl font-extrabold text-gray-900 dark:text-white">
          Create Credentials Manually
        </h1>
      </div>
      <div class="block-2 ml-4 mb-6">
        <span class="ml-auto bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
          Fill-data
        </span>
      </div>
      <hr class="mx-4" />
      <div class="top-table-container flex justify-between m-4">
        <div class="credential-count text-gray-800 dark:text-gray-500">
          Creating credentials
        </div>
      </div>
      <div class="p-2 block-4 m-2">
        <div class="flex flex-col">
          <div class="-m-1.5 overflow-x-auto">
            <div class="p-1.5 min-w-full inline-block align-middle">
              <div class="border rounded-lg shadow overflow-hidden">
                <table class="min-w-full divide-y divide-gray-350">
                  <thead class="bg-blue-100">
                    <tr>
                      <th scope="col" class="px-6 py-3 text-start text-xs font-medium block text-gray-900 dark:text-white dark:bg-gray-700 uppercase">#</th>
                      <th scope="col" class="px-6 py-3 text-start text-xs font-medium text-gray-900 dark:text-white dark:bg-gray-700 uppercase">Recipient Name</th>
                      <th scope="col" class="px-6 py-3 text-start text-xs font-medium text-gray-900 dark:text-white dark:bg-gray-700 uppercase">Email</th>
                      {#each attributes as attribute}
                        <th scope="col" class="px-6 py-3 text-start text-xs font-medium text-gray-900 dark:text-white dark:bg-gray-700 uppercase">{attribute}</th>
                      {/each}
                      <th scope="col" class="px-6 py-3 text-end text-xs font-medium text-gray-900 dark:text-white dark:bg-gray-700 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    {#each records as record, index}
                      <tr key={index} class="cursor-pointer">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-50">{index + 1}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-50">{record.Name}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">{record.Email}</td>
                        {#each attributes as attribute}
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">{record[attribute]}</td>
                        {/each}
                        <td class="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                          <button
                            on:click={() => handleDelete(index)}
                            type="button"
                            class="inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:pointer-events-none"
                          >
                            <i class="fa fa-trash delete-icon 2xl fa-lg xl:fa-3x"></i>
                          </button>
                        </td>
                      </tr>
                    {/each}
                    <tr class="cursor-pointer">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">{records.length + 1}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        <form class="flex">
                          <Input bind:value={Name} placeholder="Recipient Name" class="rounded p-2 text-gray-800 border border-gray-200 bg-white" />
                        </form>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        <form class="flex">
                          <Input bind:value={Email} type="email" placeholder="Email" class="rounded p-2 text-gray-800 border border-gray-200 bg-white" />
                        </form>
                      </td>
                      {#each attributes as attribute}
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          <form class="flex">
                            <Input bind:value={newRecord[attribute]} placeholder={attribute} class="rounded p-2 text-gray-800 border border-gray-200 bg-white" />
                          </form>
                        </td>
                      {/each}
                      <td class="py-4 whitespace-nowrap text-sm font-medium">
                        <Button on:click={() => addRecord()} type="button" class="ml-2.5 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent text-white hover:bg-black disabled:opacity-50 disabled:pointer-events-none">
                          + Add
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div class="my-2 w-full flex justify-between">
            {#if currentStep > 1}
            <button on:click={() => { manualPage = false; }} class="flex items-center justify-center px-4 py-2.5 text-base font-medium text-center text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
                <i class="icon-chevron-left mr-2"></i>
                Group Information
            </button>
            {/if}
          <button
            on:click={() => createRecipients()}
            type="button"
            class="px-4 py-2.5 text-base font-medium text-center text-white bg-primary-700 rounded-lg hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-900"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  </main>
{/if}
<style>
    .onlyErrors .valid {
        display: none;
    }

    .table-under::-webkit-scrollbar {
        width: 12px;
    }

    .table-under::-webkit-scrollbar-track {
        background-color: #F9FAFB;
        border-radius: 100px;
    }

    .table-under::-webkit-scrollbar-thumb {
        background-color: #C1C1C1;
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
    #certDelivDateTime {
        width: 50%;
        border-radius: 5px;
        letter-spacing: -1px;
    }
    .app {
    margin: 20px auto;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
    background-color:#1f2937;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    max-width: 600px; /* Set a maximum width for the app */
    width: 450px; /* Set a default width */
    margin-left: auto;
    margin-right: auto;
  }

  .form {
    margin-bottom: 20px;
  }

  .dropdown-toggle {
    background-color: #007bff;
    padding:10px;
    color: #000; /* Changed color to black */
  }

  .dropdown-toggle:hover {
    background-color: #0056b3;
  }

  .form-control {
    width: calc(100% - 20px); /* Adjusted width with margin */
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin-bottom: 10px;
    margin-top: 20px; /* Increased top margin to 20px */
  }

  .box {
    margin-top: 10px;
  }

  .tick {
    margin-right: 5px;
  }

  .task {
    width:450px;
    margin-bottom: 10px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .delete-task {
    background-color: #dc3545;
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 5px 10px;
    cursor: pointer;
  }

  .delete-task:hover {
    background-color: #c82333;
  }

  /* Added new CSS rule for black text */
  .task span {
    color: #000; /* Set text color to black */
  }

  /* Set label color to black */
  .box label {
    color: #ffffff;
  }

  /* Improved styling for the "Add" button */
  .btn-add {
    background-color: #28a745;
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 10px 20px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .btn-add:hover {
    background-color: #218838;
  }

  /* Media query for responsiveness */
  @media screen and (max-width: 768px) {
    .app {
      padding: 10px;
    }
    .form-control {
      font-size: 14px; /* Adjust font size for smaller screens */
    }
  }
  #list{
    width:230px;
  }
</style>