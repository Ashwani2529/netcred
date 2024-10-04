<script>
  import { base } from "$app/paths";
  import { chart } from "svelte-apexcharts";
  import { Card, Input } from "flowbite-svelte";
  import { easepick } from "@easepick/core";
  import { RangePlugin } from "@easepick/range-plugin";
  import { LockPlugin } from "@easepick/lock-plugin";
  import { onMount } from "svelte";
  import { enhance } from "$app/forms";

  export let data;
  let selectedGroup = "all";
  let picker;

  onMount(() => {
    if (data.groups.length) {
      let endDate = new Date();
      let startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      picker = new easepick.create({
        element: document.getElementById("datepicker"),
        format: "DD-MM-YYYY",
        zIndex: 10,
        css: [
          "https://cdn.jsdelivr.net/npm/@easepick/core@1.2.1/dist/index.css",
          "https://cdn.jsdelivr.net/npm/@easepick/range-plugin@1.2.1/dist/index.css",
          "https://cdn.jsdelivr.net/npm/@easepick/lock-plugin@1.2.1/dist/index.css",
        ],
        plugins: [RangePlugin, LockPlugin],
        LockPlugin: {
          maxDate: new Date(),
          maxDays: 7,
        },
        setup(picker) {
          picker.on("select", (e) => {
            updateStats();
          });
        },
      });

      picker.setStartDate(startDate);
      picker.setEndDate(endDate);
    }
  });

  let eventCounts = {};
  function getEventCounts(event) {
    eventCounts = event;
  }
  getEventCounts(data.eventCounts);

  let funnel = {};
  function generateFunnelChart(eventCounts) {
    funnel = {
      series: [
        {
          data: [
            {
              x: "Credentials Issued",
              y: [
                "credential-issued" in eventCounts
                  ? eventCounts["credential-issued"] / 2
                  : 0.025,
                "credential-issued" in eventCounts
                  ? -1 * (eventCounts["credential-issued"] / 2)
                  : -0.025,
              ],
            },
            {
              x: "Credentials Viewed",
              y: [
                "credential-viewed" in eventCounts
                  ? eventCounts["credential-viewed"] / 2
                  : 0.025,
                "credential-viewed" in eventCounts
                  ? -1 * (eventCounts["credential-viewed"] / 2)
                  : -0.025,
              ],
            },
            {
              x: "Credentials Engaged - Start",
              y: [
                "credential-engaged" in eventCounts
                  ? eventCounts["credential-engaged"] / 2
                  : 0.025,
                "credential-engaged" in eventCounts
                  ? -1 * (eventCounts["credential-engaged"] / 2)
                  : -0.025,
              ],
            },
            {
              x: "Credentials Engaged - End",
              y: [
                "credential-engaged" in eventCounts
                  ? eventCounts["credential-engaged"] / 2
                  : 0.025,
                "credential-engaged" in eventCounts
                  ? -1 * (eventCounts["credential-engaged"] / 2)
                  : -0.025,
              ],
            },
          ],
        },
      ],
      chart: {
        height: 250,
        type: "rangeArea",
        toolbar: {
          show: false,
        },
      },
      stroke: {
        curve: "smooth",
      },
      yaxis: {
        min:
          "credential-issued" in eventCounts
            ? -1 * (eventCounts["credential-issued"] / 2 + 5)
            : 0,
        max:
          "credential-issued" in eventCounts
            ? eventCounts["credential-issued"] / 2 + 5
            : 0,
        show: false, // Hide y-axis
      },
      xaxis: {
        labels: {
          show: false, // Hide x-axis labels
        },
        axisBorder: {
          show: false,
        },
      },
      dataLabels: {
        enabled: false, // Hide data labels
      },
      markers: {
        show: false, // Hide data point markers
      },
      tooltip: {
        enabled: false, // Hide tooltips
      },
      legend: {
        show: false, // Hide legend
      },
      grid: {
        xaxis: {
          lines: {
            show: true,
          },
        },
        yaxis: {
          lines: {
            show: false,
          },
        },
      },
    };
  }
  generateFunnelChart(data.eventCounts);

  const eventTypes = [
    "credential-issued",
    "credential-viewed",
    "credential-engaged",
  ];

  let activity = {};
  function generateActivityChart(chartData) {
    const extractedData = eventTypes.map((eventType) =>
      Object.values(chartData).map((eventData) => Number(eventData[eventType])),
    );

    activity = {
      chart: {
        type: "bar",
        height: 300,
        toolbar: {
          show: false,
        },
      },
      series: [
        {
          name: "Credentials Issued",
          data: extractedData[0],
        },
        {
          name: "Credentials Viewed",
          data: extractedData[1],
        },
        {
          name: "Credentials Engaged",
          data: extractedData[2],
        },
      ],
      xaxis: {
        categories: Object.keys(chartData),
      },
    };
  }
  generateActivityChart(data.chartData);

  async function updateStats() {
    let response = await fetch("/api/fetch-stats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        group: selectedGroup,
        startDate: picker.getStartDate(),
        endDate: picker.getEndDate(),
      }),
    });

    const result = await response.json();
    generateFunnelChart(result.eventCounts);
    generateActivityChart(result.chartData);
    getEventCounts(result.eventCounts);
  }
</script>

<main class="p-4 md:ml-60 h-auto min-h-screen">
  {#if !data.groups.length}
    <div
      class="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden"
    >
      <div
        class="flex flex-col items-center justify-between gap-2 p-4 border-b border-gray-200 dark:border-gray-700"
      >
        <img src="{base}/dashboard.png" alt="Create Group" class="w-80" />
        <div class="text-center">
          <h2
            class="mb-3 text-2xl font-bold leading-tight text-gray-900 dark:text-white"
          >
            Welcome
          </h2>
          <p
            class="mb-5 text-base font-normal text-gray-500 dark:text-gray-400"
          >
            Complete the steps below to view the analytics
          </p>
        </div>
        <div class="mb-4">
          <div class="flex align-center gap-4">
            <a href="/designs" class="w-72">
              <div
                class="{data.designs.length?'text-green-700 border-green-300 bg-green-50 dark:bg-gray-800 dark:border-green-800 dark:text-green-400':'text-blue-700 bg-blue-100 border-blue-300 dark:bg-gray-800 dark:border-blue-800 dark:text-blue-400'} w-full p-4  border rounded-lg"
                role="alert"
              >
                <div class="flex items-center justify-between">
                  <h3 class="font-medium">1. Create design</h3>
                  {#if data.designs.length}
                  <svg
                    class="w-4 h-4"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 16 12"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M1 5.917 5.724 10.5 15 1.5"
                    />
                  </svg>
                  {:else}
                  <svg
                    class="rtl:rotate-180 w-4 h-4"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 10"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M1 5h12m0 0L9 1m4 4L9 9"
                    />
                  </svg>
                  {/if}
                </div>
              </div>
            </a>
            <a href="/groups/create" class="w-72">
              <div
                class="w-full p-4 text-blue-700 bg-blue-100 border border-blue-300 rounded-lg dark:bg-gray-800 dark:border-blue-800 dark:text-blue-400"
                role="alert"
              >
                <div class="flex items-center justify-between">
                  <h3 class="font-medium">2. Create group</h3>
                  <svg
                    class="rtl:rotate-180 w-4 h-4"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 10"
                  >
                    <path
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M1 5h12m0 0L9 1m4 4L9 9"
                    />
                  </svg>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div
      class="bg-white border border-gray-200 rounded-lg shadow-sm 2xl:col-span-2 dark:border-gray-700 dark:bg-gray-800 py-2 px-4"
    >
      <div id="filter" class="grid grid-cols-3 gap-4 items-center">
        <div class="dark:text-white">Select filter</div>
        <select
          name="group"
          bind:value={selectedGroup}
          on:change={updateStats}
          id="groups"
          class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        >
          <option value="all">All Groups</option>
          {#each data.groups as group}
            <option value={group.id}>{group.name}</option>
          {/each}
        </select>
        <Input type="text" id="datepicker" on:change={updateStats}></Input>
      </div>
    </div>

    <div
      class="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm 2xl:col-span-2 dark:border-gray-700 sm:p-6 dark:bg-gray-800"
    >
      <div class="grid grid-cols-3 gap-6 px-3">
        <div class="max-w-full">
          <p
            class="font-normal text-gray-700 dark:text-gray-400 leading-tight mb-2"
          >
            Credentials Issued
          </p>
          <h5
            class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
          >
            {#if "credential-issued" in eventCounts}
              {eventCounts["credential-issued"]}
            {:else}
              0
            {/if}
          </h5>
        </div>
        <div class="max-w-full">
          <p
            class="font-normal text-gray-700 dark:text-gray-400 leading-tight mb-2"
          >
            Credentials Viewed (Unique)
          </p>
          <h5
            class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
          >
            {#if "credential-viewed" in eventCounts}
              {eventCounts["credential-viewed"]}
            {:else}
              0
            {/if}
          </h5>
        </div>
        <div class="max-w-full">
          <p
            class="font-normal text-gray-700 dark:text-gray-400 leading-tight mb-2"
          >
            Credentials Engagement (Unique)
          </p>
          <h5
            class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
          >
            {#if "credential-engaged" in eventCounts}
              {eventCounts["credential-engaged"]}
            {:else}
              0
            {/if}
          </h5>
        </div>
      </div>
      <div class="-my-4" use:chart={funnel} />
    </div>

    <div
      class="p-4 mt-4 bg-white border border-gray-200 rounded-lg shadow-sm 2xl:col-span-2 dark:border-gray-700 sm:p-6 dark:bg-gray-800"
    >
      <div class="flex items-center justify-between mb-4">
        <div class="flex-shrink-0">
          <span
            class="text-xl font-bold leading-none text-gray-900 sm:text-2xl dark:text-white"
            >Activity Chart</span
          >
        </div>
      </div>
      <div use:chart={activity} />
    </div>
  {/if}
</main>
