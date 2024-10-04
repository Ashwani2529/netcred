<script>
  import EmailBlocks from "./EmailBlocks.svelte";
  import {
    Input,
    Label,
    Select,
    Toggle,
    Button,
    Modal,
    Spinner,
    Toast,
    Dropdown,
    DropdownItem,
  } from "flowbite-svelte";
  import { fly } from "svelte/transition";
  import { enhance } from "$app/forms";
  import { dndzone } from "svelte-dnd-action";
  import { flip } from "svelte/animate";
  import { goto } from "$app/navigation";
  import {
    generateRandomID,
    capitalizeFirstLetter,
    po,
    cloneDeep,
    moveItem,
  } from "$lib/helpers.js";
  import { fonts, supportsBold, getApiUrl } from "$lib/fonts.js";
  import { onMount } from "svelte";
  import { customAlphabet } from "nanoid";

  export let data;

  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  const generateDesignId = customAlphabet(alphabet, 12);
  let designId = generateDesignId();

  let formModal = false;
  let linkText = "";
  let links = [];
  let linkUrl = "";
  let dropdownFont = false;
  let defaultModal = false;
  let toastMessage;
  let toastType = null;

  let designName = "My Email Design";

  let fileInput;
  let mediaInput;
  let loading = false;
  let formLoading1 = false;
  let formLoading2 = false;

  let _formBackground;
  let _formImage;

  let editor;
  let toolbar;
  let main_border_radius = 0;
  let main_border_width = 0;
  let main_border_color = "#DDDDDD";
  let main_content_txt_color = "#000000";
  let link_color = "#0000FF";

  function handleChangeMainTextColor() {
    item_id = "lquu1vu6r2ulg141zlh";
    updateElementStyle("main-content-text", main_content_txt_color);
  }
  function handleDndConsider(e) {
    items = e.detail.items;
  }
  function handleDndFinalize(e) {
    items = e.detail.items;
  }

  function getItemIndexById(id) {
    const item = itemsMap.get(id);
    return items.indexOf(item);
  }

  function onDocChange() {
    canvas.width = po[canvas.paper + "-" + canvas.orientation].containerWidth;
    canvas.height = po[canvas.paper + "-" + canvas.orientation].containerHeight;
  }

  let canvas = {
    width: 700,
    height: 620,
    paper: "A4",
    orientation: "L",
    // background: "https://bucket-netcred-media.s3.ap-south-1.amazonaws.com/9pZHtrEu7Zg2BufoxUCD8h8QLgv1/VNavSjHg0RZ1BqvstsvOYB1lDbaX.png" // Default template
  };

  let items = [
    {
      id: "email-header-title",

      pos: {
        top: "5%",
      },

      prop: {
        bold: true,

        font: "Cinzel",

        size: 36,

        color: "black",

        italic: false,

        textAlign: "center",

        underline: false,

        uppercase: true,
      },

      size: {
        width: "97%",

        height: "10%",
      },

      type: "text",

      content: "Email Title",

      editMode: true,
    },

    {
      id: "email-header-subtitle",

      pos: {
        top: "15%",
      },

      prop: {
        bold: true,

        font: "Baskervville",

        size: 24,

        color: "#284f9c",

        italic: true,

        textAlign: "center",

        underline: false,

        uppercase: false,
      },

      size: {
        width: "97%",

        height: "8%",
      },

      type: "text",

      content: "Email Subtitle or Greeting",

      editMode: true,
    },

    {
      id: "email-body-intro",

      pos: {
        top: "30%"
      },

      prop: {
        bold: false,

        font: "Baskervville",

        size: 18,

        color: "#333333",

        italic: false,

        textAlign: "left",

        underline: false,

        uppercase: false,
      },

      size: {
        width: "97%",

        height: "20%",
      },

      type: "text",

      content: "Dear [recipient.name],\n\nWe are pleased to inform you...",

      editMode: true,
    },

    {
      id: "email-body-content",

      pos: {
        top: "50%",
      },

      prop: {
        bold: false,

        font: "Baskervville",

        size: 18,

        color: "#333333",

        italic: false,

        textAlign: "left",

        underline: false,

        uppercase: false,
      },

      size: {
        width: "97%",

        height: "25%",
      },

      type: "text",

      content: "This email is to confirm your participation in the event...",

      editMode: true,
    },

    {
      id: "email-footer-signature",

      pos: {
        top: "85%",
      },

      prop: {
        bold: true,

        font: "Cinzel",

        size: 18,

        color: "#284f9c",

        italic: true,

        textAlign: "left",

        underline: false,

        uppercase: false,
      },

      size: {
        width: "30%",

        height: "8%",
      },

      type: "text",

      content: "Best regards,\n[Sender Name]",

      editMode: true,
    },

    {
      id: "email-footer-company",

      pos: {
        top: "93%"
      },

      prop: {
        bold: false,

        font: "Baskervville",

        size: 14,

        color: "#333333",

        italic: false,

        textAlign: "center",

        underline: false,

        uppercase: false,
      },

      size: {
        width: "97%",

        height: "5%",
      },

      type: "text",

      content: "[Company Name] | [Company Address] | [Company Contact Info]",

      editMode: true,
    },
  ];

  let attributes = {
    "[recipient.name]": true, // Default template
    "[credential.id]": true, // Default template
    "[credential.expiry]": false,
    "[credential.issued]": false,
    "[issuer.name]": false,
    "[group.name]": false,
  };

  if (data.design) {
    designId = data.design.id;
    canvas = data.design.canvas;
    items = data.design.items;
    designName = data.design.name;
    data.design.attributes.forEach((attr) => {
      attributes[attr] = true;
    });
  }

  onMount(async () => {
    let fonts = items
      .filter((item) => item.prop && item.prop.font)
      .map((item) => item.prop.font);
    fonts.forEach((font) => {
      addFont(font);
    });

    document.addEventListener("click", (event) => {
      if (
        event.target.tagName === "A" &&
        event.target.closest(".content-editable")
      ) {
        event.preventDefault();
        window.open(event.target.href, "_blank");
      }
    });
  });

  function addFont(font) {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=" + getApiUrl(font);
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }

  let activeId = null;
  let activeElement = null;
  let customAttribute = null;
  let showVerticalGridLine = false;
  let showHorizontalGridLine = false;
  let item_id = null;
  let innerHeaderTextColor = "#96E8C9";
  let innerFooterBackgroundColor = "#000000";
  let innerFooterTextColor = "#96E8C9";
  let background_color = "#F1F1F1";
  let innerHeaderBackgroundColor = "#000000";
  let main_content_background_color = "#ffffff";
  let button_color = "#284f9c";

  let activeTab = "foreground";

  function enableEditMode(event) {
    const index = getItemIndexById(event.target.parentElement.id);
    if (index !== -1) {
      items[index].editMode = true;
    }
    for (let i = 0; i < items.length; i++) {
      if (i !== index) {
        items[i].editMode = false;
      }
    }
    items = [...items];
  }

  //   function handleDrop(event) {
  //   items = event.detail.items;
  // }

  function updateActiveElementContent(eveventent) {
    const index = getItemIndexById(activeElement.id);
    if (index !== -1) {
      const span = event.target.closest("span");
      items[index].content = span.innerHTML;
      items = [...items];
    }
  }

  function elementMoving(event) {
    if (event.detail) {
      activeElement.editMode = false;
      let width = document.getElementById(activeElement.id).clientWidth;
      let height = document.getElementById(activeElement.id).clientHeight;
      let centerX = activeElement.pos.left + width / 2;
      let centerY = activeElement.pos.top + height / 2;
      showVerticalGridLine = Math.abs(parseFloat(centerX) - canvas.width / 2);
      showHorizontalGridLine = Math.abs(
        parseFloat(centerY) - canvas.height / 2
      );
    } else {
      showVerticalGridLine = false;
      showHorizontalGridLine = false;
    }
  }

  function onMouseUp(event) {
    if (!(editor.contains(event.target) || toolbar.contains(event.target))) {
      activeId = null;
      activeElement = null;
    }
  }

  function setActive(event) {
    activeId = event.detail;
    activeElement = items.find((el) => el.id === activeId);
  }

  function addCustomAttribute() {
    attributes[
      "[custom." + customAttribute.toLowerCase().replace(/\s+/g, "_") + "]"
    ] = false;
    customAttribute = null;
    defaultModal = false;
  }

  function updateElementStyle(type, action) {
    const index =
      activeElement?.id !== null && activeElement?.id !== undefined
        ? getItemIndexById(activeElement.id)
        : getItemIndexById(item_id);
    if (index === -1) return;
    let prop = items[index].prop;
    switch (type) {
      case "fontSize":
        prop.size = Math.max(prop.size + 1 * action, 1);
        break;
      case "fontSizeChange":
        prop.size = Math.max(activeElement.prop.size, 1);
        break;
      case "font":
        prop.font = action;
        const link = document.createElement("link");
        link.href =
          "https://fonts.googleapis.com/css2?family=" + getApiUrl(action);
        link.rel = "stylesheet";
        document.head.appendChild(link);
        dropdownFont = false;
      case "fontColor":
        prop[type] = activeElement.prop[type];
        break;
      case "backgroundColor":
        prop.backgroundColor = activeElement.prop.backgroundColor;
        break;
      case "alignment":
        prop.textAlign = action;
      case "type":
        prop[type] = action;
        break;
      case "style":
        prop[action] = !prop[action];
        break;
      case "qrColor":
        prop.background = "#FFFFFF00";
        prop.foreground = activeElement.prop.foreground;
        break;
      case "inner-header":
        prop.backgroundColor = action;
        break;
      case "inner-header-text":
        prop.color = action;
        break;
      case "inner-footer":
        prop.backgroundColor = action;
        break;
      case "inner-footer-text":
        prop.color = action;
        break;
      case "main-content-text":
        prop.color = action;
        break;
      case "main-content-text-font":
        prop.font = action;
        break;
      case "content-button-color":
        prop.color = action;
        break;
    }

    items[index] = { ...items[index], prop };
    activeElement = items[index];
  }

  function addElement(type, value) {
    let id = generateRandomID();
    let newItem = {
      id: id,
      content:
        type === "textfield"
          ? "Add some text"
          : type === "attribute"
            ? value
            : null,
      editMode: true,
      type: type === "line" ? value : type,
      size: { width: "97%", height: "auto" },
      pos: { left: "0%", top: `${items.length * 6}%` },
      prop: {
        size: 18,
        color: "#ffff",
        backgroundColor: "#000000",
        bold: false,
        italic: false,
        underline: false,
        textAlign: "center",
        font: "Roboto",
      },
    };

    switch (type) {
      case "attribute":
        attributes[value] = true;
        break;
      case "qr":
        newItem.size = { width: "15%", height: "20%" };
        newItem.prop = { background: "#FFFFFF00", foreground: "#000000" };
        break;
      case "line":
        if (value === "line-horizontal") {
          newItem.size.height = undefined;
        } else {
          newItem.size.width = undefined;
          newItem.size.height = "20%";
        }
        newItem.prop = { size: 2, color: "#000000", type: "solid" };
        break;
      case "line":
        if (value === "line-vertical") {
          newItem.size.height = undefined;
        } else {
          newItem.size.width = undefined;
          newItem.size.height = "20%";
        }
        newItem.prop = { size: 2, color: "#000000", type: "solid" };
        break;
      case "image":
        newItem.content = value.data.url;
        newItem.size = { width: "30%" };
        newItem.prop = {};
        mediaInput.value = "";
        break;
      case "inner-header":
        newItem.size.height = "10%";
        newItem.size.width = "100%";
        newItem.prop = {
          size: 25,
          color: innerHeaderTextColor,
          backgroundColor: innerHeaderBackgroundColor,
        };
        newItem.pos = { left: "0%", top: "0%" };
        newItem.content = "[email.subject]";
        newItem.editMode = true;
        break;
      case "inner-footer":
        newItem.size.height = "10%";
        newItem.size.width = "100%";
        newItem.prop = {
          size: 25,
          color: innerFooterTextColor,
          backgroundColor: innerFooterBackgroundColor,
        };
        newItem.pos = { left: "0%", top: "90%" };
        newItem.content = "[email.footer]";
        newItem.editMode = true;
        break;
      case "text":
        newItem.content = "text";
        newItem.size = { width: "97%", height: "auto" };
        newItem.editMode = true;
        newItem.prop = {
          size: 28,
          color: "black",
          bold: true,
          italic: false,
          underline: false,
          textAlign: "center",
          font: "Roboto",
        };
        break;
      case "_button":
        newItem.content = "Email Button";
        newItem.size = { width: "97%" };
        newItem.prop = { size: 40 };
        newItem.editMode = true;
        break;
      default:
        break;
    }
    // if(newItem.)
    if (
      newItem.type == "inner-header" ||
      newItem.type == "inner-footer" ||
      newItem.type == "text"
    ) {
      //assign the element's top position to 10% if it is below 10% upon inserting inner-header or text
      if (newItem.type == "text" || newItem.type === "inner-header") {
        //get the items that lie at top 10% and below
        let itemsBelow10 = items.filter(
          (item) => parseFloat(item.pos.top) <= 10
        );
        let x = newItem.type == "text" ? 10 : 11.5;

        //assign these elements top starting from top 11% snd rest with the dfference of 5% in top
        itemsBelow10.forEach((item) => {
          item.pos.top = `${x}%`;
          x += 6;
        });
        newItem.pos.top = "0%";
      } else {
        //get all the elements that lie at 90% top or above and reduce their top to 89%
        let itemsAbove90 = items.filter(
          (item) => parseFloat(item.pos.top) >= 90
        );
        let y = 85;
        itemsAbove90.forEach((item) => {
          item.pos.top = `${y}%`;
          y -= 6;
        });
        newItem.pos.top = "90%";
      }
    }
    items.push(newItem);
    setActive({
      detail: id,
    });
    item_id = id;
    items = [...items];
  }

  function deleteItem() {
    let itemId = null;
    if (activeId) {
      itemId = items.find((item) => item.id === activeId).id;
    } else {
      itemId = item_id;
    }

    if (activeElement.type == "attribute") {
      attributes[activeElement.content] = false;
    }
    const itemIndex = getItemIndexById(itemId);
    const itemType = items[itemIndex].type;
    if (itemType === "inner-header" || itemType === "inner-footer") {
      if (itemType === "inner-header") {
        innerHeaderChecked = false;
      } else {
        innerFooterChecked = false;
      }
    }
    items = items.filter((item) => item.id !== itemId);
    activeId = null;
    activeElement = null;
  }

  function duplicateItem() {
    const item = items.find((item) => item.id === activeId);
    let id = generateRandomID();
    let newElement = cloneDeep(item);
    newElement.id = id;
    newElement.pos = {
      left: parseFloat(item.pos.left.replace("%", "")) + 5 + "%",
      top: parseFloat(item.pos.top.replace("%", "")) + 5 + "%",
    };
    items.push(newElement);
    items = items;
    activeId = id;
    const index = items.findIndex((el) => el.id === activeId);
    activeElement = items[index];
  }

  function handleShortcut(event) {
    if (event.key === "Delete") {
      deleteItem();
    } else if (event.ctrlKey && event.key === "d") {
      event.preventDefault();
      if (activeElement.type != "attribute") {
        duplicateItem();
      }
    }
  }

  function handleBackground(event) {
    canvas.background = event.data.url;
    fileInput.value = "";
  }

  function verifyImage(button, event) {
    let file = event.files[0];
    const validExtensions = ["jpg", "jpeg", "png"];
    const extension = file.name.split(".").pop().toLowerCase();
    if (!validExtensions.includes(extension)) {
      toastMessage = "Invalid file type. Only JPG and PNG are allowed.";
      triggerToast();
      event.value = "";
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2 MB in bytes
    if (file.size > maxSize) {
      toastMessage = "File size exceeds 2 MB limit.";
      triggerToast();
      event.value = "";
      return;
    }
    button.click();
  }

  // Function to move an element in the list
  function moveElementIndex(action) {
    const index = getItemIndexById(activeElement.id);
    items = moveItem(items, index, index + 1 * action);
  }

  // $: console.log(activeId, activeElement);
  $: itemsMap = new Map(items.map((item) => [item.id, item]));

  async function createDesign() {
    loading = true;
    let response = await fetch("/api/create-design", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ designName, designId, canvas, items, attributes }),
    });
    loading = false;
    if (response.ok) {
      toastType = "success";
      toastMessage = `Design ${data.design ? "updated" : "created"} successfully!`;
      triggerToast();
      setTimeout(() => {
        goto("/designs");
      }, 2000);
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

  let selected_font = "sans-serif";

  let font_list = [
    { value: "arial", name: "Arial" },
    { value: "georgia", name: "Georgia" },
    { value: "monospace", name: "Monospace" },
    { value: "sans-serif", name: "Sans-serif" },
    { value: "times-new-roman", name: "Times New Roman" },
    { value: "verdana", name: "Verdana" },
  ];

  //   let outerFooterChecked = false;
  let innerFooterChecked = false;
  let innerHeaderChecked = false;
  // function handleInput(event) {
  //     let name = event.target.value;
  // }

  //   function handleClickOuterFooter(event) {
  //     outerFooterChecked = !outerFooterChecked;
  //     // setTimeout(() => event.target.checked = checked, 0);
  //   }

  //   function handleClickInnerFooter(event) {
  //     innerFooterChecked = !innerFooterChecked;
  //   }

  function handleClickInnerHeader(event) {
    innerHeaderChecked = !innerHeaderChecked;
    if (innerHeaderChecked == true) {
      addElement("inner-header", "");
    } else if (innerHeaderChecked == false) {
      let event = { detail: item_id };
      setActive(event);
      deleteItem();
    }
  }
  function handleClickInnerFooter(event) {
    innerFooterChecked = !innerFooterChecked;
    if (innerFooterChecked == true) {
      addElement("inner-footer", "");
    } else if (innerFooterChecked == false) {
      let event = { detail: item_id };
      setActive(event);
      deleteItem();
    }
  }

  function handleLinkClick(event) {
    const linkId = event.target.id;
    const link = links.find((link) => link.id === linkId);
    if (link) {
      window.open(link.url, "_blank");
    }
  }

  function changeAllLinksColor() {
    //change color of all linkElements of links array
    links.forEach((link) => {
      const linkElement = document.getElementById(link.id);
      if (linkElement) {
        linkElement.style.color = link_color;
      }
    });
  }

  function linkInserter(event) {
    event.preventDefault();
    // Create a div element with the provided text and URL
    // Create a link element with the provided text and URL
    if (linkText && linkUrl) {
      const linkId = `link-${Date.now()}`;
      const linkElement = `<a id="${linkId}" href="${linkUrl}" target="_blank" style="color: ${link_color}; cursor: pointer;">${linkText}</a>&nbsp;`;

      // Add this linkElement in the activeElement's content
      const index = getItemIndexById(activeElement.id);
      if (index !== -1) {
        items[index].content += linkElement;
        links.push({ id: linkId, url: linkUrl });
        items = [...items];
      }
      // Close the modal
      formModal = false;
      linkUrl = "";
      linkText = "";
    }
  }

  //   let outerHeader = false;
  //   function handleOuterHeader(event) {
  //     outerHeader = !outerHeader;
  //   }

  function handleChangeInnerHeadBGColor() {
    updateElementStyle("inner-header", innerHeaderBackgroundColor);
  }

  function handleChangeInnerHeaderTextColor() {
    updateElementStyle("inner-header-text", innerHeaderTextColor);
  }
  function handleChangeInnerFooterBGColor() {
    updateElementStyle("inner-footer", innerFooterBackgroundColor);
  }
  function handleChangeInnerFooterTextColor() {
    updateElementStyle("inner-footer-text", innerFooterTextColor);
  }
  function handleChangeFont() {
    item_id = "lquu1vu6r2ulg141zlh";
    updateElementStyle("main-content-text-font", selected_font);
  }

  function handleChangeButtonColor() {
    item_id = "lquu663ec3catu5su49";
    updateElementStyle("content-button-color", button_color);
  }
  let draggedElementId = null;

  function onDragStart(event, type) {
    console.log("onDragStart", event.target, type);
    draggedElementId = type;
  }

  function onDragOver(event) {
    event.preventDefault(); // Allows the drop
  }

  function onDrop(event) {
    event.preventDefault();

    const draggedElement = draggedElementId; // The element being dragged
    const dropTarget = event.target.closest('.droppable'); // The target element where the dragged element is dropped
    // console.log("onDrop", draggedElement, dropTarget);

    if (draggedElement) {
    const newItem = createDefaultItem(draggedElement);
    items.unshift(newItem); // Add newItem at the 0th index
    items = [...items]; // Update the items array
    console.log("items", items);
  }

    // Clear the dragged element ID after the drop
    draggedElementId = null;
  }

  function createDefaultItem(type) {
    const defaultProps = {
      text: {
        id: `text-${Date.now()}`,
        pos: { top: "20%" },
        prop: {
          bold: false,
          font: "Arial",
          size: 14,
          color: "black",
          italic: false,
          textAlign: "left",
          underline: false,
          uppercase: false,
        },
        size: { width: "100%", height: "auto" },
        type: "text",
        content: "New Text Item",
        editMode: true,
      },
      textfield: {
        id: `textfield-${Date.now()}`,
        pos: { top: "20%" },
        prop: {
          bold: false,
          font: "Arial",
          size: 14,
          color: "black",
          italic: false,
          textAlign: "left",
          underline: false,
          uppercase: false,
        },
        size: { width: "100%", height: "auto" },
        type: "textfield",
        content: "New TextField Item",
        editMode: true,
      },
    };

    return defaultProps[type] || {};
  }

</script>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&display=swap"
  />
</svelte:head>

<svelte:window on:keydown={handleShortcut} on:mouseup={onMouseUp} />

<main class="p-4 md:ml-60 min-h-screen">
  <div
    class="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden"
  >
    <div
      class="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 p-3 border-b border-gray-200 dark:border-gray-700"
    >
      <div class="w-full md:w-1/2">
        <input
          type="text"
          class="{designName
            ? 'bg-gray-50 border-gray-300 focus:ring-primary-500 focus:border-primary-500'
            : 'bg-red-50 border-red-500 placeholder-red-700 dark:bg-gray-700 focus:border-red-500 dark:text-red-500 dark:placeholder-red-500 dark:border-red-500'} placeholder-opacity-50 text-gray-900 text-sm rounded-lg block w-full p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
          required
          bind:value={designName}
          placeholder="Design Name"
        />
      </div>
      <button
        type="button"
        disabled={!designName || !items.length || loading}
        on:click={createDesign}
        class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
      >
        {#if loading}
          <Spinner size="5" color="white" />
        {:else if data.design}
          Update Design
        {:else}
          Create Design
        {/if}
      </button>
    </div>
    <div
      class="playground grid grid-cols-10 bg-white dark:text-gray-400 dark:bg-gray-800"
    >
      <!-- Sidebar -->
      <!-- <div class="col-span-3 pe-3 border-e border-gray-200 overflow-y-auto">
                <div class="col-span-9 p-3 text-medium text-gray-500 dark:text-gray-400 dark:bg-gray-800 rounded-lg w-full">
                    <p class="font-medium">Background</p>
                    <div class="email-tool-one mt-5 pb-3 flex flex-wrap">
                        <div class="basis-[50%]">
                            <label for="background-color" class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt">Background Color</label>
                            <input bind:value={background_color} id="background-color" class="background-color" type="color">
                        </div>
                        <div class="basis-[50%]">
                            <label for="background-color" class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt">Text Color</label>
                            <input type="color">
                        </div>
                    </div>
                    <div class="email-tool-two pt-3 pb-3">
                        <p class="font-medium">Header</p>
                        <div class="mt-5 space-y-3">
                            <Toggle checked={outerHeader} on:click={handleOuterHeader}>Outer Header</Toggle>
                            <Toggle checked={innerHeaderChecked} on:click={handleClickInnerHeader}>Inner Header</Toggle>
                            {#if innerHeaderChecked}
                            <div class="mt-5 pb-3 flex flex-wrap"> 
                                <div class="basis-[50%]">
                                    <label for="background-color" class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt">Background Color</label>
                                    <input bind:value={innerHeaderBackgroundColor} on:change={handleChangeInnerHeadBGColor} type="color">
                                </div>
                                <div class="basis-[50%]">
                                    <label for="background-color" class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt">Text Color</label>
                                    <input bind:value={innerHeaderTextColor} on:change={handleChangeInnerHeaderTextColor} type="color">
                                </div>
                            </div>
                            {/if}
                        </div>
                    </div>
                    <div class="email-tool-two pt-3 pb-3">
                        <p class="font-medium">Main Content</p>
                        <div class="mt-5 space-y-3">
                            <Label>
                                Font
                                <Select class="mt-2" size="sm" items={font_list} bind:value={selected_font} on:change={handleChangeFont} />
                            </Label>
                            <div class="flex flex-row space-x-2">
                                <div class="basis-[33.3%]">
                                    <label for="background-color" class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt">Background Color</label>
                                    <input bind:value={main_content_background_color} type="color">
                                </div>
                                <div class="basis-[33.3%]">
                                    <label for="text-color" class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt">Text Color</label>
                                    <input bind:value={main_content_txt_color} on:change={handleChangeMainTextColor} type="color">
                                </div>
                                <div class="basis-[33.3%]">
                                    <label for="link-color" class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt">Link - Color</label>
                                    <input type="color">
                                </div>
                            </div>
                            <div class="flex flex-row space-x-2">
                                <div class="basis-[33.3%]">
                                    <label for="border-color" class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt">Border Color</label>
                                    <input type="color">
                                </div>
                                <div class="basis-[33.3%]">
                                    <label for="border-radius" class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt">Border Radius</label>
                                    <Input id="border-radius" size="sm" />
                                </div>
                                <div class="basis-[33.3%]">
                                    <label for="background-width" class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt">Border Width</label>
                                    <Input id="background-width" size="sm" />
                                </div>
                            </div>
                            <div class="flex flex-row space-x-2">
                                <div class="basis-[33.3%]">
                                    <label for="cta-bg-color" class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt">CTA - BG Color</label>
                                    <input id="cta-bg-color" bind:value={button_color} on:change={handleChangeButtonColor} type="color">
                                </div>
                                <div class="basis-[33.3%]">
                                    <label for="cta-txt-color" class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt">CTA - Text Color</label>
                                    <input id="cta-txt-color" type="color">
                                </div>
                                <div class="basis-[33.3%]">
                                    <label for="line-color" class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt">Line - Color</label>
                                    <input id="line-color" type="color">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="email-tool-two pt-3 pb-3">
                        <p class="font-medium">Footer</p>
                        <div class="mt-5 space-y-3">
                            <div class="">
                                <Toggle checked={outerFooterChecked} on:click={handleClickOuterFooter}>Outer Footer</Toggle>
                                {#if outerFooterChecked}
                                <div class="mt-5 pb-3 flex flex-wrap">
                                    <div class="basis-[50%]">
                                        <label for="background-color" class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt">Background Color</label>
                                        <input type="color">
                                    </div>
                                    <div class="basis-[50%]">
                                        <label for="background-color" class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt">Text Color</label>
                                        <input type="color">
                                    </div>
                                </div>
                                {/if}
                            </div>
                            <div class="">
                                <Toggle checked={innerFooterChecked} on:click={handleClickInnerFooter}>Inner Footer</Toggle>
                                {#if innerFooterChecked}
                                <div class="mt-5 pb-3 flex flex-wrap">
                                    <div class="basis-[50%]">
                                        <label for="background-color" class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt">Background Color</label>
                                        <input type="color">
                                    </div>
                                    <div class="basis-[50%]">
                                        <label for="background-color" class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt">Text Color</label>
                                        <input type="color">
                                    </div>
                                </div>
                                {/if}
                            </div>
                            
                        </div>
                    </div>
                    <Button class="mt-5" color="blue">Save</Button>
                </div>
            </div> -->
      <div class="col-span-3 pe-3 border-e border-gray-200 overflow-y-auto">
        <div class="grid grid-cols-12 h-full">
          <ul
            class="col-span-3 border-e border-gray-200 h-full text-sm font-medium text-gray-500 dark:text-gray-400 md:me-2 mb-4 md:mb-0"
          >
            <li>
              <button
                on:click={() => (activeTab = "foreground")}
                class="{activeTab == 'foreground'
                  ? 'text-white bg-blue-700'
                  : 'hover:text-gray-900 hover:bg-gray-100'} text-xs flex flex-col items-center px-4 py-3 active w-full"
                aria-current="page"
              >
                <svg
                  class="w-8 h-8 {activeTab == 'foreground'
                    ? 'text-white'
                    : 'text-gray-500 dark:text-gray-400'}"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 4v3c0 .6-.4 1-1 1h-3m2 10v1c0 .6-.4 1-1 1H5a1 1 0 0 1-1-1v-7.1c0-.3 0-.5.2-.7l2.5-2.9c.2-.2.5-.3.8-.3H9m-1 4H4m16-7v10c0 .6-.4 1-1 1h-7a1 1 0 0 1-1-1V7.9c0-.3 0-.5.2-.7l2.5-2.9c.2-.2.5-.3.8-.3H19c.6 0 1 .4 1 1Z"
                  />
                </svg>
                Foreground
              </button>
            </li>
            <li>
              <button
                on:click={() => (activeTab = "items")}
                class="{activeTab == 'items'
                  ? 'text-white bg-blue-700'
                  : 'hover:text-gray-900 hover:bg-gray-100'} text-xs flex flex-col items-center px-4 py-3 w-full"
              >
                <svg
                  class="w-8 h-8 {activeTab == 'items'
                    ? 'text-white'
                    : 'text-gray-500 dark:text-gray-400'}"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5 10.2c.6 0 1 .4 1 1v.2l6 3.5 6-3.5v-.2a1 1 0 1 1 2 0v.8c0 .4-.2.7-.5.9l-7 4a1 1 0 0 1-1 0l-7-4A1 1 0 0 1 4 12v-.8c0-.6.5-1 1-1Zm0 5c.6 0 1 .4 1 1v.2l6 3.4 6-3.4V16a1 1 0 1 1 2 0v.9c0 .3-.2.6-.5.8l-7 4a1 1 0 0 1-1 0l-7-4A1 1 0 0 1 4 17v-1c0-.5.4-1 1-1Z"
                    clip-rule="evenodd"
                  />
                  <path
                    d="M12.5 2.1a1 1 0 0 0-1 0l-7 4a1 1 0 0 0 0 1.8l7 4c.3.2.7.2 1 0l7-4a1 1 0 0 0 0-1.7l-7-4Z"
                  />
                </svg>
                Items
              </button>
            </li>
            <li>
              <button
                on:click={() => (activeTab = "header")}
                class="{activeTab == 'header'
                  ? 'text-white bg-blue-700'
                  : 'hover:text-gray-900 hover:bg-gray-100'} text-xs flex flex-col items-center px-4 py-3 w-full"
              >
                <i
                  class="fa-solid fa-h size text-xl {activeTab == 'header'
                    ? 'text-white'
                    : 'text-gray-500 dark:text-gray-400'}"
                >
                </i>

                Header
              </button>
            </li>
            <li>
              <button
                on:click={() => (activeTab = "main-content")}
                class="{activeTab == 'main-content'
                  ? 'text-white bg-blue-700'
                  : 'hover:text-gray-900 hover:bg-gray-100'} text-xs flex flex-col items-center px-4 py-3 w-full"
              >
                <i
                  class="icon-grid-2-plus text-xl {activeTab == 'main-content'
                    ? 'text-white'
                    : 'text-gray-500 dark:text-gray-400'}"
                />
                Main Content
              </button>
            </li>
            <li>
              <button
                on:click={() => (activeTab = "footer")}
                class="{activeTab == 'footer'
                  ? 'text-white bg-blue-700'
                  : 'hover:text-gray-900 hover:bg-gray-100'} text-xs flex flex-col items-center px-4 py-3 w-full"
              >
                <i
                  class="fa-solid fa-f size text-xl {activeTab == 'footer'
                    ? 'text-white'
                    : 'text-gray-500 dark:text-gray-400'}"
                >
                </i>
                Footer
              </button>
            </li>
          </ul>
          <div
            class="col-span-9 py-3 text-medium text-gray-500 dark:text-gray-400 dark:bg-gray-800 rounded-lg w-full"
          >
            {#if activeTab == "foreground"}
              <p class="font-medium">Foreground</p>
              <div class="email-tool-one mt-5 pb-3 flex flex-wrap">
                <!-- justify-between -->
                <div class="basis-[100%]">
                  <label
                    for="background-color"
                    class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt"
                    >Foreground Color</label
                  >
                  <input
                    bind:value={background_color}
                    id="background-color"
                    class="background-color"
                    type="color"
                  />
                </div>
                <!-- <div class="basis-[50%]">
                  <label
                    for="background-color"
                    class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt"
                    >Text Color</label
                  >
                  <input type="color" />
                </div> -->
              </div>
            {:else if activeTab == "items"}
              <p class="font-medium">Items</p>
              <div class="grid grid-cols-2"
              >
                <button
                draggable="true" on:dragstart={(event)=>{onDragStart(event,"text")}}
                  type="button"
                  class="draggable flex h-32 w-full items-center justify-center border-none shadow-none hover:bg-black"
                >
                  <svg
                    width="50"
                    height="50"
                    viewBox="0 0 29 23"
                    fill="black"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4.86691 16.328V17H0.234906V16.328L1.55491 16.16C1.73091 16.128 1.85891 16.096 1.93891 16.064C2.01891 16.016 2.09091 15.912 2.15491 15.752C2.21891 15.592 2.30691 15.336 2.41891 14.984L7.00291 0.68H9.06691L13.6749 14.984C13.7869 15.336 13.8749 15.592 13.9389 15.752C14.0029 15.912 14.0749 16.016 14.1549 16.064C14.2509 16.096 14.3789 16.128 14.5389 16.16L15.8589 16.328V17H9.23491V16.328L10.5549 16.16C10.8109 16.128 10.9469 16.064 10.9629 15.968C10.9949 15.856 10.9229 15.528 10.7469 14.984L9.83491 12.008H4.29091L3.35491 14.984C3.19491 15.528 3.12291 15.856 3.13891 15.968C3.15491 16.064 3.29091 16.128 3.54691 16.16L4.86691 16.328ZM4.57891 11.168H9.57091L7.09891 3.2L4.57891 11.168ZM28.499 16.4C28.243 16.64 27.931 16.84 27.563 17C27.211 17.16 26.779 17.24 26.267 17.24C25.611 17.24 25.059 17.096 24.611 16.808C24.179 16.52 23.891 16.112 23.747 15.584C23.219 16.16 22.635 16.584 21.995 16.856C21.371 17.112 20.731 17.24 20.075 17.24C18.971 17.24 18.147 16.936 17.603 16.328C17.059 15.704 16.787 14.928 16.787 14C16.787 13.056 17.131 12.296 17.819 11.72C18.507 11.128 19.723 10.832 21.467 10.832H23.651V8.888C23.651 7.56 23.475 6.656 23.123 6.176C22.787 5.68 22.315 5.432 21.707 5.432C21.307 5.432 20.939 5.536 20.603 5.744C20.267 5.936 20.027 6.304 19.883 6.848C19.755 7.376 19.779 8.144 19.955 9.152L17.315 8.768C17.187 8.032 17.267 7.352 17.555 6.728C17.859 6.088 18.363 5.576 19.067 5.192C19.771 4.792 20.667 4.592 21.755 4.592C22.987 4.592 23.939 4.792 24.611 5.192C25.283 5.592 25.747 6.12 26.003 6.776C26.275 7.432 26.411 8.136 26.411 8.888V14.432C26.411 15.248 26.483 15.76 26.627 15.968C26.771 16.176 26.931 16.28 27.107 16.28C27.395 16.28 27.715 16.112 28.067 15.776L28.499 16.4ZM21.131 15.968C21.547 15.968 21.955 15.864 22.355 15.656C22.771 15.432 23.203 15.024 23.651 14.432V11.672H21.851C21.067 11.672 20.499 11.856 20.147 12.224C19.795 12.592 19.619 13.168 19.619 13.952C19.619 14.592 19.747 15.088 20.003 15.44C20.259 15.792 20.635 15.968 21.131 15.968ZM6.02977 19.6H8.63477V20.385H8.50977L8.37477 19.88C8.36143 19.8233 8.34143 19.7883 8.31477 19.775C8.29143 19.7583 8.22143 19.75 8.10477 19.75H7.49477V22.605C7.49477 22.7217 7.49977 22.79 7.50977 22.81C7.51977 22.83 7.55143 22.8433 7.60477 22.85L7.87977 22.875V23H6.78477V22.875L7.05977 22.85C7.1131 22.8433 7.14477 22.83 7.15477 22.81C7.16477 22.79 7.16977 22.7217 7.16977 22.605V19.75H6.55977C6.4431 19.75 6.3731 19.7583 6.34977 19.775C6.32643 19.7883 6.30643 19.8233 6.28977 19.88L6.15477 20.385H6.02977V19.6ZM13.1339 22.215H13.2539V23H10.9139V22.875L11.1889 22.85C11.2422 22.8433 11.2739 22.83 11.2839 22.81C11.2939 22.79 11.2989 22.7217 11.2989 22.605V19.995C11.2989 19.8783 11.2939 19.81 11.2839 19.79C11.2739 19.7667 11.2422 19.7533 11.1889 19.75L10.9139 19.725V19.6H13.1839V20.385H13.0639L12.9289 19.88C12.9156 19.8233 12.8956 19.7883 12.8689 19.775C12.8456 19.7583 12.7756 19.75 12.6589 19.75H11.6239V21.205H12.3639C12.4439 21.205 12.5006 21.2033 12.5339 21.2C12.5672 21.1933 12.5889 21.1817 12.5989 21.165C12.6122 21.145 12.6239 21.115 12.6339 21.075L12.7189 20.72H12.8389V21.84H12.7189L12.6339 21.485C12.6239 21.445 12.6122 21.4167 12.5989 21.4C12.5889 21.38 12.5672 21.3683 12.5339 21.365C12.5006 21.3583 12.4439 21.355 12.3639 21.355H11.6239V22.85H12.7289C12.8456 22.85 12.9156 22.8433 12.9389 22.83C12.9656 22.8133 12.9856 22.7767 12.9989 22.72L13.1339 22.215ZM16.3411 22.875V23H15.4461V22.875L15.6911 22.85C15.7377 22.8433 15.7711 22.8333 15.7911 22.82C15.8144 22.8033 15.8527 22.7483 15.9061 22.655L16.7311 21.305L15.9411 19.945C15.9077 19.8817 15.8811 19.8383 15.8611 19.815C15.8444 19.7883 15.8277 19.7717 15.8111 19.765C15.7944 19.7583 15.7694 19.7533 15.7361 19.75L15.4911 19.725V19.6H16.5611V19.725L16.3161 19.75C16.2627 19.7533 16.2344 19.765 16.2311 19.785C16.2277 19.8017 16.2527 19.855 16.3061 19.945L16.9511 21.055L17.6261 19.945C17.6827 19.8583 17.7094 19.805 17.7061 19.785C17.7061 19.765 17.6794 19.7533 17.6261 19.75L17.3811 19.725V19.6H18.2761V19.725L18.0311 19.75C17.9844 19.7533 17.9511 19.7633 17.9311 19.78C17.9111 19.7967 17.8727 19.8517 17.8161 19.945L17.0411 21.21L17.8761 22.655C17.9294 22.745 17.9644 22.7983 17.9811 22.815C18.0011 22.8317 18.0361 22.8433 18.0861 22.85L18.3311 22.875V23H17.2611V22.875L17.5061 22.85C17.5594 22.8433 17.5877 22.8317 17.5911 22.815C17.5944 22.7983 17.5694 22.745 17.5161 22.655L16.8211 21.46L16.0961 22.655C16.0427 22.7417 16.0161 22.795 16.0161 22.815C16.0161 22.8317 16.0427 22.8433 16.0961 22.85L16.3411 22.875ZM20.3661 19.6H22.9711V20.385H22.8461L22.7111 19.88C22.6978 19.8233 22.6778 19.7883 22.6511 19.775C22.6278 19.7583 22.5578 19.75 22.4411 19.75H21.8311V22.605C21.8311 22.7217 21.8361 22.79 21.8461 22.81C21.8561 22.83 21.8878 22.8433 21.9411 22.85L22.2161 22.875V23H21.1211V22.875L21.3961 22.85C21.4494 22.8433 21.4811 22.83 21.4911 22.81C21.5011 22.79 21.5061 22.7217 21.5061 22.605V19.75H20.8961C20.7794 19.75 20.7094 19.7583 20.6861 19.775C20.6628 19.7883 20.6428 19.8233 20.6261 19.88L20.4911 20.385H20.3661V19.6Z"
                      fill="white"
                    />
                  </svg>
                </button>
                <button
                  type="button"  
                  on:dragstart={(event)=>{onDragStart(event,"textfield")}}
                  draggable="true"
                  class="draggable flex h-32 w-full items-center justify-center border-none shadow-none hover:bg-black"
                >
                  <svg
                    width="50"
                    height="50"
                    viewBox="0 0 23 24"
                    fill="black"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M19.382 16.328V17H12.806V16.328L14.126 16.16C14.382 16.128 14.534 16.064 14.582 15.968C14.63 15.856 14.654 15.528 14.654 14.984V9.176H8.34203V14.984C8.34203 15.528 8.36603 15.856 8.41403 15.968C8.46203 16.064 8.61403 16.128 8.87003 16.16L10.19 16.328V17H3.61403V16.328L4.93403 16.16C5.19003 16.128 5.34203 16.064 5.39003 15.968C5.43803 15.856 5.46203 15.528 5.46203 14.984V2.696C5.46203 2.152 5.43803 1.832 5.39003 1.736C5.34203 1.624 5.19003 1.552 4.93403 1.52L3.61403 1.352V0.68H10.19V1.352L8.87003 1.52C8.61403 1.552 8.46203 1.624 8.41403 1.736C8.36603 1.832 8.34203 2.152 8.34203 2.696V8.336H14.654V2.696C14.654 2.152 14.63 1.832 14.582 1.736C14.534 1.624 14.382 1.552 14.126 1.52L12.806 1.352V0.68H19.382V1.352L18.062 1.52C17.806 1.552 17.654 1.624 17.606 1.736C17.558 1.832 17.534 2.152 17.534 2.696V14.984C17.534 15.528 17.558 15.856 17.606 15.968C17.654 16.064 17.806 16.128 18.062 16.16L19.382 16.328ZM3.53533 22.875V23H2.44033V22.875L2.71533 22.85C2.76867 22.8433 2.80033 22.83 2.81033 22.81C2.82033 22.79 2.82533 22.7217 2.82533 22.605V21.355H1.18533V22.605C1.18533 22.7217 1.19033 22.79 1.20033 22.81C1.21033 22.83 1.242 22.8433 1.29533 22.85L1.57033 22.875V23H0.475332V22.875L0.750332 22.85C0.803665 22.8433 0.835332 22.83 0.845332 22.81C0.855332 22.79 0.860332 22.7217 0.860332 22.605V19.995C0.860332 19.8783 0.855332 19.81 0.845332 19.79C0.835332 19.7667 0.803665 19.7533 0.750332 19.75L0.475332 19.725V19.6H1.57033V19.725L1.29533 19.75C1.242 19.7533 1.21033 19.7667 1.20033 19.79C1.19033 19.81 1.18533 19.8783 1.18533 19.995V21.205H2.82533V19.995C2.82533 19.8783 2.82033 19.81 2.81033 19.79C2.80033 19.7667 2.76867 19.7533 2.71533 19.75L2.44033 19.725V19.6H3.53533V19.725L3.26033 19.75C3.207 19.7533 3.17533 19.7667 3.16533 19.79C3.15533 19.81 3.15033 19.8783 3.15033 19.995V22.605C3.15033 22.7217 3.15533 22.79 3.16533 22.81C3.17533 22.83 3.207 22.8433 3.26033 22.85L3.53533 22.875ZM6.52443 22.215H6.64443V23H4.30443V22.875L4.57943 22.85C4.63277 22.8433 4.66443 22.83 4.67443 22.81C4.68443 22.79 4.68943 22.7217 4.68943 22.605V19.995C4.68943 19.8783 4.68443 19.81 4.67443 19.79C4.66443 19.7667 4.63277 19.7533 4.57943 19.75L4.30443 19.725V19.6H6.57443V20.385H6.45443L6.31943 19.88C6.3061 19.8233 6.2861 19.7883 6.25943 19.775C6.2361 19.7583 6.1661 19.75 6.04943 19.75H5.01443V21.205H5.75443C5.83443 21.205 5.8911 21.2033 5.92443 21.2C5.95777 21.1933 5.97943 21.1817 5.98943 21.165C6.00277 21.145 6.01443 21.115 6.02443 21.075L6.10943 20.72H6.22943V21.84H6.10943L6.02443 21.485C6.01443 21.445 6.00277 21.4167 5.98943 21.4C5.97943 21.38 5.95777 21.3683 5.92443 21.365C5.8911 21.3583 5.83443 21.355 5.75443 21.355H5.01443V22.85H6.11943C6.2361 22.85 6.3061 22.8433 6.32943 22.83C6.3561 22.8133 6.3761 22.7767 6.38943 22.72L6.52443 22.215ZM8.06658 22.875V23H7.12158V22.875L7.39658 22.85C7.43325 22.8467 7.45992 22.8417 7.47658 22.835C7.49325 22.825 7.50825 22.8033 7.52158 22.77C7.53825 22.7367 7.55825 22.6817 7.58158 22.605L8.55658 19.6H8.79158L9.77658 22.605C9.80325 22.6817 9.82325 22.7367 9.83658 22.77C9.84992 22.8033 9.86492 22.825 9.88158 22.835C9.89825 22.8417 9.92325 22.8467 9.95658 22.85L10.2316 22.875V23H9.12658V22.875L9.40158 22.85C9.45825 22.8433 9.48825 22.83 9.49158 22.81C9.49492 22.7867 9.47825 22.7183 9.44158 22.605L9.22658 21.95H7.96158L7.75158 22.605C7.71492 22.7183 7.69825 22.7867 7.70158 22.81C7.70825 22.83 7.73825 22.8433 7.79158 22.85L8.06658 22.875ZM8.01158 21.8H9.18158L8.59658 20L8.01158 21.8ZM10.7419 19.725V19.6H12.1269C12.3869 19.6 12.6069 19.6617 12.7869 19.785C12.9669 19.9083 13.1036 20.0817 13.1969 20.305C13.2936 20.5283 13.3419 20.79 13.3419 21.09V21.505C13.3419 21.805 13.2936 22.0683 13.1969 22.295C13.1036 22.5183 12.9669 22.6917 12.7869 22.815C12.6069 22.9383 12.3869 23 12.1269 23H10.7419V22.875L11.0169 22.85C11.0703 22.8433 11.1019 22.83 11.1119 22.81C11.1219 22.79 11.1269 22.7217 11.1269 22.605V19.995C11.1269 19.8783 11.1219 19.81 11.1119 19.79C11.1019 19.7667 11.0703 19.7533 11.0169 19.75L10.7419 19.725ZM12.1269 19.75H11.4519V22.85H12.1269C12.4036 22.85 12.6136 22.765 12.7569 22.595C12.9036 22.425 12.9769 22.145 12.9769 21.755V20.84C12.9769 20.45 12.9036 20.1717 12.7569 20.005C12.6136 19.835 12.4036 19.75 12.1269 19.75ZM14.2537 19.725V19.6H15.3487V19.725L15.0737 19.75C15.0203 19.7533 14.9887 19.7667 14.9787 19.79C14.9687 19.81 14.9637 19.8783 14.9637 19.995V22.605C14.9637 22.7217 14.9687 22.79 14.9787 22.81C14.9887 22.83 15.0203 22.8433 15.0737 22.85L15.3487 22.875V23H14.2537V22.875L14.5287 22.85C14.582 22.8433 14.6137 22.83 14.6237 22.81C14.6337 22.79 14.6387 22.7217 14.6387 22.605V19.995C14.6387 19.8783 14.6337 19.81 14.6237 19.79C14.6137 19.7667 14.582 19.7533 14.5287 19.75L14.2537 19.725ZM18.1549 19.725V19.6H19.0999V19.725L18.8249 19.75C18.7715 19.7533 18.7399 19.7667 18.7299 19.79C18.7199 19.81 18.7149 19.8783 18.7149 19.995V23H18.4899L16.6799 19.85V22.605C16.6799 22.7183 16.6849 22.7867 16.6949 22.81C16.7049 22.83 16.7365 22.8433 16.7899 22.85L17.0649 22.875V23H16.1199V22.875L16.3949 22.85C16.4482 22.8433 16.4799 22.83 16.4899 22.81C16.4999 22.7867 16.5049 22.7183 16.5049 22.605V19.995C16.5049 19.8783 16.4999 19.81 16.4899 19.79C16.4799 19.7667 16.4482 19.7533 16.3949 19.75L16.1199 19.725V19.6H16.8899L18.5399 22.47V19.995C18.5399 19.8783 18.5349 19.81 18.5249 19.79C18.5149 19.7667 18.4832 19.7533 18.4299 19.75L18.1549 19.725ZM21.4864 21.585V21.46H22.6664V21.585L22.3914 21.61C22.3381 21.6133 22.3064 21.6267 22.2964 21.65C22.2864 21.67 22.2814 21.7383 22.2814 21.855V23H22.1714C22.1514 22.9533 22.1264 22.9117 22.0964 22.875C22.0664 22.835 22.0331 22.7983 21.9964 22.765C21.7964 22.955 21.5331 23.05 21.2064 23.05C20.9464 23.05 20.7248 22.9867 20.5414 22.86C20.3614 22.73 20.2231 22.55 20.1264 22.32C20.0331 22.0867 19.9864 21.815 19.9864 21.505V21.09C19.9864 20.78 20.0348 20.51 20.1314 20.28C20.2281 20.0467 20.3681 19.8667 20.5514 19.74C20.7381 19.6133 20.9631 19.55 21.2264 19.55C21.4831 19.55 21.6948 19.6 21.8614 19.7C22.0281 19.7967 22.1464 19.9233 22.2164 20.08C22.2864 20.2367 22.3048 20.405 22.2714 20.585L21.9464 20.665C21.9831 20.355 21.9398 20.1167 21.8164 19.95C21.6964 19.78 21.5031 19.695 21.2364 19.695C20.9464 19.695 20.7264 19.7833 20.5764 19.96C20.4264 20.1367 20.3514 20.43 20.3514 20.84V21.755C20.3514 22.1583 20.4248 22.45 20.5714 22.63C20.7214 22.81 20.9414 22.9 21.2314 22.9C21.3881 22.9 21.5281 22.8733 21.6514 22.82C21.7748 22.7633 21.8814 22.6717 21.9714 22.545V21.855C21.9714 21.7383 21.9664 21.67 21.9564 21.65C21.9464 21.6267 21.9148 21.6133 21.8614 21.61L21.4864 21.585Z"
                      fill="white"
                    />
                  </svg>
                </button>
                <button
                  on:click={() => addElement("_button", "")}
                  type="button"
                  class="flex h-32 w-full items-center justify-center border-none shadow-none hover:bg-black"
                >
                  <svg
                    width="60"
                    height="60"
                    viewBox="0 0 30 34"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15 22C21.9036 22 27.5 17.5228 27.5 12C27.5 6.47715 21.9036 2 15 2C8.09644 2 2.5 6.47715 2.5 12C2.5 17.5228 8.09644 22 15 22Z"
                      stroke="white"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M12.5 8L20 12L12.5 16V8Z"
                      stroke="white"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M4.92332 28.885C5.17999 28.955 5.38332 29.0783 5.53332 29.255C5.68665 29.4283 5.76332 29.6283 5.76332 29.855C5.76332 30.065 5.67999 30.2633 5.51332 30.45C5.34999 30.6333 5.14332 30.78 4.89332 30.89C4.64665 31 4.41165 31.055 4.18832 31.055C4.02165 31.055 3.85832 31.0467 3.69832 31.03C3.43165 31.0133 3.22499 31.005 3.07832 31.005H2.46832V30.875L2.93832 30.505V27.42L2.42332 27.245L2.50832 27.07H3.07332C3.37665 27.07 3.67499 27.06 3.96832 27.04C4.19499 27.0267 4.36165 27.02 4.46832 27.02C4.68499 27.02 4.87665 27.0633 5.04332 27.15C5.20999 27.2367 5.33832 27.355 5.42832 27.505C5.51832 27.6517 5.56332 27.8167 5.56332 28C5.56332 28.1667 5.50332 28.3267 5.38332 28.48C5.26665 28.6333 5.11499 28.765 4.92832 28.875L4.92332 28.885ZM4.94332 28.24C4.94332 27.9733 4.86999 27.755 4.72332 27.585C4.57999 27.4117 4.36499 27.325 4.07832 27.325C3.86165 27.325 3.66832 27.3917 3.49832 27.525V28.85H4.24832C4.46499 28.85 4.63332 28.7967 4.75332 28.69C4.87665 28.5833 4.93832 28.4333 4.93832 28.24H4.94332ZM4.32332 30.715C4.56999 30.715 4.76665 30.6533 4.91332 30.53C5.06332 30.4033 5.13832 30.2367 5.13832 30.03C5.13832 29.7633 5.05999 29.5483 4.90332 29.385C4.74665 29.2217 4.51332 29.135 4.20332 29.125C4.17999 29.1283 4.14832 29.13 4.10832 29.13H3.49832V30.58C3.72499 30.67 4.00165 30.715 4.32832 30.715H4.32332ZM9.94875 27.57V29.45C9.94875 29.8 9.86542 30.1 9.69875 30.35C9.53208 30.6 9.32542 30.7883 9.07875 30.915C8.83208 31.0383 8.59208 31.1 8.35875 31.1C8.06542 31.1 7.80375 31.035 7.57375 30.905C7.34375 30.7717 7.16375 30.59 7.03375 30.36C6.90375 30.1267 6.83875 29.865 6.83875 29.575V27.43L6.32375 27.245L6.41375 27.07H7.88375V27.2L7.40875 27.57V29.32C7.40875 29.76 7.51542 30.1017 7.72875 30.345C7.94208 30.5883 8.26542 30.71 8.69875 30.71C8.85875 30.71 9.01542 30.6583 9.16875 30.555C9.32542 30.4483 9.45375 30.2933 9.55375 30.09C9.65375 29.8867 9.70375 29.6467 9.70375 29.37V27.515L9.19375 27.245L9.28375 27.07H10.4238V27.2L9.94875 27.57ZM14.3609 28.205L14.2359 28.24L13.5759 27.265H12.9359V30.64L13.4559 30.825L13.3659 31H11.8959V30.87L12.3659 30.5V27.265H11.7459L11.0859 28.24L10.9609 28.205V26.98L11.2109 27.07H14.1109L14.3609 26.98V28.205ZM18.5113 28.205L18.3863 28.24L17.7263 27.265H17.0863V30.64L17.6063 30.825L17.5163 31H16.0463V30.87L16.5163 30.5V27.265H15.8963L15.2363 28.24L15.1113 28.205V26.98L15.3613 27.07H18.2613L18.5113 26.98V28.205ZM21.3717 26.97C21.7184 26.97 22.0251 27.055 22.2917 27.225C22.5617 27.395 22.7701 27.63 22.9167 27.93C23.0634 28.23 23.1367 28.57 23.1367 28.95C23.1367 29.34 23.0251 29.7 22.8017 30.03C22.5784 30.36 22.3001 30.6217 21.9667 30.815C21.6367 31.005 21.3201 31.1 21.0167 31.1C20.6701 31.1 20.3634 31.015 20.0967 30.845C19.8301 30.675 19.6217 30.4417 19.4717 30.145C19.3251 29.845 19.2517 29.505 19.2517 29.125C19.2517 28.735 19.3634 28.375 19.5867 28.045C19.8101 27.7117 20.0867 27.45 20.4167 27.26C20.7501 27.0667 21.0684 26.97 21.3717 26.97ZM21.0817 27.36C20.8551 27.36 20.6484 27.4267 20.4617 27.56C20.2751 27.69 20.1284 27.8717 20.0217 28.105C19.9151 28.335 19.8617 28.595 19.8617 28.885C19.8617 29.2183 19.9134 29.5233 20.0167 29.8C20.1234 30.0767 20.2851 30.2983 20.5017 30.465C20.7184 30.6283 20.9867 30.71 21.3067 30.71C21.5334 30.71 21.7401 30.645 21.9267 30.515C22.1134 30.3817 22.2601 30.2 22.3667 29.97C22.4734 29.7367 22.5267 29.475 22.5267 29.185C22.5267 28.8483 22.4734 28.5433 22.3667 28.27C22.2634 27.9933 22.1034 27.7733 21.8867 27.61C21.6701 27.4433 21.4017 27.36 21.0817 27.36ZM27.151 27.565V31H26.911L24.526 27.93V30.56L25.016 30.825L24.926 31H23.816V30.87L24.286 30.505V27.52L23.771 27.245L23.856 27.07H24.586L26.911 30.065V27.51L26.426 27.245L26.516 27.07H27.626V27.2L27.151 27.565Z"
                      fill="white"
                    />
                  </svg>
                </button>
              </div>
            {:else if activeTab == "header"}
              <p class="font-medium">Header</p>
              <div class="mt-5 space-y-3">
                <!-- <Toggle checked={outerHeader} on:click={handleOuterHeader}
                  >Outer Header</Toggle
                > -->
                <Toggle
                  checked={innerHeaderChecked}
                  on:click={handleClickInnerHeader}>Header</Toggle
                >
                {#if innerHeaderChecked}
                  <div class="mt-5 pb-3 flex flex-wrap">
                    <div class="basis-[50%]">
                      <label
                        for="background-color"
                        class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt"
                        >Background Color</label
                      >
                      <input
                        bind:value={innerHeaderBackgroundColor}
                        on:input={handleChangeInnerHeadBGColor}
                        type="color"
                      />
                    </div>
                    <div class="basis-[50%]">
                      <label
                        for="background-color"
                        class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt"
                        >Text Color</label
                      >
                      <input
                        bind:value={innerHeaderTextColor}
                        on:input={handleChangeInnerHeaderTextColor}
                        type="color"
                      />
                    </div>
                  </div>
                {/if}
              </div>
            {:else if activeTab == "main-content"}
              <p class="font-medium">Main Content</p>
              <div class="mt-5 space-y-3">
                <!-- <Label>
                                Font
                                <Select class="mt-2" size="sm" items={font_list} bind:value={selected_font} on:change={handleChangeFont} />
                            </Label> -->
                <div class="horizontal-line"></div>
                <div class="flex flex-row space-x-1">
                  <div class="basis-[33.3%] block items-end">
                    <label
                      for="background-color"
                      class="block mb-1 text-center text-sm font-small text-gray-900 dark:text-white label-txt"
                      >Background</label
                    >
                    <input
                      bind:value={main_content_background_color}
                      type="color"
                    />
                  </div>
                  <!-- <div class="basis-[33.3%] flex items-end">
                                    <div>
                                        <label for="text-color" class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt">Text Color</label>
                                        <input bind:value={main_content_txt_color} on:change={handleChangeMainTextColor} type="color">
                                    </div>
                                </div> -->
                  <div class="basis-[33.3%] block items-end">
                    <div>
                      <label
                        for="link-color"
                        class="block mb-1 text-center text-sm font-small text-gray-900 dark:text-white label-txt"
                        >Link - Color</label
                      >
                      <input
                        id="link-color"
                        type="color"
                        bind:value={link_color}
                        on:change={changeAllLinksColor}
                      />
                    </div>
                  </div>
                  <div class="basis-[33.3%] block items-end">
                    <label
                      for="border-color"
                      class="block mb-1 text-center text-sm font-small text-gray-900 dark:text-white label-txt"
                      >Border Color</label
                    >
                    <input
                      id="border-color"
                      type="color"
                      bind:value={main_border_color}
                    />
                  </div>
                </div>
                <div class="flex flex-row space-x-1">
                  <div class="basis-[50%]">
                    <label
                      for="border-radius"
                      class="block mb-1 text-center text-sm font-small text-gray-900 dark:text-white label-txt"
                      >Border Radius</label
                    >
                    <Input
                      id="border-radius"
                      bind:value={main_border_radius}
                      size="sm"
                    />
                  </div>
                  <div class="basis-[50%]">
                    <label
                      for="background-width"
                      class="block mb-1 text-center text-sm font-small text-gray-900 dark:text-white label-txt"
                      >Border Width</label
                    >
                    <Input
                      id="background-width"
                      bind:value={main_border_width}
                      size="sm"
                    />
                  </div>
                </div>
                <!-- <div class="flex flex-row space-x-2">
                  <div class="basis-[33.3%] flex items-end">
                    <div>
                      <label
                        for="cta-bg-color"
                        class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt"
                        >CTA - BG Color</label
                      >
                      <input
                        id="cta-bg-color"
                        bind:value={button_color}
                        on:change={handleChangeButtonColor}
                        type="color"
                      />
                    </div>
                  </div>
                  <div class="basis-[33.3%]">
                    <label
                      for="cta-txt-color"
                      class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt"
                      >CTA - Text Color</label
                    >
                    <input id="cta-txt-color" type="color" />
                  </div>
                  <div class="basis-[33.3%] flex items-end">
                    <div>
                      <label
                        for="line-color"
                        class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt"
                        >Line - Color</label
                      >
                      <input id="line-color" type="color" />
                    </div>
                  </div>
                </div> -->
                <div class="horizontal-line"></div>
              </div>
            {:else if activeTab == "footer"}
              <p class="font-medium">Footer</p>
              <div class="mt-5 space-y-3">
                <!-- <div class="">
                  <Toggle
                    checked={outerFooterChecked}
                    on:click={handleClickOuterFooter}>Outer Footer</Toggle
                  >
                  {#if outerFooterChecked}
                    <div class="mt-5 pb-3 flex flex-wrap">
                      <div class="basis-[50%]">
                        <label
                          for="background-color"
                          class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt"
                          >Background Color</label
                        >
                        <input type="color" />
                      </div>
                      <div class="basis-[50%]">
                        <label
                          for="background-color"
                          class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt"
                          >Text Color</label
                        >
                        <input type="color" />
                      </div>
                    </div>
                  {/if}
                </div> -->
                <div class="">
                  <Toggle
                    checked={innerFooterChecked}
                    on:click={handleClickInnerFooter}>Footer</Toggle
                  >
                  {#if innerFooterChecked}
                    <div class="mt-5 pb-3 flex flex-wrap">
                      <div class="basis-[50%]">
                        <label
                          for="background-color"
                          class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt"
                          >Background Color</label
                        >
                        <input
                          bind:value={innerFooterBackgroundColor}
                          on:input={handleChangeInnerFooterBGColor}
                          type="color"
                        />
                      </div>
                      <div class="basis-[50%]">
                        <label
                          for="background-color"
                          class="block mb-1 text-sm font-small text-gray-900 dark:text-white label-txt"
                          >Text Color</label
                        >
                        <input
                          bind:value={innerFooterTextColor}
                          on:input={handleChangeInnerFooterTextColor}
                          type="color"
                        />
                      </div>
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>
      <div class="col-span-7">
        <!-- Toolbar -->
        <div
          bind:this={toolbar}
          class="toolbar flex items-center justify-between px-3 py-2 border-b dark:border-gray-600 relative"
          style="height: 50px; z-index: 9999;"
        >
          <div class="flex items-center space-x-3">
            {#if activeElement && activeElement.type == "qr"}
              <!-- Background -->
              <!-- <input
                                type="color"
                                style="width: 36px; height: 36px; border: none; outline: none; padding: 0; margin: 0; cursor: pointer; background: white;"
                                bind:value={activeElement.prop.background}
                                on:input={() =>
                                    updateElementStyle("qrColor", "")}
                            /> -->
              <!-- Foreground -->
              <input
                type="color"
                style="width: 36px; height: 36px; border: none; outline: none; padding: 0; margin: 0; cursor: pointer; background: white;"
                bind:value={activeElement.prop.foreground}
                on:input={() => updateElementStyle("qrColor", "")}
              />
            {/if}
            {#if activeElement && (activeElement.type == "textfield" || activeElement.type == "text" || activeElement.type == "attribute" || activeElement.type == "line-horizontal" || activeElement.type == "line-vertical")}
              <!-- Element Color -->
              <input
                type="color"
                style="width: 36px; height: 36px; border: none; outline: none; padding: 0; margin: 0; cursor: pointer; background: none;"
                bind:value={activeElement.prop.color}
                on:input={() => updateElementStyle("fontColor", "")}
              />
              <input
                type="color"
                style="width: 36px; height: 36px; border: none; outline: none; padding: 0; margin: 0; cursor: pointer; background: none;"
                bind:value={activeElement.prop.backgroundColor}
                on:input={() => updateElementStyle("backgroundColour", "")}
              />
              <!-- Element Size -->
              <div class="inline-flex rounded-md shadow-sm" role="group">
                <button
                  on:click={() => updateElementStyle("fontSize", -1)}
                  type="button"
                  class="px-4 py-0 text-lg font-medium text-gray-900 bg-white border border-gray-200 rounded-l-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white"
                >
                  -
                </button>
                <input
                  type="number"
                  pattern="\d*"
                  min="0"
                  max="100"
                  step="0.1"
                  tabindex="-1"
                  class="border border-gray-200 font-size text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white"
                  bind:value={activeElement.prop.size}
                  on:input={() => updateElementStyle("fontSizeChange", "")}
                />
                <button
                  on:click={() => updateElementStyle("fontSize", 1)}
                  type="button"
                  class="px-4 py-0 text-lg font-medium text-gray-900 bg-white border border-gray-200 rounded-r-md hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white"
                >
                  +
                </button>
              </div>
            {/if}
            {#if activeElement && activeElement.type == "_button"}
              <!-- Element Color -->
              <input
                type="color"
                style="width: 36px; height: 36px; border: none; outline: none; padding: 0; margin: 0; cursor: pointer; background: none;"
                bind:value={activeElement.prop.color}
                on:input={() => updateElementStyle("fontColor", "")}
              />
              <!-- Element Size -->
              <div class="inline-flex rounded-md shadow-sm" role="group">
                <button
                  on:click={() => updateElementStyle("fontSize", -1)}
                  type="button"
                  class="px-4 py-0 text-lg font-medium text-gray-900 bg-white border border-gray-200 rounded-l-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white"
                >
                  -
                </button>
                <input
                  type="number"
                  pattern="\d*"
                  min="0"
                  max="100"
                  step="0.1"
                  tabindex="-1"
                  class="border border-gray-200 font-size text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white"
                  bind:value={activeElement.prop.size}
                  on:input={() => updateElementStyle("fontSizeChange", "")}
                />
                <button
                  on:click={() => updateElementStyle("fontSize", 1)}
                  type="button"
                  class="px-4 py-0 text-lg font-medium text-gray-900 bg-white border border-gray-200 rounded-r-md hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white"
                >
                  +
                </button>
              </div>
            {/if}
            {#if activeElement && (activeElement.type == "textfield" || activeElement.type == "attribute")}
              <!-- Font Family -->
              <Button
                on:click={() => (dropdownFont = !dropdownFont)}
                class="w-32 bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg block p-2 hover:bg-gray-50"
                color="light">{activeElement.prop.font}</Button
              >
              <Dropdown
                bind:open={dropdownFont}
                ulClass="overflow-y-auto h-52 text-sm"
              >
                {#each fonts as font}
                  <DropdownItem
                    defaultClass="bg-gray-50 font-medium py-2 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                    on:click={() => updateElementStyle("font", font.name)}
                  >
                    <div class="flex items-center">
                      {font.name}
                      <img
                        alt={font.name}
                        width="64"
                        class="invert-image-dark-mode ms-4"
                        src="https://bucket-netcred-media.s3.ap-south-1.amazonaws.com/fonts/{font.imageUrl}"
                      />
                    </div>
                  </DropdownItem>
                {/each}
              </Dropdown>
              <!-- Font Alignment -->
              <div
                style="background: rgba(57,76,96,.15); width: 1px; height: 24px;"
              />
              <div class="grid grid-cols-3 space-x-1">
                <button
                  on:click={() => updateElementStyle("alignment", "left")}
                  type="button"
                  class="{activeElement.prop.textAlign == 'left'
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-gray-900 dark:text-gray-400'} text-lg h-full p-2 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 flex justify-center items-center"
                >
                  <i class="icon-align-left" />
                </button>
                <button
                  on:click={() => updateElementStyle("alignment", "center")}
                  type="button"
                  class="{activeElement.prop.textAlign == 'center'
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-gray-900 dark:text-gray-400'} text-lg h-full p-2 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 flex justify-center items-center"
                >
                  <i class="icon-align-center" />
                </button>
                <button
                  on:click={() => updateElementStyle("alignment", "right")}
                  type="button"
                  class="{activeElement.prop.textAlign == 'right'
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-gray-900 dark:text-gray-400'} text-lg h-full p-2 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 flex justify-center items-center"
                >
                  <i class="icon-align-right" />
                </button>
              </div>

              <!-- Font Style -->
              <div
                style="background: rgba(57,76,96,.15); width: 1px; height: 24px;"
              />
              <div class="grid grid-cols-4 space-x-1">
                <button
                  on:click={() => updateElementStyle("style", "bold")}
                  type="button"
                  disabled={!supportsBold(activeElement.prop.font)}
                  class="{activeElement.prop.bold
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-gray-900 dark:text-gray-400'} text-lg h-full p-2 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 flex justify-center items-center"
                >
                  <i class="icon-bold" />
                </button>
                <button
                  on:click={() => updateElementStyle("style", "italic")}
                  type="button"
                  class="{activeElement.prop.italic
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-gray-900 dark:text-gray-400'} text-lg h-full p-2 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 flex justify-center items-center"
                >
                  <i class="icon-italic" />
                </button>
                <button
                  on:click={() => updateElementStyle("style", "underline")}
                  type="button"
                  class="{activeElement.prop.underline
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-gray-900 dark:text-gray-400'} text-lg h-full p-2 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 flex justify-center items-center"
                >
                  <i class="icon-underline" />
                </button>

                <button
                  on:click={() => (formModal = true)}
                  type="button"
                  class="{formModal
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-gray-900 dark:text-gray-400'} text-lg h-full p-2 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 flex justify-center items-center"
                >
                  <i class="fa-solid fa-link"></i>
                </button>
              </div>
            {/if}
            {#if activeElement && activeElement.type == "text"}
              <!-- Font Family -->
              <Button
                on:click={() => (dropdownFont = !dropdownFont)}
                class="w-32 bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg block p-2 hover:bg-gray-50"
                color="light">{activeElement.prop.font}</Button
              >
              <Dropdown
                bind:open={dropdownFont}
                ulClass="overflow-y-auto h-52 text-sm"
              >
                {#each fonts as font}
                  <DropdownItem
                    defaultClass="bg-gray-50 font-medium py-2 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                    on:click={() => updateElementStyle("font", font.name)}
                  >
                    <div class="flex items-center">
                      {font.name}
                      <img
                        alt={font.name}
                        width="64"
                        class="invert-image-dark-mode ms-4"
                        src="https://bucket-netcred-media.s3.ap-south-1.amazonaws.com/fonts/{font.imageUrl}"
                      />
                    </div>
                  </DropdownItem>
                {/each}
              </Dropdown>
              <!-- Font Alignment -->
              <div
                style="background: rgba(57,76,96,.15); width: 1px; height: 24px;"
              />
              <div class="grid grid-cols-3 space-x-1">
                <button
                  on:click={() => updateElementStyle("alignment", "left")}
                  type="button"
                  class="{activeElement.prop.textAlign == 'left'
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-gray-900 dark:text-gray-400'} text-lg h-full p-2 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 flex justify-center items-center"
                >
                  <i class="icon-align-left" />
                </button>
                <button
                  on:click={() => updateElementStyle("alignment", "center")}
                  type="button"
                  class="{activeElement.prop.textAlign == 'center'
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-gray-900 dark:text-gray-400'} text-lg h-full p-2 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 flex justify-center items-center"
                >
                  <i class="icon-align-center" />
                </button>
                <button
                  on:click={() => updateElementStyle("alignment", "right")}
                  type="button"
                  class="{activeElement.prop.textAlign == 'right'
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-gray-900 dark:text-gray-400'} text-lg h-full p-2 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 flex justify-center items-center"
                >
                  <i class="icon-align-right" />
                </button>
              </div>
            {/if}
            <!-- Line Styling -->
            {#if activeElement && (activeElement.type == "line-horizontal" || activeElement.type == "line-vertical")}
              <div
                style="background: rgba(57,76,96,.15); width: 1px; height: 24px;"
              />
              <div class="inline-flex" style="height: 33.6px;">
                <button
                  on:click={() => updateElementStyle("type", "solid")}
                  type="button"
                  class="px-4 py-0 text-sm font-medium bg-white border border-gray-200 rounded-s-lg hover:bg-gray-100 hover:text-blue-700"
                >
                  <div
                    style="border-width: 4px 0px 0px; border-color: {activeElement
                      .prop.type == 'solid'
                      ? '#1A56DB'
                      : '#000000'}; border-style: solid; width: 20px;"
                  />
                </button>
                <button
                  on:click={() => updateElementStyle("type", "dashed")}
                  type="button"
                  class="px-4 py-0 text-sm font-medium bg-white border-t border-b border-e border-gray-200 hover:bg-gray-100 hover:text-blue-700"
                >
                  <div
                    style="border-width: 4px 0px 0px; border-color: {activeElement
                      .prop.type == 'dashed'
                      ? '#1A56DB'
                      : '#000000'}; border-style: dashed; width: 20px;"
                  />
                </button>
                <button
                  on:click={() => updateElementStyle("type", "dotted")}
                  type="button"
                  class="px-4 py-0 text-sm font-medium bg-white border-t border-b border-e border-gray-200 hover:bg-gray-100 hover:text-blue-700"
                >
                  <div
                    style="border-width: 4px 0px 0px; border-color: {activeElement
                      .prop.type == 'dotted'
                      ? '#1A56DB'
                      : '#000000'}; border-style: dotted; width: 20px;"
                  />
                </button>
                <button
                  on:click={() => updateElementStyle("type", "double")}
                  type="button"
                  class="px-4 py-0 text-sm font-medium bg-white border-t border-b border-gray-200 hover:bg-gray-100 hover:text-blue-700"
                >
                  <div
                    style="border-width: 4px 0px 0px; border-color: {activeElement
                      .prop.type == 'double'
                      ? '#1A56DB'
                      : '#000000'}; border-style: double; width: 20px;"
                  />
                </button>
                <button
                  on:click={() => updateElementStyle("type", "groove")}
                  type="button"
                  class="px-4 py-0 text-sm font-medium bg-white border border-gray-200 rounded-e-lg hover:bg-gray-100 hover:text-blue-700"
                >
                  <div
                    style="border-width: 4px 0px 0px; border-color: {activeElement
                      .prop.type == 'groove'
                      ? '#1A56DB'
                      : '#000000'}; border-style: groove; width: 20px;"
                  />
                </button>
              </div>
            {/if}
            <!-- End Line Styling -->
          </div>
          <!-- Z-Index -->
          {#if activeElement}
            <div class="inline-flex">
              <button
                on:click={() => moveElementIndex(-1)}
                type="button"
                class="text-lg h-full p-2 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 flex justify-center items-center"
              >
                <i class="icon-arrow-up-short-wide" />
              </button>
              <button
                on:click={() => moveElementIndex(1)}
                type="button"
                class="text-lg h-full p-2 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 flex justify-center items-center"
              >
                <i class="icon-arrow-down-wide-short" />
              </button>
            </div>
          {/if}
        </div>
        <!-- Canvas -->
        <!-- style="background: rgb(235, 236, 240);display: flex;justify-content: center;align-items: center;" -->
        <div
          on:mousedown|stopPropagation={() => {
            activeId = null;

            activeElement = null;
          }}
          style="background: {background_color};display: flex;justify-content: center;align-items: center; padding: 50px;"
        >
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            bind:this={editor}
            class="editor relative droppable"
            on:dragover={onDragOver} on:drop={onDrop}
            use:dndzone={{
              items,
              flipDurationMs: 100,
              dropFromOthersDisabled: false,
              dragDisabled: false,
              autoAriaDisabled: true,
            }}
            on:consider={handleDndConsider}
            on:finalize={handleDndFinalize}
            style="font-size: {po[canvas.paper + '-' + canvas.orientation]
              .fontSize}px; width: {canvas.width}px; padding:15px; height:auto; min-height: {canvas.height}px;background: {main_content_background_color};border-radius:{main_border_radius}px; border:{main_border_width}px solid {main_border_color}; box-shadow: 0 2px 8px rgba(14,19,24,.07); background-position: center bottom; background-size: 100% 100%; background-repeat: no-repeat; background-image: {canvas.background
              ? 'url(' + canvas.background + ')'
              : 'none'}"
          >
            {#each items as item, index (item.id)}
              <EmailBlocks
                content={item.content}
                containerWidth={canvas.width}
                containerHeight={canvas.height}
                type={item.type}
                bind:left={item.pos.left}
                bind:top={item.pos.top}
                bind:width={item.size.width}
                bind:height={item.size.height}
                size={item.prop.size}
                color={item.prop.color}
                backgroundColor={item.prop.backgroundColor}
                textAlign={item.prop.textAlign}
                bold={item.prop.bold}
                italic={item.prop.italic}
                underline={item.prop.underline}
                font={item.prop.font}
                id={item.id}
                active={item.id === activeId}
                {index}
                on:moving={elementMoving}
                on:select={setActive}
                on:delete={deleteItem}
                on:duplicate={duplicateItem}
              >
                {#if item.type == "text"}
                  <span
                    on:click={enableEditMode}
                    on:input={updateActiveElementContent}
                    contenteditable={item.editMode}
                    class="w-full outline-none"
                    style="height: 40px; word-break: break-word; white-space: pre-line; background-color: {item
                      .prop.backgroundColor}; {item.id=="email-footer-company" ? 'margin-top:3%' : ''}"
                    >{item.content}
                  </span>
                {:else if item.type == "textfield"}
                  <Modal
                    bind:open={formModal}
                    size="xs"
                    autoclose={false}
                    class="w-full z-50"
                  >
                    <form
                      class="flex flex-col space-y-6"
                      on:submit={linkInserter}
                    >
                      <h3
                        class="mb-4 text-xl font-medium text-gray-900 dark:text-white"
                      >
                        Insert Link
                      </h3>
                      <Label class="space-y-2">
                        <span>Link Text</span>
                        <Input
                          type="text"
                          bind:value={linkText}
                          name="text"
                          placeholder="My Website"
                          required
                        />
                      </Label>
                      <Label class="space-y-2">
                        <span>Link URL</span>
                        <Input
                          type="link"
                          bind:value={linkUrl}
                          name="link"
                          placeholder="www.example.com"
                          required
                        />
                      </Label>
                      <Button type="submit" class="w-full">Insert</Button>
                    </form>
                  </Modal>

                  {#if item.editMode}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <span
                      on:click={enableEditMode}
                      on:input={updateActiveElementContent}
                      contenteditable="true"
                      class="w-full outline-none content-editable"
                      bind:innerHTML={item.content}
                      style="word-break: break-word; white-space: pre-line; background-color: {item
                        .prop.backgroundColor};"
                    ></span>
                  {:else}
                    <!-- Non-editable span -->
                    <span
                      on:click={enableEditMode}
                      class="w-full outline-none"
                      style="word-break: break-word; white-space: pre-line; background-color: {item
                        .prop.backgroundColor};"
                    >
                      {item.content}
                    </span>
                  {/if}
                {:else if item.type == "_button"}
                  <div class="flex items-center justify-center">
                    <Button
                      on:click={enableEditMode}
                      style={`background-color:${item.prop.color}; font-size: ${item.prop.size}%; height: ${item.prop.size < 40 ? 40 : item.prop.size}px;`}
                    >
                      <span
                        contenteditable="true"
                        style="display:inline-block; width:100%; height:100%; white-space: pre-wrap; outline:none;"
                        on:input={updateActiveElementContent}
                        >{item.content}</span
                      >
                    </Button>
                  </div>
                {:else if item.type == "inner-header"}
                  <span
                    on:click={enableEditMode}
                    on:input={updateActiveElementContent}
                    contenteditable={item.editMode}
                    class="w-full outline-none"
                    style="height:100%;background-color:{item.prop
                      .backgroundColor};color:{item.prop
                      .color}; display:flex; word-break: break-word; white-space: pre-line; justify-content:center; align-items:center !important;"
                    >{item.content}
                  </span>
                {:else if item.type == "inner-footer"}
                  <span
                    on:click={enableEditMode}
                    on:input={updateActiveElementContent}
                    contenteditable={item.editMode}
                    class="w-full outline-none"
                    style="height:100%;background-color:{item.prop
                      .backgroundColor};color:{item.prop
                      .color}; display:flex; word-break: break-word; white-space: pre-line; justify-content:center; align-items:center !important;"
                    >{item.content}
                  </span>
                {:else if item.type == "attribute"}
                  <span
                    class="w-full"
                    style="word-break: break-word; white-space: pre-line;"
                    >{item.content}</span
                  >
                {:else if item.type == "image"}
                  <img
                    class="relative h-full w-full object-cover"
                    src={item.content}
                  />
                {:else if item.type == "line-horizontal"}
                  <div
                    class="relative w-full"
                    style="border-width: {item.prop
                      .size}em 0em 0em; border-color: {item.prop
                      .color}; border-style: {item.prop.type};"
                  />
                {:else if item.type == "line-vertical"}
                  <div
                    class="relative h-full"
                    style="border-width: 0px {item.prop
                      .size}em 0em 0em; border-color: {item.prop
                      .color}; border-style: {item.prop.type};"
                  />
                {:else if item.type == "qr"}
                  <!-- <svg
                                                style="background: {item.prop
                                                    .background};"
                                                fill={item.prop.foreground}
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 448 512"
                                                ><path
                                                    d="M104 103.1C112.8 103.1 120 111.2 120 119.1V135.1C120 144.8 112.8 151.1 104 151.1H88C79.16 151.1 72 144.8 72 135.1V119.1C72 111.2 79.16 103.1 88 103.1H104zM0 79.1C0 53.49 21.49 31.1 48 31.1H144C170.5 31.1 192 53.49 192 79.1V175.1C192 202.5 170.5 223.1 144 223.1H48C21.49 223.1 0 202.5 0 175.1V79.1zM48 175.1H144V79.1H48V175.1zM72 375.1C72 367.2 79.16 359.1 88 359.1H104C112.8 359.1 120 367.2 120 375.1V391.1C120 400.8 112.8 407.1 104 407.1H88C79.16 407.1 72 400.8 72 391.1V375.1zM0 335.1C0 309.5 21.49 287.1 48 287.1H144C170.5 287.1 192 309.5 192 335.1V431.1C192 458.5 170.5 479.1 144 479.1H48C21.49 479.1 0 458.5 0 431.1V335.1zM48 431.1H144V335.1H48V431.1zM360 103.1C368.8 103.1 376 111.2 376 119.1V135.1C376 144.8 368.8 151.1 360 151.1H344C335.2 151.1 328 144.8 328 135.1V119.1C328 111.2 335.2 103.1 344 103.1H360zM400 31.1C426.5 31.1 448 53.49 448 79.1V175.1C448 202.5 426.5 223.1 400 223.1H304C277.5 223.1 256 202.5 256 175.1V79.1C256 53.49 277.5 31.1 304 31.1H400zM400 79.1H304V175.1H400V79.1zM384 479.1H352V447.1H384V479.1zM416 447.1H448V479.1H416V447.1zM448 415.1H352V383.1H320V479.1H256V287.1H352V319.1H416V287.1H448V415.1z"
                                                /></svg
                                            > -->
                  <svg
                    style="background: #FFFFFF00;"
                    fill={item.prop.foreground}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 448 512"
                    ><path
                      d="M104 103.1C112.8 103.1 120 111.2 120 119.1V135.1C120 144.8 112.8 151.1 104 151.1H88C79.16 151.1 72 144.8 72 135.1V119.1C72 111.2 79.16 103.1 88 103.1H104zM0 79.1C0 53.49 21.49 31.1 48 31.1H144C170.5 31.1 192 53.49 192 79.1V175.1C192 202.5 170.5 223.1 144 223.1H48C21.49 223.1 0 202.5 0 175.1V79.1zM48 175.1H144V79.1H48V175.1zM72 375.1C72 367.2 79.16 359.1 88 359.1H104C112.8 359.1 120 367.2 120 375.1V391.1C120 400.8 112.8 407.1 104 407.1H88C79.16 407.1 72 400.8 72 391.1V375.1zM0 335.1C0 309.5 21.49 287.1 48 287.1H144C170.5 287.1 192 309.5 192 335.1V431.1C192 458.5 170.5 479.1 144 479.1H48C21.49 479.1 0 458.5 0 431.1V335.1zM48 431.1H144V335.1H48V431.1zM360 103.1C368.8 103.1 376 111.2 376 119.1V135.1C376 144.8 368.8 151.1 360 151.1H344C335.2 151.1 328 144.8 328 135.1V119.1C328 111.2 335.2 103.1 344 103.1H360zM400 31.1C426.5 31.1 448 53.49 448 79.1V175.1C448 202.5 426.5 223.1 400 223.1H304C277.5 223.1 256 202.5 256 175.1V79.1C256 53.49 277.5 31.1 304 31.1H400zM400 79.1H304V175.1H400V79.1zM384 479.1H352V447.1H384V479.1zM416 447.1H448V479.1H416V447.1zM448 415.1H352V383.1H320V479.1H256V287.1H352V319.1H416V287.1H448V415.1z"
                    /></svg
                  >
                {/if}
              </EmailBlocks>

              <!-- {/if} -->
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
</main>

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
  .font-size {
    outline: 0;
    width: 50px;
    -webkit-appearance: text;
    -moz-appearance: text;
    border-radius: 0;
    height: 33.6px;
    font-weight: 600;
    line-height: 1;
    padding: 0;
    text-align: center;
    -webkit-tap-highlight-color: transparent;
  }
  .link {
    color: blue;
    cursor: pointer;
  }

  .link:hover {
    text-decoration: underline;
  }

  input[type="number"].font-size::-webkit-inner-spin-button,
  input[type="number"].font-size::-webkit-outer-spin-button {
    -webkit-appearance: none;
    appearance: none;
    margin: 0;
  }

  /* Hide number input arrows in Firefox */
  input[type="number"].font-size::-webkit-inner-spin-button,
  input[type="number"].font-size::-webkit-outer-spin-button {
    appearance: none;
    margin: 0;
  }

  .email-tool-one {
    /* border-bottom: solid 2px #E5E7EB; */
  }
  .email-tool-two {
    /* border-bottom: solid 2px #E5E7EB; */
  }
  .horizontal-line {
    border-bottom: solid 2px #e5e7eb;
  }
  .label-txt {
    letter-spacing: -1px;
    font-size: small !important;
  }
</style>
