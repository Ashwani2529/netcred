<svelte:head>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&display=swap">
</svelte:head>

<script>
    import Draggable from "./Draggable.svelte";
    import { Badge, Range, Label, Button, Modal, Spinner, Toast, Dropdown, DropdownItem, P } from "flowbite-svelte";
    // import { ChevronDownSolid } from 'flowbite-svelte-icons';
    import { fly } from "svelte/transition";
    import { enhance } from "$app/forms";
    import { goto } from '$app/navigation';
    import {
        generateRandomID,
        capitalizeFirstLetter,
        po,
        cloneDeep,
        moveItem
    } from "$lib/helpers.js";
    import { fonts, supportsBold, getApiUrl } from "$lib/fonts.js";
    import { onMount } from 'svelte';
    import { customAlphabet } from 'nanoid';
    import { hide } from "@popperjs/core";

    export let data;

    let actionTop = 0;
    let actionLeft = 0;
    let actionEnable = false;

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    const generateDesignId = customAlphabet(alphabet, 12);
    let designId = generateDesignId();

    let dropdownFont = true;
    let searchQuery = '';
    let filteredFonts = fonts;
    let selectedFont = null;
    let defaultModal = false;
    let toastMessage;
    let toastType = null;

    let designName = "My Certificate Design";

    let fileInput;
    let mediaInput;

    let loading = false;
    let formLoading1 = false;
    let formLoading2 = false;

    let _formBackground;
    let _formImage;

    let editor;
    let toolbar;
    let actionbar;

    let lastActiveTab = "document";

    // function getItemIndexById(id) {
    //     const item = itemsMap.get(id);
    //     return items.indexOf(item);
    // }

    function getItemIndexById(id) {
        let index = null;
        for (let i=0; i<=items.length; i++) {
            if (items[i]?.id === id) {
                index = i;
            }
        }
        return index;
    }

    function onDocChange() {
        canvas.width =
            po[canvas.paper + "-" + canvas.orientation].containerWidth;
        canvas.height =
            po[canvas.paper + "-" + canvas.orientation].containerHeight;
    }

    let canvas = {
        width: 842,
        height: 595,
        paper: "A4",
        orientation: "L",
        background: "https://bucket-netcred-media.s3.ap-south-1.amazonaws.com/9pZHtrEu7Zg2BufoxUCD8h8QLgv1/VNavSjHg0RZ1BqvstsvOYB1lDbaX.png" // Default template
    };
    // let items = [];
    // Default template
    let items = [
        {
            "id": "lqutx9vji715g845o4r",
            "pos": {
                "top": "38.40336134453779%",
                "left": "12.019002375296933%"
            },
            "prop": {
                "bold": false,
                "font": "Birthstone",
                "size": 42,
                "color": "#284f9c",
                "italic": false,
                "textAlign": "center",
                "underline": false,
                "uppercase": false,
            },
            "size": {
                "width": "73.9192399049881%",
                "height": "7.5210084033613445%"
            },
            "type": "attribute",
            "content": "[recipient.name]",
            "editMode": false
        },
        {
            "id": "lqutzewb1biufdlgwj9",
            "pos": {
                "top": "11.848739495798318%",
                "left": "26.627078384798093%"
            },
            "prop": {
                "bold": true,
                "font": "Cinzel",
                "size": 40,
                "color": "#284f9c",
                "italic": false,
                "textAlign": "center",
                "underline": false,
                "uppercase": false,
            },
            "size": {
                "width": "43.752969121140126%",
                "height": "9.20168067226891%"
            },
            "type": "text",
            "content": "CERTIFICATE",
            "editMode": true
        },
        {
            "id": "lquu11k72byox43rtmb",
            "pos": {
                "top": "20.042016806722696%",
                "left": "27.232779097387155%"
            },
            "prop": {
                "bold": true,
                "font": "Cinzel",
                "size": 21,
                "color": "#284f9c",
                "italic": false,
                "textAlign": "center",
                "underline": false,
                "uppercase": false,
            },
            "size": {
                "width": "43.752969121140126%",
                "height": "9.20168067226891%"
            },
            "type": "text",
            "content": "OF PARTICIPATION",
            "editMode": true
        },
        {
            "id": "lquu1vu6r2ulg141zlh",
            "pos": {
                "top": "31.092436974789912%",
                "left": "27.71971496437051%"
            },
            "prop": {
                "bold": false,
                "font": "Baskervville",
                "size": 18,
                "color": "#284f9c",
                "italic": true,
                "textAlign": "center",
                "underline": false,
                "uppercase": false,
            },
            "size": {
                "width": "42.56532066508313%",
                "height": "5.336134453781524%"
            },
            "type": "text",
            "content": "The following award is given to",
            "editMode": true
        },
        {
            "id": "lquu3ak0a7ymyzusx2r",
            "pos": {
                "top": "75.25210084033613%",
                "left": "14.073634204275498%"
            },
            "prop": {
                "bold": true,
                "font": "Cinzel",
                "size": 16,
                "color": "#284f9c",
                "italic": true,
                "textAlign": "center",
                "underline": false,
                "uppercase": false,
            },
            "size": {
                "width": "17.980997624703072%",
                "height": "5.336134453781524%"
            },
            "type": "text",
            "content": "Hannan Satopay",
            "editMode": true
        },
        {
            "id": "lquu3wd3gjj3grsj8as",
            "pos": {
                "top": "79.07563025210084%",
                "left": "13.72921615201896%"
            },
            "prop": {
                "bold": false,
                "font": "Baskervville",
                "size": 16,
                "color": "#284f9c",
                "italic": true,
                "textAlign": "center",
                "underline": false,
                "uppercase": false,
            },
            "size": {
                "width": "17.980997624703072%",
                "height": "5.336134453781524%"
            },
            "type": "text",
            "content": "Chief Executive",
            "editMode": true
        },
        {
            "id": "lquu4b5zxapul0reaqr",
            "pos": {
                "top": "73.8655462184874%",
                "left": "63.372921615201896%"
            },
            "prop": {
                "bold": true,
                "font": "Cinzel",
                "size": 16,
                "color": "#284f9c",
                "italic": true,
                "textAlign": "center",
                "underline": false,
                "uppercase": false,
            },
            "size": {
                "width": "17.980997624703072%",
                "height": "5.336134453781524%"
            },
            "type": "text",
            "content": "Munsif Satopay",
            "editMode": true
        },
        {
            "id": "lquu4k5qmppg87159cl",
            "pos": {
                "top": "78.19327731092439%",
                "left": "63.147268408551035%"
            },
            "prop": {
                "bold": false,
                "font": "Baskervville",
                "size": 16,
                "color": "#284f9c",
                "italic": true,
                "textAlign": "center",
                "underline": false,
                "uppercase": false,
            },
            "size": {
                "width": "17.980997624703072%",
                "height": "5.336134453781524%"
            },
            "type": "text",
            "content": "Head of Community",
            "editMode": true
        },
        {
            "id": "lquu5d2pknt9f7wm5u",
            "pos": {
                "top": "74.20168067226888%",
                "left": "15.463182897862238%"
            },
            "prop": {
                "size": 1,
                "type": "solid",
                "color": "#284f9c"
            },
            "size": {
                "width": "15.368171021377677%",
                "height": null
            },
            "type": "line-horizontal",
            "content": null,
            "editMode": false
        },
        {
            "id": "lquu663ec3catu5su49",
            "pos": {
                "top": "73.31932773109243%",
                "left": "64.64370546318293%"
            },
            "prop": {
                "size": 1,
                "type": "solid",
                "color": "#284f9c"
            },
            "size": {
                "width": "15.368171021377677%",
                "height": null
            },
            "type": "line-horizontal",
            "content": null,
            "editMode": false
        },
        {
            "id": "lquu73h38k9lvi8ahhs",
            "pos": {
                "top": "51.05042016806721%",
                "left": "26.781472684085468%"
            },
            "prop": {
                "bold": false,
                "font": "Baskervville",
                "size": 18,
                "color": "#284f9c",
                "italic": true,
                "textAlign": "center",
                "underline": false,
                "uppercase": false,
            },
            "size": {
                "width": "42.56532066508313%",
                "height": "5.336134453781524%"
            },
            "type": "text",
            "content": "For participating in the seminar on",
            "editMode": true
        },
        {
            "id": "lquu8ipc7puhus3p2o3",
            "pos": {
                "top": "58.57142857142856%",
                "left": "25.724465558194726%"
            },
            "prop": {
                "bold": true,
                "font": "Cinzel",
                "size": 18,
                "color": "#284f9c",
                "italic": true,
                "textAlign": "center",
                "underline": false,
                "uppercase": false,
            },
            "size": {
                "width": "42.56532066508313%",
                "height": "5.336134453781524%"
            },
            "type": "text",
            "content": "Machine Learning",
            "editMode": true
        },
        {
            "id": "lquu8tbz9l27p0yv394",
            "pos": {
                "top": "92.35294117647051%",
                "left": "4.536817102137771%"
            },
            "prop": {
                "bold": false,
                "font": "Baskervville",
                "size": 12,
                "color": "#ffffff",
                "italic": false,
                "textAlign": "center",
                "underline": false,
                "uppercase": false,
            },
            "size": {
                "width": "12.04275534441806%",
                "height": "3.3193277310924354%"
            },
            "type": "attribute",
            "content": "[credential.id]",
            "editMode": false
        }
    ];
    
    let attributes = {
        "[recipient.name]": true, // Default template
        "[credential.id]": true, // Default template
        "[credential.expiry]": false,
        "[credential.issued]": false,
        "[issuer.name]": false,
        "[group.name]": false
    };

    if (data.design) {
        designId = data.design.id;
        canvas = data.design.canvas;
        items = data.design.items;
        designName = data.design.name;
        attributes["[recipient.name]"] = false;
        attributes["[credential.id]"] = false;
        data.design.attributes.forEach(attr => {
            attributes[attr] = true;
        });
    }
    // let sortedFonts = []; 
    async function loadFonts() {
        // console.log("--called--\n");
        // let fonts = items.filter(item => item.prop && item.prop.font).map(item => item.prop.font);
        // fonts.forEach(font => {
        //     addFont(font); 
        // });
        // console.log(fonts,"--fonts--");
        dropdownFont = true;
        // sortedFonts = [...filteredFonts].sort((a, b) => {
        //     if (a.name === selectedFont) return -1;
        //     if (b.name === selectedFont) return 1;
        //     return 0;
        // });
    }

    // onMount(async () => {
    //     loadFonts();
	// 	// let fonts = items.filter(item => item.prop && item.prop.font).map(item => item.prop.font);
    //     // fonts.forEach(font => {
    //     //     addFont(font); 
    //     // });
	// });

    function addFont(font) {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family='+getApiUrl(font);
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }

    let activeId = null;
    let activeElement = null;
    let customAttribute = null;
    let showVerticalGridLine = false;
    let showHorizontalGridLine = false;
    let temp = null;
    let activeTab = "document";
    let letterspacing = 0;
    let linespacing = 0;
    let transparency = null;
    let itemColor = null;
    let documentColor = [];

    function enableEditMode(event) {
        const index = getItemIndexById(event.target.parentElement.id);
        if (index !== -1) {
            items[index].editMode = true;
            items = [...items];
        }
    }

    function updateActiveElementContent(event) {
        const index = getItemIndexById(activeElement.id);
        if (index !== -1) {
            items[index].content = event.target.textContent;
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
            // showVerticalGridLine = Math.abs(centerX - canvas.width / 2) < 8;
            // showHorizontalGridLine = Math.abs(centerY - canvas.height / 2) < 8;
            showVerticalGridLine = Math.abs(parseFloat(centerX) - canvas.width / 2);
            showHorizontalGridLine = Math.abs(parseFloat(centerY) - canvas.height / 2);
            triggerAction();
        } else {
            showVerticalGridLine = false;
            showHorizontalGridLine = false;
        }
    }

    function onMouseUp(event) {
        if (!(editor.contains(event.target) || toolbar.contains(event.target))) {
            activeId = null;
            activeElement = null;
            actionEnable = false;
        } else {
            setActive(activeId);
        }
    }

    function setActive(event) {
        triggerAction();
        if (event?.detail) {
            activeId = event.detail;
            lastActiveTab = activeTab === "position" ? lastActiveTab : activeTab;
            activeTab = lastActiveTab === "color" ? lastActiveTab : "position";
        } else { activeId = event }

        activeElement = items.find((el) => el.id === activeId);
        temp = activeElement;
        selectedFont = temp?.prop?.font || null;
        letterspacing = activeElement?.prop?.letterSpacing ? activeElement?.prop?.letterSpacing : 0;
        linespacing = activeElement?.prop?.lineSpacing ? activeElement?.prop?.lineSpacing : 0;
        transparency = activeElement?.prop?.opacity ? activeElement?.prop?.opacity : 0;
    }
    
    function addCustomAttribute() {
        attributes[
            "[custom." + customAttribute.toLowerCase().replace(/\s+/g, "_") + "]"
        ] = false;
        customAttribute = null;
        defaultModal = false;
    }

    function updateElementStyle(type, action) {
        
        if (activeElement?.id != null || activeElement?.id != undefined) {
            const index = getItemIndexById(activeElement.id);
            
            if (index === -1) return;

            let prop = items[index].prop;

            let current_values = {
                "id": activeElement?.id,
                "type": type,
                "item": items[index],
                "action": "updated"
            };

            switch (type) {
                case "fontSize":
                    current_values['value'] = action === 1 ? -1 : 1;
                    prop.size = Math.max(prop.size + 1 * action, 1);
                    break;
                case "fontSizeChange":
                    current_values['value'] = prop.size;
                    prop.size = Math.max(activeElement.prop.size, 1);
                    break;
                // case "font":
                //     console.log("--Case-font-line-515--");
                //     current_values['value'] = prop.font;
                //     prop.font = action;
                //     const link = document.createElement('link');
                //     link.href = 'https://fonts.googleapis.com/css2?family='+getApiUrl(action);
                //     link.rel = 'stylesheet';
                //     document.head.appendChild(link);
                //     dropdownFont = false;
                case "fontColor":
                    current_values['value'] = prop['color'];
                    prop['color'] = action;
                    updateDocumentColor();
                    break;
                case "alignment":
                    current_values['value'] = prop.textAlign;
                    prop.textAlign = action;
                    break;
                case "type":
                    current_values['value'] = prop[type];
                    prop[type] = action;
                    break;
                case "style":
                    current_values['value'] = action;
                    prop[action] = !prop[action];
                    break;
                case "qrColor":
                    current_values['value'] = {
                        "background": prop.background,
                        "foreground": prop.foreground
                    };
                    prop.background = "#FFFFFF00";
                    prop.foreground = activeElement.prop.foreground;
                    break;
                case "letterSpacing":
                    current_values['value'] = prop.letterSpacing;
                    prop.letterSpacing = action;
                    break;
                case "lineSpacing":
                    current_values['value'] = prop.lineSpacing;
                    prop.lineSpacing = action;
                    break;
                case "transparency":
                    current_values['value'] = prop.opacity;
                    prop.opacity = action;
                    break;
            }

            items[index] = { ...items[index], prop };
            activeElement = items[index];
            
            pushAndTrim(undoStack, current_values);
        } 
        if (type === 'font' &  (temp?.id != undefined || temp?.id != null)) {
            const index = getItemIndexById(temp.id);
            if (index === -1) return;
            let current_values = {
                "id": temp?.id,
                "type": type,
                "item": items[index],
                "action": "updated"
            };
            
            let prop = items[index].prop;
            current_values['value'] = prop.font;
            prop.font = action;
            const link = document.createElement('link');
            link.href = 'https://fonts.googleapis.com/css2?family='+getApiUrl(action);
            link.rel = 'stylesheet';
            document.head.appendChild(link);
            dropdownFont = true;
            selectedFont =  action; 

            items[index] = { ...items[index], prop };
            activeElement = items[index];
            pushAndTrim(undoStack, current_values);
        }

        // pushAndTrim(undoStack, current_values);
    }

    function addElement(type, value) {
        let id = generateRandomID();
        let newItem = {
            id: id,
            content:
                type === "text"
                    ? "Add some text"
                    : type === "attribute"
                    ? value
                    : null,
            editMode: false,
            type: type === "line" ? value : type,
            pos: { left: "10%", top: "10%" },
            size: { width: "20%", height: "5%" },
            prop: {
                size: 18,
                color: "#000000",
                bold: false,
                italic: false,
                underline: false,
                textAlign: "center",
                font: "Roboto",
                uppercase: false,
                letterSpacing: 0,
                opacity: 0,
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
        }
        items.push(newItem);
        setActive({
            detail: id,
        });
        items = items;

        pushAndTrim(undoStack, {
            "id": id,
            "item": type,
            "action": "created"
        });
    }

    function deleteAttribute(attribute) {
        delete attributes[attribute];
        attributes = attributes;
    }

    function deleteItem() {
        const itemId = items.find((item) => item.id === activeId).id;
        const index = getItemIndexById(activeElement.id);
        if (index === -1) return;

        //  -- Removed on 03/03/2024 ---
        // let current_values = {
        //     "id": activeElement?.id,
        //     "item": items[index],
        //     "action": "deleted"
        // };
        
        // pushAndTrim(undoStack, current_values); Removed on 03/03/2024

        if (activeElement.type == "attribute") {
            attributes[activeElement.content] = false;
        }

        items = items.filter((item) => item.id !== itemId);
        activeId = null;
        activeElement = null;
        actionEnable = false;
        handleDeleteDocumentColor();
    }

    function duplicateItem() {
        const item = items.find((item) => item.id === activeId);
        let id = generateRandomID();
        let newElement = cloneDeep(item);
        newElement.id = id;
        newElement.pos = { left: parseFloat(item.pos.left.replace('%', '')) + 5 + '%', top: parseFloat(item.pos.top.replace('%', '')) + 5 + '%' };
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
        let type = 'certificate';
        let response = await fetch('/api/create-design', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type, designName, designId, canvas, items, attributes }),
        });
        loading = false;
        if (response.ok) {
            toastType = 'success';
            toastMessage = `Design ${data.design?'updated':'created'} successfully!`;
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

    function moveElement(area) {
        const index = getItemIndexById(temp.id);
        if (index === -1) return;

        let pos = items[index].pos;
        let widthPercent = temp.size.width;
        let heightPercent = temp.size.height;

        let current_values = {
            "id": temp?.id,
            "value": {
                "left": pos.left,
                "top": pos.top
            },
            "action": "updated_position"
        };

        if (widthPercent && heightPercent) {
                let width = parseFloat(widthPercent.replace('%', ''));
                let height = parseFloat(heightPercent.replace('%', ''));

                switch (area) {
                    case "top":
                        pos.top = "0%";
                        break;
                    case "left":
                        pos.left = "0%";
                        break;
                    case "center":
                        let center = 50 - width / 2;
                        pos.left = `${center}%`;
                        break;
                    case "middle":
                        let m_top = 50 - height / 2;
                        let m_left = 50 - width / 2;
                        pos.top = `${m_top}%`;
                        pos.left = `${m_left}%`;
                        break;
                    case "bottom":
                        let b_top = 100 - height;
                        pos.top = `${b_top}%`;
                        break;
                    case "right":
                        let right = 100 - width;
                        pos.left = `${right}%`;
                        break;    
                }

                items[index] = { ...items[index], pos };
                activeElement = items[index];

        } else if (items[index].type == "line-horizontal" || items[index].type == "image") {

                let width = parseFloat(widthPercent.replace('%', ''));
                let line_id = items[index].id;
                var element = document.getElementById(line_id);
                var height = element.offsetHeight / 100 * 16.9;

                switch (area) {
                    case "top":
                        pos.top = "0%";
                        break;
                    case "left":
                        pos.left = "0%";
                        break;
                    case "center":
                        let center = 50 - width / 2;
                        pos.left = `${center}%`;
                        break;
                    case "middle":
                        let m_top = 50 - height / 2;
                        let m_left = 50 - (width + 0.4) / 2;
                        pos.top = `${m_top}%`;
                        pos.left = `${m_left}%`;
                        break;
                    case "bottom":
                        let b_top = 100 - height;
                        pos.top = `${b_top}%`;
                        break;
                    case "right":
                        let right = 100 - (width + 0.4);
                        pos.left = `${right}%`;
                        break;    
                }

                items[index] = { ...items[index], pos };
                activeElement = items[index];

        } else if (items[index].type == "line-vertical") {

                let line_id = items[index].id;
                var element = document.getElementById(line_id);
                var width = element.offsetWidth / 100 * 16.9;
                let height = element.offsetHeight / 100 * 16.9;

                switch (area) {
                    case "top":
                        pos.top = "0%";
                        break;
                    case "left":
                        pos.left = "0%";
                        break;
                    case "center":
                        let center = 50 - width / 2;
                        pos.left = `${center}%`;
                        break;
                    case "middle":
                        let m_top = 50 - height / 2;
                        let m_left = 50 - width / 2;
                        pos.top = `${m_top}%`;
                        pos.left = `${m_left}%`;
                        break;
                    case "bottom":
                        let b_top = 100 - height;
                        pos.top = `${b_top}%`;
                        break;
                    case "right":
                        let right = 100 - width;
                        pos.left = `${right}%`;
                        break;
                }

                items[index] = { ...items[index], pos };
                activeElement = items[index];
        }

        pushAndTrim(undoStack, current_values); 
    }

  function filterFonts() {
    filteredFonts = fonts.filter(font => font.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

  function handleKeyDown(event) {
        // Ensure the enter key is handled for accessibility
        if (event.key === 'Enter') {
            enableEditMode();
        }

        if (event.ctrlKey && event.key === 'z') {
        undo();

        } else if (event.ctrlKey && event.key === 'y') {
        redo();
        }
    }

    function handleKeyUp(event) {
        // Ensure the spacebar key is handled for accessibility
        if (event.key === ' ') {
            enableEditMode();
        }
    }

    function handleKeyDownDel(event) {
        // Ensure the enter key is handled for accessibility
        if (event.key === 'Enter') {
            deleteAttribute(key);
        }
    }

    function handleKeyUpDel(event) {
        // Ensure the spacebar key is handled for accessibility
        if (event.key === ' ') {
            deleteAttribute(key);
        }
    }

    function handleDocumentColor() {

        for (let i=0; i<=items.length; i++) {
            if (!documentColor.includes(items[i]?.prop?.color) && items[i]?.prop?.color != undefined){
                documentColor.push(items[i]?.prop?.color);
            }
        }
        documentColor = removeDuplicates(documentColor);
    }

    function handleDeleteDocumentColor(colorName=null) {
        if (colorName) {
            // If colorName is provided, find and remove all items with that color
            // documentColor = documentColor.filter(color => color.color !== colorName);
            const index = documentColor.indexOf(colorName);
            if (index !== -1) {
                documentColor.splice(index, 1);
                // console.log(`Color ${colorName} removed from documentColor.`);
            } else {
                // console.log(`Color ${colorName} not found in documentColor.`);
            }
            // for (let i=0; i<=items.length; i++) {
            //     documentColor
            // }
            // console.log(`Color ${colorName} removed from documentColor.`);
        }else {
            let counter = 0;
            for (let i=0; i<=items.length; i++) {
                if (items[i]?.prop?.color === temp?.prop?.color) {
                    counter++;
                }
            }
            if (counter === 0) {
                const index = documentColor.indexOf(temp?.prop?.color);
            if (index !== -1) {
                documentColor.splice(index, 1);
                // console.log(`Color ${temp?.prop?.color} removed from documentColor.`);
            } else {
                // console.log(`Color ${temp?.prop?.color} not found in documentColor.`);
            }
            // const index = documentColor.findIndex(item => item.color === temp?.prop?.color);
            // // Check if the color is found
            // if (index !== -1) {
            //     // Remove the object from documentColor array
            //     documentColor.splice(index, 1);
            //     console.log(`Color ${temp?.prop?.color} removed from documentColor.`);
            // } else {
            //     console.log(`Color ${temp?.prop?.color} not found in documentColor.`);
            // }
            }
            activeTab="document";
        }
    }

    function handleRemoveObsoleteDocumentColor() {
        for (let i = documentColor.length - 1; i >= 0; i--) {
        let colorFound = false;
        for (let j = 0; j < items.length; j++) {
            if (documentColor[i] === items[j]?.prop?.color) {
                colorFound = true;
                break;
            }
        }
        if (!colorFound) {
            documentColor.splice(i, 1);
        }
    }
    }

    function removeDuplicates(documentColor) {
    for (let j = 0; j < documentColor.length; j++) {
        for (let k = j + 1; k < documentColor.length; k++) {
            if (documentColor[j] === documentColor[k]) {
                documentColor.splice(k, 1);
                k--; // Adjust the index after removing an element
            }
        }
    }
    return documentColor;
    }

    function updateDocumentColor() {
        handleDocumentColor();
        handleRemoveObsoleteDocumentColor();
        handleDocumentColor();
        for (let j=0; j <= documentColor.length; j++) {
            for (let k=0; k <= j - documentColor.length; k++) {
                if (documentColor[j] === documentColor[k]) {
                    documentColor.pop(documentColor[j]);
                }
            }
        }
    }

    function handleUpdateDocumentColor(activeId, itemColor) {
        setActive(activeId);
        updateElementStyle("fontColor", itemColor);
        updateDocumentColor();
    }

    let undoStack = [];
    let redoStack = [];

    const MAX_STACK_SIZE = 10;

    function pushAndTrim(stack, item) {
    stack.push(item);
    if (stack.length > MAX_STACK_SIZE) {
        stack.shift(); // Remove the oldest item
    }
    }

    function undo() {
        if (undoStack.length > 0) {
        const action = undoStack.pop();
        const index = getItemIndexById(action['id']);

        // if (index === -1) return;

        let current_values = {
            "id": action['id'],
            "type": action['type'] ? action['type'] : null,
            "item": items[index] ? items[index] : null,
            "action": action['action']
        };
        // redoStack.push(current_values);

        if (action['action'] === "created") {
            setActive(action['id']);
            deleteItem();
        }
        if (action['action'] === "updated") {
            setActive(action['id']);
            const index = getItemIndexById(activeElement.id);
            if (index === -1) return;

            let prop = items[index].prop;
            switch (action['type']) {
                case "fontSize":
                    current_values['value'] = action['value'] === 1 ? -1 : 1;
                    prop.size = Math.max(prop.size + 1 * action['value'], 1);
                    break;
                case "fontSizeChange":
                    current_values['value'] = prop.size;
                    prop.size = Math.max(activeElement.prop.size, 1);
                    break;
                case "fontColor":
                    current_values['value'] = prop['color'];
                    prop['color'] = action['value'];
                    updateDocumentColor();
                    break;
                case "alignment":
                    prop.textAlign = action['value'];
                    break;
                case "type":
                    current_values['value'] = prop[type];
                    prop[type] = action;
                    break;
                case "style":
                    current_values['value'] = action['value'];
                    prop[action['value']] = !prop[action['value']];
                    break;
                case "qrColor":
                    current_values['value'] = {
                        "background": prop.background,
                        "foreground": prop.foreground
                    };
                    prop.background = "#FFFFFF00";
                    prop.foreground = activeElement.prop.foreground;
                    break;
                case "letterSpacing":
                    current_values['value'] = prop.letterSpacing;
                    prop.letterSpacing = action['value'];
                    break;
                case "lineSpacing":
                    current_values['value'] = prop.lineSpacing;
                    prop.lineSpacing = action['value'];
                    break;
                case "transparency":
                    current_values['value'] = prop.opacity;
                    prop.opacity = action['value'];
                    break;
                case "font":
                    if (temp?.id != undefined || temp?.id != null) {
                        current_values['value'] = prop.font;
                        prop.font = action['value'];
                        const link = document.createElement('link');
                        link.href = 'https://fonts.googleapis.com/css2?family='+getApiUrl(action['value']);
                        link.rel = 'stylesheet';
                        document.head.appendChild(link);
                        dropdownFont = false;
                    }
                    break;
            }

            items[index] = { ...items[index], prop };
            activeElement = items[index];
            setActive(action['id']);
        }
        if (action['action'] === "updated_position") {
            setActive(action['id']);
            const index = getItemIndexById(temp.id);
            if (index === -1) return;
            let pos = action['value'];
            items[index].pos = pos;
        }
        if (action['action'] === "deleted") {
            items.push(action['item']);
            setActive({
                detail: action['id'],
            });
            items = items;
        }

        pushAndTrim(redoStack, current_values);
        }
    }

    function redo() {
        if (redoStack.length > 0) {
        const action = redoStack.pop();
        const index = getItemIndexById(action['id']);
        // if (index === -1) return;
        
        let current_values = {
            "id": action['id'],
            "type": action['type'] ? action['type'] : null,
            "item": items[index] ? items[index] : null,
            "action": action['action'] ? action['action'] : null
        };
        
        if (action['action'] === "deleted") {
            setActive(action['id']);
            deleteItem();
        }
        if (action['action'] === "updated") {
            setActive(action['id']);
            const index = getItemIndexById(activeElement.id);
            if (index === -1) return;

            let prop = items[index].prop;
            switch (action['type']) {
                case "fontSize":
                    current_values['value'] = action['value'] === 1 ? -1 : 1;
                    prop.size = Math.max(prop.size + 1 * action['value'], 1);
                    break;
                case "fontSizeChange":
                    current_values['value'] = prop.size;
                    prop.size = Math.max(activeElement.prop.size, 1);
                    break;
                case "fontColor":
                    current_values['value'] = prop['color'];
                    prop['color'] = action['value'];
                    updateDocumentColor();
                    break;
                case "alignment":
                    prop.textAlign = action['value'];
                    prop.textAlign = action['value'];
                    break;
                case "type":
                    current_values['value'] = prop[type];
                    prop[type] = action;
                    break;
                case "style":
                    current_values['value'] = action['value'];
                    prop[action['value']] = !prop[action['value']];
                    break;
                case "qrColor":
                    current_values['value'] = {
                        "background": prop.background,
                        "foreground": prop.foreground
                    };
                    prop.background = "#FFFFFF00";
                    prop.foreground = activeElement.prop.foreground;
                    break;
                case "letterSpacing":
                    current_values['value'] = prop.letterSpacing;
                    prop.letterSpacing = action['value'];
                    break;
                case "lineSpacing":
                    current_values['value'] = prop.lineSpacing;
                    prop.lineSpacing = action['value'];
                    break;
                case "transparency":
                    current_values['value'] = prop.opacity;
                    prop.opacity = action['value'];
                    break;
                case "font":
                    if (temp?.id != undefined || temp?.id != null) {
                        current_values['value'] = prop.font;
                        prop.font = action['value'];
                        const link = document.createElement('link');
                        link.href = 'https://fonts.googleapis.com/css2?family='+getApiUrl(action['value']);
                        link.rel = 'stylesheet';
                        document.head.appendChild(link);
                        dropdownFont = false;
                    }
                    break;
            }

            items[index] = { ...items[index], prop };
            activeElement = items[index];
            setActive(action['id']);
        }
        if (action['action'] === "updated_position") {
            setActive(action['id']);
            const index = getItemIndexById(temp.id);
            if (index === -1) return;
            let pos = action['value'];
            items[index].pos = pos;
        }
        if (action['action'] === "created") {
            items.push(action['item']);
            setActive({
                detail: action['id'],
            });
            items = items;
        }

        // undoStack.push(action);
        pushAndTrim(undoStack, current_values);
        }
    }

    onMount(() => {
        document.addEventListener('keydown', handleKeyDown);

        // Clean up event listener on component unmount
        return () => {
        document.removeEventListener('keydown', handleKeyDown);
        };
    });
    
    $: letterspacing && updateElementStyle("letterSpacing", letterspacing);
    $: linespacing && updateElementStyle("lineSpacing", linespacing);
    $: transparency && updateElementStyle("transparency", transparency);

    let triggerAction = () => {
        if (activeElement) {
            actionEnable = true;
            let newWidth = parseFloat((parseFloat(activeElement.size.width.replace('%', '') / 100)) * canvas.width)/2;
            actionLeft = ((parseFloat(activeElement.pos.left.replace('%', '') / 100)) * canvas.width + newWidth - 40) + 'px';
            actionTop = (((parseFloat(activeElement.pos.top.replace('%', '') / 100)) * canvas.height) - 50) + 'px';
        } else {
            actionEnable = false;
        }
    }

    $: sortedFonts = [...filteredFonts].sort((a, b) => {
    if (a.name === selectedFont) return -1;
    if (b.name === selectedFont) return 1;
    return 0;
  });
</script>

<svelte:window on:keydown={handleShortcut} on:mouseup={onMouseUp}/>

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
                {:else}
                    {#if data.design}
                        Update Design
                    {:else}
                        Create Design
                    {/if}
                {/if}
                </button>
        </div>
        <div class="playground grid grid-cols-10 bg-white dark:text-gray-400 dark:bg-gray-800">
            <!-- Sidebar -->
            <div
                class="col-span-3 pe-3 border-e border-gray-200 overflow-y-auto"
            >
                <div class="grid grid-cols-12 h-full">
                    <ul
                        class="col-span-3 border-e border-gray-200 h-full text-sm font-medium text-gray-500 dark:text-gray-400 md:me-4 mb-4 md:mb-0"
                    >
                        <li>
                            <button
                                on:click={() => (activeTab = "document")}
                                class="{activeTab == 'document'
                                    ? 'text-white bg-blue-700'
                                    : 'hover:text-gray-900 hover:bg-gray-100'} text-xs flex flex-col items-center px-4 py-3 active w-full"
                                aria-current="page"
                            >
                                <i
                                    class="icon-file text-xl {activeTab ==
                                    'document'
                                        ? 'text-white'
                                        : 'text-gray-500 dark:text-gray-400'}"
                                />
                                Document
                            </button>
                        </li>
                        <li>
                            <button
                                on:click={() => (activeTab = "text")}
                                class="{activeTab == 'text'
                                    ? 'text-white bg-blue-700'
                                    : 'hover:text-gray-900 hover:bg-gray-100'} text-xs flex flex-col items-center px-4 py-3 w-full"
                            >
                                <i
                                    class="icon-text-size text-xl {activeTab ==
                                    'text'
                                        ? 'text-white'
                                        : 'text-gray-500 dark:text-gray-400'}"
                                />
                                Text
                            </button>
                        </li>
                        <li>
                            <button
                                on:click={() => (activeTab = "elements")}
                                class="{activeTab == 'elements'
                                    ? 'text-white bg-blue-700'
                                    : 'hover:text-gray-900 hover:bg-gray-100'} text-xs flex flex-col items-center px-4 py-3 w-full"
                            >
                                <i
                                    class="icon-grid-2-plus text-xl {activeTab ==
                                    'elements'
                                        ? 'text-white'
                                        : 'text-gray-500 dark:text-gray-400'}"
                                />
                                Elements
                            </button>
                        </li>
                    </ul>
                    <div
                        class="col-span-9 py-3 text-medium text-gray-500 dark:text-gray-400 dark:bg-gray-800 rounded-lg w-full"
                    >
                        {#if activeTab == "document"}
                            <p class="font-medium">Paper Size</p>
                            <div class="grid grid-cols-2 gap-2">
                                <div class="flex items-center">
                                    <input
                                        value="A4"
                                        bind:group={canvas.paper}
                                        on:change={onDocChange}
                                        id="p-a4"
                                        type="radio"
                                        name="paper"
                                        class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <label
                                        for="p-a4"
                                        class="w-full py-2 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                                        >A4</label
                                    >
                                </div>
                                <div class="flex items-center">
                                    <input
                                        value="USL"
                                        bind:group={canvas.paper}
                                        on:change={onDocChange}
                                        id="p-letter"
                                        type="radio"
                                        name="paper"
                                        class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <label
                                        for="p-letter"
                                        class="w-full py-2 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                                        >US Letter</label
                                    >
                                </div>
                            </div>

                            <p
                                class="font-medium border-t border-gray-200 dark:border-gray-700 mt-4 pt-4"
                            >
                                Orientation
                            </p>
                            <div class="grid grid-cols-2 gap-2">
                                <div class="flex items-center">
                                    <input
                                        value="L"
                                        bind:group={canvas.orientation}
                                        on:change={onDocChange}
                                        id="o-landscape"
                                        type="radio"
                                        name="orientation"
                                        class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <label
                                        for="o-landscape"
                                        class="w-full py-2 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                                        >Landscape</label
                                    >
                                </div>
                                <div class="flex items-center">
                                    <input
                                        value="P"
                                        bind:group={canvas.orientation}
                                        on:change={onDocChange}
                                        id="o-portrait"
                                        type="radio"
                                        name="orientation"
                                        class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <label
                                        for="o-portrait"
                                        class="w-full py-2 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                                        >Portrait</label
                                    >
                                </div>
                            </div>

                            <p
                                class="font-medium border-t border-gray-200 dark:border-gray-700 mt-4 pt-4"
                            >
                                Background Image
                            </p>
                            <form
                                method="post"
                                enctype="multipart/form-data"
                                use:enhance={() => {
                                    formLoading1 = true;
                                    return async ({ result, update }) => {
                                        await update({ reset: false });
                                        formLoading1 = false;
                                        handleBackground(result);
                                    };
                                }}
                            >
                                <button
                                    disabled={formLoading1}
                                    on:click={() => fileInput.click()}
                                    type="button"
                                    class="uppercase w-full mt-2 text-xs text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2"
                                >
                                    {#if formLoading1}
                                        <Spinner size="5" color="white" />
                                    {:else}
                                        <i class="icon-upload me-1" /> Upload Image
                                    {/if}
                                </button>
                                <p
                                    class="text-xs text-gray-500 dark:text-gray-300"
                                >
                                    PNG, JPG
                                </p>
                                <p
                                    class="text-xs text-gray-500 dark:text-gray-300"
                                >
                                    Minimum - {po[
                                        canvas.paper + "-" + canvas.orientation
                                    ].actualWidth} x {po[
                                        canvas.paper + "-" + canvas.orientation
                                    ].actualHeight} pixels
                                </p>
                                <p
                                    class="text-xs text-gray-500 dark:text-gray-300"
                                >
                                    The maximum image size is 2MB.
                                </p>
                                <input
                                    class="hidden"
                                    type="file"
                                    accept=".jpg,.jpeg,.png"
                                    name="image"
                                    bind:this={fileInput}
                                    on:change={() =>
                                        verifyImage(_formBackground, fileInput)}
                                />
                                <input class="hidden" type="text" name="designId" bind:value={designId}/>
                                <button
                                    bind:this={_formBackground}
                                    type="submit"
                                    class="hidden">Submit</button
                                >
                            </form>
                        {:else if activeTab == "text"}
                            <button
                                on:click={() => addElement("text", "")}
                                type="button"
                                class="uppercase w-full mt-2 text-xs text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2"
                            >
                                <i class="icon-plus me-1" />
                                Add Text
                            </button>

                            <p
                                class="font-medium border-t border-gray-200 dark:border-gray-700 mt-4 pt-4"
                            >
                                Attributes
                            </p>
                            <button
                                on:click={() => (
                                    (defaultModal = true),
                                    (customAttribute = null)
                                )}
                                type="button"
                                class="uppercase w-full mt-2 text-xs text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2"
                            >
                                <i class="icon-plus me-1" />
                                Add Custom Attribute
                            </button>
                            <Modal
                                title="Create Attribute"
                                bind:open={defaultModal}
                                size="xs"
                            >
                                <div class="mb-6">
                                    <label
                                        for="attribute-name"
                                        class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                        >Name</label
                                    >
                                    <input
                                        bind:value={customAttribute}
                                        type="text"
                                        id="attribute-name"
                                        class="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div class="mb-6">
                                    <label
                                        for="attribute-tag"
                                        class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                                        >Tag</label
                                    >
                                    <input
                                        type="text"
                                        id="attribute-tag"
                                        value="custom."
                                        class="bg-gray-200 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                        disabled
                                    />
                                </div>
                                <svelte:fragment slot="footer">
                                    <Button
                                        on:click={addCustomAttribute}
                                        disabled={!customAttribute}
                                        >Create</Button
                                    >
                                    <Button
                                        color="alternative"
                                        on:click={() => (defaultModal = false)}
                                        >Cancel</Button
                                    >
                                </svelte:fragment>
                            </Modal>
                            <div class="flex flex-col space-y-2">
                                <div
                                    class="relative h-full flex-grow space-y-2 overflow-y-auto"
                                >
                                    <div
                                        class="border-b border-b-gray-400 last:border-none"
                                    >
                                        <h3
                                            class="text-xs font-medium capitalize"
                                        >
                                            Recipient
                                        </h3>
                                        <div class="py-2">
                                            <div
                                                class="flex items-center justify-between"
                                            >
                                                <span
                                                    class="break-all text-sm s-y_bCXRrkrYfP"
                                                    >Recipient Name</span
                                                >
                                                {#if attributes["[recipient.name]"]}
                                                    <button
                                                        type="button"
                                                        class="px-2 py-1 text-xs font-medium text-center text-green-700 bg-green-100 border border-green-700 rounded-lg"
                                                        disabled>In Use</button
                                                    >
                                                {:else}
                                                    <button
                                                        on:click={() =>
                                                            addElement(
                                                                "attribute",
                                                                "[recipient.name]"
                                                            )}
                                                        type="button"
                                                        class="px-2 py-1 text-xs font-medium text-center text-blue-700 bg-blue-100 border border-blue-700 rounded-lg hover:bg-blue-200"
                                                        >Use</button
                                                    >
                                                {/if}
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        class="border-b border-b-gray-400 last:border-none"
                                    >
                                        <h3
                                            class="text-xs font-medium capitalize"
                                        >
                                            Credential
                                        </h3>
                                        <div class="py-2 space-y-2">
                                            <div
                                                class="flex items-center justify-between"
                                            >
                                                <span class="break-all text-sm"
                                                    >Credential ID</span
                                                >
                                                {#if attributes["[credential.id]"]}
                                                    <button
                                                        type="button"
                                                        class="px-2 py-1 text-xs font-medium text-center text-green-700 bg-green-100 border border-green-700 rounded-lg"
                                                        disabled>In Use</button
                                                    >
                                                {:else}
                                                    <button
                                                        on:click={() =>
                                                            addElement(
                                                                "attribute",
                                                                "[credential.id]"
                                                            )}
                                                        type="button"
                                                        class="px-2 py-1 text-xs font-medium text-center text-blue-700 bg-blue-100 border border-blue-700 rounded-lg hover:bg-blue-200"
                                                        >Use</button
                                                    >
                                                {/if}
                                            </div>
                                            <div
                                                class="flex items-center justify-between"
                                            >
                                                <span class="break-all text-sm"
                                                    >Expiry Date</span
                                                >
                                                {#if attributes["[credential.expiry]"]}
                                                    <button
                                                        type="button"
                                                        class="px-2 py-1 text-xs font-medium text-center text-green-700 bg-green-100 border border-green-700 rounded-lg"
                                                        disabled>In Use</button
                                                    >
                                                {:else}
                                                    <button
                                                        on:click={() =>
                                                            addElement(
                                                                "attribute",
                                                                "[credential.expiry]"
                                                            )}
                                                        type="button"
                                                        class="px-2 py-1 text-xs font-medium text-center text-blue-700 bg-blue-100 border border-blue-700 rounded-lg hover:bg-blue-200"
                                                        >Use</button
                                                    >
                                                {/if}
                                            </div>
                                            <div
                                                class="flex items-center justify-between"
                                            >
                                                <span class="break-all text-sm"
                                                    >Issue Date</span
                                                >
                                                {#if attributes["[credential.issued]"]}
                                                    <button
                                                        type="button"
                                                        class="px-2 py-1 text-xs font-medium text-center text-green-700 bg-green-100 border border-green-700 rounded-lg"
                                                        disabled>In Use</button
                                                    >
                                                {:else}
                                                    <button
                                                        on:click={() =>
                                                            addElement(
                                                                "attribute",
                                                                "[credential.issued]"
                                                            )}
                                                        type="button"
                                                        class="px-2 py-1 text-xs font-medium text-center text-blue-700 bg-blue-100 border border-blue-700 rounded-lg hover:bg-blue-200"
                                                        >Use</button
                                                    >
                                                {/if}
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        class="border-b border-b-gray-400 last:border-none"
                                    >
                                        <h3
                                            class="text-xs font-medium capitalize"
                                        >
                                            Issuer
                                        </h3>
                                        <div class="py-2 space-y-2">
                                            <div
                                                class="flex items-center justify-between"
                                            >
                                                <span class="break-all text-sm"
                                                    >Issuer Name</span
                                                >
                                                {#if attributes["[issuer.name]"]}
                                                    <button
                                                        type="button"
                                                        class="px-2 py-1 text-xs font-medium text-center text-green-700 bg-green-100 border border-green-700 rounded-lg"
                                                        disabled>In Use</button
                                                    >
                                                {:else}
                                                    <button
                                                        on:click={() =>
                                                            addElement(
                                                                "attribute",
                                                                "[issuer.name]"
                                                            )}
                                                        type="button"
                                                        class="px-2 py-1 text-xs font-medium text-center text-blue-700 bg-blue-100 border border-blue-700 rounded-lg hover:bg-blue-200"
                                                        >Use</button
                                                    >
                                                {/if}
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        class="border-b border-b-gray-400 last:border-none"
                                    >
                                        <h3
                                            class="text-xs font-medium capitalize"
                                        >
                                            Group
                                        </h3>
                                        <div class="py-2 space-y-2">
                                            <div
                                                class="flex items-center justify-between"
                                            >
                                                <span class="break-all text-sm"
                                                    >Group Name</span
                                                >
                                                {#if attributes["[group.name]"]}
                                                    <button
                                                        type="button"
                                                        class="px-2 py-1 text-xs font-medium text-center text-green-700 bg-green-100 border border-green-700 rounded-lg"
                                                        disabled>In Use</button
                                                    >
                                                {:else}
                                                    <button
                                                        on:click={() =>
                                                            addElement(
                                                                "attribute",
                                                                "[group.name]"
                                                            )}
                                                        type="button"
                                                        class="px-2 py-1 text-xs font-medium text-center text-blue-700 bg-blue-100 border border-blue-700 rounded-lg hover:bg-blue-200"
                                                        >Use</button
                                                    >
                                                {/if}
                                            </div>
                                        </div>
                                    </div>
                                    {#if Object.keys(attributes).filter( (key) => key.includes("custom.") ).length}
                                        <div
                                            class="border-b border-b-gray-400 last:border-none"
                                        >
                                            <h3
                                                class="text-xs font-medium capitalize"
                                            >
                                                Custom
                                            </h3>
                                            <div class="py-2 space-y-2">
                                                {#each Object.keys(attributes).filter( (key) => key.includes("custom.") ) as key}
                                                    <div
                                                        class="flex items-center justify-between"
                                                    >
                                                        <span
                                                            class="break-all text-sm"
                                                            >{key
                                                                .replace(
                                                                    "custom.",
                                                                    ""
                                                                )
                                                                .replace(
                                                                    /_/g,
                                                                    " "
                                                                )
                                                                .replace(/\[|\]/g, "")
                                                                .split(" ")
                                                                .map(
                                                                    capitalizeFirstLetter
                                                                )
                                                                .join(
                                                                    " "
                                                                )}</span
                                                        >
                                                        <div
                                                            class="flex items-center space-x-3"
                                                        >
                                                            {#if attributes[key]}
                                                                <button
                                                                    type="button"
                                                                    class="px-2 py-1 text-xs font-medium text-center text-green-700 bg-green-100 border border-green-700 rounded-lg"
                                                                    disabled
                                                                    >In Use</button
                                                                >
                                                            {:else}
                                                                <button
                                                                    on:click={() =>
                                                                        addElement(
                                                                            "attribute",
                                                                            key
                                                                        )}
                                                                    type="button"
                                                                    class="px-2 py-1 text-xs font-medium text-center text-blue-700 bg-blue-100 border border-blue-700 rounded-lg hover:bg-blue-200"
                                                                    >Use</button
                                                                >
                                                                <!-- <i
                                                                    on:click={() =>
                                                                        deleteAttribute(
                                                                            key
                                                                        )}
                                                                    class="icon-trash-can cursor-pointer"
                                                                /> -->
                                                                <i
                                                                    on:click={() => deleteAttribute(key)}
                                                                    on:keydown={(event) => handleKeyDownDel(event)}
                                                                    on:keyup={(event) => handleKeyUpDel(event)}
                                                                    class="icon-trash-can cursor-pointer"
                                                                />
                                                            {/if}
                                                        </div>
                                                    </div>
                                                {/each}
                                            </div>
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        {:else if activeTab == "elements"}
                            <p class="font-medium">Images</p>
                            <form
                                method="post"
                                enctype="multipart/form-data"
                                use:enhance={() => {
                                    formLoading2 = true;
                                    return async ({ result, update }) => {
                                        await update({ reset: false });
                                        formLoading2 = false;
                                        addElement("image", result);
                                    };
                                }}
                            >
                                <button
                                    disabled={formLoading2}
                                    on:click={() => mediaInput.click()}
                                    type="button"
                                    class="uppercase w-full mt-2 text-xs text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2"
                                >
                                    {#if formLoading2}
                                        <Spinner size="5" color="white" />
                                    {:else}
                                        <i class="icon-upload me-1" /> Upload Image
                                    {/if}
                                </button>
                                <input
                                    class="hidden"
                                    type="file"
                                    accept=".jpg,.jpeg,.png"
                                    name="image"
                                    bind:this={mediaInput}
                                    on:change={() =>
                                        verifyImage(_formImage, mediaInput)}
                                />
                                <input class="hidden" type="text" name="designId" bind:value={designId}/>
                                <button
                                    bind:this={_formImage}
                                    type="submit"
                                    class="hidden">Submit</button
                                >
                            </form>
                            <p
                                class="font-medium border-t border-gray-200 dark:border-gray-700 mt-4 pt-4"
                            >
                                Lines
                            </p>
                            <div class="grid grid-cols-2">
                                <button
                                    on:click={() =>
                                        addElement("line", "line-horizontal")}
                                    type="button"
                                    class="flex h-32 w-full items-center justify-center border-none shadow-none hover:bg-gray-200"
                                    ><div
                                        class="bg-black h-0.5 w-[80%]"
                                    /></button
                                >
                                <button
                                    on:click={() =>
                                        addElement("line", "line-vertical")}
                                    type="button"
                                    class="flex h-32 w-full items-center justify-center border-none shadow-none hover:bg-gray-200"
                                    ><div
                                        class="bg-black h-[80%] w-0.5"
                                    /></button
                                >
                            </div>

                            <p
                                class="font-medium border-t border-gray-200 dark:border-gray-700 mt-4 pt-4"
                            >
                                QR Code
                            </p>
                            <button
                                on:click={() => addElement("qr", "")}
                                type="button"
                                class="uppercase w-full mt-2 text-xs text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2"
                            >
                                <i class="icon-plus me-1" />
                                Add QR Code
                            </button>
                            <p class="text-xs">
                                When displayed on the recipient's certificate
                                this will point to the live version of their
                                credential.
                            </p>
                        {:else if activeTab == "position"}
                        <p class="font-medium mb-2">Align to page</p>
                       
                        <div class="grid grid-cols-2 mb-2">
                            <div class="top-btn-container m-2 h-20 flex justify-center">
                                <div>
                                    <Label for="top" class="block mb-1 flex justify-center text-md">Top</Label>
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            moveElement("top")}
                                        type="button"
                                        id="top"
                                        class="pos-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg class="w-3 h-3 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 8">
                                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7 7.674 1.3a.91.91 0 0 0-1.348 0L1 7"/>
                                        </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div class="left-btn-container m-2 h-20 flex justify-center">
                                <div>
                                    <Label for="left" class="block mb-1 flex justify-center text-md">Left</Label>
                                    <div class="flex items-center justify-center">
                                    <button
                                        on:click={() =>
                                            moveElement("left")}
                                        type="button"
                                        id="left"
                                        class="pos-icons flex items-center justify-center border rounded-lg shadow-none hover:bg-gray-200"
                                        >
                                        <svg class="w-3 h-3 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 8 14">
                                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 1 1.3 6.326a.91.91 0 0 0 0 1.348L7 13"/>
                                        </svg>
                                    </button>
                                    </div>
                                </div>
                            </div>

                            <div class="middle-btn-container m-2 h-20 flex justify-center">
                                <div>
                                    <Label for="middle" class="block mb-1 flex justify-center text-md">Middle</Label>
                                    <div class="flex items-center justify-center">
                                        <button
                                            on:click={() =>
                                                moveElement("middle")}
                                            type="button"
                                            id="middle"
                                            class="pos-icons flex items-center justify-center border rounded-lg shadow-none hover:bg-gray-200"
                                            >
                                            <svg class="w-3 h-3 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 2">
                                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 1h16"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div class="center-btn-container m-2 h-20 flex justify-center">
                                <div>
                                <Label for="center" class="block mb-1 flex justify-center text-md">Center</Label>
                                <div class="flex items-center justify-center">
                                    <button
                                        on:click={() =>
                                            moveElement("center")}
                                        type="button"
                                        id="center"
                                        class="pos-icons flex items-center justify-center border rounded-lg shadow-none hover:bg-gray-200"
                                        >
                                        <svg class="w-3 h-3 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 1h8M1 5h12M3 9h8M1 13h12"/>
                                        </svg>
                                    </button>
                                </div>
                                </div>
                            </div>

                            <div class="bottom-btn-container m-2 h-20 flex justify-center">
                                <div>
                                    <Label for="bottom" class="block mb-1 flex justify-center text-md">Bottom</Label>
                                    <div class="flex items-center justify-center">
                                        <button
                                            on:click={() =>
                                                moveElement("bottom")}
                                            type="button"
                                            id="bottom"
                                            class="pos-icons flex items-center justify-center border rounded-lg shadow-none hover:bg-gray-200"
                                            >
                                            <svg class="w-3 h-3 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 8">
                                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 5.326 5.7a.909.909 0 0 0 1.348 0L13 1"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div class="right-btn-container m-2 h-20 flex justify-center">
                                <div>
                                    <Label for="right" class="block mb-1 flex justify-center text-md">Right</Label>
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            moveElement("right")}
                                        type="button"
                                        id="right"
                                        class="pos-icons flex items-center justify-center border rounded-lg shadow-none hover:bg-gray-200"
                                        >
                                        <svg class="w-3 h-3 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 8 14">
                                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 13 5.7-5.326a.909.909 0 0 0 0-1.348L1 1"/>
                                        </svg>
                                    </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- {#if temp && (temp.type == "text" || temp.type == "attribute")} -->
                        <!-- <p
                                class="font-medium border-t border-gray-200 dark:border-gray-700 mt-4 pt-4"
                            > -->
                        <!-- <p class="font-medium mb-2">Select font</p>
                        Font Family -->
                            <!-- <Button on:click={()=>dropdownFont=!dropdownFont} class="w-full bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg block p-2 hover:bg-gray-50" color="light">{temp.prop.font}</Button>
                            <Dropdown bind:open={dropdownFont} ulClass="overflow-y-auto h-52 text-sm">
                            {#each fonts as font}
                                <DropdownItem defaultClass="bg-gray-50 font-medium py-2 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left" on:click={()=>updateElementStyle("font", font.name)}>
                                    <div class="flex items-center">
                                        {font.name}
                                        <img alt={font.name} width="64" class="invert-image-dark-mode ms-4" src="https://bucket-netcred-media.s3.ap-south-1.amazonaws.com/fonts/{font.imageUrl}"/>
                                    </div>
                                </DropdownItem>
                            {/each}
                            </Dropdown> -->

                            <!-- <Button on:click={() => dropdownFont = !dropdownFont} class="w-full bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg block p-2 hover:bg-gray-50" color="light">
                                {temp.prop.font}
                              </Button>
                              
                              <Dropdown bind:open={dropdownFont} ulClass="overflow-y-auto h-52 text-sm" id="dropdown">
                                <input type="text" bind:value={searchQuery} placeholder="Search font..." class="w-full p-2 border-b border-gray-300" on:input={filterFonts} />
                              
                                {#each filteredFonts as font}
                                  <DropdownItem defaultClass="bg-gray-50 font-medium py-2 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left" on:click={() => updateElementStyle("font", font.name)}>
                                    <div class="flex items-center">
                                      {font.name}
                                      <img alt={font.name} width="64" class="invert-image-dark-mode ms-4" src={`https://bucket-netcred-media.s3.ap-south-1.amazonaws.com/fonts/${font.imageUrl}`} />
                                    </div>
                                  </DropdownItem>
                                {/each}
                              </Dropdown> -->


                              <!-- <Button on:click={() => dropdownFont = !dropdownFont} role="button" tabindex="0" class="w-full bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg block p-2 hover:bg-gray-50" color="light">
                                {temp.prop.font}
                              </Button>
                              
                              <Dropdown bind:open={dropdownFont} ulClass="overflow-y-auto h-52 text-sm" id="dropdown">
                                <input type="text" bind:value={searchQuery} placeholder="Search font..." class="w-full p-2 border-b border-gray-300" on:input={filterFonts} />
                              
                                {#each filteredFonts as font}
                                  <DropdownItem role="option" defaultClass="bg-gray-50 font-medium py-2 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left" on:click={() => updateElementStyle("font", font.name)}>
                                    <div class="flex items-center">
                                      {font.name}
                                      <img alt={font.name} width="64" class="invert-image-dark-mode ms-4" src={`https://bucket-netcred-media.s3.ap-south-1.amazonaws.com/fonts/${font.imageUrl}`} />
                                    </div>
                                  </DropdownItem>
                                {/each}
                              </Dropdown> -->
                        <!-- {/if} -->
                        {:else if activeTab == "color"}
                        <p class="font-medium mb-2">Document colors</p>
                        <div class="grid grid-cols-6 gap-2">
                            <div class="colors">
                                <input type="color" class="opacity-0 absolute top-0 left-0 w-full h-full pointer-events-none" id="colorPicker" bind:value={temp.prop.color} on:input={() => {
                                    handleUpdateDocumentColor(temp?.id, temp.prop.color);
                                }}>
                                <label for="colorPicker" class="absolute top-0 left-0 w-full h-full cursor-pointer" style="background: linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff);">
                                    <i class="fa-solid fa-plus" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: black; background-color: white; border-radius: 50%; padding: 5px; cursor: pointer;"></i>
                                </label>
                            </div>
                            {#each documentColor as color}
                                <button class="colors" style="{activeElement?.prop?.color == color ? 'outline: 1.5px solid #8b3dff; outline-offset: 3px;' : 'outline: 0;'} background-color: {color}" on:click={()=>handleUpdateDocumentColor(temp?.id, color)}></button>
                            {/each}
                        </div>
                        {:else if activeTab == "font"}
                        <span hidden>{dropdownFont = true}</span>
                        <p class="font-medium mb-2">Select font</p>
                        <!-- Font Family -->
                            <!-- <Button on:click={()=>dropdownFont=!dropdownFont} class="w-full bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg block p-2 hover:bg-gray-50" color="light">{temp.prop.font}</Button>
                            <Dropdown bind:open={dropdownFont} ulClass="overflow-y-auto h-52 text-sm">
                            {#each fonts as font}
                                <DropdownItem defaultClass="bg-gray-50 font-medium py-2 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left" on:click={()=>updateElementStyle("font", font.name)}>
                                    <div class="flex items-center">
                                        {font.name}
                                        <img alt={font.name} width="64" class="invert-image-dark-mode ms-4" src="https://bucket-netcred-media.s3.ap-south-1.amazonaws.com/fonts/{font.imageUrl}"/>
                                    </div>
                                </DropdownItem>
                            {/each}
                            </Dropdown> -->

                            <!-- <Button on:click={() => dropdownFont = !dropdownFont} class="w-full bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg block p-2 hover:bg-gray-50" color="light">
                                {temp.prop.font}
                              </Button>
                              
                              <Dropdown bind:open={dropdownFont} ulClass="overflow-y-auto h-52 text-sm" id="dropdown">
                                <input type="text" bind:value={searchQuery} placeholder="Search font..." class="w-full p-2 border-b border-gray-300" on:input={filterFonts} />
                              
                                {#each filteredFonts as font}
                                  <DropdownItem defaultClass="bg-gray-50 font-medium py-2 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left" on:click={() => updateElementStyle("font", font.name)}>
                                    <div class="flex items-center">
                                      {font.name}
                                      <img alt={font.name} width="64" class="invert-image-dark-mode ms-4" src={`https://bucket-netcred-media.s3.ap-south-1.amazonaws.com/fonts/${font.imageUrl}`} />
                                    </div>
                                  </DropdownItem>
                                {/each}
                              </Dropdown> -->


                              <!-- <Button on:click={() => dropdownFont = !dropdownFont} role="button" tabindex="0" class="w-full bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg block p-2 hover:bg-gray-50" color="light">
                                {temp.prop.font}
                              </Button> -->
                        
                              <Dropdown bind:open={dropdownFont} ulClass="overflow-y-auto h-52 text-sm" id="dropdown">
                                <input type="text" bind:value={searchQuery} placeholder="Search font..." class="w-full p-2 border-b border-gray-300" on:input={filterFonts} />
                                
                                {#each sortedFonts as font}
                                  <DropdownItem role="option" defaultClass={`bg-gray-50 font-medium py-2 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left ${selectedFont === font.name ? 'bg-blue-100' : ''}`} on:click={() => updateElementStyle("font", font.name)}>
                                    <div class="flex items-center">
                                      {font.name}
                                      <img alt={font.name} width="64" class="invert-image-dark-mode ms-4" src={`https://bucket-netcred-media.s3.ap-south-1.amazonaws.com/fonts/${font.imageUrl}`} />
                                    </div>
                                  </DropdownItem>
                                {/each}
                              </Dropdown>
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
                                on:input={() =>
                                    updateElementStyle("qrColor", "")}
                            />
                        {/if}
                        {#if activeElement && (activeElement.type == "text" || activeElement.type == "attribute" || activeElement.type == "line-horizontal" || activeElement.type == "line-vertical")}   
                        <!-- Element Color -->
                            <!-- <input
                                type="color"
                                style="width: 36px; height: 36px; border: none; outline: none; padding: 0; margin: 0; cursor: pointer; background: none;"
                                bind:value={activeElement.prop.color}
                                on:input={() =>
                                    updateElementStyle("fontColor", "")}
                            /> -->
                            <div class="change-color-btn" on:click={() => (activeTab = "color", handleDocumentColor())}
                            style="border:solid; border-width: 4px; border-style: outset; border-radius:50%; width: 36px; height: 36px; padding: 0; margin: 0; cursor: pointer; background-color:{activeElement.prop.color}"
                            >
                                
                            </div>
                            <!-- Element Size -->
                            <div
                                class="inline-flex rounded-md shadow-sm"
                                role="group"
                            >
                                <button
                                    on:click={() =>
                                        updateElementStyle("fontSize", -1)}
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
                                    on:input={() =>
                                        updateElementStyle(
                                            "fontSizeChange",
                                            ""
                                        )}
                                />
                                <button
                                    on:click={() =>
                                        updateElementStyle("fontSize", 1)}
                                    type="button"
                                    class="px-4 py-0 text-lg font-medium text-gray-900 bg-white border border-gray-200 rounded-r-md hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white"
                                >
                                    +
                                </button>
                            </div>
                        {/if}
                        {#if activeElement && (activeElement.type == "text" || activeElement.type == "attribute")}
                            <!-- Font Family -->
                            <!-- <Button on:click={()=>dropdownFont=!dropdownFont} class="w-32 bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg block p-2 hover:bg-gray-50" color="light">{activeElement.prop.font}</Button>
                            <Dropdown bind:open={dropdownFont} ulClass="overflow-y-auto h-52 text-sm">
                                {#each fonts as font}
                                    <DropdownItem defaultClass="bg-gray-50 font-medium py-2 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left" on:click={()=>updateElementStyle("font", font.name)}>
                                        <div class="flex items-center">
                                            {font.name}
                                            <img alt={font.name} width="64" class="invert-image-dark-mode ms-4" src="https://bucket-netcred-media.s3.ap-south-1.amazonaws.com/fonts/{font.imageUrl}"/>
                                        </div>
                                    </DropdownItem>
                                {/each}
                            </Dropdown> -->
                            <!-- Font Alignment -->
                            <div
                                style="background: rgba(57,76,96,.15); width: 1px; height: 24px;"
                            />
                            <div class="grid grid-cols-3 space-x-1">
                                <button
                                    on:click={() =>
                                        updateElementStyle("alignment", "left")}
                                    type="button"
                                    class="{activeElement.prop.textAlign ==
                                    'left'
                                        ? 'text-blue-700 dark:text-blue-400'
                                        : 'text-gray-900 dark:text-gray-400'} text-lg h-full p-2 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 flex justify-center items-center"
                                >
                                    <i class="icon-align-left" />
                                </button>
                                <button
                                    on:click={() =>
                                        updateElementStyle(
                                            "alignment",
                                            "center"
                                        )}
                                    type="button"
                                    class="{activeElement.prop.textAlign ==
                                    'center'
                                        ? 'text-blue-700 dark:text-blue-400'
                                        : 'text-gray-900 dark:text-gray-400'} text-lg h-full p-2 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 flex justify-center items-center"
                                >
                                    <i class="icon-align-center" />
                                </button>
                                <button
                                    on:click={() =>
                                        updateElementStyle(
                                            "alignment",
                                            "right"
                                        )}
                                    type="button"
                                    class="{activeElement.prop.textAlign ==
                                    'right'
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
                            <div class="grid grid-cols-7 space-x-2">
                                <button
                                    on:click={() =>
                                        updateElementStyle("style", "bold")}
                                    type="button"
                                    disabled={!supportsBold(activeElement.prop.font)}
                                    class="{activeElement.prop.bold
                                        ? 'text-blue-700 dark:text-blue-400'
                                        : 'text-gray-900 dark:text-gray-400'} text-lg h-full p-2 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 flex justify-center items-center"
                                >
                                    <i class="icon-bold" />
                                </button>

                                <button
                                    on:click={() =>
                                        updateElementStyle("style", "italic")}
                                    type="button"
                                    class="{activeElement.prop.italic
                                        ? 'text-blue-700 dark:text-blue-400'
                                        : 'text-gray-900 dark:text-gray-400'} text-lg h-full p-2 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 flex justify-center items-center"
                                >
                                    <i class="icon-italic" />
                                </button>

                                <button
                                    on:click={() =>
                                        updateElementStyle(
                                            "style",
                                            "underline"
                                        )}
                                    type="button"
                                    class="{activeElement.prop.underline
                                        ? 'text-blue-700 dark:text-blue-400'
                                        : 'text-gray-900 dark:text-gray-400'} text-lg h-full p-2 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 flex justify-center items-center"
                                >
                                    <i class="icon-underline" />
                                </button>

                                <button
                                    on:click={() => (activeTab = "font", loadFonts())}
                                    type="button"
                                    class="{activeElement.prop.underline
                                        ? 'text-blue-700 dark:text-blue-400'
                                        : 'text-gray-900 dark:text-gray-400'} text-lg h-full p-2 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 flex justify-center items-center"
                                >
                                <!-- <svg width="11" height="18" viewBox="0 0 11 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8.40547 0.34C8.7788 0.34 9.1988 0.38 9.66547 0.459999C10.1455 0.526666 10.4855 0.599999 10.6855 0.679999V3.76H9.92547C9.59214 3.22667 9.18547 2.80667 8.70547 2.5C8.22547 2.18 7.7388 2.02 7.24547 2.02C6.63214 2.02 6.16547 2.29333 5.84547 2.84C5.5388 3.38667 5.38547 4.18667 5.38547 5.24V7.98H8.98547V8.8H5.38547V16.34L8.18547 17.2L7.78547 18H1.20547V17.38L2.98547 15.98V8.8H0.605469V7.98H2.98547V6.2C2.98547 5.17333 3.26547 4.20667 3.82547 3.3C4.38547 2.39333 5.08547 1.67333 5.92547 1.14C6.7788 0.606666 7.60547 0.34 8.40547 0.34Z" fill="black"/>
                                </svg> -->
                                {temp.prop.font}
                                </button>

                                <button
                                    on:click={() =>
                                        updateElementStyle(
                                            "style",
                                            "uppercase"
                                        )}
                                    type="button"
                                    class="{activeElement.prop.uppercase
                                        ? 'text-blue-700 dark:text-blue-400'
                                        : 'text-gray-900 dark:text-gray-400'} text-lg h-full p-2 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 flex justify-center items-center"
                                    >
                                    <svg width="30" height="30" viewBox="0 0 33 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <g clip-path="url(#clip0_702_13)">
                                        <path d="M21.7718 14H19.3002L23.0662 3.09091H26.0385L29.7992 14H27.3276L24.595 5.58381H24.5098L21.7718 14ZM21.6174 9.712H27.4554V11.5124H21.6174V9.712ZM23.5707 32.1545C23.0487 32.1545 22.5835 32.0639 22.1751 31.8828C21.7667 31.6982 21.4435 31.4265 21.2056 31.0678C20.9712 30.7056 20.854 30.2546 20.854 29.7148C20.854 29.2603 20.9375 28.8786 21.1044 28.5696C21.2713 28.2607 21.4986 28.0121 21.7862 27.8239C22.0739 27.6357 22.4006 27.4936 22.7663 27.3977C23.1357 27.3018 23.5227 27.2344 23.9276 27.1953C24.4034 27.1456 24.7869 27.0994 25.0781 27.0568C25.3693 27.0107 25.5806 26.9432 25.712 26.8544C25.8434 26.7656 25.9091 26.6342 25.9091 26.4602V26.4283C25.9091 26.0909 25.8026 25.8299 25.5895 25.6452C25.38 25.4606 25.0817 25.3683 24.6946 25.3683C24.2862 25.3683 23.9613 25.4588 23.7198 25.6399C23.4783 25.8175 23.3185 26.0412 23.2404 26.3111L21.1417 26.1406C21.2482 25.6435 21.4577 25.2138 21.7702 24.8516C22.0827 24.4858 22.4858 24.2053 22.9794 24.0099C23.4766 23.8111 24.0518 23.7116 24.7053 23.7116C25.1598 23.7116 25.5948 23.7649 26.0103 23.8714C26.4293 23.978 26.8004 24.1431 27.1236 24.3668C27.4503 24.5906 27.7077 24.8782 27.896 25.2298C28.0842 25.5778 28.1783 25.995 28.1783 26.4815V32H26.0263V30.8654H25.9624C25.831 31.1211 25.6552 31.3466 25.435 31.5419C25.2148 31.7337 24.9503 31.8846 24.6413 31.9947C24.3324 32.1012 23.9755 32.1545 23.5707 32.1545ZM24.2205 30.5884C24.5543 30.5884 24.8491 30.5227 25.1048 30.3913C25.3604 30.2564 25.5611 30.0753 25.7067 29.848C25.8523 29.6207 25.9251 29.3633 25.9251 29.0756V28.2074C25.854 28.2536 25.7564 28.2962 25.6321 28.3352C25.5114 28.3707 25.3746 28.4045 25.2219 28.4364C25.0692 28.4648 24.9165 28.4915 24.7638 28.5163C24.6112 28.5376 24.4727 28.5572 24.3484 28.5749C24.082 28.614 23.8494 28.6761 23.6506 28.7614C23.4517 28.8466 23.2972 28.962 23.1871 29.1076C23.0771 29.2496 23.022 29.4272 23.022 29.6403C23.022 29.9492 23.1339 30.1854 23.3576 30.3487C23.5849 30.5085 23.8725 30.5884 24.2205 30.5884Z" fill={activeElement.prop.uppercase ? "blue":"black"}/>
                                        </g>
                                        <g filter="url(#filter0_d_702_13)">
                                        <path d="M12 17L12 30M12 17L16 21M12 17L8 21" stroke={activeElement.prop.uppercase ? "blue":"black"} stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </g>
                                        <defs>
                                        <filter id="filter0_d_702_13" x="-4" y="11" width="29" height="32" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                        <feOffset dy="4"/>
                                        <feGaussianBlur stdDeviation="2"/>
                                        <feComposite in2="hardAlpha" operator="out"/>
                                        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                                        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_702_13"/>
                                        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_702_13" result="shape"/>
                                        </filter>
                                        <clipPath id="clip0_702_13">
                                        <rect width="19" height="33" fill="white" transform="translate(12)"/>
                                        </clipPath>
                                        </defs>
                                    </svg>                             
                                </button>
                                
                                <div class="flex items-center">
                                    <Button color="light" style="height: 33.6px; padding-left: 13px !important; padding-right: 13px !important;">
                                        <svg width="22" height="34" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M10 3V23" stroke="black" stroke-width="2" stroke-linecap="round"/>
                                            <g filter="url(#filter0_d_0_1)">
                                            <path d="M5 18L10 25L15 18" stroke="#383838" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            </g>
                                            <path d="M15 8L10 1L5 8" stroke="#383838" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            <line x1="18" y1="6.5" x2="29" y2="6.5" stroke="black"/>
                                            <line x1="18" y1="12.5" x2="29" y2="12.5" stroke="black"/>
                                            <line x1="18" y1="19.5" x2="29" y2="19.5" stroke="black"/>
                                            <defs>
                                            <filter id="filter0_d_0_1" x="0" y="16.9999" width="20" height="17.0001" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                            <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                            <feOffset dy="4"/>
                                            <feGaussianBlur stdDeviation="2"/>
                                            <feComposite in2="hardAlpha" operator="out"/>
                                            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                                            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_1"/>
                                            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_0_1" result="shape"/>
                                            </filter>
                                            </defs>
                                        </svg>  
                                    </Button>
                                </div>
                                <Dropdown>
                                <!-- <DropdownItem on:change={() => updateElementStyle("letterSpacing", letterspacing)}>
                                    <Label>Letter Spacing</Label>
                                    <Range id="range-minmax" min="0" max="10" bind:value={letterspacing}  size="sm"/>
                                    {#if letterspacing == 0}
                                    <p>Value: <Badge color="red">Notset</Badge></p>
                                    {:else}
                                        <p>Value: <Badge color="indigo">{letterspacing}</Badge></p>
                                    {/if}
                                </DropdownItem> -->

                                <DropdownItem>
                                    <Label>Letter Spacing</Label>
                                    <Range id="range-minmax" min="1" max="11" bind:value={letterspacing}  size="sm"/>
                                    {#if letterspacing -1 == 0 || letterspacing == 0}
                                    <p>Value: <Badge color="red">Notset</Badge></p>
                                    {:else}
                                        <p>Value: <Badge color="indigo">{letterspacing -1}</Badge></p>
                                    {/if}
                                </DropdownItem>
                                
                                <DropdownItem>
                                    <!-- <Label>Line Spacing</Label>
                                    <Range id="range-minmax" min="0" max="10" bind:value={linespacing}  size="sm"/>
                                    <p>Value: {linespacing}</p> -->
                                    <Label>Line Spacing</Label>
                                    <Range id="range-minmax" step="0.5" min="0.5" max="6" bind:value={linespacing} size="sm"/>
                                    {#if linespacing -0.5 == 0 || linespacing == 0}
                                    <p>Value: <Badge color="red">Notset</Badge></p>
                                    {:else}
                                        <p>Value: <Badge color="indigo">{linespacing -1}</Badge></p>
                                    {/if}
                                </DropdownItem>
                                </Dropdown>
                                    <div class="flex items-center">
                                        <Button color="light" style="height: 33.6px; padding-left: 13px !important; padding-right: 13px !important;">
                                            <svg width="22" height="34" viewBox="0 0 39 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <g clip-path="url(#clip0_702_3)">
                                                <path d="M0 10H9V17H0V10Z" fill="#060606"/>
                                                <path d="M0 21H9V28H0V21Z" fill="#040404"/>
                                                <rect width="9" height="7" fill="black"/>
                                                <rect x="15" y="10" width="9" height="7" fill="black" fill-opacity="0.6"/>
                                                <rect x="15" width="9" height="7" fill="black" fill-opacity="0.6"/>
                                                <rect x="30" width="9" height="7" fill="#060606" fill-opacity="0.2"/>
                                                <rect x="30" y="10" width="9" height="7" fill="#010101" fill-opacity="0.2"/>
                                                <rect x="30" y="21" width="9" height="7" fill="#050505" fill-opacity="0.2"/>
                                                <path d="M15 21H24V28H15V21Z" fill="#040404" fill-opacity="0.6"/>
                                                </g>
                                                <defs>
                                                <clipPath id="clip0_702_3">
                                                <rect width="39" height="28" fill="white"/>
                                                </clipPath>
                                                </defs>
                                            </svg>
                                        </Button>
                                    </div>
                                <Dropdown>
                                <DropdownItem>
                                    <Label>Transparency</Label>
                                    <!-- on:input={updateTransparency} -->
                                    <Range id="range-minmax"  min="1" max="101" bind:value={transparency}  size="sm"/>
                                    <!-- <div class="range-container">
                                        <input
                                          type="range"
                                          min="0"
                                          max="99"
                                          value={100 - transparency}
                                          on:input={updateTransparency}
                                        />
                                      </div> -->
                                    {#if transparency -1 == 0 || transparency == 0}
                                    <p>Value: <Badge color="red">Notset</Badge></p>
                                    {:else}
                                        <p>Value: <Badge color="indigo">{transparency-1}</Badge></p>
                                    {/if}
                                    <!-- <p>Value: <Badge color="indigo">{transparency}</Badge></p> -->
                                </DropdownItem>
                                </Dropdown>
                            </div>
                        {/if}
                        <!-- Line Styling -->
                        {#if activeElement && (activeElement.type == "line-horizontal" || activeElement.type == "line-vertical")}
                            <div
                                style="background: rgba(57,76,96,.15); width: 1px; height: 24px;"
                            />
                            <Button color="light" style="height: 33.6px;">Styles</Button>
                            <Dropdown>
                            <DropdownItem
                              on:click={() =>
                                updateElementStyle("type", "solid")} class="flex items-center justify-between">
                                Solid
                                <div
                                style="border-width: 4px 0px 0px; border-color: {activeElement
                                    .prop.type == 'solid'
                                    ? '#1A56DB'
                                    : '#000000'}; border-style: solid; width: 60px;"/>
                            </DropdownItem>
                            <DropdownItem
                            on:click={() =>
                                updateElementStyle("type", "dashed")} class="flex items-center justify-between">
                                Dashed
                                <div
                                style="border-width: 4px 0px 0px; border-color: {activeElement
                                    .prop.type == 'dashed'
                                    ? '#1A56DB'
                                    : '#000000'}; border-style: dashed; width: 60px;"/>
                            </DropdownItem>
                            <DropdownItem
                            on:click={() =>
                                updateElementStyle("type", "dotted")} class="flex items-center justify-between">
                                Dotted
                                <div
                                style="border-width: 4px 0px 0px; border-color: {activeElement
                                    .prop.type == 'dotted'
                                    ? '#1A56DB'
                                    : '#000000'}; border-style: dotted; width: 60px;"/>
                            </DropdownItem>
                            <DropdownItem
                            on:click={() =>
                                updateElementStyle("type", "double")} class="flex items-center justify-between">Double
                                <div
                                style="border-width: 4px 0px 0px; border-color: {activeElement
                                    .prop.type == 'double'
                                    ? '#1A56DB'
                                    : '#000000'}; border-style: double; width: 60px;"/>
                            </DropdownItem>
                            <DropdownItem
                            on:click={() =>
                                updateElementStyle("type", "groove")} class="flex items-center justify-between">
                                Groove
                                <div
                                style="border-width: 4px 0px 0px; border-color: {activeElement
                                    .prop.type == 'groove'
                                    ? '#1A56DB'
                                    : '#000000'}; border-style: groove; width: 60px;"
                            />
                            </DropdownItem>
                            </Dropdown>
                            
                            <!-- <div class="inline-flex" style="height: 33.6px;">
                                <button
                                    on:click={() =>
                                        updateElementStyle("type", "solid")}
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
                                    on:click={() =>
                                        updateElementStyle("type", "dashed")}
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
                                    on:click={() =>
                                        updateElementStyle("type", "dotted")}
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
                                    on:click={() =>
                                        updateElementStyle("type", "double")}
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
                                    on:click={() =>
                                        updateElementStyle("type", "groove")}
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
                            </div> -->
                        {/if}
                        <!-- End Line Styling -->
                        {#if activeElement}
                        {#if activeElement.type !== "image"}
                            <div
                                style="background: rgba(57,76,96,.15); width: 1px; height: 24px;"
                            />
                        {/if}
                        <div class="inline-flex">
                            <Button on:click={() => (activeTab = "position")} color="light" style="height: 33.6px;">
                                <i class="fa-solid fa-up-down-left-right"></i>
                            </Button>
                            <!-- <button
                                on:click={() => moveElementIndex(1)}
                                type="button"
                                class="text-lg h-full p-2 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 flex justify-center items-center"
                            >
                                <i class="icon-arrow-up-short-wide" />
                            </button> -->
                            <!-- <button
                                on:click={() => moveElementIndex(-1)}
                                type="button"
                                class="text-lg h-full p-2 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 flex justify-center items-center"
                            >
                                <i class="icon-arrow-down-wide-short" />
                            </button> -->
                        </div>
                    {/if}
                    </div>
                    <!-- Z-Index -->
                    <!-- {#if activeElement}
                        <div class="inline-flex">
                            <Button on:click={() => (activeTab = "position")} color="light" style="height: 33.6px;">
                                <i class="fa-solid fa-up-down-left-right"></i>
                            </Button>
                            <button
                                on:click={() => moveElementIndex(1)}
                                type="button"
                                class="text-lg h-full p-2 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 flex justify-center items-center"
                            >
                                <i class="icon-arrow-up-short-wide" />
                            </button>
                            <button
                                on:click={() => moveElementIndex(-1)}
                                type="button"
                                class="text-lg h-full p-2 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 flex justify-center items-center"
                            >
                                <i class="icon-arrow-down-wide-short" />
                            </button>
                        </div>
                    {/if} -->
                </div>
                <!-- Canvas -->
                <div
                    on:mousedown|stopPropagation={(event) => {
                        if (!actionbar.contains(event.target)) {
                            activeId = null;
                            activeElement = null;
                        }
                        if (activeTab === "position") {
                            activeTab = lastActiveTab;
                        }
                    }}
                    style="background: rgb(235, 236, 240);display: flex;justify-content: center;align-items: center;"
                    class="p-4"
                >
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <div
                        bind:this={editor}
                        class="editor relative"
                        style="font-size: {po[canvas.paper + "-" + canvas.orientation].fontSize}px; width: {canvas.width}px;height: {canvas.height}px;background: white;box-shadow: 0 2px 8px rgba(14,19,24,.07); background-position: center bottom; background-size: 100% 100%; background-repeat: no-repeat; background-image: {canvas.background
                            ? 'url(' + canvas.background + ')'
                            : 'none'}"
                    >
                    <!-- Action -->
                    {#if activeElement !== null || activeElement?.type != "attribute" || (activeElement?.type == "attribute" && activeElement?.content != "[recipient.name]")}
                    <div bind:this={actionbar} class="actions" style="left: {actionLeft}; top: {actionTop}; display:{actionEnable?'grid':'none'}">
                        <button
                            on:click={deleteItem}
                            class="text-lg h-full p-2 text-gray-900 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 flex justify-center items-center"
                        >
                            <i class="icon-trash-can" />
                        </button>
                        {#if activeElement?.type != "attribute"}
                            <button
                                class="text-lg h-full p-2 text-gray-900 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 flex justify-center items-center"
                                on:click={duplicateItem}
                            >
                                <i class="icon-copy" />
                            </button>
                        {/if}
                    </div>
                    {/if}
                            <div class={showVerticalGridLine?'':'hidden'} style="background: rgb(139, 61, 255);width: 1px;height: 100%;position: absolute;margin-left: auto;margin-right: auto;left: 0;right: 0;z-index: 9999;"></div>
                            <div class={showHorizontalGridLine?'':'hidden'} style="background: rgb(139, 61, 255);width: 100%;height: 1px;position: absolute;margin-top: auto;margin-bottom: auto;top: 0;bottom: 0;z-index: 9999;"></div>
                            {#each items as item, index (item.id)}
                            <Draggable
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
                                textAlign={item.prop.textAlign}
                                bold={item.prop.bold}
                                italic={item.prop.italic}
                                underline={item.prop.underline}
                                uppercase={item.prop.uppercase}
                                letterSpacing={item.prop.letterSpacing}
                                lineSpacing={item.prop.lineSpacing}
                                font={item.prop.font}
                                id={item.id}
                                active={item.id === activeId}
                                {index}
                                on:moving={elementMoving}
                                on:select={setActive}
                            >   
                                {#if item.type == "text"}
                                    <!-- <span
                                        on:click={enableEditMode}
                                        on:input={updateActiveElementContent}
                                        contenteditable={item.editMode}
                                        class="w-full outline-none"
                                        style="word-break: break-word; white-space: pre-line;"
                                        >{item.content}</span
                                    > -->
                                    <span
                                        on:click={enableEditMode}
                                        on:keydown={(event) => handleKeyDown(event)}
                                        on:keyup={(event) => handleKeyUp(event)}
                                        on:input={updateActiveElementContent}
                                        contenteditable={item.editMode}
                                        class="w-full outline-none"
                                        style="word-break: break-word; white-space: pre-line; {item.prop.opacity ? `opacity: ${100-item.prop.opacity-1}%;` : ''}"
                                    >{item.content}</span>
                                {:else if item.type == "attribute"}
                                    <span
                                        class="w-full"
                                        style="word-break: break-word; white-space: pre-line; {item.prop.opacity ? `opacity: ${100-item.prop.opacity-1}%;` : ''}"
                                        >{item.content}</span
                                    >
                                {:else if item.type == "image"}
                                    <img alt="{item.type}"
                                        class="relative h-full w-full object-cover"
                                        src={item.content}
                                    />
                                {:else if item.type == "line-horizontal"}
                                    <div
                                        class="relative w-full"
                                        style="border-width: {item.prop
                                            .size}em 0em 0em; border-color: {item
                                            .prop.color}; border-style: {item
                                            .prop.type};"
                                    />
                                {:else if item.type == "line-vertical"}
                                    <div
                                        class="relative h-full"
                                        style="border-width: 0px {item.prop
                                            .size}em 0em 0em; border-color: {item
                                            .prop.color}; border-style: {item
                                            .prop.type};"
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
                            </Draggable>
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
    color={toastType=='success'?'green':'red'}
    position="top-right"
    open={toast}
    class="fixed"
>
    <svelte:fragment slot="icon">
        {#if toastType == 'success'}
            <i class="icon-check"></i>
        {:else if toastType == 'error'}
            <i class="icon-xmark"></i>
        {/if}
    </svelte:fragment>
    {toastMessage}
</Toast>

<style>
    .font-size {
        outline: 0;
        width: 50px;
        -webkit-appearance: textfield;
        -moz-appearance: textfield;
        border-radius: 0;
        height: 33.6px;
        font-weight: 600;
        line-height: 1;
        padding: 0;
        text-align: center;
        -webkit-tap-highlight-color: transparent;
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
    .pos-icons {
        height: 45px;
        width: 75px;
    }

    
    /* Transparent-Range Starts */
  /* .range-container {
    position: relative;
    width: 100%;
    height: 20px; 
  }

  .range-track {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: #ddd;
    border-radius: 5px;
  }

  .range-thumb {
    position: absolute;
    width: 20px; 
    height: 20px; 
    background-color: #007bff; 
    border-radius: 50%;
    cursor: pointer;
  } */
  /* Transparent-Range Ends*/

  .actions {
        border-radius: 4px;
        height: 40px;
        align-items: center;
        background-color: var(--action-button-bg);
        box-shadow: var(--action-button-shadow);
        display: grid;
        grid-auto-flow: column;
        overflow: hidden;
        position: absolute;
        top: 0;
        bottom: 0;
        right: 0;
        left: 0;
        /* margin-left: auto; */
        /* margin-right: auto; */
        width: 80px;
        display: grid;
        z-index: 999999;
    }

    .colors {
        padding-top: 100%; height: 0; position: relative; width: 100%;
        box-shadow: inset 0 0 0 1px #d1d5db;
        border-radius: 5px;
        overflow: hidden;
    }
</style>