<script>
    import { Tooltip, Badge, Alert, Button, Toast, Modal } from "flowbite-svelte";
    import { CloseCircleSolid, ExclamationCircleOutline  } from "flowbite-svelte-icons";
    import { organization } from '../../data.js';
    import { enhance } from '$app/forms';
    import { Spinner } from 'flowbite-svelte';
    import { fly } from 'svelte/transition';
	import { Chevron, Dropdown, DropdownItem, Search } from 'flowbite-svelte';
    import { countryList } from '$lib/countries.js';
    import axios from 'axios';

    // console.log($organization);
    export let data;
    // console.log(data);

    let customEmailDelModal = false;
    let customDomainDelModal = false;
    let customSocialMediaDelModal=false;

    function showArticle() {
        if (window.Intercom) {
            window.Intercom('showArticle', 8251124);
        }
    }

    let country = {
        name: null,
        code: null,
        states: []
    };
	let searchCountry = '';
	const countryArray = countryList;
	let filteredCountries = countryArray;
    let dropdownOpenCountry = false;

    function _searchCountry() {
		searchCountry = searchCountry.toLowerCase();
		filteredCountries = countryArray.filter((country) => {
			return country.name.toLowerCase().includes(searchCountry);
		});
	}

	function selectCountry(c) {
		country = c;
		searchCountry = '';
		dropdownOpenCountry = false;
        stateArray = country.states;
        state = null;
        setTimeout(() => {
            _searchState();
        }, 100);
	}

    let state = null;
    let searchState = '';
    let stateArray = null;
	let filteredStates = null;
    let dropdownOpenState = false;

    function _searchState() {
		searchState = searchState.toLowerCase();
		filteredStates = stateArray.filter((state) => {
			return state.toLowerCase().includes(searchState);
		});
	}

    function selectState(c) {
		state = c;
		searchState = '';
		dropdownOpenState = false;
	}

    if ($organization.country) {
        country = countryList.find(c => c.name == $organization.country);
        if ($organization.state) state = $organization.state;
        stateArray = country.states;
        setTimeout(() => {
            _searchState();
        }, 100);
    }

    let fileInput;
    let files;
    let logo = null;

    let formLoading1 = false;
    let formLoading2 = false;
    let formLoading3 = false;
    let formLoading4 = false;
    let formLoading5 = false;
    let formLoadingLinks = false;
    let formLoadingDomain = false;
    let companyDescriptionFormLoading=false;
    let basicDetailsFormLoading=false;
    let socialMediaLinkFormLoading=false;

    function getBase64(image) {
        const reader = new FileReader();
        reader.readAsDataURL(image);
        reader.onload = e => {
            logo = e.target.result;
        };
    };

    // Toast Function
    let toast = false;
    let counter = 6;
    let toastTimeout;
    let toastMsg = null;
    let toastStatus = null;
    // function triggerToast(msg,status) {
    //     if (toast) {
    //         closeToast();
    //     }
    //     toast = true;
    //     toastMsg = msg;
    //     toastStatus = status;
    //     counter = 3;
    //     timeout();
    // }
    function triggerToast(msg, status) {
        if (toast) {
            closeToast();
        }
        toast = true;
        toastMsg = msg;
        toastStatus = status;
        counter = 3;
        timeout();

        // Return a promise that resolves after the timeout
        return new Promise((resolve) => {
            toastTimeout = setTimeout(() => {
                closeToast();
                resolve(); // Resolve the promise after the timeout
            }, counter * 1000); // Multiply by 1000 to convert seconds to milliseconds
        });
    }

    function closeToast() {
        toast = false;
        toastMsg = null;
        toastStatus = null;
        clearTimeout(toastTimeout);
    }

    function timeout() {
        if (--counter > 0) {
            toastTimeout = setTimeout(timeout, 1000);
        } else {
            closeToast();
        }
    }

    // let currentStep = 0;
    // const steps = [
    //     { title: "Domain Name", content: "Create your custom domain's name:" },
    //     { title: "Ownership", content: "Step 2 content" },
    //     { title: "CNAME Validation", content: "Step 3 content" }
    // ];

    // function nextStep() {
    //     if (currentStep < steps.length - 1) {
    //         currentStep++;
    //     } else {
    //         // Handle reaching the last step
    //         console.log("Save clicked");
    //     }
    // }

    // function prevStep() {
    //     if (currentStep > 0) {
    //         currentStep--;
    //     }
    // }
    let isDomainLoading = false;
    let isEmailLoading = false;
    
    let hostName = null; 
    let hostStatus = null;
    let domainName = null;
    let customEmailStatus = null;
    let customHostId = null;
    let customEmailId=null;
    hostName = data?.orgData?.custom_domain_name;
    customHostId = data?.orgData?.custom_domain_id;
    hostStatus = data?.orgData?.custom_domain_status;
    domainName = data?.orgData?.custom_email_name;
    customEmailStatus = data?.orgData?.custom_email_state;
    customEmailId = data?.orgData?.custom_email_id;
    let customEmailDKIMHost = data?.orgData?.custom_email_dkim_host;
    let customEmailDKIMValue = data?.orgData?.custom_email_dkim_value;

    let terms=data?.orgData?.basic_details.terms;
    let privacy_policy=data?.orgData?.basic_details.privacy_policy;
    let contact=data?.orgData?.basic_details.contact;
    let faq=data?.orgData?.basic_details.faq;

    let selectedSocialMedia = '';
    let socialMediaLink = '';
    let socialMediaOptions = ['LinkedIn', 'Instagram', 'Facebook', 'Twitter'];

    function handleSelect(platform) {
        selectedSocialMedia = platform;
    }

    let company_description=data?.orgData?.description;

    async function handleCompanyDescription(){
        try {
                companyDescriptionFormLoading=true;
                const data = { description: company_description};
                const response = await axios.post('/api/company-description/update', data);
                console.log("response.data.message ",response.data.message);
                if (response.status === 200) {
                    companyDescriptionFormLoading=false;
                    triggerToast(response.data.message, response.status)
                    .then(() => {
                        // location.reload();
                    });
                } else {
                    companyDescriptionFormLoading=false;
                    triggerToast(response.data.message);
                }
            } catch (error) {
                companyDescriptionFormLoading=false;
                triggerToast(error.response.data.message, error.response.status);
            }
    }

    async function handleSocialMedia() {
        
        console.log(`Selected Social Media: ${selectedSocialMedia}`);
        console.log(`Social Media Link: ${socialMediaLink}`);

        try {
                socialMediaLinkFormLoading=true;
                const data = { selectedSocialMedia: selectedSocialMedia,socialMediaLink: socialMediaLink };
                const response = await axios.post('/api/social-media/update', data);
                console.log("response.data.message ",response.data.message);
                if (response.status === 200) {
                    socialMediaLinkFormLoading=false;
                    triggerToast(response.data.message, response.status)
                    .then(() => {
                        location.reload();
                    });
                } else {
                    socialMediaLinkFormLoading=false;
                    triggerToast(response.data.message);
                }
            } catch (error) {
                socialMediaLinkFormLoading=false;
                triggerToast(error.response.data.message, error.response.status);
            }
    }

    async function handleSocialMediaDelete(platform) {

        try {
                const data = { selectedSocialMedia: platform};
                const response = await axios.post('/api/social-media/delete', data);
                console.log("response.data.message ",response.data.message);
                if (response.status === 200) {
                    triggerToast(response.data.message, response.status)
                    .then(() => {
                        location.reload();
                    });
                } else {
                    triggerToast(response.data.message);
                }
            } catch (error) {
                triggerToast(error.response.data.message, error.response.status);
            }
    }

    async function handleBasicDetails() {
      
            try {
                basicDetailsFormLoading=true;
                const data = { terms: terms,privacy_policy: privacy_policy,contact: contact,faq: faq };
                const response = await axios.post('/api/basic-details/update', data);
                console.log("response.data.message ",response.data.message);
                if (response.status === 200) {
                    basicDetailsFormLoading=false;
                    triggerToast(response.data.message, response.status)
                    .then(() => {
                        // location.reload();
                    });
                } else {
                    basicDetailsFormLoading=false;
                    triggerToast(response.data.message);
                }
            } catch (error) {
                basicDetailsFormLoading=false;
                triggerToast(error.response.data.message, error.response.status);
            }
   }


    async function handleCustomDomain(action=null) {
        if (action == 'delete') {
            try {
                const data = { custom_hostname_id: customHostId, action: 'delete-from-btn' };
                const response = await axios.post('/api/custom-hostname/delete', data);
                console.log("response.data.message ",response.data.message);
                if (response.status === 200) {
                    triggerToast(response.data.message, response.status)
                    .then(() => {
                        location.reload();
                    });
                } else {
                    triggerToast(response.data.message);
                }
            } catch (error) {
                triggerToast(error.response.data.message, error.response.status);
            }
        } else if (action == 'verify') {
            isDomainLoading = true;
            try {
                const data = { custom_hostname_id:customHostId,  host_status:hostStatus};
                const response = await axios.post('/api/custom-hostname/fetch', data);
                if (response.status === 200) {
                    if (hostStatus != response.data.status) {
                        triggerToast(`status: ${response.data.status}`, response.status).then(() => {
                        location.reload();
                    });
                    } else {
                        triggerToast(`status updated: ${response.data.status}`, response.status);
                        setTimeout(() => {
                            location.reload();
                        },3000);
                    }
                } else {
                    triggerToast(response.data.message);
                }
            } catch (error) {
                triggerToast(error.response.data.message, error.response.status);
            }
            isDomainLoading = false;
        } else {
            isDomainLoading = true;
            try {
                // console.log(hostName);
                const data = { host_name: hostName };
                const response = await axios.post('/api/custom-hostname/create', data);
                if (response.status === 201) {
                    triggerToast(response.data.message, response.status)
                    .then(() => {
                        location.reload();
                    });
                } else {
                    triggerToast(response.data.message);
                }
            } catch (error) {
                triggerToast(error.response.data.message, error.response.status);
            }
            isDomainLoading = false;
        
        }
   }

   async function handleCustomEmail(action=null) {
    const data = { domain_name: domainName, action: 'delete-from-btn'};
    if (action == 'delete') {
        try {
            const response = await axios.post('/api/custom-email/delete', data);
            if (response.status === 200) {
                triggerToast(response.data.message, response.status)
                .then(() => {
                    location.reload();
                });
            } else {
                triggerToast(response.data.message);
            }
        } catch (error) {
            triggerToast(error.response.data.message, error.response.status);
        }
    }else if (action == 'verify') {
            isEmailLoading = true;
            try {
                const data = { domain_name: domainName,  email_status:customEmailStatus};
                const response = await axios.post('/api/custom-email/fetch', data);
                if (response.status === 200) {
                    if (customEmailStatus != response.data.state) {
                        triggerToast(`status: ${response.data.state}`, response.status);
                    } else {
                        triggerToast(`status updated: ${response.data.state}`, response.status);
                        setTimeout(() => {
                            location.reload();
                        },3000);
                    }
                } else {
                    triggerToast(response.data.message);
                }
            } catch (error) {
                triggerToast(error.response.data.message, error.response.status);
            }
            isEmailLoading = false;
    } else {
            isEmailLoading = true;
        try {
            const response = await axios.post('/api/custom-email/create', data);
            if (response.status === 201) {
                triggerToast(response.data.message, response.status)
                    .then(() => {
                        location.reload();
                    });
            } else {
                triggerToast(response.data.message);
            }
        } catch (error) {
            triggerToast(error.response.data.message, error.response.status);
        }
        isEmailLoading = false;
    }
   }

//    function copyToCustomDomain() {
//         const inputField = document.getElementById('domain_key');
//         inputField.select();
//         inputField.setSelectionRange(0, 99999); // For mobile devices
//         document.execCommand('copy');
//         // alert('Copied: ' + inputField.value);
//     }

    function copyToCustomEmail() {
        const inputField = document.getElementById('email_key');
        inputField.select();
        inputField.setSelectionRange(0, 99999); // For mobile devices
        document.execCommand('copy');
        alert('Copied: ' + inputField.value);
    }
</script>
<main class="p-4 md:ml-60 min-h-screen">
    <!-- {#if $organization.verified == 1}
    <Alert border color="green">
        <svg slot="icon" aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>
        Your organization has been verified.
    </Alert>
    {:else if $organization.verified == 2}
    <Alert border color="blue">
        <div class="grid grid-cols-12 gap-2 items-center">
            <div class="col-span-10">
                <div class="flex items-center gap-3">
                    <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>
                    <span class="text-lg font-medium">Verification under process</span>
                </div>
                <p class="mt-2 text-sm">Our team is currently verifying your organization's details. Should we require any documentation, we'll be sure to get in touch to ensure a smooth process.</p>
            </div>
        </div>
    </Alert>
    {:else}
    <Alert border color="yellow">
        <div class="grid grid-cols-12 gap-2 items-center">
            <div class="col-span-10">
                <div class="flex items-center gap-3">
                    <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>
                    <span class="text-lg font-medium">Your organization has not been verified</span>
                </div>
                <p class="mt-2 text-sm">When an organization is verified, this status appears on all their credentials, assuring viewers of their authenticity.</p>
            </div>
            <div class="col-span-2 text-right">
                <form class="space-y-4 md:space-y-6" method="POST"
                use:enhance={() => {
                    formLoading4 = true;
                    return async ({ update }) => {
                        await update({ reset: false });
                        formLoading4 = false;
                        triggerToast();
                    };
                }}>
                    <input name="verified" type="number" value='2' hidden>
                    <Button type="submit" size="xs" color="yellow">
                        {#if formLoading4}
                            <Spinner size="5" color="white" />
                        {:else}
                            Request verification
                        {/if}
                    </Button>
                </form>
            </div>
        </div>
    </Alert>
    {/if} -->

    <div class="grid grid-cols-12 gap-4 my-4">
        <div class="relative col-span-8 p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 sm:p-6 dark:bg-gray-800">
            <h3 class="mb-4 text-xl font-semibold dark:text-white">General information</h3>
            <form class="space-y-4 md:space-y-6" method="POST"
                use:enhance={() => {
                    formLoading1 = true;
                    return async ({ update }) => {
                        await update({ reset: false });
                        formLoading1 = false;
                        triggerToast();
                    };
                }}>
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-3 relative p-2 flex items-center" style="border: 2px dashed #c1c1ca; border-radius: 8px; overflow: hidden;">
                        {#if logo || $organization.logo}
                            <img src={logo || $organization.logo} alt="Logo" class="w-full aspect-square object-contain"/>
                            <input type="text" name="logo" class="hidden" accept="image/*" value={logo}>
                             <Badge border color="dark" large class="!p-1.5 absolute right-1 top-1 cursor-pointer z-10">
                                <i class="icon-pen dark:text-white" on:click={() => fileInput.click()}></i>
                            </Badge>
                        {:else}
                            <div class="flex flex-col justify-center items-center w-full aspect-square bg-gray-100 rounded dark:bg-gray-700">
                                <svg width="48" height="48" class="text-gray-300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" fill="currentColor" viewBox="0 0 640 512" > <path d="M480 80C480 35.82 515.8 0 560 0C604.2 0 640 35.82 640 80C640 124.2 604.2 160 560 160C515.8 160 480 124.2 480 80zM0 456.1C0 445.6 2.964 435.3 8.551 426.4L225.3 81.01C231.9 70.42 243.5 64 256 64C268.5 64 280.1 70.42 286.8 81.01L412.7 281.7L460.9 202.7C464.1 196.1 472.2 192 480 192C487.8 192 495 196.1 499.1 202.7L631.1 419.1C636.9 428.6 640 439.7 640 450.9C640 484.6 612.6 512 578.9 512H55.91C25.03 512 .0006 486.1 .0006 456.1L0 456.1z"/> </svg>
                                <button on:click={() => fileInput.click()} type="button" class="mt-2 text-xs text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700">Select a file</button>
                            </div>
                        {/if}
                        <input type="file" class="hidden" accept="image/*" bind:files bind:this={fileInput} on:change={() => getBase64(files[0])}>
                    </div>
                    <div class="col-span-9">
                        <div>
                            <label for="email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email Address</label>
                            <div class="relative mb-6">
                                <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                  <i class="icon-envelope text-lg text-gray-900 dark:text-white"></i>
                                </div>
                                <input type="text" name="email" id="email" class="bg-gray-300 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" value={$organization.email} disabled readonly>
                            </div>
                        </div>
                        <div>
                            <label for="name" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Organization Name</label>
                            <input type="text" name="name" id="name" bind:value={$organization.name} class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required>
                        </div>
                    </div>
                </div>
                <Button type="submit" size="sm" class="absolute" style="margin-top: 0px; top: 24px; right: 24px;">
                    {#if formLoading1}
                        <Spinner size="5" color="white" />
                    {:else}
                        Save
                    {/if}
                </Button>
            </form>
        </div>
        <div class="relative col-span-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 sm:p-6 dark:bg-gray-800">
            <h3 class="mb-4 text-xl font-semibold dark:text-white">Web & Social</h3>
            <form class="space-y-4 md:space-y-6" method="POST"
                use:enhance={() => {
                    formLoading2 = true;
                    return async ({ update }) => {
                        await update({ reset: false });
                        formLoading2 = false;
                        triggerToast();
                    };
                }}>
                <div>
                    <label for="website" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Website</label>
                    <input type="text" name="website" id="website" bind:value={$organization.website} class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required="">
                </div>
                <div>
                    <label for="linkedin" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">LinkedIn Organization ID <i class="icon-circle-question dark:text-white ml-1 cursor-pointer" on:click={showArticle}></i></label>
                    <div class="relative mb-6">
                        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <i class="icon-linkedin text-lg text-gray-900 dark:text-white"></i>
                        </div>
                        <input bind:value={$organization.linkedin} type="text" name="linkedin" id="linkedin" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                    </div>
                </div>
                <Button type="submit" size="sm" class="absolute" style="margin-top: 0px; top: 24px; right: 24px;">
                    {#if formLoading2}
                        <Spinner size="5" color="white" />
                    {:else}
                        Save
                    {/if}
                </Button>
            </form>
        </div>
        <!--Company Description-->
            <div class="relative col-span-12 p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 sm:p-6 dark:bg-gray-800">
                <h3 class="mb-4 text-xl font-semibold dark:text-white">Company Description</h3>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12">
                            <label for="description" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Description</label>
                            <textarea bind:value={company_description} name="description" id="description" class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" rows="4" required></textarea>
                        </div>
                    </div>
                    <Button on:click={() => {handleCompanyDescription()}} size="sm" class="absolute" style="margin-top: 0px; top: 24px; right: 24px;">
                        {#if companyDescriptionFormLoading}
                        <Spinner size="5" color="white" />
                        {:else}
                            Save
                        {/if}
                    </Button>
            </div>
        <!--Company Description-->

        <div class="relative col-span-12 p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 sm:p-6 dark:bg-gray-800">
            <h3 class="mb-4 text-xl font-semibold dark:text-white">Billing details</h3>
            <form class="space-y-4 md:space-y-6" method="POST"
            use:enhance={() => {
                formLoading3 = true;
                return async ({ update }) => {
                    await update({ reset: false });
                    formLoading3 = false;
                    triggerToast();
                };
            }}>
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="settings-country" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Country</label>
                        <input type="text" name="country" hidden value={country.name} required>
                        <!-- <input type="text" name="currency" value={country.name=='India'?'INR':'USD'} hidden> -->
                        <Button color="none" class="w-full justify-between flex-shrink-0 text-gray-900 bg-gray-100 border border-gray-300 dark:border-gray-700 dark:text-white hover:bg-gray-200 focus:ring-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800 bg-gray-50 border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 inline-flex">
                            {#if country}
                                <Chevron>{country.name}</Chevron>
                            {:else}
                                <Chevron>Select country</Chevron>
                            {/if}
                        </Button>
                        <Dropdown ulClass="overflow-y-auto h-28 px-3 pb-3 text-sm" bind:open={dropdownOpenCountry} placement="top">
                            <div slot="header" class="p-3">
                                <Search size="md" bind:value={searchCountry} on:input={_searchCountry} class="rounded-lg border"/>
                            </div>
                            {#each filteredCountries as country}
                                <DropdownItem on:click={()=>selectCountry(country)}>{country.name}</DropdownItem>
                            {/each}
                        </Dropdown>
                    </div>
                    <div class="col-span-6">
                        <label for="settings-state" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">State</label>
                        <input type="text" name="state" value={state} required on:keydown={(event)=>event.preventDefault()} on:click={()=>dropdownOpenState = true} color="none" class="w-full justify-between flex-shrink-0 text-gray-900 bg-gray-100 border border-gray-300 dark:border-gray-700 dark:text-white hover:bg-gray-200 focus:ring-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800 bg-gray-50 border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 inline-flex cursor-pointer" style="caret-color: transparent;" autocomplete="anyrandominvalidvalue">
                        <Dropdown ulClass="overflow-y-auto h-28 px-3 pb-3 text-sm" bind:open={dropdownOpenState} placement="top">
                            <div slot="header" class="p-3">
                                <Search size="md" bind:value={searchState} on:input={_searchState} class="rounded-lg border"/>
                            </div>
                            {#each filteredStates as state}
                                <DropdownItem on:click={()=>selectState(state)}>{state}</DropdownItem>
                            {/each}
                        </Dropdown>
                    </div>
                </div>
                <Button type="submit" size="sm" class="absolute" style="margin-top: 0px; top: 24px; right: 24px;">
                    {#if formLoading3}
                        <Spinner size="5" color="white" />
                    {:else}
                        Save
                    {/if}
                </Button>
            </form>
        </div>
        {#if $organization.country == "India"}
        <div class="relative col-span-12 p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 sm:p-6 dark:bg-gray-800">
            <h3 class="mb-4 text-xl font-semibold dark:text-white">Tax details</h3>
            <form class="space-y-4 md:space-y-6" method="POST"
            use:enhance={() => {
                formLoading5 = true;
                return async ({ update }) => {
                    await update({ reset: false });
                    formLoading5 = false;
                    triggerToast();
                };
            }}>
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="legal_name" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Legal Business Name</label>
                        <input type="text" name="legal_name" id="legal_name" bind:value={$organization.legal_name} class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required>
                    </div>
                    <div class="col-span-6">
                        <label for="tax_id" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">GSTIN</label>
                        <input type="text" name="tax_id" id="tax_id" bind:value={$organization.tax_id} class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required>
                    </div>
                </div>
                <Button type="submit" size="sm" class="absolute" style="margin-top: 0px; top: 24px; right: 24px;">
                    {#if formLoading5}
                        <Spinner size="5" color="white" />
                    {:else}
                        Save
                    {/if}
                </Button>
            </form>
        </div>
        {/if}

        <!--Company Basic Details-->
        <div class="relative col-span-12 p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 sm:p-6 dark:bg-gray-800">
            <h3 class="mb-4 text-xl font-semibold dark:text-white">Basic Details</h3>
            <form class="space-y-4 md:space-y-6" method="POST">
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label for="legal_name" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Terms</label>
                        <input type="text" name="legal_name" id="legal_name" bind:value={terms} class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required>
                    </div>
                    <div class="col-span-6">
                        <label for="tax_id" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Privacy Policy</label>
                        <input type="text" name="tax_id" id="tax_id" bind:value={privacy_policy} class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required>
                    </div>
                    <div class="col-span-6">
                        <label for="tax_id" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Contact</label>
                        <input type="text" name="tax_id" id="tax_id" bind:value={contact} class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required>
                    </div>
                    <div class="col-span-6">
                        <label for="tax_id" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">FAQ</label>
                        <input type="text" name="tax_id" id="tax_id" bind:value={faq} class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required>
                    </div>
                </div>
                <Button on:click={() => {handleBasicDetails()}} size="sm" class="absolute" style="margin-top: 0px; top: 24px; right: 24px;"> 
                    {#if basicDetailsFormLoading}
                    <Spinner size="5" color="white" />
                    {:else}
                        Save
                    {/if}
                </Button>
            </form>
        </div>
        <!--Company Basic Details-->
       <!--Social Media Links -->
        <div class="relative col-span-12 p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 sm:p-6 dark:bg-gray-800">
            <h3 class="mb-4 text-xl font-semibold dark:text-white">Social Media Links</h3>
            
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-5">
                        <label for="social-media" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Social Media</label>
                        <Button color="none" class="w-full justify-between flex-shrink-0 text-gray-900 bg-gray-100 border border-gray-300 dark:border-gray-700 dark:text-white hover:bg-gray-200 focus:ring-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800 bg-gray-50 border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 inline-flex">
                            {#if selectedSocialMedia}
                                <Chevron>{selectedSocialMedia}</Chevron>
                            {:else}
                                <Chevron>Select Social Media</Chevron>
                            {/if}
                        </Button>
                        <Dropdown ulClass="overflow-y-auto h-28 px-3 pb-3 text-sm" placement="top">
                            {#each socialMediaOptions as option}
                                <DropdownItem on:click={() => handleSelect(option)}>{option}</DropdownItem>
                            {/each}
                        </Dropdown>
                    </div>
                    <div class="col-span-6">
                        <label for="social-media-link" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Social Media Link</label>
                        <input type="url" name="social-media-link" bind:value={socialMediaLink} placeholder="Enter link" required class="w-full text-gray-900 bg-gray-100 border border-gray-300 dark:border-gray-700 dark:text-white hover:bg-gray-200 focus:ring-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800 bg-gray-50 border-gray-300 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" />
                    </div>
                    <div class="col-span-1">
                        <Button on:click={handleSocialMedia} type="submit" size="sm" class="absolute" style="margin-top: 70px; top: 24px; right: 24px;">
                            {#if socialMediaLinkFormLoading}
                                <Spinner size="5" color="white" />
                            {:else}
                                Add
                            {/if}
                        </Button>
                    </div>
                </div>
            

            <!-- Display Social Media Links -->
            <div class="relative col-span-12 p-4 bg-white sm:p-6  mt-6">
                {#if data?.orgData?.social_media_links.LinkedIn || 
                data?.orgData?.social_media_links.Instagram || 
                data?.orgData?.social_media_links.Facebook || 
                data?.orgData?.social_media_links.Twitter }
                <h3 class="mb-4 text-xl font-semibold dark:text-white">Current Social Media Links</h3>
               {/if}
                <ul class="space-y-2">
                    {#each Object.entries(data?.orgData?.social_media_links) as [platform, link]}
                       {#if link}
                       <li class="flex justify-between items-center">
                        <span class="text-sm font-medium text-gray-900 dark:text-white">{platform}:</span>
                        <span class="text-sm text-gray-900 dark:text-white">{link}</span>
                        <Button on:click={() => (customSocialMediaDelModal = true)} size="sm" color="red" class="ml-2">Delete</Button>
                        
                        <Modal bind:open={customSocialMediaDelModal} size="xs" autoclose>
                            <div class="text-center">
                              <ExclamationCircleOutline class="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200" />
                              <h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">Are you sure you want to delete this social media link?</h3>
                              <Button on:click={() => {handleSocialMediaDelete(platform)}} color="red" class="me-2">Yes, I'm sure</Button>
                              <Button color="alternative">No, cancel</Button>
                            </div>
                        </Modal>
                    </li>
                    {/if}
                    {/each}
                </ul>
            </div>
        </div>
        <!--Social Media Links -->

        <!-- <div class="relative col-span-12 p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 sm:p-6 dark:bg-gray-800">
            <h3 class="mb-4 text-xl font-semibold dark:text-white">Custom Domain</h3>
            
            <ol class="flex items-center w-full text-sm font-medium text-center text-gray-500 dark:text-gray-400 sm:text-base">
                <li class="flex md:w-full items-center text-blue-600 dark:text-blue-500 sm:after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-200 after:border-1 after:hidden sm:after:inline-block after:mx-6 xl:after:mx-10 dark:after:border-gray-700">
                    <span class="flex items-center after:content-['/'] sm:after:hidden after:mx-2 after:text-gray-200 dark:after:text-gray-500">
                        <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4 me-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
                        </svg>
                        Domain`s <span class="hidden sm:inline-flex sm:ms-2">Name</span>
                    </span>
                </li>
                <li class="flex md:w-full items-center after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-200 after:border-1 after:hidden sm:after:inline-block after:mx-6 xl:after:mx-10 dark:after:border-gray-700">
                    <span class="flex items-center after:content-['/'] sm:after:hidden after:mx-2 after:text-gray-200 dark:after:text-gray-500">
                        <span class="me-2">2</span>
                        Domain`s <span class="hidden sm:inline-flex sm:ms-2">Ownership</span>
                    </span>
                </li>
                <li class="flex items-center">
                    <span class="me-2">3</span>
                    CNAME <span class="hidden sm:inline-flex sm:ms-2">Validation</span>
                </li>
            </ol>
        </div> -->
        <!-- <div class="relative col-span-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 sm:p-6 dark:bg-gray-800">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-semibold dark:text-white">{steps[currentStep].title}</h3>
                {#if currentStep == 2}
                <span class="bg-green-100 text-green-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300">Step Final</span>
                {:else}
                    <span class="bg-blue-100 text-blue-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">Step {currentStep + 1}</span>
                {/if}
            
            </div>
            
            <p style="font-weight:500" class="mb-4">{steps[currentStep].content}</p>
           
            {#if currentStep === 0}
                <div>
                    <label for="host_name" class="block mb-2 text-sm text-sm text-gray-900 dark:text-white">Custom Domain</label>
                    <input type="text" id="host_name" bind:value={hostName} class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="credentials.company.com" required />
                </div>
            {:else if currentStep === 1}
            second
            {:else if currentStep === 2}
            final
            {/if}
            <div class="flex justify-between mt-4">
                {#if currentStep > 0}
                    <button class="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline" on:click={prevStep}>Back</button>
                {/if}
                {#if currentStep < steps.length - 1}
                    <button class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline" on:click={nextStep}>Next</button>
                {:else}
                    <button class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline" on:click={handleCreateCustomDomain}>Save</button>
                {/if}
            </div>
        </div> -->
        <div class="relative col-span-12 p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 sm:p-6 dark:bg-gray-800">
            <h3 class="mb-4 text-xl font-semibold dark:text-white">WhiteLabel</h3>

            <!-- <div class="mb-9">
                <h3 class="mb-4 text-xl font-medium dark:text-white">Links</h3>
                <form class="space-y-4 md:space-y-6" method="POST"
                use:enhance={() => {
                    formLoadingLinks = true;
                    return async ({ update }) => {
                        await update({ reset: false });
                        formLoadingLinks = false;
                        triggerToast();
                    };
                }}>
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-6">
                            <label for="links-contact" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Contact</label>
                            <input type="text" name="links-contact" bind:value={$organization.name} class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                        </div>
                    </div>
                    <Button type="submit" size="sm" class="absolute" style="margin-top: 0px; top: 24px; right: 24px;">
                        {#if formLoadingLinks}
                            <Spinner size="5" color="white" />
                        {:else}
                            Save
                        {/if}
                    </Button>
                </form>
            </div> -->
            
            <div class="gap-5">
                <div class="custom-domain bg-white dark:border-gray-700 dark:bg-gray-800">
                    <div class="mb-4 flex justify-between items-center">
                        <p class="dark:text-white" style="font-weight:500">Custom Domain</p>
                        {#if isDomainLoading }
                        <Spinner />
                        {:else}
                        {#if hostStatus == -1} 
                        <div class="flex">
                            <Badge color="red">Pending Verification</Badge>
                            
                            <Button size="xs" color="blue" class="ms-3" on:click={() => {handleCustomDomain('verify')}}>Verify</Button>
                            <Button size="xs" color="blue" class="ms-3" on:click={() => (customDomainDelModal = true)}>Delete</Button>
                            <!-- <div class="ml-2 mr-2 px-0 py-0" on:click={() => (customDomainDelModal = true)}>
                                <Badge color="dark" class="w-full h-full" onmouseover="this.style.cursor='pointer';">
                                    <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"/>
                                    </svg>
                                </Badge>
                            </div> -->
                            <!-- <Tooltip>Check verification status</Tooltip> -->
                        </div>
                        {:else if hostStatus == 1}
                        <div class="flex">
                            <Badge color="green">Verified</Badge>
                            <Button size="xs" color="blue" class="ms-3" on:click={() => (customDomainDelModal = true)}>Delete</Button>
                            <!-- <div class="ml-2 px-0 py-0" on:click={() => (customDomainDelModal = true)}>
                                <Badge color="dark" class="w-full h-full" onmouseover="this.style.cursor='pointer';">
                                    <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"/>
                                    </svg>
                                </Badge>
                            </div> -->
                        </div>
                        {/if}
                        {/if}
                        <Modal bind:open={customDomainDelModal} size="xs" autoclose>
                            <div class="text-center">
                              <ExclamationCircleOutline class="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200" />
                              <h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">Are you sure you want to delete this domain?</h3>
                              <Button on:click={() => {handleCustomDomain('delete')}} color="red" class="me-2">Yes, I'm sure</Button>
                              <Button color="alternative">No, cancel</Button>
                            </div>
                        </Modal>
                    </div>
                    <div class="relative flex items-center">
                        <input type="text" id="host_name" disabled={hostStatus==-1 || hostStatus==1} bind:value={hostName} class="block w-full p-3 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="verify.your-domain.com" required />
                        <button on:click={handleCustomDomain} disabled={hostStatus==-1 || hostStatus==1} type="submit" class="text-white absolute text-xs end-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Add Domain</button>
                    </div>
                    {#if hostStatus == -1}
                    <table class="mt-4 w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                        <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" class="px-6 py-3">
                                    Type
                                </th>
                                <th scope="col" class="px-6 py-3">
                                    Hostname
                                </th>
                                <th scope="col" class="px-6 py-3">
                                    Target
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                    CNAME
                                </th>
                                <td class="px-6 py-4">
                                    {hostName}
                                </td>
                                <td class="px-6 py-4">
                                    verify.netcredential.com
                                </td>
                            </tr>
                            <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                    CNAME
                                </th>
                                <td class="px-6 py-4">
                                    _acme-challenge.{hostName}
                                </td>
                                <td class="px-6 py-4">
                                    {hostName}.0ae78b20de409387.dcv.cloudflare.com
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    {/if}
                    
                </div>
                <hr class="my-5"/>
                <div class="custom-email bg-white dark:border-gray-700 dark:bg-gray-800">
                    <div class="mb-4 flex justify-between items-center">
                        <p class="dark:text-white" style="font-weight:500">Custom Email Domain</p>
                        {#if isEmailLoading}
                        <Spinner />
                        {:else}
                        {#if customEmailStatus == -1}
                            <div class="flex">
                                <Badge color="red">Pending Verification</Badge>
                                <!-- <div class="ml-2 px-0 py-0 mr-2" on:click={() => (customEmailDelModal = true)}>
                                    <Badge color="dark" class="w-full h-full" onmouseover="this.style.cursor='pointer';">
                                        <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"/>
                                        </svg>
                                    </Badge>
                                </div> -->
                                <Button size="xs" color="blue" class="ms-3" on:click={() => {handleCustomEmail('verify')}}>Verify</Button>
                                <Button size="xs" color="blue" class="ms-3" on:click={() => (customEmailDelModal = true)}>Delete</Button>
                            <!-- <Tooltip>Check verification status</Tooltip> -->
                            </div> 
                        {:else if customEmailStatus == 1}
                        <div class="flex">
                            <Badge color="green">Verified</Badge>
                            <Button size="xs" color="blue" class="ms-3" on:click={() => (customEmailDelModal = true)}>Delete</Button>
                            <!-- <div class="ml-2 px-0 py-0" on:click={() => (customEmailDelModal = true)}>
                                <Badge color="dark" class="w-full h-full" onmouseover="this.style.cursor='pointer';">
                                    <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"/>
                                    </svg>
                                </Badge>
                            </div> -->
                        </div>
                        {/if}
                        {/if}
                        <Modal bind:open={customEmailDelModal} size="xs" autoclose>
                            <div class="text-center">
                              <ExclamationCircleOutline class="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200" />
                              <h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">Are you sure you want to delete this domain?</h3>
                              <Button on:click={() => {handleCustomEmail('delete')}} color="red" class="me-2">Yes, I'm sure</Button>
                              <Button color="alternative">No, cancel</Button>
                            </div>
                        </Modal>
                    </div>
                    <div class="relative flex items-center">
                        <input type="text" id="domain_name" disabled={customEmailStatus==-1 || customEmailStatus==1} bind:value={domainName} class="block w-full p-3 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="credentials.your-domain.com" required />
                        <button on:click={handleCustomEmail} disabled={customEmailStatus==-1 || customEmailStatus==1} type="submit" class="text-white absolute text-xs end-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Add Email Domain</button>
                    </div>
                    {#if customEmailStatus==-1}
                    <table class="mt-4 w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                        <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" class="px-6 py-3">
                                    Type
                                </th>
                                <th scope="col" class="px-6 py-3">
                                    Hostname
                                </th>
                                <th scope="col" class="px-6 py-3">
                                    Target
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                    SPF (TXT)
                                </th>
                                <td class="px-6 py-4">
                                    {domainName}
                                </td>
                                <td class="px-6 py-4">
                                    v=spf1 include:mailgun.org ~all
                                </td>
                            </tr>
                            <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                    DKIM (TXT)
                                </th>
                                <td class="px-6 py-4">
                                    {customEmailDKIMHost}
                                </td>
                                <td class="px-6 py-4" style="word-break: break-word;">
                                    {customEmailDKIMValue}
                                </td>
                            </tr>
                            <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                    MX (Priority: 10)
                                </th>
                                <td class="px-6 py-4">
                                    {domainName}
                                </td>
                                <td class="px-6 py-4">
                                    mxa.mailgun.org
                                </td>
                            </tr>
                            <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                    MX (Priority: 10)
                                </th>
                                <td class="px-6 py-4">
                                    {domainName}
                                </td>
                                <td class="px-6 py-4">
                                    mxb.mailgun.org
                                </td>
                            </tr>
                            <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                    CNAME
                                </th>
                                <td class="px-6 py-4">
                                    email.{domainName}
                                </td>
                                <td class="px-6 py-4">
                                    mailgun.org
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    {/if}
                </div>
            </div>

            <!-- <div class="container mx-auto">
                <div class="flex flex-wrap gap-6 mb-8">
                  {#if customHostId}
                    <div class="mydomain flex-1 min-w-0 p-4 bg-slate-100 rounded-lg shadow-xs dark:bg-gray-800 max-w-md">
                      <h4 class="mb-4 font-semibold text-gray-800 dark:text-gray-300">Custom Domain</h4>
                      <p class="text-gray-600 dark:text-gray-400"><strong>Hostname:</strong> {hostName}</p>
                      <p class="text-gray-600 dark:text-gray-400"><strong>Status:</strong> {hostStatus === -1 ? 'pending' : (hostStatus === 1 ? 'verified' : 'unknown')}</p>
                      <p class="text-gray-600 dark:text-gray-400"><strong>ID:</strong> {customHostId}</p>
                      
                    </div>
                  {/if}
                  {#if customEmailId}
                    <div class="{customHostId ? 'myemail1' : 'myemail2'} overflow-x-auto flex-1 min-w-0 p-4 bg-slate-100 rounded-lg shadow-xs dark:bg-gray-800 max-w-md sticky top-0">
                      <h4 class="mb-4 font-semibold text-gray-800 dark:text-gray-300">Custom Email</h4>
                      <p class="text-gray-600 dark:text-gray-400"><strong>Email Name:</strong> {domainName}</p>
                      <p class="text-gray-600 dark:text-gray-400"><strong>Status:</strong> {customEmailStatus === -1 ? 'unverified' : (customEmailStatus === 1 ? 'verified' : 'unknown')}</p>
                      <p class="text-gray-600 dark:text-gray-400"><strong>ID:</strong> {customEmailId}</p>
                     
                    </div>
                  {/if}
                </div>
              </div> -->
              
              
        </div>
        <!-- <div class="col-span-12 p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 sm:p-6 dark:bg-gray-800">
            <h3 class="mb-4 text-xl font-semibold dark:text-white">Preference</h3>
            <form class="space-y-4 md:space-y-6" action="#">
                <div>
                    <label for="settings-language" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Language</label>
                    <select id="settings-language" name="countries" class="bg-gray-50 border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500">
                        <option>English (US)</option>
                        <option>Italiano</option>
                        <option>Français (France)</option>
                        <option>正體字</option>
                        <option>Español (España)</option>
                        <option>Deutsch</option>
                        <option>Português (Brasil)</option>
                    </select>
                </div>
                <div>
                    <label for="settings-timezone" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Time Zone</label>
                    <select id="settings-timezone" name="countries" class="bg-gray-50 border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500">
                        <option>GMT+0 Greenwich Mean Time (GMT)</option>
                        <option>GMT+1 Central European Time (CET)</option>
                        <option>GMT+2 Eastern European Time (EET)</option>
                        <option>GMT+3 Moscow Time (MSK)</option>
                        <option>GMT+5 Pakistan Standard Time (PKT)</option>
                        <option>GMT+8 China Standard Time (CST)</option>
                        <option>GMT+10 Eastern Australia Standard Time (AEST)</option>
                    </select>
                </div>
                <div>
                    <label for="settings-timezone" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Currency</label>
                    <select id="settings-timezone" name="countries" class="bg-gray-50 border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500">
                        <option>INR</option>
                        <option>USD</option>
                        <option>GBP</option>
                    </select>
                </div>
            </form>
        </div> -->
    </div>

   
</main>

{#if toastStatus == 200 || toastStatus == 201}
    <Toast transition={fly} params="{{x: 200}}" color="green" position="top-right" open={toast} class="fixed">
        <svelte:fragment slot="icon">
            <i class="icon-check"></i>        
        </svelte:fragment>
        {toastMsg}
    </Toast>
{:else}
    <Toast color="red" transition={fly} params="{{x: 200}}" position="top-right" open={toast} class="fixed">
        <svelte:fragment slot="icon">
        <CloseCircleSolid class="w-5 h-5" />
        <span class="sr-only">Error icon</span>
        </svelte:fragment>
        {toastMsg}
    </Toast>
{/if}

<style>
   .myemail1 {
    position: sticky;
    top: 0; /* Adjust this value based on where you want the sticky element to start */
    margin-left: 150px;
}
.myemail2 {
    position: sticky;
    top: 0; /* Adjust this value based on where you want the sticky element to start */
    margin-left: 650px;
}
</style>