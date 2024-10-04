<svelte:head>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&display=swap">
</svelte:head>

<script>
    import Draggable from "./Draggable.svelte";
    import { Badge, Range, Label, Button, Modal, Spinner, Toast, Dropdown, DropdownItem } from "flowbite-svelte";
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

    export let data;
    
    // var { protocol, host } = window?.location ? window?.location : null;
    // const staticBasePath = import.meta.env.BASE_URL;


    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    const generateDesignId = customAlphabet(alphabet, 12);
    let designId = generateDesignId();

    let dropdownFont = false;
    let searchQuery = '';
    let filteredFonts = fonts;
    let defaultModal = false;
    let toastMessage;
    let toastType = null;

    let designName = "My Badge Design";

    let fileInput;
    let mediaInput;

    let loading = false;
    let formLoading1 = false;
    let formLoading2 = false;

    let _formBackground;
    let _formImage;

    let editor;
    let toolbar;

    let lastActiveTab = "text";

    function getItemIndexById(id) {
        const item = itemsMap.get(id);
        return items.indexOf(item);
    }

    function onDocChange() {
        canvas.width =
            po[canvas.paper + "-" + canvas.orientation].containerWidth;
        canvas.height =
            po[canvas.paper + "-" + canvas.orientation].containerHeight;
    }

    let canvas = {
        width: 595,
        height: 595,
        paper: "A4",
        orientation: "L",
    };

    let items = [];
    
    let attributes = {
        "[recipient.name]": false, // Default template
        "[credential.id]": false, // Default template
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

    onMount(async () => {
		let fonts = items.filter(item => item.prop && item.prop.font).map(item => item.prop.font);
        fonts.forEach(font => {
            addFont(font); 
        });
	});

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
    let activeTab = "text";
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
        if (event?.detail) {
            activeId = event.detail;
            lastActiveTab = activeTab === "position" ? lastActiveTab : activeTab;
            activeTab = lastActiveTab === "color" ? lastActiveTab : "position";
        } else { activeId = event }

        activeElement = items.find((el) => el.id === activeId);
        temp = activeElement;
        letterspacing = activeElement?.prop?.letterSpacing ? activeElement?.prop?.letterSpacing : 0;
        linespacing = activeElement?.prop?.lineSpacing ? activeElement?.prop?.lineSpacing : 0;
        transparency = activeElement?.prop?.opacity ? activeElement?.prop?.opacity : 1;
        
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

            let icon = null;
            let temp = null;
            let svgDoc = null;
            let paths = null;
            let prop = null;
            let current_values = null;

            if (type == "ribbonColor" || type == "basesColor" || type == "iconColor") {
                icon = items[index];
                temp = {"icon": JSON.parse(JSON.stringify(icon))};
                svgDoc = new DOMParser().parseFromString(icon.content, 'image/svg+xml');
                paths = svgDoc.getElementsByTagName('path');

                current_values = {
                    "id": activeElement?.id,
                    "type": type,
                    "item": icon,
                    "action": "updated"
                };
            } else {
                prop = items[index].prop;
                
                current_values = {
                    "id": activeElement?.id,
                    "type": type,
                    "item": items[index],
                    "action": "updated"
                };
            }
            
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
                case "ribbonColor":
                    let ribbon_action_path = action.indexes;
                    temp.prev_color = paths[action.indexes[0]].getAttribute('fill');
                    

                    for (let i=0; i < ribbon_action_path.length; i++) {
                        paths[action.indexes[i]].setAttribute('fill', action.color);
                    }
                    const updatedRibbonSVGContent = new XMLSerializer().serializeToString(svgDoc);
                    icon.content = updatedRibbonSVGContent;
                    break;
                case "basesColor":
                    let bases_action_path = action.indexes;
                    temp.prev_color = paths[action.indexes[0]]?.getAttribute('fill') ? paths[action.indexes[0]]?.getAttribute('fill') : paths[action.indexes[1]]?.getAttribute('fill');
                    
                    for (let i = 0; i < bases_action_path.length; i++) {
                        const index = bases_action_path[i];

                        if (index == 'maskRect') {
                            const maskRect = svgDoc.querySelector('g rect'); // Find rect within <g> tag
                            if (maskRect) { // Ensure rect is found
                                maskRect.setAttribute('fill', action.color);
                            }
                        } else if (index == 'mask') {
                            const mask = svgDoc.querySelector('g ellipse');
                            if (mask) {
                                mask.setAttribute('fill', action.color);
                            }
                        } else if (index == 'rect') {
                            const rect = svgDoc.querySelector('rect');
                            if (rect) {
                                // temp.prev_color = rect[action.circleIndex].getAttribute('fill') || "";
                                rect.setAttribute('fill', action.color);
                            }
                        } else if (index == 'circle') {
                            const circles = svgDoc.querySelectorAll('circle');
                            temp.prev_color = circles[action.circleIndex].getAttribute('fill') || "";
                            circles[action.circleIndex].setAttribute('fill', action.color);
                        } else if (index == 'g_mask_circle') {
                            const gMask = svgDoc.querySelector('g[mask="url(#LRKCemSjs6VGVYiTLJtP9)"] circle');
                            temp.prev_color = gMask.getAttribute('fill') || "";
                            gMask.setAttribute('fill', action.color);
                        } else {
                            paths[index].setAttribute('fill', action.color);
                        }
                    }

                    const updatedBasesSVGContent = new XMLSerializer().serializeToString(svgDoc);
                    icon.content = updatedBasesSVGContent;
                    break;
                case "iconColor":
                    let icons_action_path = action.indexes;
                    temp.prev_color = paths[action.indexes[0]]?.getAttribute('fill') ? paths[action.indexes[0]]?.getAttribute('fill') : paths[action.indexes[1]]?.getAttribute('fill');

                    for (let i = 0; i < icons_action_path.length; i++) {
                        const index = icons_action_path[i];

                        if (typeof index === 'string' && index === 'g') {
                            const maskPath = svgDoc.querySelector('g[mask="url(#AwsWJKn1f6HCLZL1fBVxj)"] path');
                            if (maskPath) {
                                temp.prev_color = maskPath.getAttribute('fill') || "";
                                maskPath.setAttribute('fill', action.color);
                            }
                        }  else {
                            // temp.prev_color = paths[action.indexes[0]].getAttribute('fill') || "";
                            paths[index].setAttribute('fill', action.color);
                        }
                    }
                    const updatedIconsSVGContent = new XMLSerializer().serializeToString(svgDoc);
                    icon.content = updatedIconsSVGContent;
                    break;
            }
            
            if (type == "ribbonColor" || type == "basesColor" || type == "iconColor") {
                items[index] = icon;
                for (let i=0; i <= temp.icon.colors.length -1; i++) {
                    if ( temp.icon.colors[i].id == action.id) {
                        temp.icon.colors[i].color = temp.prev_color;
                    }
                }
                current_values.item = temp.icon;
            } else {
                items[index] = { ...items[index], prop };
            }
            
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
            dropdownFont = false;
                

            items[index] = { ...items[index], prop };
            activeElement = items[index];
            pushAndTrim(undoStack, current_values);
        }

        // pushAndTrim(undoStack, current_values);
    }

    function addElement(type, value, itemColor=null) {
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
            case "ribbon":
                newItem.content = value;
                newItem.size = { width: "80%", height: "20%" };
                newItem.colors = itemColor;
                break;
            case "bases":
                for (let i = items.length - 1; i >= 0; i--) {
                    if (items[i].type === 'bases') {
                        items.splice(i, 1);
                    }
                }
                newItem.content = value;
                newItem.size = { width: "70%", height: "70%" };
                newItem.colors = itemColor;
                break;
            case "icons":
                newItem.content = value;
                newItem.size = { width: "20%", height: "20%" };
                newItem.colors = itemColor;
                break;
            case "template":
                // if (typeof window !== 'undefined') {
                //     var { protocol, host } = window.location;
                //     var url = `${protocol.trim()}//${host.trim()}${value.trim()}/template_1.jpg`;
                //     console.log(url,"--url--");
                //     var trimmedValue = url.trim();
                //     newItem.content = trimmedValue;
                //     newItem.size = { width: "50%" };


                //     // var height = 100;
                //     // let m_top = 50 - height / 2;
                //     let m_left = 50 - (50 + 0.4) / 2;
                //     // newItem.pos.top = `${m_top}%`;
                //     newItem.pos.left = `${m_left}%`;

                // }else {
                //     console.log("---Error: Window is undefined----");
                // }
                newItem.content = value;
                newItem.size = { width: "80%" };
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
        let type = 'badge';
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

        } else if (items[index].type == "ribbon" || items[index].type == "line-horizontal" || items[index].type == "image" || items[index].type == "template") {
                
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
            activeTab="text";
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
        // console.log(activeId);
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
        let temp_data = null;
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

            let icon = null;
            let prop = null;

            if (action['type'] == "ribbonColor" || action['type'] == "basesColor" || action['type'] == "iconColor") {
                icon = items[index];
            } else {
                prop = items[index].prop;
            }

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
                case "ribbonColor":
                    temp_data = {"icon": JSON.parse(JSON.stringify(icon))};
                    icon.content = action['item'].content;
                    icon.colors = action['item'].colors;
                    break;
                case "basesColor":
                    temp_data = {"icon": JSON.parse(JSON.stringify(icon))};
                    icon.content = action['item'].content;
                    icon.colors = action['item'].colors;
                    break;
                case "iconColor":
                    temp_data = {"icon": JSON.parse(JSON.stringify(icon))};
                    icon.content = action['item'].content;
                    icon.colors = action['item'].colors;
                    break;
            }
            
            if (action['type'] == "ribbonColor" || action['type'] == "basesColor" || action['type'] == "iconColor") {
                current_values.item = temp_data.icon;
                items[index] = icon;
            } else {
                items[index] = { ...items[index], prop };
            }

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
        let temp = null;
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

            let icon = null;
            let prop = null;

            if (action['type'] == "ribbonColor" || action['type'] == "basesColor" || action['type'] == "iconColor") {
                icon = items[index];
            } else {
                prop = items[index].prop;
            }

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
                case "ribbonColor":
                    temp = {"icon": JSON.parse(JSON.stringify(icon))};
                    icon.content = action['item'].content;
                    icon.colors = action['item'].colors;
                    break;
                case "basesColor":
                    temp = {"icon": JSON.parse(JSON.stringify(icon))};
                    icon.content = action['item'].content;
                    icon.colors = action['item'].colors;
                    break;
                case "iconColor":
                    temp = {"icon": JSON.parse(JSON.stringify(icon))};
                    icon.content = action['item'].content;
                    icon.colors = action['item'].colors;
                    break;
            }

            if (action['type'] == "ribbonColor" || action['type'] == "basesColor" || action['type'] == "iconColor") {
                current_values.item = temp.icon;
                items[index] = icon;
            } else {
                items[index] = { ...items[index], prop };
            }

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
        <div class="playground grid grid-cols-8 bg-white dark:text-gray-400 dark:bg-gray-800">
            <!-- Sidebar -->
            <div
                class="col-span-3 pe-3 border-e border-gray-200 overflow-y-auto"
            >
                <div class="grid grid-cols-12 h-full">
                    <ul
                        class="col-span-3 border-e border-gray-200 h-full text-sm font-medium text-gray-500 dark:text-gray-400 md:me-4 mb-4 md:mb-0"
                    >
                        <!-- <li>
                            <button
                                on:click={() => (activeTab = "Templates")}
                                class="{activeTab == 'Templates'
                                    ? 'text-white bg-blue-700'
                                    : 'hover:text-gray-900 hover:bg-gray-100'} text-xs flex flex-col items-center px-4 py-3 active w-full"
                                aria-current="page"
                            >
                                    {#if activeTab == 'Templates'}
                                        <svg class="m-1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24px" height="24px" viewBox="0,0,256,256">
                                            <g fill="#ffffff" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><g transform="scale(9.84615,9.84615)"><path d="M7,0c-2.20312,0 -4,1.79688 -4,4v18c0,2.20313 1.79688,4 4,4h12c2.20313,0 4,-1.79687 4,-4v-14c0,-1.0625 -0.97266,-2.07031 -2.71875,-3.78125c-0.24219,-0.23828 -0.50391,-0.50391 -0.75,-0.75c-0.24609,-0.24609 -0.51172,-0.47656 -0.75,-0.71875c-1.71094,-1.74609 -2.71875,-2.75 -3.78125,-2.75zM7,2h7.28125c0.72266,0.18359 0.71875,1.05078 0.71875,1.9375v3.0625c0,0.55078 0.44922,1 1,1h3c0.99609,0 2,0.00391 2,1v13c0,1.10547 -0.89453,2 -2,2h-12c-1.10547,0 -2,-0.89453 -2,-2v-18c0,-1.10547 0.89453,-2 2,-2zM10,9c-1.10547,0 -2,0.89453 -2,2c0,1.10547 0.89453,2 2,2c1.10547,0 2,-0.89453 2,-2c0,-1.10547 -0.89453,-2 -2,-2zM15.96875,12.15625c-1.1875,0 -1.60547,4.90625 -3.25,4.90625c-1.21875,0 -1.69141,-2 -2.71875,-2c-1.02734,0 -2.875,4.1875 -2.875,4.1875c-0.37891,0.42188 0.1875,0.75 0.625,0.75h10.5625c0.35547,0 0.8125,-0.45312 0.53125,-1.0625c0,0 -1.6875,-6.78125 -2.875,-6.78125z"></path></g></g>
                                        </svg>
                                    {:else}
                                        <svg class="m-1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24px" height="24px" viewBox="0,0,256,256">
                                            <g fill="#6b7280" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><g transform="scale(9.84615,9.84615)"><path d="M7,0c-2.20312,0 -4,1.79688 -4,4v18c0,2.20313 1.79688,4 4,4h12c2.20313,0 4,-1.79687 4,-4v-14c0,-1.0625 -0.97266,-2.07031 -2.71875,-3.78125c-0.24219,-0.23828 -0.50391,-0.50391 -0.75,-0.75c-0.24609,-0.24609 -0.51172,-0.47656 -0.75,-0.71875c-1.71094,-1.74609 -2.71875,-2.75 -3.78125,-2.75zM7,2h7.28125c0.72266,0.18359 0.71875,1.05078 0.71875,1.9375v3.0625c0,0.55078 0.44922,1 1,1h3c0.99609,0 2,0.00391 2,1v13c0,1.10547 -0.89453,2 -2,2h-12c-1.10547,0 -2,-0.89453 -2,-2v-18c0,-1.10547 0.89453,-2 2,-2zM10,9c-1.10547,0 -2,0.89453 -2,2c0,1.10547 0.89453,2 2,2c1.10547,0 2,-0.89453 2,-2c0,-1.10547 -0.89453,-2 -2,-2zM15.96875,12.15625c-1.1875,0 -1.60547,4.90625 -3.25,4.90625c-1.21875,0 -1.69141,-2 -2.71875,-2c-1.02734,0 -2.875,4.1875 -2.875,4.1875c-0.37891,0.42188 0.1875,0.75 0.625,0.75h10.5625c0.35547,0 0.8125,-0.45312 0.53125,-1.0625c0,0 -1.6875,-6.78125 -2.875,-6.78125z"></path></g></g>
                                        </svg>
                                    {/if}    
                                Templates
                            </button>
                        </li> -->
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
                        <li>
                            <button
                                on:click={() => (activeTab = "ribbons")}
                                class="{activeTab == 'ribbons'
                                    ? 'text-white bg-blue-700'
                                    : 'hover:text-gray-900 hover:bg-gray-100'} text-xs flex flex-col items-center px-4 py-3 w-full"
                            >

                                <i class="fa-solid fa-ribbon text-xl {activeTab === 'ribbons' ? 'text-white' : 'text-gray-500 dark:text-gray-400'}"></i>

                                Ribbons
                            </button>
                        </li>
                        <li>
                            <button
                                on:click={() => (activeTab = "bases")}
                                class="{activeTab == 'bases'
                                    ? 'text-white bg-blue-700'
                                    : 'hover:text-gray-900 hover:bg-gray-100'} text-xs flex flex-col items-center px-4 py-3 w-full"
                            >
                                <svg class="w-7 h-7 {activeTab === 'bases' ? 'text-white' : 'text-gray-500 dark:text-gray-400'}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M12 20a16.405 16.405 0 0 1-5.092-5.804A16.694 16.694 0 0 1 5 6.666L12 4l7 2.667a16.695 16.695 0 0 1-1.908 7.529A16.406 16.406 0 0 1 12 20Z"/>
                                </svg>
                                  
                                Bases
                            </button>
                        </li>
                        <li>
                            <button
                                on:click={() => (activeTab = "icons")}
                                class="{activeTab == 'icons'
                                    ? 'text-white bg-blue-700'
                                    : 'hover:text-gray-900 hover:bg-gray-100'} text-xs flex flex-col items-center px-4 py-3 w-full"
                            >
                                <svg class="w-6 h-6 {activeTab === 'icons' ? 'text-white' : 'text-gray-500 dark:text-gray-400'}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                    <path stroke="currentColor" stroke-width="2" d="M11.083 5.104c.35-.8 1.485-.8 1.834 0l1.752 4.022a1 1 0 0 0 .84.597l4.463.342c.9.069 1.255 1.2.556 1.771l-3.33 2.723a1 1 0 0 0-.337 1.016l1.03 4.119c.214.858-.71 1.552-1.474 1.106l-3.913-2.281a1 1 0 0 0-1.008 0L7.583 20.8c-.764.446-1.688-.248-1.474-1.106l1.03-4.119A1 1 0 0 0 6.8 14.56l-3.33-2.723c-.698-.571-.342-1.702.557-1.771l4.462-.342a1 1 0 0 0 .84-.597l1.753-4.022Z"/>
                                </svg>  
                                  
                                Icons
                            </button>
                        </li>
                    </ul>
                    <div
                        class="col-span-9 py-3 text-medium text-gray-500 dark:text-gray-400 dark:bg-gray-800 rounded-lg w-full" style="height: 85vh; overflow-y: auto; overflow-x:hidden;"
                    >
                        {#if activeTab == "text"}
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
                        {:else if activeTab == "ribbons"}
                            <p class="font-medium">
                                Ribbons
                            </p>
                            <!-- <h1>The path to the static folder is: {imagePath}</h1> -->
                            <!-- <img src="/Ribbon/ribbon_1.png" alt="Ribbon Image"> -->
                            <div class="grid grid-cols-2">
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon", 
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 270 75" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M242.837 58.4126C172.35 33.1774 97.1279 33.1183 26.6124 58.2426C23.4092 45.6626 20.2003 33.0759 16.9858 20.4826C93.7931 -6.8887 175.729 -6.82608 252.506 20.6626C249.292 33.2426 246.069 45.8259 242.837 58.4126Z" fill="#1565D8"></path><path d="M15.9032 33.3828C18.5482 43.3828 21.1931 53.3828 23.838 63.3828C11.8428 73.5024 22.8398 64.0024 10.667 74.7228C12.2517 67.4561 13.9915 60.1895 15.8863 52.9228C10.7262 48.3961 5.43079 43.9895 0 39.7028C5.27289 37.4628 10.574 35.3561 15.9032 33.3828Z" fill="#1565D8"></path><path d="M254.097 33.3828C251.452 43.3828 248.807 53.3828 246.162 63.3828C258.157 73.5024 247.16 64.0024 259.333 74.7228C257.748 67.4561 256.009 60.1895 254.114 52.9228C259.274 48.3961 264.569 43.9895 270 39.7028C264.727 37.4628 259.426 35.3561 254.097 33.3828Z" fill="#1565D8"></path><path d="M26.6465 58.0024L23.6858 63.5024L15.6495 33.5024L16.9184 20.5024L26.6465 58.0024Z" fill="#01068B"></path><path d="M242.778 58.5024L246.162 63.5024L254.198 33.5024L252.506 21.0024L242.778 58.5024Z" fill="#01068B"></path></svg>
                                            `, [
                                                    {
                                                        "id": 1,
                                                        "indexes": [0,1,2],
                                                        "color": "#1565D8"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [3,4],
                                                        "color": "#01068B"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 270 75" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M242.837 58.4126C172.35 33.1774 97.1279 33.1183 26.6124 58.2426C23.4092 45.6626 20.2003 33.0759 16.9858 20.4826C93.7931 -6.8887 175.729 -6.82608 252.506 20.6626C249.292 33.2426 246.069 45.8259 242.837 58.4126Z" fill="#1565D8"></path><path d="M15.9032 33.3828C18.5482 43.3828 21.1931 53.3828 23.838 63.3828C11.8428 73.5024 22.8398 64.0024 10.667 74.7228C12.2517 67.4561 13.9915 60.1895 15.8863 52.9228C10.7262 48.3961 5.43079 43.9895 0 39.7028C5.27289 37.4628 10.574 35.3561 15.9032 33.3828Z" fill="#1565D8"></path><path d="M254.097 33.3828C251.452 43.3828 248.807 53.3828 246.162 63.3828C258.157 73.5024 247.16 64.0024 259.333 74.7228C257.748 67.4561 256.009 60.1895 254.114 52.9228C259.274 48.3961 264.569 43.9895 270 39.7028C264.727 37.4628 259.426 35.3561 254.097 33.3828Z" fill="#1565D8"></path><path d="M26.6465 58.0024L23.6858 63.5024L15.6495 33.5024L16.9184 20.5024L26.6465 58.0024Z" fill="#01068B"></path><path d="M242.778 58.5024L246.162 63.5024L254.198 33.5024L252.506 21.0024L242.778 58.5024Z" fill="#01068B"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 270 75" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M242.837 58.4126C172.35 33.1774 97.1279 33.1183 26.6124 58.2426C23.4092 45.6626 20.2003 33.0759 16.9858 20.4826C93.7931 -6.8887 175.729 -6.82608 252.506 20.6626C249.292 33.2426 246.069 45.8259 242.837 58.4126Z" fill="#000E59"></path><path d="M15.9032 33.3828C18.5482 43.3828 21.1931 53.3828 23.838 63.3828C11.8428 73.5024 22.8398 64.0024 10.667 74.7228C12.2517 67.4561 13.9915 60.1895 15.8863 52.9228C10.7262 48.3961 5.43079 43.9895 0 39.7028C5.27289 37.4628 10.574 35.3561 15.9032 33.3828Z" fill="#000E59"></path><path d="M254.097 33.3828C251.452 43.3828 248.807 53.3828 246.162 63.3828C258.157 73.5024 247.16 64.0024 259.333 74.7228C257.748 67.4561 256.009 60.1895 254.114 52.9228C259.274 48.3961 264.569 43.9895 270 39.7028C264.727 37.4628 259.426 35.3561 254.097 33.3828Z" fill="#000E59"></path><path d="M26.6465 58.0024L23.6858 63.5024L15.6495 33.5024L16.9184 20.5024L26.6465 58.0024Z" fill="black"></path><path d="M242.778 58.5024L246.162 63.5024L254.198 33.5024L252.506 21.0024L242.778 58.5024Z" fill="black"></path></svg>
                                            `, [
                                                    {
                                                        "id": 1,
                                                        "indexes": [0,1,2],
                                                        "color": "#000E59"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [3,4],
                                                        "color": "black"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 270 75" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M242.837 58.4126C172.35 33.1774 97.1279 33.1183 26.6124 58.2426C23.4092 45.6626 20.2003 33.0759 16.9858 20.4826C93.7931 -6.8887 175.729 -6.82608 252.506 20.6626C249.292 33.2426 246.069 45.8259 242.837 58.4126Z" fill="#000E59"></path><path d="M15.9032 33.3828C18.5482 43.3828 21.1931 53.3828 23.838 63.3828C11.8428 73.5024 22.8398 64.0024 10.667 74.7228C12.2517 67.4561 13.9915 60.1895 15.8863 52.9228C10.7262 48.3961 5.43079 43.9895 0 39.7028C5.27289 37.4628 10.574 35.3561 15.9032 33.3828Z" fill="#000E59"></path><path d="M254.097 33.3828C251.452 43.3828 248.807 53.3828 246.162 63.3828C258.157 73.5024 247.16 64.0024 259.333 74.7228C257.748 67.4561 256.009 60.1895 254.114 52.9228C259.274 48.3961 264.569 43.9895 270 39.7028C264.727 37.4628 259.426 35.3561 254.097 33.3828Z" fill="#000E59"></path><path d="M26.6465 58.0024L23.6858 63.5024L15.6495 33.5024L16.9184 20.5024L26.6465 58.0024Z" fill="black"></path><path d="M242.778 58.5024L246.162 63.5024L254.198 33.5024L252.506 21.0024L242.778 58.5024Z" fill="black"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 270 75" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M242.837 58.4126C172.35 33.1774 97.1279 33.1183 26.6124 58.2426C23.4092 45.6626 20.2003 33.0759 16.9858 20.4826C93.7931 -6.8887 175.729 -6.82608 252.506 20.6626C249.292 33.2426 246.069 45.8259 242.837 58.4126Z" fill="#F4A608"></path><path d="M15.9032 33.3828C18.5482 43.3828 21.1931 53.3828 23.838 63.3828C11.8428 73.5024 22.8398 64.0024 10.667 74.7228C12.2517 67.4561 13.9915 60.1895 15.8863 52.9228C10.7262 48.3961 5.43079 43.9895 0 39.7028C5.27289 37.4628 10.574 35.3561 15.9032 33.3828Z" fill="#F4A608"></path><path d="M254.097 33.3828C251.452 43.3828 248.807 53.3828 246.162 63.3828C258.157 73.5024 247.16 64.0024 259.333 74.7228C257.748 67.4561 256.009 60.1895 254.114 52.9228C259.274 48.3961 264.569 43.9895 270 39.7028C264.727 37.4628 259.426 35.3561 254.097 33.3828Z" fill="#F4A608"></path><path d="M26.6465 58.0024L23.6858 63.5024L15.6495 33.5024L16.9184 20.5024L26.6465 58.0024Z" fill="#8C5A00"></path><path d="M242.778 58.5024L246.162 63.5024L254.198 33.5024L252.506 21.0024L242.778 58.5024Z" fill="#8C5A00"></path></svg>
                                            `, [
                                                    {
                                                        "id": 1,
                                                        "indexes": [0,1,2],
                                                        "color": "#F4A608"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [3,4],
                                                        "color": "#8C5A00"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 270 75" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M242.837 58.4126C172.35 33.1774 97.1279 33.1183 26.6124 58.2426C23.4092 45.6626 20.2003 33.0759 16.9858 20.4826C93.7931 -6.8887 175.729 -6.82608 252.506 20.6626C249.292 33.2426 246.069 45.8259 242.837 58.4126Z" fill="#F4A608"></path><path d="M15.9032 33.3828C18.5482 43.3828 21.1931 53.3828 23.838 63.3828C11.8428 73.5024 22.8398 64.0024 10.667 74.7228C12.2517 67.4561 13.9915 60.1895 15.8863 52.9228C10.7262 48.3961 5.43079 43.9895 0 39.7028C5.27289 37.4628 10.574 35.3561 15.9032 33.3828Z" fill="#F4A608"></path><path d="M254.097 33.3828C251.452 43.3828 248.807 53.3828 246.162 63.3828C258.157 73.5024 247.16 64.0024 259.333 74.7228C257.748 67.4561 256.009 60.1895 254.114 52.9228C259.274 48.3961 264.569 43.9895 270 39.7028C264.727 37.4628 259.426 35.3561 254.097 33.3828Z" fill="#F4A608"></path><path d="M26.6465 58.0024L23.6858 63.5024L15.6495 33.5024L16.9184 20.5024L26.6465 58.0024Z" fill="#8C5A00"></path><path d="M242.778 58.5024L246.162 63.5024L254.198 33.5024L252.506 21.0024L242.778 58.5024Z" fill="#8C5A00"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 260 65" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M228.649 8.14807C228.649 8 228.835 4 228.835 4C228.835 4 230.927 3.36787 235.378 2.22714C239.829 1.08641 243.987 0 248.608 0C252.476 0.0208997 256.299 0.806852 259.835 2.30862C255.563 6.19254 252.955 9.46987 248.126 16.2961L247.692 16.9027L248.136 17.5002C252.194 22.7575 255.896 28.2582 259.221 33.9684C256.43 33.156 253.529 32.7411 250.612 32.7371C244.686 32.7371 239.46 34.4392 234.405 36.0779C232.571 36.6754 230.63 37.5111 228.835 38L228.649 8.14807Z" fill="#0A4CAB"></path><path d="M231 16.5L228.835 4L228.165 37.045L231 54L231 16.5Z" fill="black"></path><path d="M31.1855 8.14807C31.1855 8 31 4 31 4C31 4 28.908 3.36787 24.457 2.22714C20.006 1.08641 15.8479 0 11.2268 0C7.35852 0.0208997 3.53645 0.806852 0 2.30862C4.27146 6.19254 6.8797 9.46987 11.7087 16.2961L12.1434 16.9027L11.6993 17.5002C7.64145 22.7575 3.93888 28.2582 0.614259 33.9684C3.40545 33.156 6.30616 32.7411 9.22334 32.7371C15.1486 32.7371 20.3745 34.4392 25.4303 36.0779C27.2637 36.6754 29.2045 37.5111 31 38L31.1855 8.14807Z" fill="#0A4CAB"></path><path d="M29 16.5L31 4L31.835 37.045L29 54V16.5Z" fill="black"></path><path d="M228.419 17.2875L226.718 17.7402C222.645 18.7814 218.061 19.732 213.053 20.6101L212.325 20.7369L211.588 20.8636C190.06 24.485 161.001 26.6035 130.052 26.6035C99.1028 26.6035 70.0342 24.4941 48.4973 20.8636L47.7224 20.7278L46.9758 20.6101C41.9767 19.7048 37.4123 18.7995 33.3393 17.7402C32.7722 17.6044 32.2052 17.4505 31.6571 17.3057C31.109 17.1608 30.5042 16.9978 29.9467 16.8258L29 16.5V54C49.4407 60.3374 87.6965 64.2929 130.005 64.2929C172.313 64.2929 210.578 60.3736 231 54V16.5473C230.575 16.6831 230.516 16.69 230.063 16.8168C229.609 16.9435 228.967 17.1065 228.419 17.2875Z" fill="#1565D8"></path></svg>
                                            `, [ 
                                                    {
                                                        "id": 1,
                                                        "indexes": [0,2],
                                                        "color": "#0A4CAB"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [1,3],
                                                        "color": "black"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": [4],
                                                        "color": "#1565D8"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 260 65" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M228.649 8.14807C228.649 8 228.835 4 228.835 4C228.835 4 230.927 3.36787 235.378 2.22714C239.829 1.08641 243.987 0 248.608 0C252.476 0.0208997 256.299 0.806852 259.835 2.30862C255.563 6.19254 252.955 9.46987 248.126 16.2961L247.692 16.9027L248.136 17.5002C252.194 22.7575 255.896 28.2582 259.221 33.9684C256.43 33.156 253.529 32.7411 250.612 32.7371C244.686 32.7371 239.46 34.4392 234.405 36.0779C232.571 36.6754 230.63 37.5111 228.835 38L228.649 8.14807Z" fill="#0A4CAB"></path><path d="M231 16.5L228.835 4L228.165 37.045L231 54L231 16.5Z" fill="black"></path><path d="M31.1855 8.14807C31.1855 8 31 4 31 4C31 4 28.908 3.36787 24.457 2.22714C20.006 1.08641 15.8479 0 11.2268 0C7.35852 0.0208997 3.53645 0.806852 0 2.30862C4.27146 6.19254 6.8797 9.46987 11.7087 16.2961L12.1434 16.9027L11.6993 17.5002C7.64145 22.7575 3.93888 28.2582 0.614259 33.9684C3.40545 33.156 6.30616 32.7411 9.22334 32.7371C15.1486 32.7371 20.3745 34.4392 25.4303 36.0779C27.2637 36.6754 29.2045 37.5111 31 38L31.1855 8.14807Z" fill="#0A4CAB"></path><path d="M29 16.5L31 4L31.835 37.045L29 54V16.5Z" fill="black"></path><path d="M228.419 17.2875L226.718 17.7402C222.645 18.7814 218.061 19.732 213.053 20.6101L212.325 20.7369L211.588 20.8636C190.06 24.485 161.001 26.6035 130.052 26.6035C99.1028 26.6035 70.0342 24.4941 48.4973 20.8636L47.7224 20.7278L46.9758 20.6101C41.9767 19.7048 37.4123 18.7995 33.3393 17.7402C32.7722 17.6044 32.2052 17.4505 31.6571 17.3057C31.109 17.1608 30.5042 16.9978 29.9467 16.8258L29 16.5V54C49.4407 60.3374 87.6965 64.2929 130.005 64.2929C172.313 64.2929 210.578 60.3736 231 54V16.5473C230.575 16.6831 230.516 16.69 230.063 16.8168C229.609 16.9435 228.967 17.1065 228.419 17.2875Z" fill="#1565D8"></path></svg>
                                        
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 260 65" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M228.649 8.14807C228.649 8 228.835 4 228.835 4C228.835 4 230.927 3.36787 235.378 2.22714C239.829 1.08641 243.987 0 248.608 0C252.476 0.0208997 256.299 0.806852 259.835 2.30862C255.563 6.19254 252.955 9.46987 248.126 16.2961L247.692 16.9027L248.136 17.5002C252.194 22.7575 255.896 28.2582 259.221 33.9684C256.43 33.156 253.529 32.7411 250.612 32.7371C244.686 32.7371 239.46 34.4392 234.405 36.0779C232.571 36.6754 230.63 37.5111 228.835 38L228.649 8.14807Z" fill="#021263"></path><path d="M231 16.5L228.835 4L228.165 37.045L231 54L231 16.5Z" fill="black"></path><path d="M31.1855 8.14807C31.1855 8 31 4 31 4C31 4 28.908 3.36787 24.457 2.22714C20.006 1.08641 15.8479 0 11.2268 0C7.35852 0.0208997 3.53645 0.806852 0 2.30862C4.27146 6.19254 6.8797 9.46987 11.7087 16.2961L12.1434 16.9027L11.6993 17.5002C7.64145 22.7575 3.93888 28.2582 0.614259 33.9684C3.40545 33.156 6.30616 32.7411 9.22334 32.7371C15.1486 32.7371 20.3745 34.4392 25.4303 36.0779C27.2637 36.6754 29.2045 37.5111 31 38L31.1855 8.14807Z" fill="#021263"></path><path d="M29 16.5L31 4L31.835 37.045L29 54V16.5Z" fill="black"></path><path d="M228.419 17.2875L226.718 17.7402C222.645 18.7814 218.061 19.732 213.053 20.6101L212.325 20.7369L211.588 20.8636C190.06 24.485 161.001 26.6035 130.052 26.6035C99.1028 26.6035 70.0342 24.4941 48.4973 20.8636L47.7224 20.7278L46.9758 20.6101C41.9767 19.7048 37.4123 18.7995 33.3393 17.7402C32.7722 17.6044 32.2052 17.4505 31.6571 17.3057C31.109 17.1608 30.5042 16.9978 29.9467 16.8258L29 16.5V54C49.4407 60.3374 87.6965 64.2929 130.005 64.2929C172.313 64.2929 210.578 60.3736 231 54V16.5473C230.575 16.6831 230.516 16.69 230.063 16.8168C229.609 16.9435 228.967 17.1065 228.419 17.2875Z" fill="#293888"></path></svg>
                                            `, [ 
                                                    {
                                                        "id": 1,
                                                        "indexes": [0,2],
                                                        "color": "#021263"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [1,3],
                                                        "color": "black"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": [4],
                                                        "color": "#293888"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 260 65" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M228.649 8.14807C228.649 8 228.835 4 228.835 4C228.835 4 230.927 3.36787 235.378 2.22714C239.829 1.08641 243.987 0 248.608 0C252.476 0.0208997 256.299 0.806852 259.835 2.30862C255.563 6.19254 252.955 9.46987 248.126 16.2961L247.692 16.9027L248.136 17.5002C252.194 22.7575 255.896 28.2582 259.221 33.9684C256.43 33.156 253.529 32.7411 250.612 32.7371C244.686 32.7371 239.46 34.4392 234.405 36.0779C232.571 36.6754 230.63 37.5111 228.835 38L228.649 8.14807Z" fill="#021263"></path><path d="M231 16.5L228.835 4L228.165 37.045L231 54L231 16.5Z" fill="black"></path><path d="M31.1855 8.14807C31.1855 8 31 4 31 4C31 4 28.908 3.36787 24.457 2.22714C20.006 1.08641 15.8479 0 11.2268 0C7.35852 0.0208997 3.53645 0.806852 0 2.30862C4.27146 6.19254 6.8797 9.46987 11.7087 16.2961L12.1434 16.9027L11.6993 17.5002C7.64145 22.7575 3.93888 28.2582 0.614259 33.9684C3.40545 33.156 6.30616 32.7411 9.22334 32.7371C15.1486 32.7371 20.3745 34.4392 25.4303 36.0779C27.2637 36.6754 29.2045 37.5111 31 38L31.1855 8.14807Z" fill="#021263"></path><path d="M29 16.5L31 4L31.835 37.045L29 54V16.5Z" fill="black"></path><path d="M228.419 17.2875L226.718 17.7402C222.645 18.7814 218.061 19.732 213.053 20.6101L212.325 20.7369L211.588 20.8636C190.06 24.485 161.001 26.6035 130.052 26.6035C99.1028 26.6035 70.0342 24.4941 48.4973 20.8636L47.7224 20.7278L46.9758 20.6101C41.9767 19.7048 37.4123 18.7995 33.3393 17.7402C32.7722 17.6044 32.2052 17.4505 31.6571 17.3057C31.109 17.1608 30.5042 16.9978 29.9467 16.8258L29 16.5V54C49.4407 60.3374 87.6965 64.2929 130.005 64.2929C172.313 64.2929 210.578 60.3736 231 54V16.5473C230.575 16.6831 230.516 16.69 230.063 16.8168C229.609 16.9435 228.967 17.1065 228.419 17.2875Z" fill="#293888"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 260 65" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M228.649 8.14807C228.649 8 228.835 4 228.835 4C228.835 4 230.927 3.36787 235.378 2.22714C239.829 1.08641 243.987 0 248.608 0C252.476 0.0208997 256.299 0.806852 259.835 2.30862C255.563 6.19254 252.955 9.46987 248.126 16.2961L247.692 16.9027L248.136 17.5002C252.194 22.7575 255.896 28.2582 259.221 33.9684C256.43 33.156 253.529 32.7411 250.612 32.7371C244.686 32.7371 239.46 34.4392 234.405 36.0779C232.571 36.6754 230.63 37.5111 228.835 38L228.649 8.14807Z" fill="#D3921C"></path><path d="M231 16.5L228.835 4L228.165 37.045L231 54L231 16.5Z" fill="black"></path><path d="M31.1855 8.14807C31.1855 8 31 4 31 4C31 4 28.908 3.36787 24.457 2.22714C20.006 1.08641 15.8479 0 11.2268 0C7.35852 0.0208997 3.53645 0.806852 0 2.30862C4.27146 6.19254 6.8797 9.46987 11.7087 16.2961L12.1434 16.9027L11.6993 17.5002C7.64145 22.7575 3.93888 28.2582 0.614259 33.9684C3.40545 33.156 6.30616 32.7411 9.22334 32.7371C15.1486 32.7371 20.3745 34.4392 25.4303 36.0779C27.2637 36.6754 29.2045 37.5111 31 38L31.1855 8.14807Z" fill="#D3921C"></path><path d="M28.9999 16.5L30.9999 4L31.835 37.045L28.9999 54V16.5Z" fill="black"></path><path d="M228.419 17.2875L226.718 17.7402C222.645 18.7814 218.061 19.732 213.053 20.6101L212.325 20.7369L211.588 20.8636C190.06 24.485 161.001 26.6035 130.052 26.6035C99.1028 26.6035 70.0342 24.4941 48.4973 20.8636L47.7224 20.7278L46.9758 20.6101C41.9767 19.7048 37.4123 18.7995 33.3393 17.7402C32.7722 17.6044 32.2052 17.4505 31.6571 17.3057C31.109 17.1608 30.5042 16.9978 29.9467 16.8258L29 16.5V54C49.4407 60.3374 87.6965 64.2929 130.005 64.2929C172.313 64.2929 210.578 60.3736 231 54V16.5473C230.575 16.6831 230.516 16.69 230.063 16.8168C229.609 16.9435 228.967 17.1065 228.419 17.2875Z" fill="#FFB300"></path></svg>  
                                            `, [ 
                                                    {
                                                        "id": 1,
                                                        "indexes": [0,2],
                                                        "color": "#D3921C"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [1,3],
                                                        "color": "black"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": [4],
                                                        "color": "#FFB300"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 260 65" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M228.649 8.14807C228.649 8 228.835 4 228.835 4C228.835 4 230.927 3.36787 235.378 2.22714C239.829 1.08641 243.987 0 248.608 0C252.476 0.0208997 256.299 0.806852 259.835 2.30862C255.563 6.19254 252.955 9.46987 248.126 16.2961L247.692 16.9027L248.136 17.5002C252.194 22.7575 255.896 28.2582 259.221 33.9684C256.43 33.156 253.529 32.7411 250.612 32.7371C244.686 32.7371 239.46 34.4392 234.405 36.0779C232.571 36.6754 230.63 37.5111 228.835 38L228.649 8.14807Z" fill="#D3921C"></path><path d="M231 16.5L228.835 4L228.165 37.045L231 54L231 16.5Z" fill="black"></path><path d="M31.1855 8.14807C31.1855 8 31 4 31 4C31 4 28.908 3.36787 24.457 2.22714C20.006 1.08641 15.8479 0 11.2268 0C7.35852 0.0208997 3.53645 0.806852 0 2.30862C4.27146 6.19254 6.8797 9.46987 11.7087 16.2961L12.1434 16.9027L11.6993 17.5002C7.64145 22.7575 3.93888 28.2582 0.614259 33.9684C3.40545 33.156 6.30616 32.7411 9.22334 32.7371C15.1486 32.7371 20.3745 34.4392 25.4303 36.0779C27.2637 36.6754 29.2045 37.5111 31 38L31.1855 8.14807Z" fill="#D3921C"></path><path d="M28.9999 16.5L30.9999 4L31.835 37.045L28.9999 54V16.5Z" fill="black"></path><path d="M228.419 17.2875L226.718 17.7402C222.645 18.7814 218.061 19.732 213.053 20.6101L212.325 20.7369L211.588 20.8636C190.06 24.485 161.001 26.6035 130.052 26.6035C99.1028 26.6035 70.0342 24.4941 48.4973 20.8636L47.7224 20.7278L46.9758 20.6101C41.9767 19.7048 37.4123 18.7995 33.3393 17.7402C32.7722 17.6044 32.2052 17.4505 31.6571 17.3057C31.109 17.1608 30.5042 16.9978 29.9467 16.8258L29 16.5V54C49.4407 60.3374 87.6965 64.2929 130.005 64.2929C172.313 64.2929 210.578 60.3736 231 54V16.5473C230.575 16.6831 230.516 16.69 230.063 16.8168C229.609 16.9435 228.967 17.1065 228.419 17.2875Z" fill="#FFB300"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 270 82" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M49.8467 48.8562C32.0931 47.0415 15.6313 42.1325 0.303104 35C7.65034 44.3363 14.9854 53.0003 22.3206 61.0762C15.2388 64.5394 7.76882 67.5077 0 69.9457C14.2419 75.314 22.1673 79.1991 49.8467 82L50 79.6659V76.3037C50 76.3037 49.685 58.1054 49.8467 48.8562Z" fill="#480CA9"></path><path d="M40 68L50 82V49L41 30L40 68Z" fill="#0E2B00"></path><path d="M270 53.5456C193.665 12.0531 116.417 72.2203 40 68V29.5C116.335 33.7295 193.583 -25.7981 270 15.6944C263.562 18.8557 257.408 22.4709 251.597 26.5064C257.704 34.9188 263.893 43.9007 270 53.5456Z" fill="#7B40DD"></path></svg>
                                            `, [ 
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#480CA9"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [1],
                                                        "color": "#0E2B00"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": [3],
                                                        "color": "#7B40DD"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 270 82" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M49.8467 48.8562C32.0931 47.0415 15.6313 42.1325 0.303104 35C7.65034 44.3363 14.9854 53.0003 22.3206 61.0762C15.2388 64.5394 7.76882 67.5077 0 69.9457C14.2419 75.314 22.1673 79.1991 49.8467 82L50 79.6659V76.3037C50 76.3037 49.685 58.1054 49.8467 48.8562Z" fill="#480CA9"></path><path d="M40 68L50 82V49L41 30L40 68Z" fill="#0E2B00"></path><path d="M270 53.5456C193.665 12.0531 116.417 72.2203 40 68V29.5C116.335 33.7295 193.583 -25.7981 270 15.6944C263.562 18.8557 257.408 22.4709 251.597 26.5064C257.704 34.9188 263.893 43.9007 270 53.5456Z" fill="#7B40DD"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 270 82" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M49.8467 48.8562C32.0931 47.0415 15.6313 42.1325 0.303104 35C7.65034 44.3363 14.9854 53.0003 22.3206 61.0762C15.2388 64.5394 7.76882 67.5077 0 69.9457C14.2419 75.314 22.1673 79.1991 49.8467 82L50 79.6659V76.3037C50 76.3037 49.685 58.1054 49.8467 48.8562Z" fill="#426A96"></path><path d="M40 68L50 82V49L41 30L40 68Z" fill="#0E2B00"></path><path d="M270 53.5456C193.665 12.0531 116.417 72.2203 40 68V29.5C116.335 33.7295 193.583 -25.7981 270 15.6944C263.562 18.8557 257.408 22.4709 251.597 26.5064C257.704 34.9188 263.893 43.9007 270 53.5456Z" fill="#668BB4"></path></svg>  
                                            `, [ 
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#426A96"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [1],
                                                        "color": "#0E2B00"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": [3],
                                                        "color": "#668BB4"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 270 82" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M49.8467 48.8562C32.0931 47.0415 15.6313 42.1325 0.303104 35C7.65034 44.3363 14.9854 53.0003 22.3206 61.0762C15.2388 64.5394 7.76882 67.5077 0 69.9457C14.2419 75.314 22.1673 79.1991 49.8467 82L50 79.6659V76.3037C50 76.3037 49.685 58.1054 49.8467 48.8562Z" fill="#426A96"></path><path d="M40 68L50 82V49L41 30L40 68Z" fill="#0E2B00"></path><path d="M270 53.5456C193.665 12.0531 116.417 72.2203 40 68V29.5C116.335 33.7295 193.583 -25.7981 270 15.6944C263.562 18.8557 257.408 22.4709 251.597 26.5064C257.704 34.9188 263.893 43.9007 270 53.5456Z" fill="#668BB4"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 270 82" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M49.8467 48.8562C32.0931 47.0415 15.6313 42.1325 0.303104 35C7.65034 44.3363 14.9854 53.0003 22.3206 61.0762C15.2388 64.5394 7.76882 67.5077 0 69.9457C14.2419 75.314 22.1673 79.1991 49.8467 82L50 79.6659V76.3037C50 76.3037 49.685 58.1054 49.8467 48.8562Z" fill="#D3921C"></path><path d="M40 68L50 82V49L41 30L40 68Z" fill="#0E2B00"></path><path d="M270 53.5456C193.665 12.0531 116.417 72.2203 40 68V29.5C116.335 33.7295 193.583 -25.7981 270 15.6944C263.562 18.8557 257.408 22.4709 251.597 26.5064C257.704 34.9188 263.893 43.9007 270 53.5456Z" fill="#FFAE1C"></path></svg>
                                            `, [ 
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#D3921C"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [1],
                                                        "color": "#0E2B00"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": [3],
                                                        "color": "#FFAE1C"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 270 82" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M49.8467 48.8562C32.0931 47.0415 15.6313 42.1325 0.303104 35C7.65034 44.3363 14.9854 53.0003 22.3206 61.0762C15.2388 64.5394 7.76882 67.5077 0 69.9457C14.2419 75.314 22.1673 79.1991 49.8467 82L50 79.6659V76.3037C50 76.3037 49.685 58.1054 49.8467 48.8562Z" fill="#D3921C"></path><path d="M40 68L50 82V49L41 30L40 68Z" fill="#0E2B00"></path><path d="M270 53.5456C193.665 12.0531 116.417 72.2203 40 68V29.5C116.335 33.7295 193.583 -25.7981 270 15.6944C263.562 18.8557 257.408 22.4709 251.597 26.5064C257.704 34.9188 263.893 43.9007 270 53.5456Z" fill="#FFAE1C"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 270 43" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M237.954 2.17767C237.75 1.6568 237.288 1.19512 236.64 0.865309C235.991 0.535502 235.194 0.356312 234.373 0.355957L35.9471 0.355957C35.125 0.356015 34.3261 0.534983 33.6762 0.864733C33.0262 1.19448 32.562 1.65632 32.3564 2.17767C27.4593 14.7703 27.4593 27.9659 32.3564 40.5586C32.5585 41.0821 33.0213 41.5467 33.6716 41.8787C34.3218 42.2108 35.1226 42.3915 35.9471 42.3922H234.373C235.197 42.3904 235.997 42.2094 236.647 41.8775C237.297 41.5456 237.76 41.0816 237.963 40.5586C242.867 27.9664 242.867 14.7698 237.963 2.17767H237.954Z" fill="#FFB300"></path><path d="M24.5387 5.4342H0.903607C0.745038 5.42933 0.58758 5.4538 0.449253 5.5048C0.310927 5.5558 0.197321 5.63128 0.12144 5.72259C0.0455588 5.81391 0.0104675 5.91737 0.0201825 6.02113C0.0298976 6.1249 0.0840266 6.22478 0.176374 6.30934L14.9483 20.7282C15.0338 20.8174 15.0792 20.9206 15.0792 21.0259C15.0792 21.1312 15.0338 21.2344 14.9483 21.3236L0.130922 36.4568C0.0499419 36.5413 0.00487177 36.6383 0.000373229 36.738C-0.00412531 36.8376 0.0321111 36.9363 0.105334 37.0237C0.178558 37.1111 0.286109 37.1841 0.416864 37.2352C0.54762 37.2862 0.696831 37.3135 0.849064 37.3141H24.5387C24.6609 37.3133 24.7815 37.2953 24.8922 37.2614C25.0029 37.2275 25.1012 37.1784 25.1805 37.1174C25.2598 37.0565 25.3182 36.9851 25.3517 36.9081C25.3853 36.8311 25.3932 36.7503 25.375 36.6712C22.2838 26.5877 22.2838 16.2023 25.375 6.11883C25.4037 6.03666 25.4038 5.95129 25.3751 5.86911C25.3464 5.78693 25.2898 5.71005 25.2093 5.64422C25.1289 5.57839 25.0268 5.52531 24.9107 5.48895C24.7946 5.45258 24.6674 5.43386 24.5387 5.4342Z" fill="#FFB300"></path><path d="M245.436 5.43411H269.071C269.224 5.43422 269.374 5.46164 269.506 5.51342C269.637 5.56521 269.745 5.63942 269.816 5.7281C269.888 5.81678 269.922 5.9166 269.914 6.01687C269.906 6.11714 269.856 6.21409 269.771 6.29734L255.044 20.7281C254.957 20.8168 254.91 20.9202 254.91 21.0258C254.91 21.1314 254.957 21.2348 255.044 21.3235L269.862 36.4448C269.945 36.5284 269.993 36.6253 269.999 36.7252C270.006 36.8251 269.971 36.9243 269.898 37.0122C269.825 37.1001 269.718 37.1734 269.586 37.2245C269.455 37.2755 269.305 37.3024 269.153 37.3021H245.436C245.316 37.3004 245.199 37.2821 245.091 37.2484C244.983 37.2148 244.887 37.1666 244.81 37.1069C244.733 37.0473 244.676 36.9777 244.643 36.9025C244.609 36.8274 244.601 36.7485 244.618 36.6711C247.697 26.5868 247.697 16.203 244.618 6.11874C244.585 6.03735 244.582 5.95222 244.609 5.86994C244.635 5.78765 244.69 5.71043 244.769 5.64423C244.848 5.57804 244.949 5.52466 245.065 5.48822C245.18 5.45178 245.307 5.43327 245.436 5.43411Z" fill="#FFB300"></path></svg>
                                            `, [ 
                                                    {
                                                        "id": 1,
                                                        "indexes": [0,1,2],
                                                        "color": "#FFB300"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 270 43" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M237.954 2.17767C237.75 1.6568 237.288 1.19512 236.64 0.865309C235.991 0.535502 235.194 0.356312 234.373 0.355957L35.9471 0.355957C35.125 0.356015 34.3261 0.534983 33.6762 0.864733C33.0262 1.19448 32.562 1.65632 32.3564 2.17767C27.4593 14.7703 27.4593 27.9659 32.3564 40.5586C32.5585 41.0821 33.0213 41.5467 33.6716 41.8787C34.3218 42.2108 35.1226 42.3915 35.9471 42.3922H234.373C235.197 42.3904 235.997 42.2094 236.647 41.8775C237.297 41.5456 237.76 41.0816 237.963 40.5586C242.867 27.9664 242.867 14.7698 237.963 2.17767H237.954Z" fill="#FFB300"></path><path d="M24.5387 5.4342H0.903607C0.745038 5.42933 0.58758 5.4538 0.449253 5.5048C0.310927 5.5558 0.197321 5.63128 0.12144 5.72259C0.0455588 5.81391 0.0104675 5.91737 0.0201825 6.02113C0.0298976 6.1249 0.0840266 6.22478 0.176374 6.30934L14.9483 20.7282C15.0338 20.8174 15.0792 20.9206 15.0792 21.0259C15.0792 21.1312 15.0338 21.2344 14.9483 21.3236L0.130922 36.4568C0.0499419 36.5413 0.00487177 36.6383 0.000373229 36.738C-0.00412531 36.8376 0.0321111 36.9363 0.105334 37.0237C0.178558 37.1111 0.286109 37.1841 0.416864 37.2352C0.54762 37.2862 0.696831 37.3135 0.849064 37.3141H24.5387C24.6609 37.3133 24.7815 37.2953 24.8922 37.2614C25.0029 37.2275 25.1012 37.1784 25.1805 37.1174C25.2598 37.0565 25.3182 36.9851 25.3517 36.9081C25.3853 36.8311 25.3932 36.7503 25.375 36.6712C22.2838 26.5877 22.2838 16.2023 25.375 6.11883C25.4037 6.03666 25.4038 5.95129 25.3751 5.86911C25.3464 5.78693 25.2898 5.71005 25.2093 5.64422C25.1289 5.57839 25.0268 5.52531 24.9107 5.48895C24.7946 5.45258 24.6674 5.43386 24.5387 5.4342Z" fill="#FFB300"></path><path d="M245.436 5.43411H269.071C269.224 5.43422 269.374 5.46164 269.506 5.51342C269.637 5.56521 269.745 5.63942 269.816 5.7281C269.888 5.81678 269.922 5.9166 269.914 6.01687C269.906 6.11714 269.856 6.21409 269.771 6.29734L255.044 20.7281C254.957 20.8168 254.91 20.9202 254.91 21.0258C254.91 21.1314 254.957 21.2348 255.044 21.3235L269.862 36.4448C269.945 36.5284 269.993 36.6253 269.999 36.7252C270.006 36.8251 269.971 36.9243 269.898 37.0122C269.825 37.1001 269.718 37.1734 269.586 37.2245C269.455 37.2755 269.305 37.3024 269.153 37.3021H245.436C245.316 37.3004 245.199 37.2821 245.091 37.2484C244.983 37.2148 244.887 37.1666 244.81 37.1069C244.733 37.0473 244.676 36.9777 244.643 36.9025C244.609 36.8274 244.601 36.7485 244.618 36.6711C247.697 26.5868 247.697 16.203 244.618 6.11874C244.585 6.03735 244.582 5.95222 244.609 5.86994C244.635 5.78765 244.69 5.71043 244.769 5.64423C244.848 5.57804 244.949 5.52466 245.065 5.48822C245.18 5.45178 245.307 5.43327 245.436 5.43411Z" fill="#FFB300"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 226 72" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.4876 49.7587C13.3815 49.6575 7.43923 48.5351 2.31309 46.5146C1.4342 46.1223 0.760106 45.5841 0.371705 44.9645C-0.0166963 44.3449 -0.102908 43.6704 0.123415 43.0218C2.4797 36.6755 3.74627 30.1977 3.90275 23.6924C3.57082 17.0675 2.56235 10.4615 0.883179 3.91273C0.759492 3.32193 0.887615 2.72172 1.25525 2.16972C1.62288 1.61772 2.21767 1.13247 2.98251 0.760571C3.74736 0.388669 4.65656 0.142605 5.62282 0.0460038C6.58909 -0.0505976 7.57996 0.00550828 8.5003 0.208935C22.2676 2.82766 36.5525 4.30542 50.9691 4.6023C52.9913 4.665 54.8962 5.19858 56.289 6.09242C57.6817 6.98626 58.4555 8.1718 58.4499 9.40325V25.9198L19.4876 49.7587Z" fill="#7C7ED0"></path><path d="M206.506 21.3232C212.616 21.4238 218.561 22.5472 223.689 24.5697C224.562 24.9625 225.232 25.4995 225.619 26.1169C226.006 26.7344 226.093 27.4064 225.871 28.0531C223.512 34.4015 222.246 40.8819 222.091 47.3896C222.422 54.0085 223.424 60.6087 225.091 67.1526C225.221 67.7437 225.098 68.345 224.734 68.8987C224.371 69.4524 223.778 69.9397 223.015 70.3137C222.251 70.6876 221.342 70.9355 220.375 71.0335C219.408 71.1315 218.415 71.0762 217.494 70.873C203.727 68.2548 189.441 66.7801 175.025 66.4891C173.002 66.4224 171.099 65.8862 169.707 64.9913C168.315 64.0963 167.541 62.9106 167.544 61.6787V46.9868L206.506 21.3232Z" fill="#7C7ED0"></path><path d="M206.506 15.6129V52.1295C206.497 50.7985 205.681 49.5163 204.214 48.5283C202.748 47.5403 200.734 46.9157 198.558 46.774C193.833 46.4765 189.087 46.3262 184.337 46.3238C133.491 46.3238 106.373 63.9778 70.1384 63.9778C45.7481 63.9778 33.0854 62.3191 26.5397 60.6129C24.4477 60.0631 22.6655 59.1533 21.4126 57.9955C20.1596 56.8377 19.4905 55.4824 19.4875 54.0963V18.9541C19.4875 18.9541 19.4875 26.0631 70.1384 26.0631C109.919 26.0631 135.05 4.42804 195.947 8.52757C198.832 8.71277 201.503 9.53761 203.45 10.8446C205.398 12.1515 206.486 13.849 206.506 15.6129V15.6129Z" fill="#9693EB"></path><path d="M58.4498 9.40332V25.9199C19.4875 24.9247 19.4875 18.9531 19.4875 18.9531C19.4937 17.6973 20.3167 16.494 21.7767 15.606C23.2367 14.718 25.2152 14.2175 27.28 14.2138H50.5404C52.6378 14.2131 54.649 13.7061 56.132 12.8041C57.6151 11.9021 58.4487 10.6789 58.4498 9.40332V9.40332Z" fill="#5B61AF"></path><path d="M206.506 52.1295C206.491 53.3835 205.665 54.5836 204.207 55.4704C202.749 56.3572 200.776 56.8595 198.714 56.8688H175.454C173.356 56.8694 171.345 57.3764 169.862 58.2784C168.379 59.1804 167.545 60.4036 167.544 61.6792V46.9873C173.112 46.5423 178.721 46.3207 184.337 46.3238C189.087 46.3262 193.833 46.4765 198.558 46.774C200.734 46.9157 202.748 47.5402 204.214 48.5283C205.681 49.5163 206.497 50.7984 206.506 52.1295V52.1295Z" fill="#5B61AF"></path></svg>                                          
                                            `, [ 
                                                    {
                                                        "id": 1,
                                                        "indexes": [0,1],
                                                        "color": "#7C7ED0"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [2],
                                                        "color": "#9693EB"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": [3,4],
                                                        "color": "#5B61AF"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 226 72" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.4876 49.7587C13.3815 49.6575 7.43923 48.5351 2.31309 46.5146C1.4342 46.1223 0.760106 45.5841 0.371705 44.9645C-0.0166963 44.3449 -0.102908 43.6704 0.123415 43.0218C2.4797 36.6755 3.74627 30.1977 3.90275 23.6924C3.57082 17.0675 2.56235 10.4615 0.883179 3.91273C0.759492 3.32193 0.887615 2.72172 1.25525 2.16972C1.62288 1.61772 2.21767 1.13247 2.98251 0.760571C3.74736 0.388669 4.65656 0.142605 5.62282 0.0460038C6.58909 -0.0505976 7.57996 0.00550828 8.5003 0.208935C22.2676 2.82766 36.5525 4.30542 50.9691 4.6023C52.9913 4.665 54.8962 5.19858 56.289 6.09242C57.6817 6.98626 58.4555 8.1718 58.4499 9.40325V25.9198L19.4876 49.7587Z" fill="#7C7ED0"></path><path d="M206.506 21.3232C212.616 21.4238 218.561 22.5472 223.689 24.5697C224.562 24.9625 225.232 25.4995 225.619 26.1169C226.006 26.7344 226.093 27.4064 225.871 28.0531C223.512 34.4015 222.246 40.8819 222.091 47.3896C222.422 54.0085 223.424 60.6087 225.091 67.1526C225.221 67.7437 225.098 68.345 224.734 68.8987C224.371 69.4524 223.778 69.9397 223.015 70.3137C222.251 70.6876 221.342 70.9355 220.375 71.0335C219.408 71.1315 218.415 71.0762 217.494 70.873C203.727 68.2548 189.441 66.7801 175.025 66.4891C173.002 66.4224 171.099 65.8862 169.707 64.9913C168.315 64.0963 167.541 62.9106 167.544 61.6787V46.9868L206.506 21.3232Z" fill="#7C7ED0"></path><path d="M206.506 15.6129V52.1295C206.497 50.7985 205.681 49.5163 204.214 48.5283C202.748 47.5403 200.734 46.9157 198.558 46.774C193.833 46.4765 189.087 46.3262 184.337 46.3238C133.491 46.3238 106.373 63.9778 70.1384 63.9778C45.7481 63.9778 33.0854 62.3191 26.5397 60.6129C24.4477 60.0631 22.6655 59.1533 21.4126 57.9955C20.1596 56.8377 19.4905 55.4824 19.4875 54.0963V18.9541C19.4875 18.9541 19.4875 26.0631 70.1384 26.0631C109.919 26.0631 135.05 4.42804 195.947 8.52757C198.832 8.71277 201.503 9.53761 203.45 10.8446C205.398 12.1515 206.486 13.849 206.506 15.6129V15.6129Z" fill="#9693EB"></path><path d="M58.4498 9.40332V25.9199C19.4875 24.9247 19.4875 18.9531 19.4875 18.9531C19.4937 17.6973 20.3167 16.494 21.7767 15.606C23.2367 14.718 25.2152 14.2175 27.28 14.2138H50.5404C52.6378 14.2131 54.649 13.7061 56.132 12.8041C57.6151 11.9021 58.4487 10.6789 58.4498 9.40332V9.40332Z" fill="#5B61AF"></path><path d="M206.506 52.1295C206.491 53.3835 205.665 54.5836 204.207 55.4704C202.749 56.3572 200.776 56.8595 198.714 56.8688H175.454C173.356 56.8694 171.345 57.3764 169.862 58.2784C168.379 59.1804 167.545 60.4036 167.544 61.6792V46.9873C173.112 46.5423 178.721 46.3207 184.337 46.3238C189.087 46.3262 193.833 46.4765 198.558 46.774C200.734 46.9157 202.748 47.5402 204.214 48.5283C205.681 49.5163 206.497 50.7984 206.506 52.1295V52.1295Z" fill="#5B61AF"></path></svg>                                       
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 226 72" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.4876 49.7587C13.3815 49.6575 7.43923 48.5351 2.31309 46.5146C1.4342 46.1223 0.760106 45.5841 0.371705 44.9645C-0.0166963 44.3449 -0.102908 43.6704 0.123415 43.0218C2.4797 36.6755 3.74627 30.1977 3.90275 23.6924C3.57082 17.0675 2.56235 10.4615 0.883179 3.91273C0.759492 3.32193 0.887615 2.72172 1.25525 2.16972C1.62288 1.61772 2.21767 1.13247 2.98251 0.760571C3.74736 0.388669 4.65656 0.142605 5.62282 0.0460038C6.58909 -0.0505976 7.57996 0.00550828 8.5003 0.208935C22.2676 2.82766 36.5525 4.30542 50.9691 4.6023C52.9913 4.665 54.8962 5.19858 56.289 6.09242C57.6817 6.98626 58.4555 8.1718 58.4499 9.40325V25.9198L19.4876 49.7587Z" fill="#FAAD13"></path><path d="M206.506 21.3232C212.616 21.4238 218.561 22.5472 223.689 24.5697C224.562 24.9625 225.232 25.4995 225.619 26.1169C226.006 26.7344 226.093 27.4064 225.871 28.0531C223.512 34.4015 222.246 40.8819 222.091 47.3896C222.422 54.0085 223.424 60.6087 225.091 67.1526C225.221 67.7437 225.098 68.345 224.734 68.8987C224.371 69.4524 223.778 69.9397 223.015 70.3137C222.251 70.6876 221.342 70.9355 220.375 71.0335C219.408 71.1315 218.415 71.0762 217.494 70.873C203.727 68.2548 189.441 66.7801 175.025 66.4891C173.002 66.4224 171.099 65.8862 169.707 64.9913C168.315 64.0963 167.541 62.9106 167.544 61.6787V46.9868L206.506 21.3232Z" fill="#FAAD13"></path><path d="M206.506 15.6129V52.1295C206.497 50.7985 205.681 49.5163 204.214 48.5283C202.748 47.5403 200.734 46.9157 198.558 46.774C193.833 46.4765 189.087 46.3262 184.337 46.3238C133.491 46.3238 106.373 63.9778 70.1384 63.9778C45.7481 63.9778 33.0854 62.3191 26.5397 60.6129C24.4477 60.0631 22.6655 59.1533 21.4126 57.9955C20.1596 56.8377 19.4905 55.4824 19.4875 54.0963V18.9541C19.4875 18.9541 19.4875 26.0631 70.1384 26.0631C109.919 26.0631 135.05 4.42804 195.947 8.52757C198.832 8.71277 201.503 9.53761 203.45 10.8446C205.398 12.1515 206.486 13.849 206.506 15.6129V15.6129Z" fill="#FFBC37"></path><path d="M58.4498 9.40332V25.9199C19.4875 24.9247 19.4875 18.9531 19.4875 18.9531C19.4937 17.6973 20.3167 16.494 21.7767 15.606C23.2367 14.718 25.2152 14.2175 27.28 14.2138H50.5404C52.6378 14.2131 54.649 13.7061 56.132 12.8041C57.6151 11.9021 58.4487 10.6789 58.4498 9.40332V9.40332Z" fill="#8C5A00"></path><path d="M206.506 52.1295C206.491 53.3835 205.665 54.5836 204.207 55.4704C202.749 56.3572 200.776 56.8595 198.714 56.8688H175.454C173.356 56.8694 171.345 57.3764 169.862 58.2784C168.379 59.1804 167.545 60.4036 167.544 61.6792V46.9873C173.112 46.5423 178.721 46.3207 184.337 46.3238C189.087 46.3262 193.833 46.4765 198.558 46.774C200.734 46.9157 202.748 47.5402 204.214 48.5283C205.681 49.5163 206.497 50.7984 206.506 52.1295V52.1295Z" fill="#8C5A00"></path></svg>  
                                            `,[ 
                                                    {
                                                        "id": 1,
                                                        "indexes": [0,1],
                                                        "color": "#FAAD13"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [2],
                                                        "color": "#FFBC37"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": [3,4],
                                                        "color": "#8C5A00"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 226 72" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.4876 49.7587C13.3815 49.6575 7.43923 48.5351 2.31309 46.5146C1.4342 46.1223 0.760106 45.5841 0.371705 44.9645C-0.0166963 44.3449 -0.102908 43.6704 0.123415 43.0218C2.4797 36.6755 3.74627 30.1977 3.90275 23.6924C3.57082 17.0675 2.56235 10.4615 0.883179 3.91273C0.759492 3.32193 0.887615 2.72172 1.25525 2.16972C1.62288 1.61772 2.21767 1.13247 2.98251 0.760571C3.74736 0.388669 4.65656 0.142605 5.62282 0.0460038C6.58909 -0.0505976 7.57996 0.00550828 8.5003 0.208935C22.2676 2.82766 36.5525 4.30542 50.9691 4.6023C52.9913 4.665 54.8962 5.19858 56.289 6.09242C57.6817 6.98626 58.4555 8.1718 58.4499 9.40325V25.9198L19.4876 49.7587Z" fill="#FAAD13"></path><path d="M206.506 21.3232C212.616 21.4238 218.561 22.5472 223.689 24.5697C224.562 24.9625 225.232 25.4995 225.619 26.1169C226.006 26.7344 226.093 27.4064 225.871 28.0531C223.512 34.4015 222.246 40.8819 222.091 47.3896C222.422 54.0085 223.424 60.6087 225.091 67.1526C225.221 67.7437 225.098 68.345 224.734 68.8987C224.371 69.4524 223.778 69.9397 223.015 70.3137C222.251 70.6876 221.342 70.9355 220.375 71.0335C219.408 71.1315 218.415 71.0762 217.494 70.873C203.727 68.2548 189.441 66.7801 175.025 66.4891C173.002 66.4224 171.099 65.8862 169.707 64.9913C168.315 64.0963 167.541 62.9106 167.544 61.6787V46.9868L206.506 21.3232Z" fill="#FAAD13"></path><path d="M206.506 15.6129V52.1295C206.497 50.7985 205.681 49.5163 204.214 48.5283C202.748 47.5403 200.734 46.9157 198.558 46.774C193.833 46.4765 189.087 46.3262 184.337 46.3238C133.491 46.3238 106.373 63.9778 70.1384 63.9778C45.7481 63.9778 33.0854 62.3191 26.5397 60.6129C24.4477 60.0631 22.6655 59.1533 21.4126 57.9955C20.1596 56.8377 19.4905 55.4824 19.4875 54.0963V18.9541C19.4875 18.9541 19.4875 26.0631 70.1384 26.0631C109.919 26.0631 135.05 4.42804 195.947 8.52757C198.832 8.71277 201.503 9.53761 203.45 10.8446C205.398 12.1515 206.486 13.849 206.506 15.6129V15.6129Z" fill="#FFBC37"></path><path d="M58.4498 9.40332V25.9199C19.4875 24.9247 19.4875 18.9531 19.4875 18.9531C19.4937 17.6973 20.3167 16.494 21.7767 15.606C23.2367 14.718 25.2152 14.2175 27.28 14.2138H50.5404C52.6378 14.2131 54.649 13.7061 56.132 12.8041C57.6151 11.9021 58.4487 10.6789 58.4498 9.40332V9.40332Z" fill="#8C5A00"></path><path d="M206.506 52.1295C206.491 53.3835 205.665 54.5836 204.207 55.4704C202.749 56.3572 200.776 56.8595 198.714 56.8688H175.454C173.356 56.8694 171.345 57.3764 169.862 58.2784C168.379 59.1804 167.545 60.4036 167.544 61.6792V46.9873C173.112 46.5423 178.721 46.3207 184.337 46.3238C189.087 46.3262 193.833 46.4765 198.558 46.774C200.734 46.9157 202.748 47.5402 204.214 48.5283C205.681 49.5163 206.497 50.7984 206.506 52.1295V52.1295Z" fill="#8C5A00"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 270 85" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M36.7787 14.528C108.905 -4.84268 161.096 -4.84268 233.222 14.528V54.8166C158.432 35.2495 111.57 35.2495 36.7787 54.8166C36.7787 41.3874 36.7787 27.9572 36.7787 14.528V14.528Z" fill="#1890FF"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M270 44.2475C256.495 36.8229 243.43 32.912 233.221 30.6895V54.8162L212.741 70.978C233.547 74.3442 247.328 78.8967 261.705 84.9306C258.285 76.4378 255.763 66.4033 252.343 57.9105L270 44.2475Z" fill="#1565D8"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M233.221 54.8171C226.161 52.9696 219.351 51.2981 212.741 49.7998V70.9789L233.221 54.8171Z" fill="#01068B"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M0 44.2475C13.5053 36.8229 26.5702 32.912 36.7788 30.6895V54.8162L57.2587 70.978C36.4527 74.3442 22.6728 78.8967 8.29459 84.9306C11.7146 76.4378 14.2371 66.4033 17.6571 57.9105L0 44.2475Z" fill="#1565D8"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M36.7787 54.8171C43.8384 52.9696 50.6493 51.2981 57.2585 49.7998V70.9789L36.7787 54.8171Z" fill="#01068B"></path></svg>
                                            `,[ 
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#1890FF"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [1,3],
                                                        "color": "#1565D8"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": [2,4],
                                                        "color": "#01068B"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 270 85" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M36.7787 14.528C108.905 -4.84268 161.096 -4.84268 233.222 14.528V54.8166C158.432 35.2495 111.57 35.2495 36.7787 54.8166C36.7787 41.3874 36.7787 27.9572 36.7787 14.528V14.528Z" fill="#1890FF"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M270 44.2475C256.495 36.8229 243.43 32.912 233.221 30.6895V54.8162L212.741 70.978C233.547 74.3442 247.328 78.8967 261.705 84.9306C258.285 76.4378 255.763 66.4033 252.343 57.9105L270 44.2475Z" fill="#1565D8"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M233.221 54.8171C226.161 52.9696 219.351 51.2981 212.741 49.7998V70.9789L233.221 54.8171Z" fill="#01068B"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M0 44.2475C13.5053 36.8229 26.5702 32.912 36.7788 30.6895V54.8162L57.2587 70.978C36.4527 74.3442 22.6728 78.8967 8.29459 84.9306C11.7146 76.4378 14.2371 66.4033 17.6571 57.9105L0 44.2475Z" fill="#1565D8"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M36.7787 54.8171C43.8384 52.9696 50.6493 51.2981 57.2585 49.7998V70.9789L36.7787 54.8171Z" fill="#01068B"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 251 79" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M34.1805 13.5017C101.212 -4.50056 149.715 -4.50056 216.746 13.5017V50.944C147.239 32.7592 103.688 32.7592 34.1805 50.944C34.1805 38.4635 34.1805 25.9822 34.1805 13.5017V13.5017Z" fill="#AFF2FE"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M250.926 41.1217C238.374 34.2216 226.232 30.587 216.745 28.5215V50.9438L197.712 65.9638C217.048 69.0922 229.856 73.3231 243.217 78.9307C240.039 71.0379 237.694 61.7122 234.516 53.8194L250.926 41.1217Z" fill="#6FCEDF"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M216.745 50.9441C210.184 49.2271 203.854 47.6737 197.712 46.2812V65.9641L216.745 50.9441Z" fill="#03045E"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M0 41.1217C12.5512 34.2216 24.6932 30.587 34.1805 28.5215V50.9438L53.2136 65.9638C33.8775 69.0922 21.0711 73.3231 7.70861 78.9307C10.887 71.0379 13.2313 61.7122 16.4097 53.8194L0 41.1217Z" fill="#6FCEDF"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M34.1804 50.9441C40.7414 49.2271 47.0711 47.6737 53.2135 46.2812V65.9641L34.1804 50.9441Z" fill="#03045E"></path></svg>
                                            `,[ 
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#AFF2FE"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [1,3],
                                                        "color": "#6FCEDF"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": [2,4],
                                                        "color": "#03045E"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 251 79" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M34.1805 13.5017C101.212 -4.50056 149.715 -4.50056 216.746 13.5017V50.944C147.239 32.7592 103.688 32.7592 34.1805 50.944C34.1805 38.4635 34.1805 25.9822 34.1805 13.5017V13.5017Z" fill="#AFF2FE"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M250.926 41.1217C238.374 34.2216 226.232 30.587 216.745 28.5215V50.9438L197.712 65.9638C217.048 69.0922 229.856 73.3231 243.217 78.9307C240.039 71.0379 237.694 61.7122 234.516 53.8194L250.926 41.1217Z" fill="#6FCEDF"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M216.745 50.9441C210.184 49.2271 203.854 47.6737 197.712 46.2812V65.9641L216.745 50.9441Z" fill="#03045E"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M0 41.1217C12.5512 34.2216 24.6932 30.587 34.1805 28.5215V50.9438L53.2136 65.9638C33.8775 69.0922 21.0711 73.3231 7.70861 78.9307C10.887 71.0379 13.2313 61.7122 16.4097 53.8194L0 41.1217Z" fill="#6FCEDF"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M34.1804 50.9441C40.7414 49.2271 47.0711 47.6737 53.2135 46.2812V65.9641L34.1804 50.9441Z" fill="#03045E"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 270 56" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M248.081 35.05C174.827 62.8087 95.6804 62.8718 22.3927 35.23C25.7757 23.5433 29.1616 11.8533 32.5505 0.16C99.223 25.313 171.228 25.2569 237.87 0C241.283 11.68 244.686 23.3633 248.081 35.05Z" fill="#1565D8"></path><path d="M25.8019 9.38023L17.4321 37.2002C5.69676 37.2002 3.5057 36.5 0 35.6402C5.51563 31.8802 10.894 28.0002 16.135 24.0002C14.3412 17.0669 12.7111 10.1469 11.2445 3.24023C16.0649 5.42023 20.9173 7.4669 25.8019 9.38023Z" fill="#2B2356"></path><path d="M244.198 9.38002C246.985 18.6467 249.775 27.92 252.568 37.2C256.792 37.2 258.107 37.2 270 35.64C264.478 31.88 259.097 28 253.856 24C255.662 17.0934 257.295 10.1834 258.755 3.27002C253.941 5.43002 249.088 7.46669 244.198 9.38002Z" fill="#2B2356"></path></svg>
                                            `,[ 
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#1565D8"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [1,2],
                                                        "color": "#2B2356"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 270 56" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M248.081 35.05C174.827 62.8087 95.6804 62.8718 22.3927 35.23C25.7757 23.5433 29.1616 11.8533 32.5505 0.16C99.223 25.313 171.228 25.2569 237.87 0C241.283 11.68 244.686 23.3633 248.081 35.05Z" fill="#1565D8"></path><path d="M25.8019 9.38023L17.4321 37.2002C5.69676 37.2002 3.5057 36.5 0 35.6402C5.51563 31.8802 10.894 28.0002 16.135 24.0002C14.3412 17.0669 12.7111 10.1469 11.2445 3.24023C16.0649 5.42023 20.9173 7.4669 25.8019 9.38023Z" fill="#2B2356"></path><path d="M244.198 9.38002C246.985 18.6467 249.775 27.92 252.568 37.2C256.792 37.2 258.107 37.2 270 35.64C264.478 31.88 259.097 28 253.856 24C255.662 17.0934 257.295 10.1834 258.755 3.27002C253.941 5.43002 249.088 7.46669 244.198 9.38002Z" fill="#2B2356"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 270 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M270 24.64C256.97 19.7466 243.789 15.5833 230.455 12.15C167.676 -4.04998 102.324 -4.04998 39.5447 12.15C26.2294 15.5833 13.0478 19.7466 0 24.64C4.73636 30.14 9.35416 35.7166 13.8534 41.3699C13.1785 48.8433 12.6313 56.2966 12.2118 63.7299C24.0618 59.2833 36.0517 55.4966 48.1814 52.3699C105.281 37.6401 164.719 37.6401 221.819 52.3699C233.93 55.5033 245.92 59.2899 257.788 63.7299C257.369 56.2966 256.821 48.8433 256.147 41.3699C260.652 35.7166 265.27 30.14 270 24.64Z" fill="#2B2356"></path></svg>
                                            `,[ 
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#2B2356"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 270 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M270 24.64C256.97 19.7466 243.789 15.5833 230.455 12.15C167.676 -4.04998 102.324 -4.04998 39.5447 12.15C26.2294 15.5833 13.0478 19.7466 0 24.64C4.73636 30.14 9.35416 35.7166 13.8534 41.3699C13.1785 48.8433 12.6313 56.2966 12.2118 63.7299C24.0618 59.2833 36.0517 55.4966 48.1814 52.3699C105.281 37.6401 164.719 37.6401 221.819 52.3699C233.93 55.5033 245.92 59.2899 257.788 63.7299C257.369 56.2966 256.821 48.8433 256.147 41.3699C260.652 35.7166 265.27 30.14 270 24.64Z" fill="#2B2356"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 270 92" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M261.614 0C249.355 7.70012 236.97 14.2672 224.461 19.7013C165.546 45.26 104.445 45.26 45.5307 19.7013C33.0441 14.2672 20.6625 7.70012 8.38589 0C9.52103 9.90015 10.7498 19.8333 12.0723 29.7994C8.13332 36.6526 4.10923 43.3902 0 50.0123C13.0542 58.2294 26.2559 65.209 39.6052 70.9511C102.422 98.193 167.569 98.193 230.386 70.9511C243.707 65.176 256.912 58.1744 270 49.9463C265.896 43.3462 261.87 36.6086 257.919 29.7334C259.247 19.8113 260.479 9.90015 261.614 0Z" fill="#082738"></path></svg>
                                            `,[ 
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#082738"
                                                    }
                                                ])
                                                }
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 270 92" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M261.614 0C249.355 7.70012 236.97 14.2672 224.461 19.7013C165.546 45.26 104.445 45.26 45.5307 19.7013C33.0441 14.2672 20.6625 7.70012 8.38589 0C9.52103 9.90015 10.7498 19.8333 12.0723 29.7994C8.13332 36.6526 4.10923 43.3902 0 50.0123C13.0542 58.2294 26.2559 65.209 39.6052 70.9511C102.422 98.193 167.569 98.193 230.386 70.9511C243.707 65.176 256.912 58.1744 270 49.9463C265.896 43.3462 261.87 36.6086 257.919 29.7334C259.247 19.8113 260.479 9.90015 261.614 0Z" fill="#082738"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 270 74" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M270 9.98212C256.891 5.018 243.408 1.92229 229.787 0.749284C166.599 -5.06267 103.401 25.0269 40.2132 19.215C26.5918 18.0467 13.1082 14.9509 0 9.98212C2.7777 20.0593 5.55238 30.0339 8.32403 39.906C5.54633 48.0261 2.77165 56.0634 0 64.0179C13.1082 68.9866 26.5918 72.0824 40.2132 73.2507C103.401 79.0627 166.599 48.9731 229.787 54.785C243.408 55.9523 256.892 59.0481 270 64.0179C267.234 53.9486 264.46 43.9739 261.676 34.094C264.454 25.9581 267.228 17.9208 270 9.98212Z" fill="#7A4F00"></path></svg>        
                                            `,[ 
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#7A4F00"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 270 74" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M270 9.98212C256.891 5.018 243.408 1.92229 229.787 0.749284C166.599 -5.06267 103.401 25.0269 40.2132 19.215C26.5918 18.0467 13.1082 14.9509 0 9.98212C2.7777 20.0593 5.55238 30.0339 8.32403 39.906C5.54633 48.0261 2.77165 56.0634 0 64.0179C13.1082 68.9866 26.5918 72.0824 40.2132 73.2507C103.401 79.0627 166.599 48.9731 229.787 54.785C243.408 55.9523 256.892 59.0481 270 64.0179C267.234 53.9486 264.46 43.9739 261.676 34.094C264.454 25.9581 267.228 17.9208 270 9.98212Z" fill="#7A4F00"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 270 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M270 0H0L8.32403 31.925L0 63.87H270L261.676 31.925L270 0Z" fill="#E6F7FF"></path></svg>                                           
                                            `,[ 
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#E6F7FF"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 270 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M270 0H0L8.32403 31.925L0 63.87H270L261.676 31.925L270 0Z" fill="#E6F7FF"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 256 61" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M239 17.498L239.219 49C243.642 50.5005 248.894 51 255.219 51.07C251.43 45.87 247.647 40.5367 243.869 35.07C247.659 27.8567 251.442 20.5 255.219 13C249.752 14.69 244.467 16.388 239 17.498Z" fill="#154C89"></path><path d="M242 45L239.219 49V16.4145L242 4V45Z" fill="#082738"></path><path d="M16.2191 26.501L16 58.0029C11.5766 59.5034 6.32556 60.0029 0 60.0729C3.78931 54.8729 7.5726 49.5396 11.3499 44.0729C7.56055 36.8596 3.77726 29.5029 0 22.0029C5.46709 23.6929 10.752 25.391 16.2191 26.501Z" fill="#154C89"></path><path d="M13 54.0029L16 58.0029V25.4175L13 13.0029V54.0029Z" fill="#082738"></path><path d="M242 45C165.388 31.42 89.6025 67.3328 13 54.0028V13.0028C89.6025 26.3328 165.388 -9.57962 242 4.00038V45Z" fill="#668BB4"></path></svg>                                           
                                            `,[ 
                                                    {
                                                        "id": 1,
                                                        "indexes": [0,2],
                                                        "color": "#154C89"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [1,3],
                                                        "color": "#082738"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": [4],
                                                        "color": "#668BB4"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 256 61" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M239 17.498L239.219 49C243.642 50.5005 248.894 51 255.219 51.07C251.43 45.87 247.647 40.5367 243.869 35.07C247.659 27.8567 251.442 20.5 255.219 13C249.752 14.69 244.467 16.388 239 17.498Z" fill="#154C89"></path><path d="M242 45L239.219 49V16.4145L242 4V45Z" fill="#082738"></path><path d="M16.2191 26.501L16 58.0029C11.5766 59.5034 6.32556 60.0029 0 60.0729C3.78931 54.8729 7.5726 49.5396 11.3499 44.0729C7.56055 36.8596 3.77726 29.5029 0 22.0029C5.46709 23.6929 10.752 25.391 16.2191 26.501Z" fill="#154C89"></path><path d="M13 54.0029L16 58.0029V25.4175L13 13.0029V54.0029Z" fill="#082738"></path><path d="M242 45C165.388 31.42 89.6025 67.3328 13 54.0028V13.0028C89.6025 26.3328 165.388 -9.57962 242 4.00038V45Z" fill="#668BB4"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 265 53" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M223.626 23H264.002L246.116 38.3084L264.251 53H223.626V46.7614L223.626 23Z" fill="#005B5B"></path><path d="M229.626 41L223.626 53V23.0459L229.626 0V41Z" fill="#003424"></path><path d="M40.6256 23H0.249627L18.1349 38.3084L7.62939e-06 53H40.6256V46.7614L40.6256 23Z" fill="#005B5B"></path><path d="M34.6256 41L40.6256 53V23.0459L34.6256 0V41Z" fill="#003424"></path><path d="M229.626 0H34.6256V41H229.626V0Z" fill="#027A73"></path></svg>                                          
                                            `,[ 
                                                    {
                                                        "id": 1,
                                                        "indexes": [0,2],
                                                        "color": "#005B5B"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [1,3],
                                                        "color": "#003424"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": [4],
                                                        "color": "#027A73"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 265 53" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M223.626 23H264.002L246.116 38.3084L264.251 53H223.626V46.7614L223.626 23Z" fill="#005B5B"></path><path d="M229.626 41L223.626 53V23.0459L229.626 0V41Z" fill="#003424"></path><path d="M40.6256 23H0.249627L18.1349 38.3084L7.62939e-06 53H40.6256V46.7614L40.6256 23Z" fill="#005B5B"></path><path d="M34.6256 41L40.6256 53V23.0459L34.6256 0V41Z" fill="#003424"></path><path d="M229.626 0H34.6256V41H229.626V0Z" fill="#027A73"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 265 53" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M224 23H264.376L246.491 38.3084L264.626 53H224V46.7614L224 23Z" fill="#DAA425"></path><path d="M230 41L224 53V23.0459L230 0V41Z" fill="#7A4F00"></path><path d="M41 23H0.62404L18.5093 38.3084L0.37442 53H41V46.7614L41 23Z" fill="#DAA425"></path><path d="M35 41L41 53V23.0459L35 0V41Z" fill="#7A4F00"></path><path d="M230 0H35V41H230V0Z" fill="#FFB300"></path></svg>                                          
                                            `,[ 
                                                    {
                                                        "id": 1,
                                                        "indexes": [0,2],
                                                        "color": "#DAA425"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [1,3],
                                                        "color": "#7A4F00"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": [4],
                                                        "color": "#FFB300"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 265 53" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M224 23H264.376L246.491 38.3084L264.626 53H224V46.7614L224 23Z" fill="#DAA425"></path><path d="M230 41L224 53V23.0459L230 0V41Z" fill="#7A4F00"></path><path d="M41 23H0.62404L18.5093 38.3084L0.37442 53H41V46.7614L41 23Z" fill="#DAA425"></path><path d="M35 41L41 53V23.0459L35 0V41Z" fill="#7A4F00"></path><path d="M230 0H35V41H230V0Z" fill="#FFB300"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 256 116" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M239.5 15L239 54C244.037 57.2532 248 59.1411 256 61.8378C252.215 54.1706 248.436 46.4107 244.663 38.5581C248.448 31.0843 252.227 23.5139 256 15.8467C250.542 15.8467 244.958 15.3951 239.5 15Z" fill="#999999"></path><path d="M243 49L239 54V14.8336L243 0V49Z" fill="#2C2C2C"></path><path d="M16.5 69L17 108C11.9632 111.253 7.99999 113.141 -7.62939e-06 115.838C3.7851 108.171 7.56418 100.411 11.3372 92.5581C7.55215 85.0843 3.77306 77.5139 -7.62939e-06 69.8467C5.458 69.8467 11.042 69.3951 16.5 69Z" fill="#999999"></path><path d="M13 103L17 108V68.8336L13 54V103Z" fill="#2C2C2C"></path><path d="M243 49C166.474 55.5183 89.5174 96.3728 13 103V54C89.5174 47.3365 166.474 6.50624 243 0V49Z" fill="#C5C5C5"></path></svg>                                           
                                            `,[ 
                                                    {
                                                        "id": 1,
                                                        "indexes": [0,2],
                                                        "color": "#999999"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [1,3],
                                                        "color": "#2C2C2C"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": [4],
                                                        "color": "#C5C5C5"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 256 116" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M239.5 15L239 54C244.037 57.2532 248 59.1411 256 61.8378C252.215 54.1706 248.436 46.4107 244.663 38.5581C248.448 31.0843 252.227 23.5139 256 15.8467C250.542 15.8467 244.958 15.3951 239.5 15Z" fill="#999999"></path><path d="M243 49L239 54V14.8336L243 0V49Z" fill="#2C2C2C"></path><path d="M16.5 69L17 108C11.9632 111.253 7.99999 113.141 -7.62939e-06 115.838C3.7851 108.171 7.56418 100.411 11.3372 92.5581C7.55215 85.0843 3.77306 77.5139 -7.62939e-06 69.8467C5.458 69.8467 11.042 69.3951 16.5 69Z" fill="#999999"></path><path d="M13 103L17 108V68.8336L13 54V103Z" fill="#2C2C2C"></path><path d="M243 49C166.474 55.5183 89.5174 96.3728 13 103V54C89.5174 47.3365 166.474 6.50624 243 0V49Z" fill="#C5C5C5"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 256 116" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M239.5 15L239 54C244.037 57.2532 248 59.1411 256 61.8378C252.215 54.1706 248.436 46.4107 244.663 38.5581C248.448 31.0843 252.227 23.5139 256 15.8467C250.542 15.8467 244.958 15.3951 239.5 15Z" fill="#0D5600"></path><path d="M243 49L239 54V14.8336L243 0V49Z" fill="#03A012"></path><path d="M16.5 69L17 108C11.9632 111.253 8 113.141 0 115.838C3.7851 108.171 7.56419 100.411 11.3373 92.5581C7.55215 85.0843 3.77307 77.5139 0 69.8467C5.45801 69.8467 11.042 69.3951 16.5 69Z" fill="#0D5600"></path><path d="M13 103L17 108V68.8336L13 54V103Z" fill="#03A012"></path><path d="M243 49C166.474 55.5183 89.5174 96.3728 13 103V54C89.5174 47.3365 166.474 6.50624 243 0V49Z" fill="#157004"></path></svg>                                          
                                            `,[ 
                                                    {
                                                        "id": 1,
                                                        "indexes": [0,2],
                                                        "color": "#0D5600"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [1,3],
                                                        "color": "#03A012"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": [4],
                                                        "color": "#157004"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 256 116" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M239.5 15L239 54C244.037 57.2532 248 59.1411 256 61.8378C252.215 54.1706 248.436 46.4107 244.663 38.5581C248.448 31.0843 252.227 23.5139 256 15.8467C250.542 15.8467 244.958 15.3951 239.5 15Z" fill="#0D5600"></path><path d="M243 49L239 54V14.8336L243 0V49Z" fill="#03A012"></path><path d="M16.5 69L17 108C11.9632 111.253 8 113.141 0 115.838C3.7851 108.171 7.56419 100.411 11.3373 92.5581C7.55215 85.0843 3.77307 77.5139 0 69.8467C5.45801 69.8467 11.042 69.3951 16.5 69Z" fill="#0D5600"></path><path d="M13 103L17 108V68.8336L13 54V103Z" fill="#03A012"></path><path d="M243 49C166.474 55.5183 89.5174 96.3728 13 103V54C89.5174 47.3365 166.474 6.50624 243 0V49Z" fill="#157004"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 254 84" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M42 42.3044L0.250901 42.0205L18.5448 62.9222L0 83.0205H42V74.0205V42.3044Z" fill="#613E00"></path><path d="M254 0H219V8.5V41.4403H253.791L238.546 20.3022L254 0Z" fill="#613E00"></path><path d="M35 64.0205L42 83.021V42.0205L35 19.0205V64.0205Z" fill="#061121"></path><path d="M228 19L219 0V20L227.5 63.8916L228 19Z" fill="#061121"></path><path d="M228 19H35.1881H35.0941L35.1881 19.1322V63.8678L35.0941 64H35.1881H228V63.8678V19.1322V19Z" fill="#925700"></path></svg>
                                            `,[ 
                                                    {
                                                        "id": 1,
                                                        "indexes": [0,1],
                                                        "color": "#613E00"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [2,3],
                                                        "color": "#061121"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": [4],
                                                        "color": "#925700"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 254 84" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M42 42.3044L0.250901 42.0205L18.5448 62.9222L0 83.0205H42V74.0205V42.3044Z" fill="#613E00"></path><path d="M254 0H219V8.5V41.4403H253.791L238.546 20.3022L254 0Z" fill="#613E00"></path><path d="M35 64.0205L42 83.021V42.0205L35 19.0205V64.0205Z" fill="#061121"></path><path d="M228 19L219 0V20L227.5 63.8916L228 19Z" fill="#061121"></path><path d="M228 19H35.1881H35.0941L35.1881 19.1322V63.8678L35.0941 64H35.1881H228V63.8678V19.1322V19Z" fill="#925700"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 254 84" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M42 42.3044L0.250901 42.0205L18.5448 62.9222L0 83.0205H42V74.0205V42.3044Z" fill="#033983"></path><path d="M254 0H219V8.5V41.4403H253.791L238.546 20.3022L254 0Z" fill="#033983"></path><path d="M35 64.0205L42 83.021V42.0205L35 19.0205V64.0205Z" fill="#1565D8"></path><path d="M228 19L219 0V20L227.5 63.8916L228 19Z" fill="#1565D8"></path><path d="M228 19H35.1881H35V19.1294V63.5V64H35.1881H228V63.8678V19.1322V19Z" fill="#0348A5"></path></svg>
                                            `,[ 
                                                    {
                                                        "id": 1,
                                                        "indexes": [0,1],
                                                        "color": "#033983"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [2,3],
                                                        "color": "#1565D8"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": [4],
                                                        "color": "#0348A5"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 254 84" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M42 42.3044L0.250901 42.0205L18.5448 62.9222L0 83.0205H42V74.0205V42.3044Z" fill="#033983"></path><path d="M254 0H219V8.5V41.4403H253.791L238.546 20.3022L254 0Z" fill="#033983"></path><path d="M35 64.0205L42 83.021V42.0205L35 19.0205V64.0205Z" fill="#1565D8"></path><path d="M228 19L219 0V20L227.5 63.8916L228 19Z" fill="#1565D8"></path><path d="M228 19H35.1881H35V19.1294V63.5V64H35.1881H228V63.8678V19.1322V19Z" fill="#0348A5"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 254 84" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M42 42.3044L0.250901 42.0205L18.5448 62.9222L0 83.0205H42V74.0205V42.3044Z" fill="#472F03"></path><path d="M254 0H219V8.5V41.4403H253.791L238.546 20.3022L254 0Z" fill="#472F03"></path><path d="M35 64.0205L42 83.021V42.0205L35 19.0205V64.0205Z" fill="#061121"></path><path d="M228 19L219 0V20L227.5 63.8916L228 19Z" fill="#061121"></path><path d="M228 19H35.1881H35V19.1294V63.5V64H35.1881H228V63.8678V19.1322V19Z" fill="#613E00"></path></svg>
                                            `,[ 
                                                    {
                                                        "id": 1,
                                                        "indexes": [0,1],
                                                        "color": "#472F03"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [2,3],
                                                        "color": "#061121"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": [4],
                                                        "color": "#613E00"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 254 84" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M42 42.3044L0.250901 42.0205L18.5448 62.9222L0 83.0205H42V74.0205V42.3044Z" fill="#472F03"></path><path d="M254 0H219V8.5V41.4403H253.791L238.546 20.3022L254 0Z" fill="#472F03"></path><path d="M35 64.0205L42 83.021V42.0205L35 19.0205V64.0205Z" fill="#061121"></path><path d="M228 19L219 0V20L227.5 63.8916L228 19Z" fill="#061121"></path><path d="M228 19H35.1881H35V19.1294V63.5V64H35.1881H228V63.8678V19.1322V19Z" fill="#613E00"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 270 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M49 23H0.297163L21.6823 43.9081L0 64H49.0458V53.5L49 38.5V23Z" fill="#668BB4"></path><path d="M41 45L49 64V23L41 0V45Z" fill="#082738"></path><path d="M270 45H41V0H270L251.607 22.5L270 45Z" fill="#80A9D8"></path></svg>
                                            `,[ 
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#668BB4"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [1],
                                                        "color": "#082738"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": [3],
                                                        "color": "#80A9D8"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 270 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M49 23H0.297163L21.6823 43.9081L0 64H49.0458V53.5L49 38.5V23Z" fill="#668BB4"></path><path d="M41 45L49 64V23L41 0V45Z" fill="#082738"></path><path d="M270 45H41V0H270L251.607 22.5L270 45Z" fill="#80A9D8"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 136 136" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M69.9653 91.8612L0.5 135.1V0.5H135.5V135.067L70.5063 91.8693L70.2384 91.6912L69.9653 91.8612Z" fill="#796458" stroke="#310900"></path></svg>
                                            `,[ 
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#310900"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 136 136" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M69.9653 91.8612L0.5 135.1V0.5H135.5V135.067L70.5063 91.8693L70.2384 91.6912L69.9653 91.8612Z" fill="#796458" stroke="#310900"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("ribbon",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 259 44" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M256.702 4.02805C257.415 2.07102 255.966 0 253.883 0H4.28767C2.20451 0 0.755443 2.07102 1.46931 4.02805L7.58442 20.7924C7.82657 21.4562 7.82662 22.1842 7.58457 22.8481L1.46852 39.6223C0.754993 41.5793 2.20403 43.65 4.28702 43.65H253.884C255.967 43.65 257.416 41.5793 256.702 39.6223L250.586 22.8481C250.344 22.1842 250.344 21.4562 250.586 20.7924L256.702 4.02805Z" fill="#2C0041"></path></svg>
                                            `,[ 
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#2C0041"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 259 44" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M256.702 4.02805C257.415 2.07102 255.966 0 253.883 0H4.28767C2.20451 0 0.755443 2.07102 1.46931 4.02805L7.58442 20.7924C7.82657 21.4562 7.82662 22.1842 7.58457 22.8481L1.46852 39.6223C0.754993 41.5793 2.20403 43.65 4.28702 43.65H253.884C255.967 43.65 257.416 41.5793 256.702 39.6223L250.586 22.8481C250.344 22.1842 250.344 21.4562 250.586 20.7924L256.702 4.02805Z" fill="#2C0041"></path></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        {:else if activeTab == "bases"}
                            <p class="font-medium">
                                Bases
                            </p>
                            <div class="grid grid-cols-2">
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("bases", 
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 174 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M162.04 127.194C162.04 138.755 155.987 149.645 145.853 156.316L102.133 185.09C97.5467 188.102 92.148 189.708 86.5346 189.708C80.9213 189.708 75.5347 188.102 70.9467 185.09L27.2266 156.316C17.0933 149.645 11.04 138.755 11.04 127.194V48.3136C11.04 45.4511 12.8266 42.7878 15.588 41.5308L83.0133 11.0516C85.2 10.0684 87.88 10.0684 90.0533 11.0516L157.48 41.5308C160.255 42.7878 162.04 45.4511 162.04 48.3136V127.194M162.293 32.2713L94.868 1.77969C92.24 0.597362 89.3866 -6.54469e-07 86.5346 -6.54469e-07C83.6946 -6.54469e-07 80.84 0.597362 78.2133 1.77969L10.7867 32.2713C4.18665 35.2458 0 41.481 0 48.3136V127.194C0 142.128 7.78667 156.129 20.8667 164.742L64.5866 193.503C71.1733 197.834 78.8533 200 86.5346 200C94.2266 200 101.907 197.834 108.48 193.503L152.213 164.742C165.293 156.129 173.067 142.128 173.067 127.194V48.3136C173.067 41.481 168.88 35.2458 162.293 32.2713Z" fill="#FAAD13"></path><path d="M154.625 43.2841L89.8783 13.7822C87.7861 12.8294 85.2177 12.8282 83.1204 13.7822L18.3713 43.2841C15.7157 44.4946 14 47.0699 14 49.8462V126.18C14 137.381 19.8091 147.92 29.5401 154.373L71.5291 182.219C75.9336 185.14 81.1102 186.683 86.4993 186.683C91.8872 186.683 97.0651 185.14 101.47 182.219L143.457 154.374C153.188 147.919 159 137.381 159 126.18V49.8474C159 47.0698 157.283 44.4946 154.625 43.2841Z" fill="#FFFAE9"></path><path d="M158.447 127.188C158.447 137.673 152.966 147.54 143.783 153.582L100.059 182.351C96.0804 184.97 91.4044 186.354 86.5364 186.354C81.6684 186.354 76.9924 184.97 73.0137 182.351L29.2897 153.581C20.107 147.541 14.6257 137.674 14.6257 127.188V48.3152C14.6257 46.7222 15.6191 45.2424 17.1551 44.5479L84.5804 14.065C85.1871 13.7912 85.8644 13.6469 86.5364 13.6469C87.2084 13.6469 87.8857 13.7912 88.4897 14.065L155.916 44.5479C157.454 45.2424 158.447 46.7222 158.447 48.3164V127.188M157.479 41.5349L90.0551 11.052C87.8764 10.0675 85.2018 10.0663 83.0178 11.052L15.5911 41.5349C12.8257 42.7857 11.0391 45.4465 11.0391 48.3152V127.188C11.0391 138.761 17.0884 149.651 27.2217 156.318L70.9471 185.089C75.5337 188.107 80.9244 189.702 86.5364 189.702C92.1471 189.702 97.5391 188.107 102.126 185.089L145.85 156.319C155.983 149.649 162.035 138.761 162.035 127.188V48.3164C162.035 45.4465 160.247 42.7857 157.479 41.5349" fill="#FFFFFF"></path></svg>
                                            `, [
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#FAAD13"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [1],
                                                        "color": "#FFFAE9"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": [2],
                                                        "color": "#FFFFFF"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg p-3"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 174 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M162.04 127.194C162.04 138.755 155.987 149.645 145.853 156.316L102.133 185.09C97.5467 188.102 92.148 189.708 86.5346 189.708C80.9213 189.708 75.5347 188.102 70.9467 185.09L27.2266 156.316C17.0933 149.645 11.04 138.755 11.04 127.194V48.3136C11.04 45.4511 12.8266 42.7878 15.588 41.5308L83.0133 11.0516C85.2 10.0684 87.88 10.0684 90.0533 11.0516L157.48 41.5308C160.255 42.7878 162.04 45.4511 162.04 48.3136V127.194M162.293 32.2713L94.868 1.77969C92.24 0.597362 89.3866 -6.54469e-07 86.5346 -6.54469e-07C83.6946 -6.54469e-07 80.84 0.597362 78.2133 1.77969L10.7867 32.2713C4.18665 35.2458 0 41.481 0 48.3136V127.194C0 142.128 7.78667 156.129 20.8667 164.742L64.5866 193.503C71.1733 197.834 78.8533 200 86.5346 200C94.2266 200 101.907 197.834 108.48 193.503L152.213 164.742C165.293 156.129 173.067 142.128 173.067 127.194V48.3136C173.067 41.481 168.88 35.2458 162.293 32.2713Z" fill="#FAAD13"></path><path d="M154.625 43.2841L89.8783 13.7822C87.7861 12.8294 85.2177 12.8282 83.1204 13.7822L18.3713 43.2841C15.7157 44.4946 14 47.0699 14 49.8462V126.18C14 137.381 19.8091 147.92 29.5401 154.373L71.5291 182.219C75.9336 185.14 81.1102 186.683 86.4993 186.683C91.8872 186.683 97.0651 185.14 101.47 182.219L143.457 154.374C153.188 147.919 159 137.381 159 126.18V49.8474C159 47.0698 157.283 44.4946 154.625 43.2841Z" fill="#FFFAE9"></path><path d="M158.447 127.188C158.447 137.673 152.966 147.54 143.783 153.582L100.059 182.351C96.0804 184.97 91.4044 186.354 86.5364 186.354C81.6684 186.354 76.9924 184.97 73.0137 182.351L29.2897 153.581C20.107 147.541 14.6257 137.674 14.6257 127.188V48.3152C14.6257 46.7222 15.6191 45.2424 17.1551 44.5479L84.5804 14.065C85.1871 13.7912 85.8644 13.6469 86.5364 13.6469C87.2084 13.6469 87.8857 13.7912 88.4897 14.065L155.916 44.5479C157.454 45.2424 158.447 46.7222 158.447 48.3164V127.188M157.479 41.5349L90.0551 11.052C87.8764 10.0675 85.2018 10.0663 83.0178 11.052L15.5911 41.5349C12.8257 42.7857 11.0391 45.4465 11.0391 48.3152V127.188C11.0391 138.761 17.0884 149.651 27.2217 156.318L70.9471 185.089C75.5337 188.107 80.9244 189.702 86.5364 189.702C92.1471 189.702 97.5391 188.107 102.126 185.089L145.85 156.319C155.983 149.649 162.035 138.761 162.035 127.188V48.3164C162.035 45.4465 160.247 42.7857 157.479 41.5349" fill="#FFFFFF"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("bases",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 174 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M162.04 127.194C162.04 138.755 155.987 149.645 145.853 156.316L102.133 185.09C97.5467 188.102 92.148 189.708 86.5346 189.708C80.9213 189.708 75.5347 188.102 70.9467 185.09L27.2266 156.316C17.0933 149.645 11.04 138.755 11.04 127.194V48.3136C11.04 45.4511 12.8266 42.7878 15.588 41.5308L83.0133 11.0516C85.2 10.0684 87.88 10.0684 90.0533 11.0516L157.48 41.5308C160.255 42.7878 162.04 45.4511 162.04 48.3136V127.194M162.293 32.2713L94.868 1.77969C92.24 0.597362 89.3866 -6.54469e-07 86.5346 -6.54469e-07C83.6946 -6.54469e-07 80.84 0.597362 78.2133 1.77969L10.7867 32.2713C4.18665 35.2458 0 41.481 0 48.3136V127.194C0 142.128 7.78667 156.129 20.8667 164.742L64.5866 193.503C71.1733 197.834 78.8533 200 86.5346 200C94.2266 200 101.907 197.834 108.48 193.503L152.213 164.742C165.293 156.129 173.067 142.128 173.067 127.194V48.3136C173.067 41.481 168.88 35.2458 162.293 32.2713Z" fill="#00116C"></path><path d="M154.625 43.2841L89.8783 13.7822C87.7861 12.8294 85.2177 12.8282 83.1204 13.7822L18.3713 43.2841C15.7157 44.4946 14 47.0699 14 49.8462V126.18C14 137.381 19.8091 147.92 29.5401 154.373L71.5291 182.219C75.9336 185.14 81.1102 186.683 86.4993 186.683C91.8872 186.683 97.0651 185.14 101.47 182.219L143.457 154.374C153.188 147.919 159 137.381 159 126.18V49.8474C159 47.0698 157.283 44.4946 154.625 43.2841Z" fill="#E9EEFF"></path><path d="M158.447 127.188C158.447 137.673 152.966 147.54 143.783 153.582L100.059 182.351C96.0804 184.97 91.4044 186.354 86.5364 186.354C81.6684 186.354 76.9924 184.97 73.0137 182.351L29.2897 153.581C20.107 147.541 14.6257 137.674 14.6257 127.188V48.3152C14.6257 46.7222 15.6191 45.2424 17.1551 44.5479L84.5804 14.065C85.1871 13.7912 85.8644 13.6469 86.5364 13.6469C87.2084 13.6469 87.8857 13.7912 88.4897 14.065L155.916 44.5479C157.454 45.2424 158.447 46.7222 158.447 48.3164V127.188M157.479 41.5349L90.0551 11.052C87.8764 10.0675 85.2018 10.0663 83.0178 11.052L15.5911 41.5349C12.8257 42.7857 11.0391 45.4465 11.0391 48.3152V127.188C11.0391 138.761 17.0884 149.651 27.2217 156.318L70.9471 185.089C75.5337 188.107 80.9244 189.702 86.5364 189.702C92.1471 189.702 97.5391 188.107 102.126 185.089L145.85 156.319C155.983 149.649 162.035 138.761 162.035 127.188V48.3164C162.035 45.4465 160.247 42.7857 157.479 41.5349" fill="#FFFFFF"></path></svg>
                                            `, [
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#00116C"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [1],
                                                        "color": "#E9EEFF"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": [2],
                                                        "color": "#FFFFFF"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg p-3"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 174 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M162.04 127.194C162.04 138.755 155.987 149.645 145.853 156.316L102.133 185.09C97.5467 188.102 92.148 189.708 86.5346 189.708C80.9213 189.708 75.5347 188.102 70.9467 185.09L27.2266 156.316C17.0933 149.645 11.04 138.755 11.04 127.194V48.3136C11.04 45.4511 12.8266 42.7878 15.588 41.5308L83.0133 11.0516C85.2 10.0684 87.88 10.0684 90.0533 11.0516L157.48 41.5308C160.255 42.7878 162.04 45.4511 162.04 48.3136V127.194M162.293 32.2713L94.868 1.77969C92.24 0.597362 89.3866 -6.54469e-07 86.5346 -6.54469e-07C83.6946 -6.54469e-07 80.84 0.597362 78.2133 1.77969L10.7867 32.2713C4.18665 35.2458 0 41.481 0 48.3136V127.194C0 142.128 7.78667 156.129 20.8667 164.742L64.5866 193.503C71.1733 197.834 78.8533 200 86.5346 200C94.2266 200 101.907 197.834 108.48 193.503L152.213 164.742C165.293 156.129 173.067 142.128 173.067 127.194V48.3136C173.067 41.481 168.88 35.2458 162.293 32.2713Z" fill="#00116C"></path><path d="M154.625 43.2841L89.8783 13.7822C87.7861 12.8294 85.2177 12.8282 83.1204 13.7822L18.3713 43.2841C15.7157 44.4946 14 47.0699 14 49.8462V126.18C14 137.381 19.8091 147.92 29.5401 154.373L71.5291 182.219C75.9336 185.14 81.1102 186.683 86.4993 186.683C91.8872 186.683 97.0651 185.14 101.47 182.219L143.457 154.374C153.188 147.919 159 137.381 159 126.18V49.8474C159 47.0698 157.283 44.4946 154.625 43.2841Z" fill="#E9EEFF"></path><path d="M158.447 127.188C158.447 137.673 152.966 147.54 143.783 153.582L100.059 182.351C96.0804 184.97 91.4044 186.354 86.5364 186.354C81.6684 186.354 76.9924 184.97 73.0137 182.351L29.2897 153.581C20.107 147.541 14.6257 137.674 14.6257 127.188V48.3152C14.6257 46.7222 15.6191 45.2424 17.1551 44.5479L84.5804 14.065C85.1871 13.7912 85.8644 13.6469 86.5364 13.6469C87.2084 13.6469 87.8857 13.7912 88.4897 14.065L155.916 44.5479C157.454 45.2424 158.447 46.7222 158.447 48.3164V127.188M157.479 41.5349L90.0551 11.052C87.8764 10.0675 85.2018 10.0663 83.0178 11.052L15.5911 41.5349C12.8257 42.7857 11.0391 45.4465 11.0391 48.3152V127.188C11.0391 138.761 17.0884 149.651 27.2217 156.318L70.9471 185.089C75.5337 188.107 80.9244 189.702 86.5364 189.702C92.1471 189.702 97.5391 188.107 102.126 185.089L145.85 156.319C155.983 149.649 162.035 138.761 162.035 127.188V48.3164C162.035 45.4465 160.247 42.7857 157.479 41.5349" fill="#FFFFFF"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("bases",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 174 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M162.04 127.194C162.04 138.755 155.987 149.645 145.853 156.316L102.133 185.09C97.5467 188.102 92.148 189.708 86.5346 189.708C80.9213 189.708 75.5347 188.102 70.9467 185.09L27.2266 156.316C17.0933 149.645 11.04 138.755 11.04 127.194V48.3136C11.04 45.4511 12.8266 42.7878 15.588 41.5308L83.0133 11.0516C85.2 10.0684 87.88 10.0684 90.0533 11.0516L157.48 41.5308C160.255 42.7878 162.04 45.4511 162.04 48.3136V127.194M162.293 32.2713L94.868 1.77969C92.24 0.597362 89.3866 -6.54469e-07 86.5346 -6.54469e-07C83.6946 -6.54469e-07 80.84 0.597362 78.2133 1.77969L10.7867 32.2713C4.18665 35.2458 0 41.481 0 48.3136V127.194C0 142.128 7.78667 156.129 20.8667 164.742L64.5866 193.503C71.1733 197.834 78.8533 200 86.5346 200C94.2266 200 101.907 197.834 108.48 193.503L152.213 164.742C165.293 156.129 173.067 142.128 173.067 127.194V48.3136C173.067 41.481 168.88 35.2458 162.293 32.2713Z" fill="#1565D8"></path><path d="M154.625 43.2841L89.8783 13.7822C87.7861 12.8294 85.2177 12.8282 83.1204 13.7822L18.3713 43.2841C15.7157 44.4946 14 47.0699 14 49.8462V126.18C14 137.381 19.8091 147.92 29.5401 154.373L71.5291 182.219C75.9336 185.14 81.1102 186.683 86.4993 186.683C91.8872 186.683 97.0651 185.14 101.47 182.219L143.457 154.374C153.188 147.919 159 137.381 159 126.18V49.8474C159 47.0698 157.283 44.4946 154.625 43.2841Z" fill="#E6F7FF"></path><path d="M158.447 127.188C158.447 137.673 152.966 147.54 143.783 153.582L100.059 182.351C96.0804 184.97 91.4044 186.354 86.5364 186.354C81.6684 186.354 76.9924 184.97 73.0137 182.351L29.2897 153.581C20.107 147.541 14.6257 137.674 14.6257 127.188V48.3152C14.6257 46.7222 15.6191 45.2424 17.1551 44.5479L84.5804 14.065C85.1871 13.7912 85.8644 13.6469 86.5364 13.6469C87.2084 13.6469 87.8857 13.7912 88.4897 14.065L155.916 44.5479C157.454 45.2424 158.447 46.7222 158.447 48.3164V127.188M157.479 41.5349L90.0551 11.052C87.8764 10.0675 85.2018 10.0663 83.0178 11.052L15.5911 41.5349C12.8257 42.7857 11.0391 45.4465 11.0391 48.3152V127.188C11.0391 138.761 17.0884 149.651 27.2217 156.318L70.9471 185.089C75.5337 188.107 80.9244 189.702 86.5364 189.702C92.1471 189.702 97.5391 188.107 102.126 185.089L145.85 156.319C155.983 149.649 162.035 138.761 162.035 127.188V48.3164C162.035 45.4465 160.247 42.7857 157.479 41.5349" fill="#FFFFFF"></path></svg>
                                            `, [
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#1565D8"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [1],
                                                        "color": "#E6F7FF"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": [2],
                                                        "color": "#FFFFFF"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg p-3"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 174 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M162.04 127.194C162.04 138.755 155.987 149.645 145.853 156.316L102.133 185.09C97.5467 188.102 92.148 189.708 86.5346 189.708C80.9213 189.708 75.5347 188.102 70.9467 185.09L27.2266 156.316C17.0933 149.645 11.04 138.755 11.04 127.194V48.3136C11.04 45.4511 12.8266 42.7878 15.588 41.5308L83.0133 11.0516C85.2 10.0684 87.88 10.0684 90.0533 11.0516L157.48 41.5308C160.255 42.7878 162.04 45.4511 162.04 48.3136V127.194M162.293 32.2713L94.868 1.77969C92.24 0.597362 89.3866 -6.54469e-07 86.5346 -6.54469e-07C83.6946 -6.54469e-07 80.84 0.597362 78.2133 1.77969L10.7867 32.2713C4.18665 35.2458 0 41.481 0 48.3136V127.194C0 142.128 7.78667 156.129 20.8667 164.742L64.5866 193.503C71.1733 197.834 78.8533 200 86.5346 200C94.2266 200 101.907 197.834 108.48 193.503L152.213 164.742C165.293 156.129 173.067 142.128 173.067 127.194V48.3136C173.067 41.481 168.88 35.2458 162.293 32.2713Z" fill="#1565D8"></path><path d="M154.625 43.2841L89.8783 13.7822C87.7861 12.8294 85.2177 12.8282 83.1204 13.7822L18.3713 43.2841C15.7157 44.4946 14 47.0699 14 49.8462V126.18C14 137.381 19.8091 147.92 29.5401 154.373L71.5291 182.219C75.9336 185.14 81.1102 186.683 86.4993 186.683C91.8872 186.683 97.0651 185.14 101.47 182.219L143.457 154.374C153.188 147.919 159 137.381 159 126.18V49.8474C159 47.0698 157.283 44.4946 154.625 43.2841Z" fill="#E6F7FF"></path><path d="M158.447 127.188C158.447 137.673 152.966 147.54 143.783 153.582L100.059 182.351C96.0804 184.97 91.4044 186.354 86.5364 186.354C81.6684 186.354 76.9924 184.97 73.0137 182.351L29.2897 153.581C20.107 147.541 14.6257 137.674 14.6257 127.188V48.3152C14.6257 46.7222 15.6191 45.2424 17.1551 44.5479L84.5804 14.065C85.1871 13.7912 85.8644 13.6469 86.5364 13.6469C87.2084 13.6469 87.8857 13.7912 88.4897 14.065L155.916 44.5479C157.454 45.2424 158.447 46.7222 158.447 48.3164V127.188M157.479 41.5349L90.0551 11.052C87.8764 10.0675 85.2018 10.0663 83.0178 11.052L15.5911 41.5349C12.8257 42.7857 11.0391 45.4465 11.0391 48.3152V127.188C11.0391 138.761 17.0884 149.651 27.2217 156.318L70.9471 185.089C75.5337 188.107 80.9244 189.702 86.5364 189.702C92.1471 189.702 97.5391 188.107 102.126 185.089L145.85 156.319C155.983 149.649 162.035 138.761 162.035 127.188V48.3164C162.035 45.4465 160.247 42.7857 157.479 41.5349" fill="#FFFFFF"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("bases",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 174 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M162.04 127.194C162.04 138.755 155.987 149.645 145.853 156.316L102.133 185.09C97.5467 188.102 92.148 189.708 86.5346 189.708C80.9213 189.708 75.5347 188.102 70.9467 185.09L27.2266 156.316C17.0933 149.645 11.04 138.755 11.04 127.194V48.3136C11.04 45.4511 12.8266 42.7878 15.588 41.5308L83.0133 11.0516C85.2 10.0684 87.88 10.0684 90.0533 11.0516L157.48 41.5308C160.255 42.7878 162.04 45.4511 162.04 48.3136V127.194M162.293 32.2713L94.868 1.77969C92.24 0.597362 89.3866 -6.54469e-07 86.5346 -6.54469e-07C83.6946 -6.54469e-07 80.84 0.597362 78.2133 1.77969L10.7867 32.2713C4.18665 35.2458 0 41.481 0 48.3136V127.194C0 142.128 7.78667 156.129 20.8667 164.742L64.5866 193.503C71.1733 197.834 78.8533 200 86.5346 200C94.2266 200 101.907 197.834 108.48 193.503L152.213 164.742C165.293 156.129 173.067 142.128 173.067 127.194V48.3136C173.067 41.481 168.88 35.2458 162.293 32.2713Z" fill="#FAAD13"></path><path d="M154.625 43.2841L89.8783 13.7822C87.7861 12.8294 85.2177 12.8282 83.1204 13.7822L18.3713 43.2841C15.7157 44.4946 14 47.0699 14 49.8462V126.18C14 137.381 19.8091 147.92 29.5401 154.373L71.5291 182.219C75.9336 185.14 81.1102 186.683 86.4993 186.683C91.8872 186.683 97.0651 185.14 101.47 182.219L143.457 154.374C153.188 147.919 159 137.381 159 126.18V49.8474C159 47.0698 157.283 44.4946 154.625 43.2841Z" fill="#FFFAE9"></path><mask id="EAPp7FnNqZqCB-F2fQNL-" maskUnits="userSpaceOnUse" x="14" y="13" width="145" height="174" style="mask-type: alpha;"><path d="M154.625 43.2831L89.8783 13.7812C87.7861 12.8284 85.2177 12.8272 83.1204 13.7812L18.3713 43.2831C15.7157 44.4937 14 47.0689 14 49.8453V126.179C14 137.38 19.8091 147.92 29.5401 154.372L71.5291 182.218C75.9336 185.139 81.1102 186.682 86.4993 186.682C91.8872 186.682 97.0651 185.139 101.47 182.218L143.457 154.373C153.188 147.918 159 137.38 159 126.179V49.8464C159 47.0688 157.283 44.4937 154.625 43.2831Z" fill="#FFFAE9"></path></mask><g mask="url(#EAPp7FnNqZqCB-F2fQNL-)"><rect x="-5" y="-16.8027" width="183" height="84.9409" fill="#FFFFFF"></rect></g><path d="M158.447 127.188C158.447 137.673 152.966 147.54 143.783 153.582L100.059 182.351C96.0804 184.97 91.4044 186.354 86.5364 186.354C81.6684 186.354 76.9924 184.97 73.0137 182.351L29.2897 153.581C20.107 147.541 14.6257 137.674 14.6257 127.188V48.3152C14.6257 46.7222 15.6191 45.2424 17.1551 44.5479L84.5804 14.065C85.1871 13.7912 85.8644 13.6469 86.5364 13.6469C87.2084 13.6469 87.8857 13.7912 88.4897 14.065L155.916 44.5479C157.454 45.2424 158.447 46.7222 158.447 48.3164V127.188M157.479 41.5349L90.0551 11.052C87.8764 10.0675 85.2018 10.0663 83.0178 11.052L15.5911 41.5349C12.8257 42.7857 11.0391 45.4465 11.0391 48.3152V127.188C11.0391 138.761 17.0884 149.651 27.2217 156.318L70.9471 185.089C75.5337 188.107 80.9244 189.702 86.5364 189.702C92.1471 189.702 97.5391 188.107 102.126 185.089L145.85 156.319C155.983 149.649 162.035 138.761 162.035 127.188V48.3164C162.035 45.4465 160.247 42.7857 157.479 41.5349" fill="#FFFFFF"></path></svg>
                                            `, [
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#FAAD13"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [1],
                                                        "color": "#FFFAE9"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": ["maskRect",3],
                                                        "color": "#FFFFFF"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg p-3"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 174 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M162.04 127.194C162.04 138.755 155.987 149.645 145.853 156.316L102.133 185.09C97.5467 188.102 92.148 189.708 86.5346 189.708C80.9213 189.708 75.5347 188.102 70.9467 185.09L27.2266 156.316C17.0933 149.645 11.04 138.755 11.04 127.194V48.3136C11.04 45.4511 12.8266 42.7878 15.588 41.5308L83.0133 11.0516C85.2 10.0684 87.88 10.0684 90.0533 11.0516L157.48 41.5308C160.255 42.7878 162.04 45.4511 162.04 48.3136V127.194M162.293 32.2713L94.868 1.77969C92.24 0.597362 89.3866 -6.54469e-07 86.5346 -6.54469e-07C83.6946 -6.54469e-07 80.84 0.597362 78.2133 1.77969L10.7867 32.2713C4.18665 35.2458 0 41.481 0 48.3136V127.194C0 142.128 7.78667 156.129 20.8667 164.742L64.5866 193.503C71.1733 197.834 78.8533 200 86.5346 200C94.2266 200 101.907 197.834 108.48 193.503L152.213 164.742C165.293 156.129 173.067 142.128 173.067 127.194V48.3136C173.067 41.481 168.88 35.2458 162.293 32.2713Z" fill="#FAAD13"></path><path d="M154.625 43.2841L89.8783 13.7822C87.7861 12.8294 85.2177 12.8282 83.1204 13.7822L18.3713 43.2841C15.7157 44.4946 14 47.0699 14 49.8462V126.18C14 137.381 19.8091 147.92 29.5401 154.373L71.5291 182.219C75.9336 185.14 81.1102 186.683 86.4993 186.683C91.8872 186.683 97.0651 185.14 101.47 182.219L143.457 154.374C153.188 147.919 159 137.381 159 126.18V49.8474C159 47.0698 157.283 44.4946 154.625 43.2841Z" fill="#FFFAE9"></path><mask id="EAPp7FnNqZqCB-F2fQNL-" maskUnits="userSpaceOnUse" x="14" y="13" width="145" height="174" style="mask-type: alpha;"><path d="M154.625 43.2831L89.8783 13.7812C87.7861 12.8284 85.2177 12.8272 83.1204 13.7812L18.3713 43.2831C15.7157 44.4937 14 47.0689 14 49.8453V126.179C14 137.38 19.8091 147.92 29.5401 154.372L71.5291 182.218C75.9336 185.139 81.1102 186.682 86.4993 186.682C91.8872 186.682 97.0651 185.139 101.47 182.218L143.457 154.373C153.188 147.918 159 137.38 159 126.179V49.8464C159 47.0688 157.283 44.4937 154.625 43.2831Z" fill="#FFFAE9"></path></mask><g mask="url(#EAPp7FnNqZqCB-F2fQNL-)"><rect x="-5" y="-16.8027" width="183" height="84.9409" fill="#FFFFFF"></rect></g><path d="M158.447 127.188C158.447 137.673 152.966 147.54 143.783 153.582L100.059 182.351C96.0804 184.97 91.4044 186.354 86.5364 186.354C81.6684 186.354 76.9924 184.97 73.0137 182.351L29.2897 153.581C20.107 147.541 14.6257 137.674 14.6257 127.188V48.3152C14.6257 46.7222 15.6191 45.2424 17.1551 44.5479L84.5804 14.065C85.1871 13.7912 85.8644 13.6469 86.5364 13.6469C87.2084 13.6469 87.8857 13.7912 88.4897 14.065L155.916 44.5479C157.454 45.2424 158.447 46.7222 158.447 48.3164V127.188M157.479 41.5349L90.0551 11.052C87.8764 10.0675 85.2018 10.0663 83.0178 11.052L15.5911 41.5349C12.8257 42.7857 11.0391 45.4465 11.0391 48.3152V127.188C11.0391 138.761 17.0884 149.651 27.2217 156.318L70.9471 185.089C75.5337 188.107 80.9244 189.702 86.5364 189.702C92.1471 189.702 97.5391 188.107 102.126 185.089L145.85 156.319C155.983 149.649 162.035 138.761 162.035 127.188V48.3164C162.035 45.4465 160.247 42.7857 157.479 41.5349" fill="#FFFFFF"></path></svg>
                                        
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("bases",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 174 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M162.04 127.194C162.04 138.755 155.987 149.645 145.853 156.316L102.133 185.09C97.5467 188.102 92.148 189.708 86.5346 189.708C80.9213 189.708 75.5347 188.102 70.9467 185.09L27.2266 156.316C17.0933 149.645 11.04 138.755 11.04 127.194V48.3136C11.04 45.4511 12.8266 42.7878 15.588 41.5308L83.0133 11.0516C85.2 10.0684 87.88 10.0684 90.0533 11.0516L157.48 41.5308C160.255 42.7878 162.04 45.4511 162.04 48.3136V127.194M162.293 32.2713L94.868 1.77969C92.24 0.597362 89.3866 -6.54469e-07 86.5346 -6.54469e-07C83.6946 -6.54469e-07 80.84 0.597362 78.2133 1.77969L10.7867 32.2713C4.18665 35.2458 0 41.481 0 48.3136V127.194C0 142.128 7.78667 156.129 20.8667 164.742L64.5866 193.503C71.1733 197.834 78.8533 200 86.5346 200C94.2266 200 101.907 197.834 108.48 193.503L152.213 164.742C165.293 156.129 173.067 142.128 173.067 127.194V48.3136C173.067 41.481 168.88 35.2458 162.293 32.2713Z" fill="#00116C"></path><path d="M154.625 43.2841L89.8783 13.7822C87.7861 12.8294 85.2177 12.8282 83.1204 13.7822L18.3713 43.2841C15.7157 44.4946 14 47.0699 14 49.8462V126.18C14 137.381 19.8091 147.92 29.5401 154.373L71.5291 182.219C75.9336 185.14 81.1102 186.683 86.4993 186.683C91.8872 186.683 97.0651 185.14 101.47 182.219L143.457 154.374C153.188 147.919 159 137.381 159 126.18V49.8474C159 47.0698 157.283 44.4946 154.625 43.2841Z" fill="#E9EEFF"></path><mask id="x-P7d5-APlpb1ZzUliRoN" maskUnits="userSpaceOnUse" x="14" y="13" width="145" height="174" style="mask-type: alpha;"><path d="M154.625 43.2831L89.8783 13.7812C87.7861 12.8284 85.2177 12.8272 83.1204 13.7812L18.3713 43.2831C15.7157 44.4937 14 47.0689 14 49.8453V126.179C14 137.38 19.8091 147.92 29.5401 154.372L71.5291 182.218C75.9336 185.139 81.1102 186.682 86.4993 186.682C91.8872 186.682 97.0651 185.139 101.47 182.218L143.457 154.373C153.188 147.918 159 137.38 159 126.179V49.8464C159 47.0688 157.283 44.4937 154.625 43.2831Z" fill="#E9EEFF"></path></mask><g mask="url(#x-P7d5-APlpb1ZzUliRoN)"><ellipse cx="84.9336" cy="186.682" rx="93" ry="86.8077" fill="#FFFFFF"></ellipse></g><path d="M158.447 127.188C158.447 137.673 152.966 147.54 143.783 153.582L100.059 182.351C96.0804 184.97 91.4044 186.354 86.5364 186.354C81.6684 186.354 76.9924 184.97 73.0137 182.351L29.2897 153.581C20.107 147.541 14.6257 137.674 14.6257 127.188V48.3152C14.6257 46.7222 15.6191 45.2424 17.1551 44.5479L84.5804 14.065C85.1871 13.7912 85.8644 13.6469 86.5364 13.6469C87.2084 13.6469 87.8857 13.7912 88.4897 14.065L155.916 44.5479C157.454 45.2424 158.447 46.7222 158.447 48.3164V127.188M157.479 41.5349L90.0551 11.052C87.8764 10.0675 85.2018 10.0663 83.0178 11.052L15.5911 41.5349C12.8257 42.7857 11.0391 45.4465 11.0391 48.3152V127.188C11.0391 138.761 17.0884 149.651 27.2217 156.318L70.9471 185.089C75.5337 188.107 80.9244 189.702 86.5364 189.702C92.1471 189.702 97.5391 188.107 102.126 185.089L145.85 156.319C155.983 149.649 162.035 138.761 162.035 127.188V48.3164C162.035 45.4465 160.247 42.7857 157.479 41.5349" fill="#FFFFFF"></path></svg>
                                            `, [
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#00116C"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [1],
                                                        "color": "#E9EEFF"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": ["mask",3],
                                                        "color": "#FFFFFF"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 174 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M162.04 127.194C162.04 138.755 155.987 149.645 145.853 156.316L102.133 185.09C97.5467 188.102 92.148 189.708 86.5346 189.708C80.9213 189.708 75.5347 188.102 70.9467 185.09L27.2266 156.316C17.0933 149.645 11.04 138.755 11.04 127.194V48.3136C11.04 45.4511 12.8266 42.7878 15.588 41.5308L83.0133 11.0516C85.2 10.0684 87.88 10.0684 90.0533 11.0516L157.48 41.5308C160.255 42.7878 162.04 45.4511 162.04 48.3136V127.194M162.293 32.2713L94.868 1.77969C92.24 0.597362 89.3866 -6.54469e-07 86.5346 -6.54469e-07C83.6946 -6.54469e-07 80.84 0.597362 78.2133 1.77969L10.7867 32.2713C4.18665 35.2458 0 41.481 0 48.3136V127.194C0 142.128 7.78667 156.129 20.8667 164.742L64.5866 193.503C71.1733 197.834 78.8533 200 86.5346 200C94.2266 200 101.907 197.834 108.48 193.503L152.213 164.742C165.293 156.129 173.067 142.128 173.067 127.194V48.3136C173.067 41.481 168.88 35.2458 162.293 32.2713Z" fill="#00116C"></path><path d="M154.625 43.2841L89.8783 13.7822C87.7861 12.8294 85.2177 12.8282 83.1204 13.7822L18.3713 43.2841C15.7157 44.4946 14 47.0699 14 49.8462V126.18C14 137.381 19.8091 147.92 29.5401 154.373L71.5291 182.219C75.9336 185.14 81.1102 186.683 86.4993 186.683C91.8872 186.683 97.0651 185.14 101.47 182.219L143.457 154.374C153.188 147.919 159 137.381 159 126.18V49.8474C159 47.0698 157.283 44.4946 154.625 43.2841Z" fill="#E9EEFF"></path><mask id="x-P7d5-APlpb1ZzUliRoN" maskUnits="userSpaceOnUse" x="14" y="13" width="145" height="174" style="mask-type: alpha;"><path d="M154.625 43.2831L89.8783 13.7812C87.7861 12.8284 85.2177 12.8272 83.1204 13.7812L18.3713 43.2831C15.7157 44.4937 14 47.0689 14 49.8453V126.179C14 137.38 19.8091 147.92 29.5401 154.372L71.5291 182.218C75.9336 185.139 81.1102 186.682 86.4993 186.682C91.8872 186.682 97.0651 185.139 101.47 182.218L143.457 154.373C153.188 147.918 159 137.38 159 126.179V49.8464C159 47.0688 157.283 44.4937 154.625 43.2831Z" fill="#E9EEFF"></path></mask><g mask="url(#x-P7d5-APlpb1ZzUliRoN)"><ellipse cx="84.9336" cy="186.682" rx="93" ry="86.8077" fill="#FFFFFF"></ellipse></g><path d="M158.447 127.188C158.447 137.673 152.966 147.54 143.783 153.582L100.059 182.351C96.0804 184.97 91.4044 186.354 86.5364 186.354C81.6684 186.354 76.9924 184.97 73.0137 182.351L29.2897 153.581C20.107 147.541 14.6257 137.674 14.6257 127.188V48.3152C14.6257 46.7222 15.6191 45.2424 17.1551 44.5479L84.5804 14.065C85.1871 13.7912 85.8644 13.6469 86.5364 13.6469C87.2084 13.6469 87.8857 13.7912 88.4897 14.065L155.916 44.5479C157.454 45.2424 158.447 46.7222 158.447 48.3164V127.188M157.479 41.5349L90.0551 11.052C87.8764 10.0675 85.2018 10.0663 83.0178 11.052L15.5911 41.5349C12.8257 42.7857 11.0391 45.4465 11.0391 48.3152V127.188C11.0391 138.761 17.0884 149.651 27.2217 156.318L70.9471 185.089C75.5337 188.107 80.9244 189.702 86.5364 189.702C92.1471 189.702 97.5391 188.107 102.126 185.089L145.85 156.319C155.983 149.649 162.035 138.761 162.035 127.188V48.3164C162.035 45.4465 160.247 42.7857 157.479 41.5349" fill="#FFFFFF"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("bases",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 174 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M162.04 127.194C162.04 138.755 155.987 149.645 145.853 156.316L102.133 185.09C97.5467 188.102 92.148 189.708 86.5346 189.708C80.9213 189.708 75.5347 188.102 70.9467 185.09L27.2266 156.316C17.0933 149.645 11.04 138.755 11.04 127.194V48.3136C11.04 45.4511 12.8266 42.7878 15.588 41.5308L83.0133 11.0516C85.2 10.0684 87.88 10.0684 90.0533 11.0516L157.48 41.5308C160.255 42.7878 162.04 45.4511 162.04 48.3136V127.194M162.293 32.2713L94.868 1.77969C92.24 0.597362 89.3866 -6.54469e-07 86.5346 -6.54469e-07C83.6946 -6.54469e-07 80.84 0.597362 78.2133 1.77969L10.7867 32.2713C4.18665 35.2458 0 41.481 0 48.3136V127.194C0 142.128 7.78667 156.129 20.8667 164.742L64.5866 193.503C71.1733 197.834 78.8533 200 86.5346 200C94.2266 200 101.907 197.834 108.48 193.503L152.213 164.742C165.293 156.129 173.067 142.128 173.067 127.194V48.3136C173.067 41.481 168.88 35.2458 162.293 32.2713Z" fill="#1565D8"></path><path d="M154.625 43.2841L89.8783 13.7822C87.7861 12.8294 85.2177 12.8282 83.1204 13.7822L18.3713 43.2841C15.7157 44.4946 14 47.0699 14 49.8462V126.18C14 137.381 19.8091 147.92 29.5401 154.373L71.5291 182.219C75.9336 185.14 81.1102 186.683 86.4993 186.683C91.8872 186.683 97.0651 185.14 101.47 182.219L143.457 154.374C153.188 147.919 159 137.381 159 126.18V49.8474C159 47.0698 157.283 44.4946 154.625 43.2841Z" fill="#E6F7FF"></path><path d="M158.447 127.188C158.447 137.673 152.966 147.54 143.783 153.582L100.059 182.351C96.0804 184.97 91.4044 186.354 86.5364 186.354C81.6684 186.354 76.9924 184.97 73.0137 182.351L29.2897 153.581C20.107 147.541 14.6257 137.674 14.6257 127.188V48.3152C14.6257 46.7222 15.6191 45.2424 17.1551 44.5479L84.5804 14.065C85.1871 13.7912 85.8644 13.6469 86.5364 13.6469C87.2084 13.6469 87.8857 13.7912 88.4897 14.065L155.916 44.5479C157.454 45.2424 158.447 46.7222 158.447 48.3164V127.188M157.479 41.5349L90.0551 11.052C87.8764 10.0675 85.2018 10.0663 83.0178 11.052L15.5911 41.5349C12.8257 42.7857 11.0391 45.4465 11.0391 48.3152V127.188C11.0391 138.761 17.0884 149.651 27.2217 156.318L70.9471 185.089C75.5337 188.107 80.9244 189.702 86.5364 189.702C92.1471 189.702 97.5391 188.107 102.126 185.089L145.85 156.319C155.983 149.649 162.035 138.761 162.035 127.188V48.3164C162.035 45.4465 160.247 42.7857 157.479 41.5349" fill="#FFFFFF"></path><rect x="14" y="59.7378" width="145" height="59.7387" fill="#FFFFFF"></rect></svg>
                                            `, [
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#1565D8"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [1],
                                                        "color": "#E6F7FF"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": ["rect",2],
                                                        "color": "#FFFFFF"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 174 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M162.04 127.194C162.04 138.755 155.987 149.645 145.853 156.316L102.133 185.09C97.5467 188.102 92.148 189.708 86.5346 189.708C80.9213 189.708 75.5347 188.102 70.9467 185.09L27.2266 156.316C17.0933 149.645 11.04 138.755 11.04 127.194V48.3136C11.04 45.4511 12.8266 42.7878 15.588 41.5308L83.0133 11.0516C85.2 10.0684 87.88 10.0684 90.0533 11.0516L157.48 41.5308C160.255 42.7878 162.04 45.4511 162.04 48.3136V127.194M162.293 32.2713L94.868 1.77969C92.24 0.597362 89.3866 -6.54469e-07 86.5346 -6.54469e-07C83.6946 -6.54469e-07 80.84 0.597362 78.2133 1.77969L10.7867 32.2713C4.18665 35.2458 0 41.481 0 48.3136V127.194C0 142.128 7.78667 156.129 20.8667 164.742L64.5866 193.503C71.1733 197.834 78.8533 200 86.5346 200C94.2266 200 101.907 197.834 108.48 193.503L152.213 164.742C165.293 156.129 173.067 142.128 173.067 127.194V48.3136C173.067 41.481 168.88 35.2458 162.293 32.2713Z" fill="#1565D8"></path><path d="M154.625 43.2841L89.8783 13.7822C87.7861 12.8294 85.2177 12.8282 83.1204 13.7822L18.3713 43.2841C15.7157 44.4946 14 47.0699 14 49.8462V126.18C14 137.381 19.8091 147.92 29.5401 154.373L71.5291 182.219C75.9336 185.14 81.1102 186.683 86.4993 186.683C91.8872 186.683 97.0651 185.14 101.47 182.219L143.457 154.374C153.188 147.919 159 137.381 159 126.18V49.8474C159 47.0698 157.283 44.4946 154.625 43.2841Z" fill="#E6F7FF"></path><path d="M158.447 127.188C158.447 137.673 152.966 147.54 143.783 153.582L100.059 182.351C96.0804 184.97 91.4044 186.354 86.5364 186.354C81.6684 186.354 76.9924 184.97 73.0137 182.351L29.2897 153.581C20.107 147.541 14.6257 137.674 14.6257 127.188V48.3152C14.6257 46.7222 15.6191 45.2424 17.1551 44.5479L84.5804 14.065C85.1871 13.7912 85.8644 13.6469 86.5364 13.6469C87.2084 13.6469 87.8857 13.7912 88.4897 14.065L155.916 44.5479C157.454 45.2424 158.447 46.7222 158.447 48.3164V127.188M157.479 41.5349L90.0551 11.052C87.8764 10.0675 85.2018 10.0663 83.0178 11.052L15.5911 41.5349C12.8257 42.7857 11.0391 45.4465 11.0391 48.3152V127.188C11.0391 138.761 17.0884 149.651 27.2217 156.318L70.9471 185.089C75.5337 188.107 80.9244 189.702 86.5364 189.702C92.1471 189.702 97.5391 188.107 102.126 185.089L145.85 156.319C155.983 149.649 162.035 138.761 162.035 127.188V48.3164C162.035 45.4465 160.247 42.7857 157.479 41.5349" fill="#FFFFFF"></path><rect x="14" y="59.7378" width="145" height="59.7387" fill="#FFFFFF"></rect></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("bases",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 5C0 2.23857 2.23858 0 5 0H100C155.228 0 200 44.7715 200 100V100C200 155.228 155.228 200 100 200V200C44.7715 200 0 155.228 0 100V5Z" fill="#505050"></path><circle cx="99.9995" cy="99.9997" r="89.071" fill="#E0E0E0"></circle><circle cx="99.9992" cy="99.9991" r="83.6065" fill="#FFFFFF"></circle></svg>
                                            `, [
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#505050"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": ["circle"],
                                                        "circleIndex": 0,
                                                        "color": "#E0E0E0"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": ["circle"],
                                                        "circleIndex": 1,
                                                        "color": "#FFFFFF"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 5C0 2.23857 2.23858 0 5 0H100C155.228 0 200 44.7715 200 100V100C200 155.228 155.228 200 100 200V200C44.7715 200 0 155.228 0 100V5Z" fill="#505050"></path><circle cx="99.9995" cy="99.9997" r="89.071" fill="#E0E0E0"></circle><circle cx="99.9992" cy="99.9991" r="83.6065" fill="#FFFFFF"></circle></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("bases",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 5C0 2.23857 2.23858 0 5 0H100C155.228 0 200 44.7715 200 100V100C200 155.228 155.228 200 100 200V200C44.7715 200 0 155.228 0 100V5Z" fill="#7A4F00"></path><circle cx="99.9995" cy="99.9997" r="89.071" fill="#FEFEFE"></circle><circle cx="99.9992" cy="99.9991" r="83.6065" fill="#FFFAE9"></circle></svg>
                                            `, [
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#7A4F00"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": ["circle"],
                                                        "circleIndex": 0,
                                                        "color": "#FEFEFE"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": ["circle"],
                                                        "circleIndex": 1,
                                                        "color": "#FFFAE9"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 5C0 2.23857 2.23858 0 5 0H100C155.228 0 200 44.7715 200 100V100C200 155.228 155.228 200 100 200V200C44.7715 200 0 155.228 0 100V5Z" fill="#7A4F00"></path><circle cx="99.9995" cy="99.9997" r="89.071" fill="#FEFEFE"></circle><circle cx="99.9992" cy="99.9991" r="83.6065" fill="#FFFAE9"></circle></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("bases",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 5C0 2.23857 2.23858 0 5 0H100C155.228 0 200 44.7715 200 100V100C200 155.228 155.228 200 100 200V200C44.7715 200 0 155.228 0 100V5Z" fill="#1565D8"></path><circle cx="99.9995" cy="99.9997" r="89.071" fill="#FEFEFE"></circle><circle cx="99.9992" cy="99.9991" r="83.6065" fill="#E6F7FF"></circle></svg>
                                            `, [
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#1565D8"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": ["circle"],
                                                        "circleIndex": 0,
                                                        "color": "#FEFEFE"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": ["circle"],
                                                        "circleIndex": 1,
                                                        "color": "#E6F7FF"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 5C0 2.23857 2.23858 0 5 0H100C155.228 0 200 44.7715 200 100V100C200 155.228 155.228 200 100 200V200C44.7715 200 0 155.228 0 100V5Z" fill="#1565D8"></path><circle cx="99.9995" cy="99.9997" r="89.071" fill="#FEFEFE"></circle><circle cx="99.9992" cy="99.9991" r="83.6065" fill="#E6F7FF"></circle></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("bases",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 5C0 2.23857 2.23858 0 5 0H100C155.228 0 200 44.7715 200 100V100C200 155.228 155.228 200 100 200V200C44.7715 200 0 155.228 0 100V5Z" fill="#1565D8"></path><circle cx="99.9995" cy="99.9997" r="89.071" fill="#FEFEFE"></circle><circle cx="99.9992" cy="99.9991" r="83.6065" fill="#E6F7FF"></circle><mask id="LRKCemSjs6VGVYiTLJtP9" maskUnits="userSpaceOnUse" x="16" y="16" width="168" height="168" style="mask-type: alpha;"><circle cx="99.9974" cy="100.002" r="83.6065" fill="#E6F7FF"></circle></mask><g mask="url(#LRKCemSjs6VGVYiTLJtP9)"><circle cx="99.541" cy="200.015" r="76.5027" fill="#FEFEFE"></circle></g></svg>
                                            `, [
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#1565D8"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": ["circle","g_mask_circle"],
                                                        "circleIndex": 0,
                                                        "color": "#FEFEFE"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": ["circle"],
                                                        "circleIndex": 1,
                                                        "color": "#E6F7FF"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 5C0 2.23857 2.23858 0 5 0H100C155.228 0 200 44.7715 200 100V100C200 155.228 155.228 200 100 200V200C44.7715 200 0 155.228 0 100V5Z" fill="#1565D8"></path><circle cx="99.9995" cy="99.9997" r="89.071" fill="#FEFEFE"></circle><circle cx="99.9992" cy="99.9991" r="83.6065" fill="#E6F7FF"></circle><mask id="LRKCemSjs6VGVYiTLJtP9" maskUnits="userSpaceOnUse" x="16" y="16" width="168" height="168" style="mask-type: alpha;"><circle cx="99.9974" cy="100.002" r="83.6065" fill="#E6F7FF"></circle></mask><g mask="url(#LRKCemSjs6VGVYiTLJtP9)"><circle cx="99.541" cy="200.015" r="76.5027" fill="#FEFEFE"></circle></g></svg>
                                        </button>
                                    </div>
                                </div>                                
                            </div>
                        {:else if activeTab == "icons"}
                            <p class="font-medium">
                                Icons
                            </p>
                            <div class="grid grid-cols-4">
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("icons", 
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 62 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M36.0007 4.31326L33.9682 6.26271L34.4457 9.01225C34.4675 9.1294 34.4547 9.25024 34.409 9.36051C34.3633 9.47077 34.2864 9.56586 34.1876 9.63455C34.0795 9.7138 33.9481 9.75616 33.8133 9.7552C33.7083 9.75396 33.6048 9.73012 33.5101 9.68535L33.4843 9.67265L31.0001 8.3836L30.6775 8.5487L28.4901 9.68535C28.3933 9.73196 28.2866 9.75513 28.1788 9.75292C28.0711 9.75071 27.9654 9.72319 27.8707 9.67265L27.8126 9.63455C27.7137 9.56586 27.6369 9.47077 27.5912 9.36051C27.5454 9.25024 27.5327 9.1294 27.5545 9.01225L28.032 6.26271L25.9995 4.31326C25.9143 4.23018 25.8543 4.12536 25.8262 4.01058C25.7982 3.8958 25.8032 3.77561 25.8407 3.66349C25.8783 3.55136 25.9468 3.45176 26.0387 3.37585C26.1305 3.29994 26.2421 3.25074 26.3608 3.23376L29.1676 2.83371L30.4194 0.325467C30.4742 0.216356 30.5652 0.12897 30.6775 0.0778171C30.8317 -0.00240538 31.0112 -0.0214417 31.1792 0.0246204C31.3473 0.0706825 31.491 0.178343 31.5808 0.325467L32.8326 2.83371L35.6394 3.23376C35.7581 3.25074 35.8696 3.29994 35.9615 3.37585C36.0533 3.45176 36.1219 3.55136 36.1594 3.66349C36.1969 3.77561 36.202 3.8958 36.1739 4.01058C36.1459 4.12536 36.0859 4.23018 36.0007 4.31326V4.31326Z" fill="#FFB300"></path><path d="M35.3555 4.31357L33.3229 6.26301L33.8004 9.01255C33.8222 9.12971 33.8095 9.25054 33.7638 9.36081C33.718 9.47108 33.6412 9.56616 33.5423 9.63485L33.4843 9.67295L31.0001 8.38391L30.6775 8.54901L30.3548 8.38391L27.8707 9.67295L27.8126 9.63485C27.7137 9.56616 27.6369 9.47108 27.5912 9.36081C27.5454 9.25054 27.5327 9.12971 27.5545 9.01255L28.032 6.26301L25.9995 4.31357C25.9143 4.23048 25.8543 4.12567 25.8262 4.01089C25.7982 3.89611 25.8032 3.77591 25.8407 3.66379C25.8783 3.55167 25.9468 3.45206 26.0387 3.37616C26.1305 3.30025 26.2421 3.25104 26.3608 3.23407L29.1676 2.83402L30.4194 0.325775C30.4742 0.216664 30.5652 0.129278 30.6775 0.078125C30.7897 0.129278 30.8808 0.216664 30.9356 0.325775L32.1873 2.83402L34.9941 3.23407C35.1128 3.25104 35.2244 3.30025 35.3162 3.37616C35.4081 3.45206 35.4766 3.55167 35.5142 3.66379C35.5517 3.77591 35.5567 3.89611 35.5287 4.01089C35.5007 4.12567 35.4407 4.23048 35.3555 4.31357V4.31357Z" fill="#FFCA6B"></path><path d="M50.6469 8.75244L49.1306 10.2066L49.492 12.264C49.5061 12.3551 49.5002 12.4482 49.4747 12.5369C49.4492 12.6256 49.4047 12.708 49.3442 12.7784C49.2836 12.8487 49.2085 12.9056 49.1238 12.945C49.0391 12.9844 48.9468 13.0055 48.8532 13.0069C48.7492 13.0073 48.6469 12.981 48.5564 12.9307L48.5305 12.918L46.6787 11.9592L46.3561 12.1243L44.8011 12.9307C44.7051 12.9803 44.598 13.0052 44.4897 13.003C44.3814 13.0007 44.2754 12.9715 44.1816 12.918L44.1236 12.8799C44.0264 12.8112 43.9508 12.717 43.9052 12.6082C43.8596 12.4994 43.8458 12.3801 43.8655 12.264L44.2268 10.2066L42.7105 8.75244C42.6245 8.67028 42.5638 8.56595 42.5353 8.4514C42.5067 8.33686 42.5115 8.21672 42.5492 8.10474C42.584 7.99157 42.6511 7.89065 42.7427 7.81408C42.8342 7.7375 42.9463 7.6885 43.0654 7.67294L45.1624 7.36814L46.098 5.50125C46.1528 5.39214 46.2439 5.30475 46.3561 5.2536C46.5103 5.17338 46.6898 5.15434 46.8579 5.2004C47.0259 5.24646 47.1696 5.35412 47.2594 5.50125L48.195 7.36814L50.2921 7.67294C50.4112 7.6885 50.5232 7.7375 50.6147 7.81408C50.7063 7.89065 50.7735 7.99157 50.8082 8.10474C50.8459 8.21672 50.8507 8.33686 50.8222 8.4514C50.7936 8.56595 50.7329 8.67028 50.6469 8.75244V8.75244Z" fill="#FFB300"></path><path d="M50.0016 8.75275L48.4853 10.2069L48.8466 12.2643C48.8662 12.3804 48.8525 12.4997 48.8069 12.6085C48.7613 12.7174 48.6856 12.8115 48.5885 12.8802L48.5304 12.9183L46.6786 11.9595L46.356 12.1246L46.0333 11.9595L44.1815 12.9183L44.1234 12.8802C44.0263 12.8115 43.9507 12.7174 43.9051 12.6085C43.8595 12.4997 43.8457 12.3804 43.8653 12.2643L44.2267 10.2069L42.7104 8.75275C42.6244 8.67059 42.5637 8.56626 42.5351 8.45171C42.5066 8.33716 42.5114 8.21703 42.549 8.10505C42.5838 7.99188 42.651 7.89096 42.7426 7.81438C42.8341 7.73781 42.9461 7.68881 43.0652 7.67325L45.1623 7.36845L46.0979 5.50156C46.1527 5.39244 46.2437 5.30506 46.356 5.25391C46.4682 5.30506 46.5593 5.39244 46.6141 5.50156L47.5497 7.36845L49.6467 7.67325C49.7658 7.68881 49.8778 7.73781 49.9694 7.81438C50.0609 7.89096 50.1281 7.99188 50.1629 8.10505C50.2005 8.21703 50.2053 8.33716 50.1768 8.45171C50.1483 8.56626 50.0876 8.67059 50.0016 8.75275V8.75275Z" fill="#FFCA6B"></path><path d="M19.2897 8.75244L17.7734 10.2066L18.1347 12.264C18.1553 12.3813 18.1419 12.502 18.096 12.6122C18.0502 12.7225 17.9738 12.8178 17.8756 12.8873C17.7773 12.9568 17.6612 12.9978 17.5405 13.0055C17.4197 13.0131 17.2992 12.9872 17.1927 12.9307L17.1669 12.918L15.3215 11.9592L14.9989 12.1243L13.4503 12.9307C13.3544 12.9804 13.2472 13.0053 13.1389 13.0031C13.0306 13.0008 12.9246 12.9716 12.8308 12.918C12.8085 12.9067 12.7869 12.894 12.7663 12.8799C12.6692 12.8112 12.5936 12.717 12.548 12.6082C12.5024 12.4994 12.4886 12.3801 12.5082 12.264L12.8696 10.2066L11.3532 8.75244C11.2673 8.67028 11.2065 8.56595 11.178 8.4514C11.1495 8.33686 11.1543 8.21672 11.1919 8.10474C11.2267 7.99157 11.2939 7.89065 11.3855 7.81408C11.477 7.7375 11.589 7.6885 11.7081 7.67294L13.8052 7.36814L14.7408 5.50125C14.7956 5.39214 14.8866 5.30475 14.9989 5.2536C15.153 5.17338 15.3326 5.15434 15.5006 5.2004C15.6686 5.24646 15.8123 5.35412 15.9022 5.50125L16.8378 7.36814L18.9348 7.67294C19.0539 7.6885 19.1659 7.7375 19.2575 7.81408C19.349 7.89065 19.4162 7.99157 19.451 8.10474C19.4886 8.21672 19.4935 8.33686 19.4649 8.4514C19.4364 8.56595 19.3757 8.67028 19.2897 8.75244V8.75244Z" fill="#FFB300"></path><path d="M18.6444 8.75275L17.1281 10.2069L17.4894 12.2643C17.5091 12.3804 17.4953 12.4997 17.4497 12.6085C17.4041 12.7174 17.3284 12.8115 17.2313 12.8802C17.2107 12.8943 17.1891 12.9071 17.1668 12.9183L15.3214 11.9595L14.9988 12.1246L14.6762 11.9595L12.8308 12.9183C12.8084 12.9071 12.7869 12.8943 12.7663 12.8802C12.6691 12.8115 12.5935 12.7174 12.5479 12.6085C12.5023 12.4997 12.4885 12.3804 12.5082 12.2643L12.8695 10.2069L11.3532 8.75275C11.2672 8.67059 11.2065 8.56626 11.178 8.45171C11.1494 8.33716 11.1542 8.21703 11.1919 8.10505C11.2267 7.99188 11.2938 7.89096 11.3854 7.81438C11.4769 7.73781 11.589 7.68881 11.7081 7.67325L13.8051 7.36845L14.7407 5.50156C14.7955 5.39244 14.8866 5.30506 14.9988 5.25391C15.111 5.30506 15.2021 5.39244 15.2569 5.50156L16.1925 7.36845L18.2895 7.67325C18.4086 7.68881 18.5206 7.73781 18.6122 7.81438C18.7037 7.89096 18.7709 7.99188 18.8057 8.10505C18.8433 8.21703 18.8482 8.33716 18.8196 8.45171C18.7911 8.56626 18.7304 8.67059 18.6444 8.75275Z" fill="#FFCA6B"></path><path d="M61.8089 13.9486L60.7314 14.9837L60.983 16.4378C61.0042 16.5543 60.9918 16.6743 60.9473 16.7843C60.9029 16.8942 60.8281 16.9898 60.7314 17.0601C60.6205 17.1386 60.4873 17.1808 60.3507 17.1808C60.2456 17.1795 60.1421 17.1557 60.0474 17.1109L60.0216 17.0982L58.7182 16.4188L58.3956 16.5839L57.389 17.1109C57.2931 17.1606 57.186 17.1855 57.0776 17.1833C56.9693 17.181 56.8633 17.1518 56.7696 17.0982C56.7473 17.0869 56.7257 17.0742 56.7051 17.0601C56.6084 16.9898 56.5336 16.8942 56.4891 16.7843C56.4446 16.6743 56.4323 16.5543 56.4534 16.4378L56.7051 14.9837L55.6275 13.9486C55.5423 13.8656 55.4823 13.7607 55.4543 13.646C55.4262 13.5312 55.4313 13.411 55.4688 13.2989C55.5063 13.1867 55.5749 13.0871 55.6667 13.0112C55.7586 12.9353 55.8701 12.8861 55.9889 12.8691L57.4729 12.6532L58.1375 11.3261C58.1923 11.217 58.2834 11.1296 58.3956 11.0784C58.5497 10.9977 58.7294 10.9785 58.8976 11.0246C59.0657 11.0706 59.2094 11.1786 59.2989 11.3261L59.9635 12.6532L61.4476 12.8691C61.5663 12.8861 61.6778 12.9353 61.7697 13.0112C61.8616 13.0871 61.9301 13.1867 61.9676 13.2989C62.0052 13.411 62.0102 13.5312 61.9822 13.646C61.9541 13.7607 61.8941 13.8656 61.8089 13.9486V13.9486Z" fill="#FFB300"></path><path d="M61.1637 13.9483L60.0861 14.9834L60.3378 16.4375C60.3589 16.554 60.3466 16.674 60.3021 16.784C60.2576 16.8939 60.1828 16.9895 60.0861 17.0598C60.0668 17.0725 60.041 17.0852 60.0216 17.0979L58.7182 16.4185L58.3956 16.5836L58.073 16.4185L56.7696 17.0979C56.7473 17.0866 56.7257 17.0739 56.7051 17.0598C56.6084 16.9895 56.5336 16.8939 56.4891 16.784C56.4446 16.674 56.4323 16.554 56.4534 16.4375L56.7051 14.9834L55.6275 13.9483C55.5423 13.8652 55.4823 13.7604 55.4543 13.6456C55.4262 13.5309 55.4313 13.4107 55.4688 13.2985C55.5063 13.1864 55.5749 13.0868 55.6667 13.0109C55.7586 12.935 55.8701 12.8858 55.9889 12.8688L57.4729 12.6529L58.1375 11.3258C58.1923 11.2167 58.2834 11.1293 58.3956 11.0781C58.5078 11.1293 58.5989 11.2167 58.6537 11.3258L59.3183 12.6529L60.8023 12.8688C60.9211 12.8858 61.0326 12.935 61.1245 13.0109C61.2163 13.0868 61.2849 13.1864 61.3224 13.2985C61.3599 13.4107 61.365 13.5309 61.3369 13.6456C61.3089 13.7604 61.2489 13.8652 61.1637 13.9483V13.9483Z" fill="#FFCA6B"></path><path d="M6.37264 13.9486L5.29509 14.9837L5.54674 16.4378C5.56852 16.555 5.5558 16.6758 5.51007 16.7861C5.46433 16.8964 5.3875 16.9914 5.28864 17.0601C5.18057 17.1394 5.04917 17.1817 4.9144 17.1808C4.80934 17.1795 4.70584 17.1557 4.61114 17.1109L4.58533 17.0982L3.28194 16.4188L2.95932 16.5839L1.95275 17.1109C1.85685 17.1606 1.74971 17.1855 1.64137 17.1833C1.53302 17.181 1.42703 17.1518 1.33332 17.0982C1.31097 17.0869 1.28942 17.0742 1.26879 17.0601C1.17209 16.9898 1.09729 16.8942 1.05282 16.7843C1.00836 16.6743 0.996002 16.5543 1.01715 16.4378L1.26879 14.9837L0.191239 13.9486C0.106026 13.8656 0.0460329 13.7607 0.0179955 13.646C-0.0100419 13.5312 -0.00501337 13.411 0.0325165 13.2989C0.0700464 13.1867 0.138592 13.0871 0.230457 13.0112C0.322321 12.9353 0.433869 12.8861 0.552574 12.8691L2.03663 12.6532L2.70123 11.3261C2.75603 11.217 2.8471 11.1296 2.95932 11.0784C3.11342 10.9977 3.29314 10.9785 3.4613 11.0246C3.62945 11.0706 3.77315 11.1786 3.86266 11.3261L4.52726 12.6532L6.01131 12.8691C6.13001 12.8861 6.24156 12.9353 6.33343 13.0112C6.42529 13.0871 6.49384 13.1867 6.53137 13.2989C6.5689 13.411 6.57393 13.5312 6.54589 13.646C6.51785 13.7607 6.45786 13.8656 6.37264 13.9486V13.9486Z" fill="#FFB300"></path><path d="M5.72728 13.9483L4.64973 14.9834L4.90137 16.4375C4.92316 16.5547 4.91043 16.6755 4.8647 16.7858C4.81897 16.896 4.74214 16.9911 4.64328 17.0598L4.5852 17.0979L3.28182 16.4185L2.9592 16.5836L2.63658 16.4185L1.33319 17.0979C1.31085 17.0866 1.2893 17.0739 1.26867 17.0598C1.17197 16.9895 1.09716 16.8939 1.0527 16.784C1.00824 16.674 0.995879 16.554 1.01703 16.4375L1.26867 14.9834L0.191117 13.9483C0.105904 13.8652 0.0459109 13.7604 0.0178735 13.6456C-0.0101639 13.5309 -0.00513544 13.4107 0.0323945 13.2985C0.0699244 13.1864 0.13847 13.0868 0.230335 13.0109C0.322199 12.935 0.433747 12.8858 0.552452 12.8688L2.03651 12.6529L2.7011 11.3258C2.7559 11.2167 2.84698 11.1293 2.9592 11.0781C3.07142 11.1293 3.16249 11.2167 3.21729 11.3258L3.88189 12.6529L5.36595 12.8688C5.48465 12.8858 5.5962 12.935 5.68806 13.0109C5.77993 13.0868 5.84847 13.1864 5.886 13.2985C5.92353 13.4107 5.92856 13.5309 5.90052 13.6456C5.87249 13.7604 5.81249 13.8652 5.72728 13.9483V13.9483Z" fill="#FFCA6B"></path></svg>
                                            `, [
                                                {
                                                    "id": 1,
                                                    "indexes": [1,3,5,7,9],
                                                    "color": "#FFCA6B"
                                                },
                                                {
                                                    "id": 2,
                                                    "indexes": [0,2,4,6,8],
                                                    "color": "#FFB300"
                                                }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="icons-btn flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg p-3"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 62 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M36.0007 4.31326L33.9682 6.26271L34.4457 9.01225C34.4675 9.1294 34.4547 9.25024 34.409 9.36051C34.3633 9.47077 34.2864 9.56586 34.1876 9.63455C34.0795 9.7138 33.9481 9.75616 33.8133 9.7552C33.7083 9.75396 33.6048 9.73012 33.5101 9.68535L33.4843 9.67265L31.0001 8.3836L30.6775 8.5487L28.4901 9.68535C28.3933 9.73196 28.2866 9.75513 28.1788 9.75292C28.0711 9.75071 27.9654 9.72319 27.8707 9.67265L27.8126 9.63455C27.7137 9.56586 27.6369 9.47077 27.5912 9.36051C27.5454 9.25024 27.5327 9.1294 27.5545 9.01225L28.032 6.26271L25.9995 4.31326C25.9143 4.23018 25.8543 4.12536 25.8262 4.01058C25.7982 3.8958 25.8032 3.77561 25.8407 3.66349C25.8783 3.55136 25.9468 3.45176 26.0387 3.37585C26.1305 3.29994 26.2421 3.25074 26.3608 3.23376L29.1676 2.83371L30.4194 0.325467C30.4742 0.216356 30.5652 0.12897 30.6775 0.0778171C30.8317 -0.00240538 31.0112 -0.0214417 31.1792 0.0246204C31.3473 0.0706825 31.491 0.178343 31.5808 0.325467L32.8326 2.83371L35.6394 3.23376C35.7581 3.25074 35.8696 3.29994 35.9615 3.37585C36.0533 3.45176 36.1219 3.55136 36.1594 3.66349C36.1969 3.77561 36.202 3.8958 36.1739 4.01058C36.1459 4.12536 36.0859 4.23018 36.0007 4.31326V4.31326Z" fill="#FFB300"></path><path d="M35.3555 4.31357L33.3229 6.26301L33.8004 9.01255C33.8222 9.12971 33.8095 9.25054 33.7638 9.36081C33.718 9.47108 33.6412 9.56616 33.5423 9.63485L33.4843 9.67295L31.0001 8.38391L30.6775 8.54901L30.3548 8.38391L27.8707 9.67295L27.8126 9.63485C27.7137 9.56616 27.6369 9.47108 27.5912 9.36081C27.5454 9.25054 27.5327 9.12971 27.5545 9.01255L28.032 6.26301L25.9995 4.31357C25.9143 4.23048 25.8543 4.12567 25.8262 4.01089C25.7982 3.89611 25.8032 3.77591 25.8407 3.66379C25.8783 3.55167 25.9468 3.45206 26.0387 3.37616C26.1305 3.30025 26.2421 3.25104 26.3608 3.23407L29.1676 2.83402L30.4194 0.325775C30.4742 0.216664 30.5652 0.129278 30.6775 0.078125C30.7897 0.129278 30.8808 0.216664 30.9356 0.325775L32.1873 2.83402L34.9941 3.23407C35.1128 3.25104 35.2244 3.30025 35.3162 3.37616C35.4081 3.45206 35.4766 3.55167 35.5142 3.66379C35.5517 3.77591 35.5567 3.89611 35.5287 4.01089C35.5007 4.12567 35.4407 4.23048 35.3555 4.31357V4.31357Z" fill="#FFCA6B"></path><path d="M50.6469 8.75244L49.1306 10.2066L49.492 12.264C49.5061 12.3551 49.5002 12.4482 49.4747 12.5369C49.4492 12.6256 49.4047 12.708 49.3442 12.7784C49.2836 12.8487 49.2085 12.9056 49.1238 12.945C49.0391 12.9844 48.9468 13.0055 48.8532 13.0069C48.7492 13.0073 48.6469 12.981 48.5564 12.9307L48.5305 12.918L46.6787 11.9592L46.3561 12.1243L44.8011 12.9307C44.7051 12.9803 44.598 13.0052 44.4897 13.003C44.3814 13.0007 44.2754 12.9715 44.1816 12.918L44.1236 12.8799C44.0264 12.8112 43.9508 12.717 43.9052 12.6082C43.8596 12.4994 43.8458 12.3801 43.8655 12.264L44.2268 10.2066L42.7105 8.75244C42.6245 8.67028 42.5638 8.56595 42.5353 8.4514C42.5067 8.33686 42.5115 8.21672 42.5492 8.10474C42.584 7.99157 42.6511 7.89065 42.7427 7.81408C42.8342 7.7375 42.9463 7.6885 43.0654 7.67294L45.1624 7.36814L46.098 5.50125C46.1528 5.39214 46.2439 5.30475 46.3561 5.2536C46.5103 5.17338 46.6898 5.15434 46.8579 5.2004C47.0259 5.24646 47.1696 5.35412 47.2594 5.50125L48.195 7.36814L50.2921 7.67294C50.4112 7.6885 50.5232 7.7375 50.6147 7.81408C50.7063 7.89065 50.7735 7.99157 50.8082 8.10474C50.8459 8.21672 50.8507 8.33686 50.8222 8.4514C50.7936 8.56595 50.7329 8.67028 50.6469 8.75244V8.75244Z" fill="#FFB300"></path><path d="M50.0016 8.75275L48.4853 10.2069L48.8466 12.2643C48.8662 12.3804 48.8525 12.4997 48.8069 12.6085C48.7613 12.7174 48.6856 12.8115 48.5885 12.8802L48.5304 12.9183L46.6786 11.9595L46.356 12.1246L46.0333 11.9595L44.1815 12.9183L44.1234 12.8802C44.0263 12.8115 43.9507 12.7174 43.9051 12.6085C43.8595 12.4997 43.8457 12.3804 43.8653 12.2643L44.2267 10.2069L42.7104 8.75275C42.6244 8.67059 42.5637 8.56626 42.5351 8.45171C42.5066 8.33716 42.5114 8.21703 42.549 8.10505C42.5838 7.99188 42.651 7.89096 42.7426 7.81438C42.8341 7.73781 42.9461 7.68881 43.0652 7.67325L45.1623 7.36845L46.0979 5.50156C46.1527 5.39244 46.2437 5.30506 46.356 5.25391C46.4682 5.30506 46.5593 5.39244 46.6141 5.50156L47.5497 7.36845L49.6467 7.67325C49.7658 7.68881 49.8778 7.73781 49.9694 7.81438C50.0609 7.89096 50.1281 7.99188 50.1629 8.10505C50.2005 8.21703 50.2053 8.33716 50.1768 8.45171C50.1483 8.56626 50.0876 8.67059 50.0016 8.75275V8.75275Z" fill="#FFCA6B"></path><path d="M19.2897 8.75244L17.7734 10.2066L18.1347 12.264C18.1553 12.3813 18.1419 12.502 18.096 12.6122C18.0502 12.7225 17.9738 12.8178 17.8756 12.8873C17.7773 12.9568 17.6612 12.9978 17.5405 13.0055C17.4197 13.0131 17.2992 12.9872 17.1927 12.9307L17.1669 12.918L15.3215 11.9592L14.9989 12.1243L13.4503 12.9307C13.3544 12.9804 13.2472 13.0053 13.1389 13.0031C13.0306 13.0008 12.9246 12.9716 12.8308 12.918C12.8085 12.9067 12.7869 12.894 12.7663 12.8799C12.6692 12.8112 12.5936 12.717 12.548 12.6082C12.5024 12.4994 12.4886 12.3801 12.5082 12.264L12.8696 10.2066L11.3532 8.75244C11.2673 8.67028 11.2065 8.56595 11.178 8.4514C11.1495 8.33686 11.1543 8.21672 11.1919 8.10474C11.2267 7.99157 11.2939 7.89065 11.3855 7.81408C11.477 7.7375 11.589 7.6885 11.7081 7.67294L13.8052 7.36814L14.7408 5.50125C14.7956 5.39214 14.8866 5.30475 14.9989 5.2536C15.153 5.17338 15.3326 5.15434 15.5006 5.2004C15.6686 5.24646 15.8123 5.35412 15.9022 5.50125L16.8378 7.36814L18.9348 7.67294C19.0539 7.6885 19.1659 7.7375 19.2575 7.81408C19.349 7.89065 19.4162 7.99157 19.451 8.10474C19.4886 8.21672 19.4935 8.33686 19.4649 8.4514C19.4364 8.56595 19.3757 8.67028 19.2897 8.75244V8.75244Z" fill="#FFB300"></path><path d="M18.6444 8.75275L17.1281 10.2069L17.4894 12.2643C17.5091 12.3804 17.4953 12.4997 17.4497 12.6085C17.4041 12.7174 17.3284 12.8115 17.2313 12.8802C17.2107 12.8943 17.1891 12.9071 17.1668 12.9183L15.3214 11.9595L14.9988 12.1246L14.6762 11.9595L12.8308 12.9183C12.8084 12.9071 12.7869 12.8943 12.7663 12.8802C12.6691 12.8115 12.5935 12.7174 12.5479 12.6085C12.5023 12.4997 12.4885 12.3804 12.5082 12.2643L12.8695 10.2069L11.3532 8.75275C11.2672 8.67059 11.2065 8.56626 11.178 8.45171C11.1494 8.33716 11.1542 8.21703 11.1919 8.10505C11.2267 7.99188 11.2938 7.89096 11.3854 7.81438C11.4769 7.73781 11.589 7.68881 11.7081 7.67325L13.8051 7.36845L14.7407 5.50156C14.7955 5.39244 14.8866 5.30506 14.9988 5.25391C15.111 5.30506 15.2021 5.39244 15.2569 5.50156L16.1925 7.36845L18.2895 7.67325C18.4086 7.68881 18.5206 7.73781 18.6122 7.81438C18.7037 7.89096 18.7709 7.99188 18.8057 8.10505C18.8433 8.21703 18.8482 8.33716 18.8196 8.45171C18.7911 8.56626 18.7304 8.67059 18.6444 8.75275Z" fill="#FFCA6B"></path><path d="M61.8089 13.9486L60.7314 14.9837L60.983 16.4378C61.0042 16.5543 60.9918 16.6743 60.9473 16.7843C60.9029 16.8942 60.8281 16.9898 60.7314 17.0601C60.6205 17.1386 60.4873 17.1808 60.3507 17.1808C60.2456 17.1795 60.1421 17.1557 60.0474 17.1109L60.0216 17.0982L58.7182 16.4188L58.3956 16.5839L57.389 17.1109C57.2931 17.1606 57.186 17.1855 57.0776 17.1833C56.9693 17.181 56.8633 17.1518 56.7696 17.0982C56.7473 17.0869 56.7257 17.0742 56.7051 17.0601C56.6084 16.9898 56.5336 16.8942 56.4891 16.7843C56.4446 16.6743 56.4323 16.5543 56.4534 16.4378L56.7051 14.9837L55.6275 13.9486C55.5423 13.8656 55.4823 13.7607 55.4543 13.646C55.4262 13.5312 55.4313 13.411 55.4688 13.2989C55.5063 13.1867 55.5749 13.0871 55.6667 13.0112C55.7586 12.9353 55.8701 12.8861 55.9889 12.8691L57.4729 12.6532L58.1375 11.3261C58.1923 11.217 58.2834 11.1296 58.3956 11.0784C58.5497 10.9977 58.7294 10.9785 58.8976 11.0246C59.0657 11.0706 59.2094 11.1786 59.2989 11.3261L59.9635 12.6532L61.4476 12.8691C61.5663 12.8861 61.6778 12.9353 61.7697 13.0112C61.8616 13.0871 61.9301 13.1867 61.9676 13.2989C62.0052 13.411 62.0102 13.5312 61.9822 13.646C61.9541 13.7607 61.8941 13.8656 61.8089 13.9486V13.9486Z" fill="#FFB300"></path><path d="M61.1637 13.9483L60.0861 14.9834L60.3378 16.4375C60.3589 16.554 60.3466 16.674 60.3021 16.784C60.2576 16.8939 60.1828 16.9895 60.0861 17.0598C60.0668 17.0725 60.041 17.0852 60.0216 17.0979L58.7182 16.4185L58.3956 16.5836L58.073 16.4185L56.7696 17.0979C56.7473 17.0866 56.7257 17.0739 56.7051 17.0598C56.6084 16.9895 56.5336 16.8939 56.4891 16.784C56.4446 16.674 56.4323 16.554 56.4534 16.4375L56.7051 14.9834L55.6275 13.9483C55.5423 13.8652 55.4823 13.7604 55.4543 13.6456C55.4262 13.5309 55.4313 13.4107 55.4688 13.2985C55.5063 13.1864 55.5749 13.0868 55.6667 13.0109C55.7586 12.935 55.8701 12.8858 55.9889 12.8688L57.4729 12.6529L58.1375 11.3258C58.1923 11.2167 58.2834 11.1293 58.3956 11.0781C58.5078 11.1293 58.5989 11.2167 58.6537 11.3258L59.3183 12.6529L60.8023 12.8688C60.9211 12.8858 61.0326 12.935 61.1245 13.0109C61.2163 13.0868 61.2849 13.1864 61.3224 13.2985C61.3599 13.4107 61.365 13.5309 61.3369 13.6456C61.3089 13.7604 61.2489 13.8652 61.1637 13.9483V13.9483Z" fill="#FFCA6B"></path><path d="M6.37264 13.9486L5.29509 14.9837L5.54674 16.4378C5.56852 16.555 5.5558 16.6758 5.51007 16.7861C5.46433 16.8964 5.3875 16.9914 5.28864 17.0601C5.18057 17.1394 5.04917 17.1817 4.9144 17.1808C4.80934 17.1795 4.70584 17.1557 4.61114 17.1109L4.58533 17.0982L3.28194 16.4188L2.95932 16.5839L1.95275 17.1109C1.85685 17.1606 1.74971 17.1855 1.64137 17.1833C1.53302 17.181 1.42703 17.1518 1.33332 17.0982C1.31097 17.0869 1.28942 17.0742 1.26879 17.0601C1.17209 16.9898 1.09729 16.8942 1.05282 16.7843C1.00836 16.6743 0.996002 16.5543 1.01715 16.4378L1.26879 14.9837L0.191239 13.9486C0.106026 13.8656 0.0460329 13.7607 0.0179955 13.646C-0.0100419 13.5312 -0.00501337 13.411 0.0325165 13.2989C0.0700464 13.1867 0.138592 13.0871 0.230457 13.0112C0.322321 12.9353 0.433869 12.8861 0.552574 12.8691L2.03663 12.6532L2.70123 11.3261C2.75603 11.217 2.8471 11.1296 2.95932 11.0784C3.11342 10.9977 3.29314 10.9785 3.4613 11.0246C3.62945 11.0706 3.77315 11.1786 3.86266 11.3261L4.52726 12.6532L6.01131 12.8691C6.13001 12.8861 6.24156 12.9353 6.33343 13.0112C6.42529 13.0871 6.49384 13.1867 6.53137 13.2989C6.5689 13.411 6.57393 13.5312 6.54589 13.646C6.51785 13.7607 6.45786 13.8656 6.37264 13.9486V13.9486Z" fill="#FFB300"></path><path d="M5.72728 13.9483L4.64973 14.9834L4.90137 16.4375C4.92316 16.5547 4.91043 16.6755 4.8647 16.7858C4.81897 16.896 4.74214 16.9911 4.64328 17.0598L4.5852 17.0979L3.28182 16.4185L2.9592 16.5836L2.63658 16.4185L1.33319 17.0979C1.31085 17.0866 1.2893 17.0739 1.26867 17.0598C1.17197 16.9895 1.09716 16.8939 1.0527 16.784C1.00824 16.674 0.995879 16.554 1.01703 16.4375L1.26867 14.9834L0.191117 13.9483C0.105904 13.8652 0.0459109 13.7604 0.0178735 13.6456C-0.0101639 13.5309 -0.00513544 13.4107 0.0323945 13.2985C0.0699244 13.1864 0.13847 13.0868 0.230335 13.0109C0.322199 12.935 0.433747 12.8858 0.552452 12.8688L2.03651 12.6529L2.7011 11.3258C2.7559 11.2167 2.84698 11.1293 2.9592 11.0781C3.07142 11.1293 3.16249 11.2167 3.21729 11.3258L3.88189 12.6529L5.36595 12.8688C5.48465 12.8858 5.5962 12.935 5.68806 13.0109C5.77993 13.0868 5.84847 13.1864 5.886 13.2985C5.92353 13.4107 5.92856 13.5309 5.90052 13.6456C5.87249 13.7604 5.81249 13.8652 5.72728 13.9483V13.9483Z" fill="#FFCA6B"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("icons",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 47 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.50023 0L4.51074 2.26766L7 1.99979L5.52078 4L7 5.99977L4.51074 5.7319L3.50023 8L2.48972 5.7319L0 5.99977L1.47967 4L0 1.99979L2.48972 2.26766L3.50023 0Z" fill="#FFB300"></path><path d="M13.5002 0L14.5107 2.26766L17 1.99979L15.5208 4L17 5.99977L14.5107 5.7319L13.5002 8L12.4897 5.7319L10 5.99977L11.4797 4L10 1.99979L12.4897 2.26766L13.5002 0Z" fill="#FFB300"></path><path d="M23.5002 0L24.5107 2.26766L27 1.99979L25.5208 4L27 5.99977L24.5107 5.7319L23.5002 8L22.4897 5.7319L20 5.99977L21.4797 4L20 1.99979L22.4897 2.26766L23.5002 0Z" fill="#FFB300"></path><path d="M33.5002 0L34.5107 2.26766L37 1.99979L35.5208 4L37 5.99977L34.5107 5.7319L33.5002 8L32.4897 5.7319L30 5.99977L31.4797 4L30 1.99979L32.4897 2.26766L33.5002 0Z" fill="#FFB300"></path><path d="M43.5002 0L44.5107 2.26766L47 1.99979L45.5208 4L47 5.99977L44.5107 5.7319L43.5002 8L42.4897 5.7319L40 5.99977L41.4797 4L40 1.99979L42.4897 2.26766L43.5002 0Z" fill="#FFB300"></path></svg>
                                            `, [
                                                    {
                                                        "id": 1,
                                                        "indexes": [0,1,2,3,4],
                                                        "color": "#FFB300"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="icons-btn flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg p-3"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 47 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.50023 0L4.51074 2.26766L7 1.99979L5.52078 4L7 5.99977L4.51074 5.7319L3.50023 8L2.48972 5.7319L0 5.99977L1.47967 4L0 1.99979L2.48972 2.26766L3.50023 0Z" fill="#FFB300"></path><path d="M13.5002 0L14.5107 2.26766L17 1.99979L15.5208 4L17 5.99977L14.5107 5.7319L13.5002 8L12.4897 5.7319L10 5.99977L11.4797 4L10 1.99979L12.4897 2.26766L13.5002 0Z" fill="#FFB300"></path><path d="M23.5002 0L24.5107 2.26766L27 1.99979L25.5208 4L27 5.99977L24.5107 5.7319L23.5002 8L22.4897 5.7319L20 5.99977L21.4797 4L20 1.99979L22.4897 2.26766L23.5002 0Z" fill="#FFB300"></path><path d="M33.5002 0L34.5107 2.26766L37 1.99979L35.5208 4L37 5.99977L34.5107 5.7319L33.5002 8L32.4897 5.7319L30 5.99977L31.4797 4L30 1.99979L32.4897 2.26766L33.5002 0Z" fill="#FFB300"></path><path d="M43.5002 0L44.5107 2.26766L47 1.99979L45.5208 4L47 5.99977L44.5107 5.7319L43.5002 8L42.4897 5.7319L40 5.99977L41.4797 4L40 1.99979L42.4897 2.26766L43.5002 0Z" fill="#FFB300"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("icons",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.1892 37.9602C16.0149 37.9603 15.846 37.8996 15.7116 37.7887C15.5772 37.6778 15.4855 37.5235 15.4525 37.3523C13.3199 26.2354 11.8014 24.7168 0.683822 22.5818C0.512621 22.549 0.358202 22.4576 0.247139 22.3233C0.136077 22.1889 0.0753174 22.02 0.0753174 21.8457C0.0753174 21.6714 0.136077 21.5026 0.247139 21.3682C0.358202 21.2339 0.512621 21.1424 0.683822 21.1096C11.8014 18.9758 13.32 17.4585 15.4525 6.34032C15.4856 6.16921 15.5772 6.01494 15.7116 5.90402C15.8461 5.79309 16.0149 5.73242 16.1892 5.73242C16.3635 5.73242 16.5323 5.79309 16.6668 5.90402C16.8012 6.01494 16.8928 6.16921 16.9259 6.34032C19.0591 17.4585 20.5776 18.9758 31.6952 21.1096C31.8664 21.1424 32.0208 21.2338 32.1319 21.3682C32.2429 21.5025 32.3037 21.6714 32.3037 21.8457C32.3037 22.02 32.2429 22.1889 32.1319 22.3232C32.0208 22.4576 31.8664 22.549 31.6952 22.5818C20.5777 24.7168 19.0591 26.2353 16.9259 37.3523C16.8928 37.5234 16.8012 37.6777 16.6668 37.7886C16.5324 37.8996 16.3635 37.9602 16.1892 37.9602ZM4.46193 21.8457C12.0962 23.6536 14.3832 25.9399 16.1892 33.5742C17.9959 25.9399 20.2829 23.6536 27.9171 21.8457C20.2829 20.0391 17.9959 17.7527 16.1892 10.1184C14.3832 17.7527 12.0962 20.0391 4.46193 21.8457Z" fill="#FFB300"></path><path d="M36.7031 5.74658C32.7859 4.99463 32.3574 4.56615 31.6055 0.648915C31.5724 0.477799 31.4808 0.323537 31.3463 0.212612C31.2119 0.101686 31.0431 0.0410156 30.8688 0.0410156C30.6945 0.0410156 30.5256 0.101686 30.3912 0.212612C30.2568 0.323537 30.1652 0.477799 30.1321 0.648915C29.3808 4.56615 28.9523 4.99463 25.035 5.74658C24.8638 5.77935 24.7094 5.87078 24.5983 6.00513C24.4873 6.13948 24.4265 6.30834 24.4265 6.48266C24.4265 6.65697 24.4873 6.82583 24.5983 6.96018C24.7094 7.09453 24.8638 7.18596 25.035 7.21874C28.9517 7.9707 29.3808 8.39916 30.1321 12.3164C30.1652 12.4875 30.2568 12.6418 30.3912 12.7527C30.5256 12.8636 30.6945 12.9243 30.8688 12.9243C31.0431 12.9243 31.2119 12.8636 31.3463 12.7527C31.4808 12.6418 31.5724 12.4875 31.6055 12.3164C32.3574 8.39916 32.7865 7.9707 36.7031 7.21874C36.8743 7.18596 37.0288 7.09453 37.1398 6.96018C37.2509 6.82583 37.3117 6.65697 37.3117 6.48266C37.3117 6.30834 37.2509 6.13948 37.1398 6.00513C37.0288 5.87078 36.8743 5.77935 36.7031 5.74658Z" fill="#FFB300"></path></svg>
                                            `, [
                                                    {
                                                        "id": 1,
                                                        "indexes": [0,1],
                                                        "color": "#FFB300"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="icons-btn flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg p-3"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.1892 37.9602C16.0149 37.9603 15.846 37.8996 15.7116 37.7887C15.5772 37.6778 15.4855 37.5235 15.4525 37.3523C13.3199 26.2354 11.8014 24.7168 0.683822 22.5818C0.512621 22.549 0.358202 22.4576 0.247139 22.3233C0.136077 22.1889 0.0753174 22.02 0.0753174 21.8457C0.0753174 21.6714 0.136077 21.5026 0.247139 21.3682C0.358202 21.2339 0.512621 21.1424 0.683822 21.1096C11.8014 18.9758 13.32 17.4585 15.4525 6.34032C15.4856 6.16921 15.5772 6.01494 15.7116 5.90402C15.8461 5.79309 16.0149 5.73242 16.1892 5.73242C16.3635 5.73242 16.5323 5.79309 16.6668 5.90402C16.8012 6.01494 16.8928 6.16921 16.9259 6.34032C19.0591 17.4585 20.5776 18.9758 31.6952 21.1096C31.8664 21.1424 32.0208 21.2338 32.1319 21.3682C32.2429 21.5025 32.3037 21.6714 32.3037 21.8457C32.3037 22.02 32.2429 22.1889 32.1319 22.3232C32.0208 22.4576 31.8664 22.549 31.6952 22.5818C20.5777 24.7168 19.0591 26.2353 16.9259 37.3523C16.8928 37.5234 16.8012 37.6777 16.6668 37.7886C16.5324 37.8996 16.3635 37.9602 16.1892 37.9602ZM4.46193 21.8457C12.0962 23.6536 14.3832 25.9399 16.1892 33.5742C17.9959 25.9399 20.2829 23.6536 27.9171 21.8457C20.2829 20.0391 17.9959 17.7527 16.1892 10.1184C14.3832 17.7527 12.0962 20.0391 4.46193 21.8457Z" fill="#FFB300"></path><path d="M36.7031 5.74658C32.7859 4.99463 32.3574 4.56615 31.6055 0.648915C31.5724 0.477799 31.4808 0.323537 31.3463 0.212612C31.2119 0.101686 31.0431 0.0410156 30.8688 0.0410156C30.6945 0.0410156 30.5256 0.101686 30.3912 0.212612C30.2568 0.323537 30.1652 0.477799 30.1321 0.648915C29.3808 4.56615 28.9523 4.99463 25.035 5.74658C24.8638 5.77935 24.7094 5.87078 24.5983 6.00513C24.4873 6.13948 24.4265 6.30834 24.4265 6.48266C24.4265 6.65697 24.4873 6.82583 24.5983 6.96018C24.7094 7.09453 24.8638 7.18596 25.035 7.21874C28.9517 7.9707 29.3808 8.39916 30.1321 12.3164C30.1652 12.4875 30.2568 12.6418 30.3912 12.7527C30.5256 12.8636 30.6945 12.9243 30.8688 12.9243C31.0431 12.9243 31.2119 12.8636 31.3463 12.7527C31.4808 12.6418 31.5724 12.4875 31.6055 12.3164C32.3574 8.39916 32.7865 7.9707 36.7031 7.21874C36.8743 7.18596 37.0288 7.09453 37.1398 6.96018C37.2509 6.82583 37.3117 6.65697 37.3117 6.48266C37.3117 6.30834 37.2509 6.13948 37.1398 6.00513C37.0288 5.87078 36.8743 5.77935 36.7031 5.74658Z" fill="#FFB300"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("icons",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M31.9923 21.0594C31.9422 20.9043 31.8474 20.7675 31.7198 20.6661C31.5923 20.5647 31.4376 20.5032 31.2752 20.4895L20.8511 19.5941L16.7801 9.99108C16.7066 9.85226 16.5967 9.7361 16.4622 9.65508C16.3276 9.57406 16.1735 9.53125 16.0164 9.53125C15.8594 9.53125 15.7053 9.57406 15.5707 9.65508C15.4362 9.7361 15.3262 9.85226 15.2528 9.99108L11.1818 19.5941L0.759059 20.4895C0.596558 20.5033 0.441733 20.5647 0.313954 20.666C0.186175 20.7673 0.0911153 20.9041 0.0406683 21.0592C-0.00977881 21.2143 -0.0133735 21.3808 0.030334 21.5379C0.0740415 21.695 0.16311 21.8358 0.286398 21.9426L8.19261 28.7947L5.82325 38.9825C5.7866 39.1414 5.79751 39.3075 5.85464 39.4601C5.91176 39.6128 6.01256 39.7453 6.14447 39.841C6.27638 39.9368 6.43356 39.9916 6.59641 39.9986C6.75927 40.0057 6.92059 39.9646 7.06026 39.8806L16.0164 34.4788L24.974 39.8806C25.1135 39.9648 25.2749 40.006 25.4377 39.999C25.6006 39.992 25.7578 39.9372 25.8896 39.8414C26.0215 39.7455 26.1222 39.613 26.1791 39.4602C26.236 39.3074 26.2466 39.1413 26.2096 38.9825L23.8396 28.7947L31.7465 21.9426C31.8701 21.8361 31.9594 21.6954 32.0031 21.5382C32.0469 21.381 32.0431 21.2144 31.9923 21.0594Z" fill="#FFB300"></path><path d="M36.2624 15.3147C36.1115 15.3149 35.9634 15.2738 35.8343 15.1959L31.8059 12.7664L27.7775 15.1959C27.6379 15.2801 27.4766 15.3213 27.3137 15.3143C27.1509 15.3073 26.9937 15.2525 26.8618 15.1566C26.7299 15.0608 26.6292 14.9282 26.5723 14.7755C26.5154 14.6227 26.5048 14.4566 26.5418 14.2978L27.6073 9.71708L24.0516 6.634C23.9283 6.52725 23.8392 6.3865 23.7955 6.22938C23.7518 6.07226 23.7554 5.90574 23.8059 5.75066C23.8563 5.59557 23.9514 5.4588 24.0792 5.35746C24.2069 5.25613 24.3618 5.19472 24.5243 5.18092L29.2117 4.77851L31.0415 0.459837C31.1152 0.320997 31.2252 0.204833 31.3599 0.123819C31.4945 0.0428051 31.6487 0 31.8059 0C31.963 0 32.1172 0.0428051 32.2519 0.123819C32.3866 0.204833 32.4966 0.320997 32.5702 0.459837L34.4001 4.7785L39.0875 5.18091C39.25 5.1947 39.4048 5.25611 39.5326 5.35745C39.6604 5.45879 39.7555 5.59556 39.8059 5.75065C39.8563 5.90574 39.8599 6.07226 39.8162 6.22939C39.7725 6.38651 39.6834 6.52725 39.5602 6.634L36.0044 9.71708L37.0699 14.2978C37.0983 14.4194 37.0989 14.5459 37.0715 14.6677C37.0442 14.7896 36.9896 14.9037 36.912 15.0015C36.8343 15.0993 36.7355 15.1783 36.623 15.2325C36.5105 15.2867 36.3872 15.3148 36.2623 15.3147H36.2624ZM31.8059 10.969C31.9568 10.9686 32.1049 11.0097 32.234 11.0878L35.0091 12.7611L34.2758 9.60505C34.2412 9.45809 34.2476 9.30445 34.2943 9.16086C34.3409 9.01727 34.4261 8.88924 34.5405 8.79073L36.9902 6.66647L33.7613 6.38962C33.6108 6.37684 33.4667 6.32331 33.3444 6.23481C33.2221 6.1463 33.1262 6.02615 33.0671 5.88726L31.8058 2.90952L30.5446 5.88726C30.4854 6.02615 30.3895 6.1463 30.2672 6.23481C30.1449 6.32331 30.0008 6.37684 29.8504 6.38962L26.6214 6.66647L29.0711 8.79073C29.1855 8.88924 29.2707 9.01727 29.3174 9.16086C29.364 9.30445 29.3704 9.45809 29.3358 9.60505L28.6025 12.7611L31.3777 11.0878C31.5068 11.0097 31.6549 10.9685 31.8059 10.969Z" fill="#FFB300"></path></svg>
                                            `, [
                                                    {
                                                        "id": 1,
                                                        "indexes": [0,1],
                                                        "color": "#FFB300"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="icons-btn flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg p-3"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M31.9923 21.0594C31.9422 20.9043 31.8474 20.7675 31.7198 20.6661C31.5923 20.5647 31.4376 20.5032 31.2752 20.4895L20.8511 19.5941L16.7801 9.99108C16.7066 9.85226 16.5967 9.7361 16.4622 9.65508C16.3276 9.57406 16.1735 9.53125 16.0164 9.53125C15.8594 9.53125 15.7053 9.57406 15.5707 9.65508C15.4362 9.7361 15.3262 9.85226 15.2528 9.99108L11.1818 19.5941L0.759059 20.4895C0.596558 20.5033 0.441733 20.5647 0.313954 20.666C0.186175 20.7673 0.0911153 20.9041 0.0406683 21.0592C-0.00977881 21.2143 -0.0133735 21.3808 0.030334 21.5379C0.0740415 21.695 0.16311 21.8358 0.286398 21.9426L8.19261 28.7947L5.82325 38.9825C5.7866 39.1414 5.79751 39.3075 5.85464 39.4601C5.91176 39.6128 6.01256 39.7453 6.14447 39.841C6.27638 39.9368 6.43356 39.9916 6.59641 39.9986C6.75927 40.0057 6.92059 39.9646 7.06026 39.8806L16.0164 34.4788L24.974 39.8806C25.1135 39.9648 25.2749 40.006 25.4377 39.999C25.6006 39.992 25.7578 39.9372 25.8896 39.8414C26.0215 39.7455 26.1222 39.613 26.1791 39.4602C26.236 39.3074 26.2466 39.1413 26.2096 38.9825L23.8396 28.7947L31.7465 21.9426C31.8701 21.8361 31.9594 21.6954 32.0031 21.5382C32.0469 21.381 32.0431 21.2144 31.9923 21.0594Z" fill="#FFB300"></path><path d="M36.2624 15.3147C36.1115 15.3149 35.9634 15.2738 35.8343 15.1959L31.8059 12.7664L27.7775 15.1959C27.6379 15.2801 27.4766 15.3213 27.3137 15.3143C27.1509 15.3073 26.9937 15.2525 26.8618 15.1566C26.7299 15.0608 26.6292 14.9282 26.5723 14.7755C26.5154 14.6227 26.5048 14.4566 26.5418 14.2978L27.6073 9.71708L24.0516 6.634C23.9283 6.52725 23.8392 6.3865 23.7955 6.22938C23.7518 6.07226 23.7554 5.90574 23.8059 5.75066C23.8563 5.59557 23.9514 5.4588 24.0792 5.35746C24.2069 5.25613 24.3618 5.19472 24.5243 5.18092L29.2117 4.77851L31.0415 0.459837C31.1152 0.320997 31.2252 0.204833 31.3599 0.123819C31.4945 0.0428051 31.6487 0 31.8059 0C31.963 0 32.1172 0.0428051 32.2519 0.123819C32.3866 0.204833 32.4966 0.320997 32.5702 0.459837L34.4001 4.7785L39.0875 5.18091C39.25 5.1947 39.4048 5.25611 39.5326 5.35745C39.6604 5.45879 39.7555 5.59556 39.8059 5.75065C39.8563 5.90574 39.8599 6.07226 39.8162 6.22939C39.7725 6.38651 39.6834 6.52725 39.5602 6.634L36.0044 9.71708L37.0699 14.2978C37.0983 14.4194 37.0989 14.5459 37.0715 14.6677C37.0442 14.7896 36.9896 14.9037 36.912 15.0015C36.8343 15.0993 36.7355 15.1783 36.623 15.2325C36.5105 15.2867 36.3872 15.3148 36.2623 15.3147H36.2624ZM31.8059 10.969C31.9568 10.9686 32.1049 11.0097 32.234 11.0878L35.0091 12.7611L34.2758 9.60505C34.2412 9.45809 34.2476 9.30445 34.2943 9.16086C34.3409 9.01727 34.4261 8.88924 34.5405 8.79073L36.9902 6.66647L33.7613 6.38962C33.6108 6.37684 33.4667 6.32331 33.3444 6.23481C33.2221 6.1463 33.1262 6.02615 33.0671 5.88726L31.8058 2.90952L30.5446 5.88726C30.4854 6.02615 30.3895 6.1463 30.2672 6.23481C30.1449 6.32331 30.0008 6.37684 29.8504 6.38962L26.6214 6.66647L29.0711 8.79073C29.1855 8.88924 29.2707 9.01727 29.3174 9.16086C29.364 9.30445 29.3704 9.45809 29.3358 9.60505L28.6025 12.7611L31.3777 11.0878C31.5068 11.0097 31.6549 10.9685 31.8059 10.969Z" fill="#FFB300"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("icons",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.779 0L22.9117 11.3383L35.5556 9.99894L28.0421 20L35.5556 29.9988L22.9117 28.6595L17.779 40L12.6462 28.6595L0 29.9988L7.5158 20L0 9.99894L12.6462 11.3383L17.779 0Z" fill="#FFB300"></path></svg>
                                            `, [
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#FFB300"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="icons-btn flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.779 0L22.9117 11.3383L35.5556 9.99894L28.0421 20L35.5556 29.9988L22.9117 28.6595L17.779 40L12.6462 28.6595L0 29.9988L7.5158 20L0 9.99894L12.6462 11.3383L17.779 0Z" fill="#FFB300"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("icons",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.9493 8.64062L16.2345 2.64343C16.0571 2.2517 15.5008 2.2517 15.3235 2.64343L12.6086 8.64065C11.9861 10.0156 10.5524 10.8367 9.05144 10.6778L2.4129 9.97469C1.97836 9.92867 1.69802 10.423 1.96053 10.7723L5.81188 15.8972C6.74799 17.1428 6.7479 18.8573 5.81166 20.1029L1.96123 25.2254C1.69867 25.5747 1.97902 26.069 2.41357 26.023L9.05133 25.32C10.5523 25.161 11.9862 25.9822 12.6086 27.3574L15.3234 33.3557C15.5008 33.7475 16.0572 33.7475 16.2345 33.3557L18.9493 27.3574C19.5717 25.9822 21.0056 25.161 22.5066 25.32L29.1428 26.023C29.5773 26.069 29.8577 25.5747 29.5952 25.2254L25.7456 20.1024C24.8098 18.8571 24.8097 17.1431 25.7454 15.8976L29.5959 10.7722C29.8584 10.4229 29.578 9.92867 29.1435 9.97469L22.5065 10.6777C21.0056 10.8367 19.5718 10.0156 18.9493 8.64062Z" fill="#FFFFFF" stroke="#FFB300" stroke-width="3"></path></svg>
                                            `, [
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#FFFFFF"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="icons-btn flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.9493 8.64062L16.2345 2.64343C16.0571 2.2517 15.5008 2.2517 15.3235 2.64343L12.6086 8.64065C11.9861 10.0156 10.5524 10.8367 9.05144 10.6778L2.4129 9.97469C1.97836 9.92867 1.69802 10.423 1.96053 10.7723L5.81188 15.8972C6.74799 17.1428 6.7479 18.8573 5.81166 20.1029L1.96123 25.2254C1.69867 25.5747 1.97902 26.069 2.41357 26.023L9.05133 25.32C10.5523 25.161 11.9862 25.9822 12.6086 27.3574L15.3234 33.3557C15.5008 33.7475 16.0572 33.7475 16.2345 33.3557L18.9493 27.3574C19.5717 25.9822 21.0056 25.161 22.5066 25.32L29.1428 26.023C29.5773 26.069 29.8577 25.5747 29.5952 25.2254L25.7456 20.1024C24.8098 18.8571 24.8097 17.1431 25.7454 15.8976L29.5959 10.7722C29.8584 10.4229 29.578 9.92867 29.1435 9.97469L22.5065 10.6777C21.0056 10.8367 19.5718 10.0156 18.9493 8.64062Z" fill="#FFFFFF" stroke="#FFB300" stroke-width="3"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("icons",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M35.8298 19.9938L39.4224 16.4778C40.4933 15.4639 39.9939 13.6622 38.5893 13.3263L33.6947 12.0771L35.0745 7.23214C35.4644 5.83854 34.1504 4.52409 32.7572 4.91409L27.914 6.29432L26.6652 1.39816C26.3347 0.0154254 24.5129 -0.490277 23.5148 0.564722L20 4.18519L16.4852 0.5648C15.4985 -0.478246 13.669 -0.000355988 13.3348 1.39824L12.0861 6.2944L7.24272 4.91417C5.84921 4.52401 4.53562 5.83893 4.92546 7.23221L6.30523 12.0771L1.4107 13.3263C0.00538796 13.6624 -0.492971 15.4644 0.577497 16.4778L4.17007 19.9938L0.577497 23.5097C-0.493439 24.5235 0.00593498 26.3252 1.41062 26.6612L6.30515 27.9104L4.92538 32.7553C4.53546 34.1489 5.84952 35.4634 7.24265 35.0734L12.0859 33.6931L13.3347 38.5893C13.6815 40.0405 15.4984 40.4657 16.4851 39.4227L20 35.8289L23.5147 39.4227C24.4913 40.4765 26.3262 40.0076 26.6651 38.5893L27.9139 33.6931L32.7571 35.0734C34.1506 35.4635 35.4643 34.1486 35.0744 32.7553L33.6946 27.9104L38.5892 26.6612C39.9944 26.3251 40.4928 24.5231 39.4223 23.5097L35.8298 19.9938Z" fill="#FFB300"></path></svg>
                                            `, [
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#FFB300"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="icons-btn flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M35.8298 19.9938L39.4224 16.4778C40.4933 15.4639 39.9939 13.6622 38.5893 13.3263L33.6947 12.0771L35.0745 7.23214C35.4644 5.83854 34.1504 4.52409 32.7572 4.91409L27.914 6.29432L26.6652 1.39816C26.3347 0.0154254 24.5129 -0.490277 23.5148 0.564722L20 4.18519L16.4852 0.5648C15.4985 -0.478246 13.669 -0.000355988 13.3348 1.39824L12.0861 6.2944L7.24272 4.91417C5.84921 4.52401 4.53562 5.83893 4.92546 7.23221L6.30523 12.0771L1.4107 13.3263C0.00538796 13.6624 -0.492971 15.4644 0.577497 16.4778L4.17007 19.9938L0.577497 23.5097C-0.493439 24.5235 0.00593498 26.3252 1.41062 26.6612L6.30515 27.9104L4.92538 32.7553C4.53546 34.1489 5.84952 35.4634 7.24265 35.0734L12.0859 33.6931L13.3347 38.5893C13.6815 40.0405 15.4984 40.4657 16.4851 39.4227L20 35.8289L23.5147 39.4227C24.4913 40.4765 26.3262 40.0076 26.6651 38.5893L27.9139 33.6931L32.7571 35.0734C34.1506 35.4635 35.4643 34.1486 35.0744 32.7553L33.6946 27.9104L38.5892 26.6612C39.9944 26.3251 40.4928 24.5231 39.4223 23.5097L35.8298 19.9938Z" fill="#FFB300"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("icons",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M33 28H7C6.45 28 6 28.45 6 29V31C6 31.55 6.45 32 7 32H33C33.55 32 34 31.55 34 31V29C34 28.45 33.55 28 33 28ZM37 8C35.3438 8 34 9.34375 34 11C34 11.4438 34.1 11.8562 34.275 12.2375L29.75 14.95C28.7875 15.525 27.5437 15.2 26.9875 14.225L21.8937 5.3125C22.5625 4.7625 23 3.9375 23 3C23 1.34375 21.6562 0 20 0C18.3438 0 17 1.34375 17 3C17 3.9375 17.4375 4.7625 18.1063 5.3125L13.0125 14.225C12.4563 15.2 11.2063 15.525 10.25 14.95L5.73125 12.2375C5.9 11.8625 6.00625 11.4438 6.00625 11C6.00625 9.34375 4.6625 8 3.00625 8C1.35 8 0 9.34375 0 11C0 12.6562 1.34375 14 3 14C3.1625 14 3.325 13.975 3.48125 13.95L8 26H32L36.5187 13.95C36.675 13.975 36.8375 14 37 14C38.6562 14 40 12.6562 40 11C40 9.34375 38.6562 8 37 8Z" fill="#FFB300"></path></svg>
                                            `, [
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#FFB300"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="icons-btn flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M33 28H7C6.45 28 6 28.45 6 29V31C6 31.55 6.45 32 7 32H33C33.55 32 34 31.55 34 31V29C34 28.45 33.55 28 33 28ZM37 8C35.3438 8 34 9.34375 34 11C34 11.4438 34.1 11.8562 34.275 12.2375L29.75 14.95C28.7875 15.525 27.5437 15.2 26.9875 14.225L21.8937 5.3125C22.5625 4.7625 23 3.9375 23 3C23 1.34375 21.6562 0 20 0C18.3438 0 17 1.34375 17 3C17 3.9375 17.4375 4.7625 18.1063 5.3125L13.0125 14.225C12.4563 15.2 11.2063 15.525 10.25 14.95L5.73125 12.2375C5.9 11.8625 6.00625 11.4438 6.00625 11C6.00625 9.34375 4.6625 8 3.00625 8C1.35 8 0 9.34375 0 11C0 12.6562 1.34375 14 3 14C3.1625 14 3.325 13.975 3.48125 13.95L8 26H32L36.5187 13.95C36.675 13.975 36.8375 14 37 14C38.6562 14 40 12.6562 40 11C40 9.34375 38.6562 8 37 8Z" fill="#FFB300"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("icons",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5875 28.3305C6.90861 27.6516 7.26251 27.843 5.62504 27.4048C4.88209 27.2056 4.22898 26.8228 3.63836 26.3642L0.0939025 35.0546C-0.249059 35.896 0.391553 36.8101 1.29935 36.7757L5.41567 36.6186L8.24687 39.6092C8.87185 40.2686 9.96871 40.0631 10.3117 39.2217L14.378 29.2516C13.5311 29.7235 12.5913 30 11.6195 30C10.096 30 8.66483 29.4071 7.5875 28.3305ZM29.9058 35.0546L26.3613 26.3642C25.7707 26.8235 25.1176 27.2056 24.3747 27.4048C22.7286 27.8454 23.0895 27.6532 22.4122 28.3305C21.3349 29.4071 19.9029 30 18.3795 30C17.4076 30 16.4678 29.7227 15.6209 29.2516L19.6873 39.2217C20.0302 40.0631 21.1279 40.2686 21.7521 39.6092L24.584 36.6186L28.7004 36.7757C29.6082 36.8101 30.2488 35.8952 29.9058 35.0546ZM20.5466 26.5626C21.7403 25.3478 21.8771 25.4525 23.577 24.9892C24.6622 24.6931 25.5106 23.8298 25.8012 22.7252C26.3856 20.5065 26.234 20.7744 27.8285 19.151C28.623 18.3425 28.9332 17.1636 28.6426 16.0589C28.059 13.8418 28.0582 14.1511 28.6426 11.9316C28.9332 10.827 28.623 9.64809 27.8285 8.83952C26.234 7.21611 26.3856 7.48329 25.8012 5.26537C25.5106 4.1607 24.6622 3.29744 23.577 3.00135C21.3989 2.40683 21.6614 2.5623 20.0654 0.938111C19.2709 0.129534 18.1123 -0.186866 17.0272 0.109222C14.8499 0.70296 15.1538 0.703741 12.9726 0.109222C11.8874 -0.186866 10.7288 0.128752 9.93433 0.938111C8.33983 2.56152 8.60233 2.40683 6.42346 3.00135C5.33833 3.29744 4.48991 4.1607 4.19929 5.26537C3.61571 7.48329 3.76649 7.21611 2.17199 8.83952C1.37747 9.64809 1.06654 10.827 1.35794 11.9316C1.94152 14.1472 1.9423 13.8379 1.35794 16.0581C1.06732 17.1628 1.37747 18.3417 2.17199 19.151C3.76649 20.7744 3.61493 20.5065 4.19929 22.7252C4.48991 23.8298 5.33833 24.6931 6.42346 24.9892C8.17187 25.4657 8.30233 25.3907 9.45309 26.5626C10.4867 27.6149 12.0968 27.8032 13.339 27.0173C13.8357 26.7019 14.4119 26.5345 15.0002 26.5345C15.5886 26.5345 16.1648 26.7019 16.6615 27.0173C17.9029 27.8032 19.513 27.6149 20.5466 26.5626ZM7.62969 13.7472C7.62969 9.60435 10.9296 6.24582 14.9999 6.24582C19.0701 6.24582 22.37 9.60435 22.37 13.7472C22.37 17.8901 19.0701 21.2486 14.9999 21.2486C10.9296 21.2486 7.62969 17.8901 7.62969 13.7472Z" fill="#FFB300"></path></svg>
                                            `, [
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#FFB300"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="icons-btn flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5875 28.3305C6.90861 27.6516 7.26251 27.843 5.62504 27.4048C4.88209 27.2056 4.22898 26.8228 3.63836 26.3642L0.0939025 35.0546C-0.249059 35.896 0.391553 36.8101 1.29935 36.7757L5.41567 36.6186L8.24687 39.6092C8.87185 40.2686 9.96871 40.0631 10.3117 39.2217L14.378 29.2516C13.5311 29.7235 12.5913 30 11.6195 30C10.096 30 8.66483 29.4071 7.5875 28.3305ZM29.9058 35.0546L26.3613 26.3642C25.7707 26.8235 25.1176 27.2056 24.3747 27.4048C22.7286 27.8454 23.0895 27.6532 22.4122 28.3305C21.3349 29.4071 19.9029 30 18.3795 30C17.4076 30 16.4678 29.7227 15.6209 29.2516L19.6873 39.2217C20.0302 40.0631 21.1279 40.2686 21.7521 39.6092L24.584 36.6186L28.7004 36.7757C29.6082 36.8101 30.2488 35.8952 29.9058 35.0546ZM20.5466 26.5626C21.7403 25.3478 21.8771 25.4525 23.577 24.9892C24.6622 24.6931 25.5106 23.8298 25.8012 22.7252C26.3856 20.5065 26.234 20.7744 27.8285 19.151C28.623 18.3425 28.9332 17.1636 28.6426 16.0589C28.059 13.8418 28.0582 14.1511 28.6426 11.9316C28.9332 10.827 28.623 9.64809 27.8285 8.83952C26.234 7.21611 26.3856 7.48329 25.8012 5.26537C25.5106 4.1607 24.6622 3.29744 23.577 3.00135C21.3989 2.40683 21.6614 2.5623 20.0654 0.938111C19.2709 0.129534 18.1123 -0.186866 17.0272 0.109222C14.8499 0.70296 15.1538 0.703741 12.9726 0.109222C11.8874 -0.186866 10.7288 0.128752 9.93433 0.938111C8.33983 2.56152 8.60233 2.40683 6.42346 3.00135C5.33833 3.29744 4.48991 4.1607 4.19929 5.26537C3.61571 7.48329 3.76649 7.21611 2.17199 8.83952C1.37747 9.64809 1.06654 10.827 1.35794 11.9316C1.94152 14.1472 1.9423 13.8379 1.35794 16.0581C1.06732 17.1628 1.37747 18.3417 2.17199 19.151C3.76649 20.7744 3.61493 20.5065 4.19929 22.7252C4.48991 23.8298 5.33833 24.6931 6.42346 24.9892C8.17187 25.4657 8.30233 25.3907 9.45309 26.5626C10.4867 27.6149 12.0968 27.8032 13.339 27.0173C13.8357 26.7019 14.4119 26.5345 15.0002 26.5345C15.5886 26.5345 16.1648 26.7019 16.6615 27.0173C17.9029 27.8032 19.513 27.6149 20.5466 26.5626ZM7.62969 13.7472C7.62969 9.60435 10.9296 6.24582 14.9999 6.24582C19.0701 6.24582 22.37 9.60435 22.37 13.7472C22.37 17.8901 19.0701 21.2486 14.9999 21.2486C10.9296 21.2486 7.62969 17.8901 7.62969 13.7472Z" fill="#FFB300"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("icons",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.473538 34.708C-0.279952 35.5588 -0.113615 36.8699 0.825783 37.5063L6.20808 39.6879C6.98114 40.2163 8.03819 40.0088 8.66441 39.3944L15.8471 31.418L9.64365 24.532L0.473538 34.708ZM34.5826 34.708C34.5826 34.708 11.7258 9.30718 11.4597 8.94711C12.6636 8.28176 14.6103 7.60858 17.5269 7.60858C20.4435 7.60858 22.3902 8.35221 23.5941 8.94711C23.3397 9.37763 19.2098 13.996 19.2098 13.996L25.4039 20.8647L28.0754 17.9607C30.3259 15.466 30.6883 11.8066 28.9756 8.91971L25.5573 3.02313C25.2246 2.45563 24.7842 1.98597 24.2462 1.6846C21.0564 -0.477397 14.2659 -0.644126 10.8217 1.6846C10.2777 1.98597 9.83934 2.45563 9.50275 3.02313L6.09067 8.75925C5.97325 8.95494 3.18426 13.6202 6.99085 17.8393L26.4113 39.3811C27.0376 40.0758 28.0848 40.203 28.8574 39.6746L34.2491 37.493C35.1853 36.8684 35.3497 35.5533 34.5826 34.708Z" fill="#FFB300"></path></svg>
                                            `, [
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#FFB300"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="icons-btn flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.473538 34.708C-0.279952 35.5588 -0.113615 36.8699 0.825783 37.5063L6.20808 39.6879C6.98114 40.2163 8.03819 40.0088 8.66441 39.3944L15.8471 31.418L9.64365 24.532L0.473538 34.708ZM34.5826 34.708C34.5826 34.708 11.7258 9.30718 11.4597 8.94711C12.6636 8.28176 14.6103 7.60858 17.5269 7.60858C20.4435 7.60858 22.3902 8.35221 23.5941 8.94711C23.3397 9.37763 19.2098 13.996 19.2098 13.996L25.4039 20.8647L28.0754 17.9607C30.3259 15.466 30.6883 11.8066 28.9756 8.91971L25.5573 3.02313C25.2246 2.45563 24.7842 1.98597 24.2462 1.6846C21.0564 -0.477397 14.2659 -0.644126 10.8217 1.6846C10.2777 1.98597 9.83934 2.45563 9.50275 3.02313L6.09067 8.75925C5.97325 8.95494 3.18426 13.6202 6.99085 17.8393L26.4113 39.3811C27.0376 40.0758 28.0848 40.203 28.8574 39.6746L34.2491 37.493C35.1853 36.8684 35.3497 35.5533 34.5826 34.708Z" fill="#FFB300"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("icons",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 38 37" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.3738 17.9597C13.73 19.4965 12.0379 20.7007 10.6945 19.8585L8.89096 18.7355L5.11321 24.7517C4.12387 26.3268 5.26194 28.3704 7.12826 28.3704H9.50475C10.814 28.3704 11.8783 29.4284 11.8783 30.7316C11.8783 32.0349 10.814 33.0995 9.50475 33.0995H7.13568C1.54252 33.0995 -1.8671 26.9792 1.08905 22.2537L4.8616 16.2383L3.05363 15.1079C1.70952 14.2656 2.05241 12.2265 3.59765 11.8719L10.3835 10.3093C11.021 10.1726 11.6668 10.5568 11.8152 11.1995L13.3738 17.9597ZM21.0109 5.83279L24.0725 10.7193L22.2727 11.8335C20.9248 12.6691 21.2655 14.7104 22.8128 15.0672L29.5965 16.6298C30.2364 16.7772 30.8753 16.3796 31.0222 15.7425L32.5838 8.98753C32.9392 7.45006 31.2515 6.25022 29.9067 7.08434L28.0987 8.20734L25.041 3.33411C22.2519 -1.10913 15.7488 -1.11209 12.9582 3.32955L12.4089 4.20296C11.7187 5.3001 12.0601 6.76517 13.1586 7.45375C14.2659 8.14521 15.7392 7.81473 16.4324 6.71198L16.9847 5.83353C17.9308 4.32708 20.1055 4.38249 21.0109 5.83279ZM36.9087 22.2596L35.6477 20.2456C34.9548 19.1389 33.4909 18.8005 32.3791 19.4913C31.2703 20.1797 30.9303 21.6449 31.6235 22.748L32.8845 24.7539C33.8753 26.329 32.7373 28.3741 30.8702 28.3741H23.7459L23.7477 26.2507C23.7477 24.6711 21.8291 23.8799 20.7069 24.9969L15.778 29.9049C15.3162 30.3647 15.3162 31.1173 15.7783 31.5768L20.708 36.4781C21.8302 37.5938 23.7472 36.8022 23.7472 35.2236L23.7455 33.1047H30.8601C36.4559 33.1055 39.87 26.9807 36.9087 22.2596Z" fill="#FFB300"></path></svg>
                                            `, [
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#FFB300"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="icons-btn flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 38 37" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.3738 17.9597C13.73 19.4965 12.0379 20.7007 10.6945 19.8585L8.89096 18.7355L5.11321 24.7517C4.12387 26.3268 5.26194 28.3704 7.12826 28.3704H9.50475C10.814 28.3704 11.8783 29.4284 11.8783 30.7316C11.8783 32.0349 10.814 33.0995 9.50475 33.0995H7.13568C1.54252 33.0995 -1.8671 26.9792 1.08905 22.2537L4.8616 16.2383L3.05363 15.1079C1.70952 14.2656 2.05241 12.2265 3.59765 11.8719L10.3835 10.3093C11.021 10.1726 11.6668 10.5568 11.8152 11.1995L13.3738 17.9597ZM21.0109 5.83279L24.0725 10.7193L22.2727 11.8335C20.9248 12.6691 21.2655 14.7104 22.8128 15.0672L29.5965 16.6298C30.2364 16.7772 30.8753 16.3796 31.0222 15.7425L32.5838 8.98753C32.9392 7.45006 31.2515 6.25022 29.9067 7.08434L28.0987 8.20734L25.041 3.33411C22.2519 -1.10913 15.7488 -1.11209 12.9582 3.32955L12.4089 4.20296C11.7187 5.3001 12.0601 6.76517 13.1586 7.45375C14.2659 8.14521 15.7392 7.81473 16.4324 6.71198L16.9847 5.83353C17.9308 4.32708 20.1055 4.38249 21.0109 5.83279ZM36.9087 22.2596L35.6477 20.2456C34.9548 19.1389 33.4909 18.8005 32.3791 19.4913C31.2703 20.1797 30.9303 21.6449 31.6235 22.748L32.8845 24.7539C33.8753 26.329 32.7373 28.3741 30.8702 28.3741H23.7459L23.7477 26.2507C23.7477 24.6711 21.8291 23.8799 20.7069 24.9969L15.778 29.9049C15.3162 30.3647 15.3162 31.1173 15.7783 31.5768L20.708 36.4781C21.8302 37.5938 23.7472 36.8022 23.7472 35.2236L23.7455 33.1047H30.8601C36.4559 33.1055 39.87 26.9807 36.9087 22.2596Z" fill="#FFB300"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("icons",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 27 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M26.4271 0.767C26.3201 0.317 25.9161 0 25.4551 0C25.4531 0 25.4511 0 25.4491 0C20.1821 0.033 7.37407 0.916 2.20307 8.38C-0.48293 12.258 -0.713929 17.293 1.51607 23.345C1.53307 23.392 1.56807 23.424 1.59107 23.467C0.79407 25.44 0.485071 26.753 0.477071 26.79C0.361071 27.33 0.706071 27.862 1.24607 27.978C1.31607 27.993 1.38607 28 1.45607 28C1.91707 28 2.33207 27.679 2.43307 27.21C2.45407 27.108 5.00207 16.837 14.0101 10.832C14.4701 10.526 14.5941 9.905 14.2871 9.445C13.9801 8.985 13.3601 8.86 12.9001 9.168C7.79207 12.573 4.64607 17.176 2.79607 20.824C1.47207 16.246 1.81907 12.447 3.84807 9.519C7.84107 3.755 17.3121 2.365 23.0291 2.071C21.7991 3.872 20.4551 7.174 20.4551 13C20.4551 16.12 19.5701 18.522 17.8261 20.14C15.0301 22.731 10.4881 22.974 7.16607 22.724C6.61407 22.679 6.13507 23.095 6.09307 23.646C6.05107 24.196 6.46407 24.676 7.01407 24.718C7.67907 24.769 8.38907 24.8 9.12707 24.8C12.5091 24.8 16.4541 24.137 19.1851 21.606C21.3551 19.595 22.4551 16.7 22.4551 13.001C22.4551 3.902 25.8851 1.905 25.9021 1.896C26.3181 1.687 26.5361 1.219 26.4271 0.767Z" fill="#FFB300"></path></svg>
                                            `, [
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#FFB300"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="icons-btn flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 27 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M26.4271 0.767C26.3201 0.317 25.9161 0 25.4551 0C25.4531 0 25.4511 0 25.4491 0C20.1821 0.033 7.37407 0.916 2.20307 8.38C-0.48293 12.258 -0.713929 17.293 1.51607 23.345C1.53307 23.392 1.56807 23.424 1.59107 23.467C0.79407 25.44 0.485071 26.753 0.477071 26.79C0.361071 27.33 0.706071 27.862 1.24607 27.978C1.31607 27.993 1.38607 28 1.45607 28C1.91707 28 2.33207 27.679 2.43307 27.21C2.45407 27.108 5.00207 16.837 14.0101 10.832C14.4701 10.526 14.5941 9.905 14.2871 9.445C13.9801 8.985 13.3601 8.86 12.9001 9.168C7.79207 12.573 4.64607 17.176 2.79607 20.824C1.47207 16.246 1.81907 12.447 3.84807 9.519C7.84107 3.755 17.3121 2.365 23.0291 2.071C21.7991 3.872 20.4551 7.174 20.4551 13C20.4551 16.12 19.5701 18.522 17.8261 20.14C15.0301 22.731 10.4881 22.974 7.16607 22.724C6.61407 22.679 6.13507 23.095 6.09307 23.646C6.05107 24.196 6.46407 24.676 7.01407 24.718C7.67907 24.769 8.38907 24.8 9.12707 24.8C12.5091 24.8 16.4541 24.137 19.1851 21.606C21.3551 19.595 22.4551 16.7 22.4551 13.001C22.4551 3.902 25.8851 1.905 25.9021 1.896C26.3181 1.687 26.5361 1.219 26.4271 0.767Z" fill="#FFB300"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("icons",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 26 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 17L0 5.5L11 10L26 0L11 17Z" fill="#FFB300"></path></svg>
                                            `, [
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#FFB300"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="icons-btn flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 26 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 17L0 5.5L11 10L26 0L11 17Z" fill="#FFB300"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("icons",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 38 30" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M35.6652 23.5712V20.0316L32.45 13.9164C32.7695 13.5632 32.9579 13.1109 32.9838 12.6353C33.0097 12.1597 32.8714 11.6897 32.5921 11.3039C32.3128 10.9181 31.9094 10.64 31.4495 10.516C30.9896 10.3921 30.5011 10.43 30.0658 10.6232C29.6305 10.8164 29.2747 11.1534 29.0582 11.5776C28.8416 12.0018 28.7773 12.4875 28.8761 12.9534C28.9749 13.4193 29.2307 13.8372 29.6008 14.137C29.9708 14.4369 30.4327 14.6005 30.909 14.6004C30.9997 14.6003 31.0904 14.5942 31.1804 14.5822L34.2316 20.3855V23.5712H2.7872V20.3855L5.83841 14.5822C6.25735 14.6374 6.68315 14.5635 7.05902 14.3704C7.43489 14.1774 7.74296 13.8743 7.94215 13.5016C8.14133 13.129 8.22216 12.7044 8.17386 12.2846C8.12555 11.8648 7.95041 11.4698 7.67178 11.1521C7.39315 10.8344 7.02429 10.6092 6.61439 10.5066C6.20449 10.4039 5.77304 10.4287 5.37758 10.5776C4.98211 10.7264 4.64144 10.9924 4.401 11.3398C4.16055 11.6873 4.03176 12.0998 4.03181 12.5224C4.0311 13.0377 4.22258 13.5348 4.56884 13.9164L1.35365 20.0316V23.5712H0V30.0004H37.0188V23.5712H35.6652Z" fill="#FFB300"></path><path d="M14.5475 8.19483C14.7307 9.13666 15.2358 9.98544 15.9762 10.5957C16.7166 11.206 17.6462 11.5397 18.6057 11.5397C19.5652 11.5397 20.4948 11.206 21.2352 10.5957C21.9756 9.98544 22.4807 9.13666 22.6639 8.19483L23.295 4.94176C23.3787 4.32602 23.3297 3.69949 23.1513 3.10426C22.9728 2.50903 22.6691 1.95888 22.2604 1.49077C21.8517 1.02267 21.3475 0.647445 20.7818 0.390314C20.2161 0.133183 19.6019 9.81138e-05 18.9805 0H18.2309C17.6095 9.8847e-05 16.9953 0.133184 16.4295 0.390315C15.8638 0.647446 15.3597 1.02267 14.951 1.49077C14.5423 1.95888 14.2385 2.50903 14.0601 3.10426C13.8816 3.69949 13.8326 4.32602 13.9164 4.94176L14.5475 8.19483Z" fill="#FFB300"></path><path d="M7.84465 19.5583C7.81404 20.0613 7.79109 20.5337 7.77388 20.9314C7.74712 21.618 7.73946 22.0789 7.73946 22.0789H29.2793C29.2793 22.0789 29.2717 21.618 29.2449 20.9314C29.2277 20.5337 29.2047 20.0613 29.1741 19.5583C29.1091 18.5237 29.0097 17.3647 28.8567 16.4678C28.8455 16.3967 28.8295 16.3264 28.8089 16.2574C28.727 15.9547 28.5819 15.6727 28.3831 15.4301C28.1843 15.1875 27.9364 14.9897 27.6557 14.8499C26.3743 14.2111 24.1521 13.3849 22.6278 12.8418C22.5841 12.9024 22.5487 12.9687 22.5227 13.0388C21.7481 14.8728 20.9748 16.7075 20.2029 18.5428C20.178 18.6002 20.1551 18.6556 20.1302 18.713C20.113 18.713 20.0786 18.7149 20.0786 18.7149L19.4715 13.943C19.4643 13.8866 19.4368 13.8347 19.3941 13.7971C19.3514 13.7595 19.2965 13.7387 19.2396 13.7387H17.7792C17.7223 13.7387 17.6674 13.7595 17.6247 13.7971C17.582 13.8347 17.5545 13.8866 17.5473 13.943L16.9402 18.7149C16.9402 18.7149 16.9058 18.713 16.8886 18.713C16.8637 18.6556 16.8408 18.6002 16.8159 18.5428C16.0433 16.7088 15.27 14.8741 14.4961 13.0388C14.4701 12.9687 14.4347 12.9024 14.3909 12.8418C12.8667 13.3849 10.6445 14.2111 9.36311 14.8499C9.08238 14.9897 8.83446 15.1875 8.6357 15.4301C8.43693 15.6727 8.29182 15.9547 8.20993 16.2574C8.18925 16.3264 8.17327 16.3967 8.16211 16.4678C8.00912 17.3647 7.90966 18.5237 7.84465 19.5583Z" fill="#FFB300"></path></svg>
                                            `, [
                                                    {
                                                        "id": 1,
                                                        "indexes": [0,1,2],
                                                        "color": "#FFB300"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="icons-btn flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 38 30" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M35.6652 23.5712V20.0316L32.45 13.9164C32.7695 13.5632 32.9579 13.1109 32.9838 12.6353C33.0097 12.1597 32.8714 11.6897 32.5921 11.3039C32.3128 10.9181 31.9094 10.64 31.4495 10.516C30.9896 10.3921 30.5011 10.43 30.0658 10.6232C29.6305 10.8164 29.2747 11.1534 29.0582 11.5776C28.8416 12.0018 28.7773 12.4875 28.8761 12.9534C28.9749 13.4193 29.2307 13.8372 29.6008 14.137C29.9708 14.4369 30.4327 14.6005 30.909 14.6004C30.9997 14.6003 31.0904 14.5942 31.1804 14.5822L34.2316 20.3855V23.5712H2.7872V20.3855L5.83841 14.5822C6.25735 14.6374 6.68315 14.5635 7.05902 14.3704C7.43489 14.1774 7.74296 13.8743 7.94215 13.5016C8.14133 13.129 8.22216 12.7044 8.17386 12.2846C8.12555 11.8648 7.95041 11.4698 7.67178 11.1521C7.39315 10.8344 7.02429 10.6092 6.61439 10.5066C6.20449 10.4039 5.77304 10.4287 5.37758 10.5776C4.98211 10.7264 4.64144 10.9924 4.401 11.3398C4.16055 11.6873 4.03176 12.0998 4.03181 12.5224C4.0311 13.0377 4.22258 13.5348 4.56884 13.9164L1.35365 20.0316V23.5712H0V30.0004H37.0188V23.5712H35.6652Z" fill="#FFB300"></path><path d="M14.5475 8.19483C14.7307 9.13666 15.2358 9.98544 15.9762 10.5957C16.7166 11.206 17.6462 11.5397 18.6057 11.5397C19.5652 11.5397 20.4948 11.206 21.2352 10.5957C21.9756 9.98544 22.4807 9.13666 22.6639 8.19483L23.295 4.94176C23.3787 4.32602 23.3297 3.69949 23.1513 3.10426C22.9728 2.50903 22.6691 1.95888 22.2604 1.49077C21.8517 1.02267 21.3475 0.647445 20.7818 0.390314C20.2161 0.133183 19.6019 9.81138e-05 18.9805 0H18.2309C17.6095 9.8847e-05 16.9953 0.133184 16.4295 0.390315C15.8638 0.647446 15.3597 1.02267 14.951 1.49077C14.5423 1.95888 14.2385 2.50903 14.0601 3.10426C13.8816 3.69949 13.8326 4.32602 13.9164 4.94176L14.5475 8.19483Z" fill="#FFB300"></path><path d="M7.84465 19.5583C7.81404 20.0613 7.79109 20.5337 7.77388 20.9314C7.74712 21.618 7.73946 22.0789 7.73946 22.0789H29.2793C29.2793 22.0789 29.2717 21.618 29.2449 20.9314C29.2277 20.5337 29.2047 20.0613 29.1741 19.5583C29.1091 18.5237 29.0097 17.3647 28.8567 16.4678C28.8455 16.3967 28.8295 16.3264 28.8089 16.2574C28.727 15.9547 28.5819 15.6727 28.3831 15.4301C28.1843 15.1875 27.9364 14.9897 27.6557 14.8499C26.3743 14.2111 24.1521 13.3849 22.6278 12.8418C22.5841 12.9024 22.5487 12.9687 22.5227 13.0388C21.7481 14.8728 20.9748 16.7075 20.2029 18.5428C20.178 18.6002 20.1551 18.6556 20.1302 18.713C20.113 18.713 20.0786 18.7149 20.0786 18.7149L19.4715 13.943C19.4643 13.8866 19.4368 13.8347 19.3941 13.7971C19.3514 13.7595 19.2965 13.7387 19.2396 13.7387H17.7792C17.7223 13.7387 17.6674 13.7595 17.6247 13.7971C17.582 13.8347 17.5545 13.8866 17.5473 13.943L16.9402 18.7149C16.9402 18.7149 16.9058 18.713 16.8886 18.713C16.8637 18.6556 16.8408 18.6002 16.8159 18.5428C16.0433 16.7088 15.27 14.8741 14.4961 13.0388C14.4701 12.9687 14.4347 12.9024 14.3909 12.8418C12.8667 13.3849 10.6445 14.2111 9.36311 14.8499C9.08238 14.9897 8.83446 15.1875 8.6357 15.4301C8.43693 15.6727 8.29182 15.9547 8.20993 16.2574C8.18925 16.3264 8.17327 16.3967 8.16211 16.4678C8.00912 17.3647 7.90966 18.5237 7.84465 19.5583Z" fill="#FFB300"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("icons",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.6 0L11.7553 6.63344H18.7301L13.0874 10.7331L15.2427 17.3666L9.6 13.2669L3.95726 17.3666L6.1126 10.7331L0.469857 6.63344H7.44467L9.6 0Z" fill="#FFB300"></path></svg>
                                            `, [
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#FFB300"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="icons-btn flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.6 0L11.7553 6.63344H18.7301L13.0874 10.7331L15.2427 17.3666L9.6 13.2669L3.95726 17.3666L6.1126 10.7331L0.469857 6.63344H7.44467L9.6 0Z" fill="#FFB300"></path></svg>
                                        </button>
                                    </div>
                                </div> 
                                <div class="top-btn-container m-2 flex justify-center">
                                    <div class="flex items-center justify-center">
                                        <button
                                        on:click={() =>
                                            addElement("icons",
                                            `
                                            <svg width="100%" height="100%" viewBox="0 0 37 38" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M36.9382 7.06125L36.8482 6.29665H32.3506C32.5755 4.76746 32.7104 3.1933 32.8004 1.57416C32.8453 0.719617 32.1707 0 31.4061 0H5.63482C4.82525 0 4.19558 0.719617 4.24056 1.57416C4.28553 3.1933 4.46544 4.76746 4.69032 6.29665H0.192712L0.0577836 7.06125C0.0128076 7.24115 -0.48193 11.8287 2.48649 15.9665C4.42046 18.6651 7.43386 20.5091 11.3468 21.4536C12.6061 22.7129 14.0004 23.6574 15.4846 24.2421C15.3047 26.0861 15.0798 27.8852 14.8549 29.5493H22.186C21.9162 27.8402 21.6913 26.0861 21.5114 24.2421C22.9956 23.7024 24.3898 22.7579 25.6492 21.4536C29.5621 20.5091 32.5755 18.6651 34.5095 15.9665C37.4779 11.8287 36.9382 7.24115 36.9382 7.06125ZM3.7908 14.8421C1.9018 12.2335 1.67692 9.4 1.67692 8.05072H4.96018C5.81472 12.3234 7.34391 16.1014 9.27788 18.9349C6.93912 18.0354 5.0951 16.6412 3.7908 14.8421ZM33.2052 14.8421C31.9008 16.6412 30.0568 18.0354 27.7181 18.9349C29.697 16.0565 31.1812 12.3234 32.0358 8.05072H35.319C35.319 9.4 35.0492 12.2335 33.2052 14.8421Z" fill="#FFCA6B"></path><path d="M26.1439 35.8907H10.852C10.4023 35.8907 10.0425 35.5309 10.0425 35.0812V29.3242C10.0425 28.8745 10.4023 28.5146 10.852 28.5146H26.1439C26.5937 28.5146 26.9535 28.8745 26.9535 29.3242V35.0812C26.9535 35.5309 26.5937 35.8907 26.1439 35.8907Z" fill="#674B29"></path><path d="M8.55829 37.5997H28.4377C28.8875 37.5997 29.2473 37.2399 29.2473 36.7901V35.0811C29.2473 34.6313 28.8875 34.2715 28.4377 34.2715H8.55829C8.10853 34.2715 7.74872 34.6313 7.74872 35.0811V36.7901C7.74872 37.1949 8.10853 37.5997 8.55829 37.5997Z" fill="#2A1C14"></path><path d="M22.0961 32.698H14.8999C14.585 32.698 14.3602 32.4731 14.3602 32.1583V31.0339C14.3602 30.719 14.585 30.4941 14.8999 30.4941H22.0961C22.4109 30.4941 22.6358 30.719 22.6358 31.0339V32.1583C22.6358 32.4731 22.3659 32.698 22.0961 32.698Z" fill="#FFC54D"></path><mask id="AwsWJKn1f6HCLZL1fBVxj" maskUnits="userSpaceOnUse" x="0" y="0" width="37" height="30" style="mask-type: alpha;"><path d="M36.9382 7.06125L36.8482 6.29665H32.3506C32.5755 4.76746 32.7104 3.1933 32.8004 1.57416C32.8453 0.719617 32.1707 0 31.4061 0H5.63482C4.82525 0 4.19558 0.719617 4.24056 1.57416C4.28553 3.1933 4.46544 4.76746 4.69032 6.29665H0.192712L0.0577836 7.06125C0.0128076 7.24115 -0.48193 11.8287 2.48649 15.9665C4.42046 18.6651 7.43386 20.5091 11.3468 21.4536C12.6061 22.7129 14.0004 23.6574 15.4846 24.2421C15.3047 26.0861 15.0798 27.8852 14.8549 29.5493H22.186C21.9162 27.8402 21.6913 26.0861 21.5114 24.2421C22.9956 23.7024 24.3898 22.7579 25.6492 21.4536C29.5621 20.5091 32.5755 18.6651 34.5095 15.9665C37.4779 11.8287 36.9382 7.24115 36.9382 7.06125ZM3.7908 14.8421C1.9018 12.2335 1.67692 9.4 1.67692 8.05072H4.96018C5.81472 12.3234 7.34391 16.1014 9.27788 18.9349C6.93912 18.0354 5.0951 16.6412 3.7908 14.8421ZM33.2052 14.8421C31.9008 16.6412 30.0568 18.0354 27.7181 18.9349C29.697 16.0565 31.1812 12.3234 32.0358 8.05072H35.319C35.319 9.4 35.0492 12.2335 33.2052 14.8421Z" fill="#FFB300"></path></mask><g mask="url(#AwsWJKn1f6HCLZL1fBVxj)"><path d="M18 -10H40V28.5H18V-10Z" fill="#FFB300"></path></g></svg>
                                            `, [
                                                    {
                                                        "id": 1,
                                                        "indexes": [0],
                                                        "color": "#FFCA6B"
                                                    },
                                                    {
                                                        "id": 2,
                                                        "indexes": [1],
                                                        "color": "#674B29"
                                                    },
                                                    {
                                                        "id": 3,
                                                        "indexes": [2],
                                                        "color": "#2A1C14"
                                                    },
                                                    {
                                                        "id": 4,
                                                        "indexes": [3],
                                                        "color": "#FFC54D"
                                                    },
                                                    {
                                                        "id": 5,
                                                        "indexes": ["g"],
                                                        "color": "#FFB300"
                                                    }
                                                ]
                                            )}
                                        type="button"
                                        id="top"
                                        class="icons-btn flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                        >
                                        <svg width="100%" height="100%" viewBox="0 0 37 38" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M36.9382 7.06125L36.8482 6.29665H32.3506C32.5755 4.76746 32.7104 3.1933 32.8004 1.57416C32.8453 0.719617 32.1707 0 31.4061 0H5.63482C4.82525 0 4.19558 0.719617 4.24056 1.57416C4.28553 3.1933 4.46544 4.76746 4.69032 6.29665H0.192712L0.0577836 7.06125C0.0128076 7.24115 -0.48193 11.8287 2.48649 15.9665C4.42046 18.6651 7.43386 20.5091 11.3468 21.4536C12.6061 22.7129 14.0004 23.6574 15.4846 24.2421C15.3047 26.0861 15.0798 27.8852 14.8549 29.5493H22.186C21.9162 27.8402 21.6913 26.0861 21.5114 24.2421C22.9956 23.7024 24.3898 22.7579 25.6492 21.4536C29.5621 20.5091 32.5755 18.6651 34.5095 15.9665C37.4779 11.8287 36.9382 7.24115 36.9382 7.06125ZM3.7908 14.8421C1.9018 12.2335 1.67692 9.4 1.67692 8.05072H4.96018C5.81472 12.3234 7.34391 16.1014 9.27788 18.9349C6.93912 18.0354 5.0951 16.6412 3.7908 14.8421ZM33.2052 14.8421C31.9008 16.6412 30.0568 18.0354 27.7181 18.9349C29.697 16.0565 31.1812 12.3234 32.0358 8.05072H35.319C35.319 9.4 35.0492 12.2335 33.2052 14.8421Z" fill="#FFCA6B"></path><path d="M26.1439 35.8907H10.852C10.4023 35.8907 10.0425 35.5309 10.0425 35.0812V29.3242C10.0425 28.8745 10.4023 28.5146 10.852 28.5146H26.1439C26.5937 28.5146 26.9535 28.8745 26.9535 29.3242V35.0812C26.9535 35.5309 26.5937 35.8907 26.1439 35.8907Z" fill="#674B29"></path><path d="M8.55829 37.5997H28.4377C28.8875 37.5997 29.2473 37.2399 29.2473 36.7901V35.0811C29.2473 34.6313 28.8875 34.2715 28.4377 34.2715H8.55829C8.10853 34.2715 7.74872 34.6313 7.74872 35.0811V36.7901C7.74872 37.1949 8.10853 37.5997 8.55829 37.5997Z" fill="#2A1C14"></path><path d="M22.0961 32.698H14.8999C14.585 32.698 14.3602 32.4731 14.3602 32.1583V31.0339C14.3602 30.719 14.585 30.4941 14.8999 30.4941H22.0961C22.4109 30.4941 22.6358 30.719 22.6358 31.0339V32.1583C22.6358 32.4731 22.3659 32.698 22.0961 32.698Z" fill="#FFC54D"></path><mask id="AwsWJKn1f6HCLZL1fBVxj" maskUnits="userSpaceOnUse" x="0" y="0" width="37" height="30" style="mask-type: alpha;"><path d="M36.9382 7.06125L36.8482 6.29665H32.3506C32.5755 4.76746 32.7104 3.1933 32.8004 1.57416C32.8453 0.719617 32.1707 0 31.4061 0H5.63482C4.82525 0 4.19558 0.719617 4.24056 1.57416C4.28553 3.1933 4.46544 4.76746 4.69032 6.29665H0.192712L0.0577836 7.06125C0.0128076 7.24115 -0.48193 11.8287 2.48649 15.9665C4.42046 18.6651 7.43386 20.5091 11.3468 21.4536C12.6061 22.7129 14.0004 23.6574 15.4846 24.2421C15.3047 26.0861 15.0798 27.8852 14.8549 29.5493H22.186C21.9162 27.8402 21.6913 26.0861 21.5114 24.2421C22.9956 23.7024 24.3898 22.7579 25.6492 21.4536C29.5621 20.5091 32.5755 18.6651 34.5095 15.9665C37.4779 11.8287 36.9382 7.24115 36.9382 7.06125ZM3.7908 14.8421C1.9018 12.2335 1.67692 9.4 1.67692 8.05072H4.96018C5.81472 12.3234 7.34391 16.1014 9.27788 18.9349C6.93912 18.0354 5.0951 16.6412 3.7908 14.8421ZM33.2052 14.8421C31.9008 16.6412 30.0568 18.0354 27.7181 18.9349C29.697 16.0565 31.1812 12.3234 32.0358 8.05072H35.319C35.319 9.4 35.0492 12.2335 33.2052 14.8421Z" fill="#FFB300"></path></mask><g mask="url(#AwsWJKn1f6HCLZL1fBVxj)"><path d="M18 -10H40V28.5H18V-10Z" fill="#FFB300"></path></g></svg>
                                        </button>
                                    </div>
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

                            <!-- <p
                                class="font-medium border-t border-gray-200 dark:border-gray-700 mt-4 pt-4"
                            >
                                QR Code
                            </p> -->
                            <!-- <button
                                on:click={() => addElement("qr", "")}
                                type="button"
                                class="uppercase w-full mt-2 text-xs text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2"
                            >
                                <i class="icon-plus me-1" />
                                Add QR Code
                            </button> -->
                            <!-- <p class="text-xs">
                                When displayed on the recipient's certificate
                                this will point to the live version of their
                                credential.
                            </p> -->
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
                        <div style="position: relative; display: inline-block;">
                            <input
                                id="colorInput"
                                type="color"
                                style="width: 40px; height: 40px; border: none; outline: none; padding: 0; margin: 0; cursor: pointer; background: linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff); border-radius: 5px;"
                                bind:value={temp.prop.color}
                                on:input={() => {
                                    handleUpdateDocumentColor(temp?.id, temp.prop.color);
                                }}
                            />
                            <i on:click={() => {
                                const colorInput = document.getElementById('colorInput');
                                colorInput.click();
                            }} class="fa-solid fa-plus" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: black; background-color: white; border-radius: 50%; padding: 5px; cursor: pointer;"></i>
                        </div>

                        <!-- {#if documentColor.length > 0} -->
                            {#each documentColor as color }
                            <input
                                type="color"
                                style={`width: 40px; height: 40px; ${activeElement?.prop?.color == color ? 'border: solid; border-color: blue; border-width: 3px; border-radius: 5px; background: none;' : 'background: none;'}; padding: unset !important; outline: none; margin-right: 3px; margin-left: 3px; cursor: pointer;`}
                                bind:value={color}
                                on:input={() => {
                                    handleUpdateDocumentColor(temp?.id, color);
                                }
                                }
                            />
                            <!-- border: ${activeElement?.prop?.color == color ? 'solid' : 'none'}; -->
                            {/each}
                        <!-- {/if} -->
                        {:else if activeTab == "font"}
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


                              <Button on:click={() => dropdownFont = !dropdownFont} role="button" tabindex="0" class="w-full bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg block p-2 hover:bg-gray-50" color="light">
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
                              </Dropdown>
                        <!-- {:else if activeTab == "Templates"}
                              <p class="font-medium">
                                  Templates
                              </p>
                              <div class="grid grid-cols-2">
                                  <div class="top-btn-container m-2 flex justify-center">
                                      <div class="flex items-center justify-center">
                                          <button
                                          on:click={() =>
                                              addElement("template", 
                                              `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="none" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="#164756"></circle><path fill="#4fa0eb" d="M11 72H187.5L191.5 92H8L11 72Z"></path><path fill="#FFFFFF" d="M12.5 128H188.219L192.5 111V92H8L8.5 110.581L12.5 128Z"></path><circle cx="100" cy="100" r="96.1135" stroke="white" stroke-dasharray="3.55 3.55" stroke-width="1.77305"></circle><circle cx="100" cy="100" r="92.1135" stroke="white" stroke-width="1.77305"></circle></svg>`
                                              )}
                                          type="button"
                                          id="top"
                                          class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                          >
                                          <img src="/Templates/Template_1.png">
                                          </button>
                                      </div>
                                  </div>
                                  <div class="top-btn-container m-2 flex justify-center">
                                      <div class="flex items-center justify-center">
                                          <button
                                          on:click={() =>
                                              addElement("ribbon",
                                              `
                                              /Ribbon/ribbon_2.png
                                              `
                                              )}
                                          type="button"
                                          id="top"
                                          class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                          >
                                          <img src="/Templates/Template_2.png">
                                          </button>
                                      </div>
                                  </div>
                                  <div class="top-btn-container m-2 flex justify-center">
                                      <div class="flex items-center justify-center">
                                          <button
                                          on:click={() =>
                                              addElement("ribbon",
                                              `
                                              /Ribbon/ribbon_3.png
                                              `
                                              )}
                                          type="button"
                                          id="top"
                                          class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                          >
                                          <img src="/Templates/Template_3.png">
                                          </button>
                                      </div>
                                  </div>
                                  <div class="top-btn-container m-2 flex justify-center">
                                      <div class="flex items-center justify-center">
                                          <button
                                          on:click={() =>
                                              addElement("ribbon",
                                              `
                                              /Ribbon/ribbon_4.png
                                              `
                                              )}
                                          type="button"
                                          id="top"
                                          class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                          >
                                          <img src="/Templates/Template_4.png">                                        
                                          </button>
                                      </div>
                                  </div>
                                  <div class="top-btn-container m-2 flex justify-center">
                                      <div class="flex items-center justify-center">
                                          <button
                                          on:click={() =>
                                              addElement("ribbon",
                                              `
                                              /Ribbon/ribbon_5.png
                                              `
                                              )}
                                          type="button"
                                          id="top"
                                          class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                          >
                                          <img src="/Templates/Template_5.png">
                                          </button>
                                      </div>
                                  </div>
                                  <div class="top-btn-container m-2 flex justify-center">
                                      <div class="flex items-center justify-center">
                                          <button
                                          on:click={() =>
                                              addElement("ribbon",
                                              `
                                              /Ribbon/ribbon_6.png  
                                              `
                                              )}
                                          type="button"
                                          id="top"
                                          class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                          >
                                          <img src="/Templates/Template_6.png">
                                          </button>
                                      </div>
                                  </div>
                                  <div class="top-btn-container m-2 flex justify-center">
                                      <div class="flex items-center justify-center">
                                          <button
                                          on:click={() =>
                                              addElement("ribbon",
                                              `
                                              /Ribbon/ribbon_7.png
                                              `)}
                                          type="button"
                                          id="top"
                                          class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                          >
                                          <img src="/Templates/Template_7.png">
                                          </button>
                                      </div>
                                  </div>
                                  <div class="top-btn-container m-2 flex justify-center">
                                      <div class="flex items-center justify-center">
                                          <button
                                          on:click={() =>
                                              addElement("ribbon",
                                              `
                                              /Ribbon/ribbon_8.png   
                                              `
                                              )}
                                          type="button"
                                          id="top"
                                          class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                          >
                                          <img src="/Templates/Template_8.png">
                                          </button>
                                      </div>
                                  </div>
                                  <div class="top-btn-container m-2 flex justify-center">
                                      <div class="flex items-center justify-center">
                                          <button
                                          on:click={() =>
                                              addElement("ribbon",
                                              `
                                              /Ribbon/ribbon_9.png
                                              `)}
                                          type="button"
                                          id="top"
                                          class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                          >
                                          <img src="/Templates/Template_9.png">
                                          </button>
                                      </div>
                                  </div>
                                  <div class="top-btn-container m-2 flex justify-center">
                                      <div class="flex items-center justify-center">
                                          <button
                                          on:click={() =>
                                              addElement("ribbon",
                                              `
                                              /Ribbon/ribbon_10.png  
                                              `)}
                                          type="button"
                                          id="top"
                                          class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                          >
                                          <img src="/Templates/Template_10.png">
                                          </button>
                                      </div>
                                  </div>
                                  <div class="top-btn-container m-2 flex justify-center">
                                      <div class="flex items-center justify-center">
                                          <button
                                          on:click={() =>
                                              addElement("ribbon",
                                              `
                                              /Ribbon/ribbon_11.png   
                                              `)}
                                          type="button"
                                          id="top"
                                          class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                          >
                                          <img src="/Templates/Template_11.png">
                                          </button>
                                      </div>
                                  </div>
                                  <div class="top-btn-container m-2 flex justify-center">
                                      <div class="flex items-center justify-center">
                                          <button
                                          on:click={() =>
                                              addElement("ribbon",
                                              `
                                              /Ribbon/ribbon_12.png   
                                              `)}
                                          type="button"
                                          id="top"
                                          class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                          >
                                          <img src="/Templates/Template_12.png">
                                          </button>
                                      </div>
                                  </div>
                                  <div class="top-btn-container m-2 flex justify-center">
                                      <div class="flex items-center justify-center">
                                          <button
                                          on:click={() =>
                                              addElement("ribbon",
                                              `
                                              /Ribbon/ribbon_13.png 
                                              `)}
                                          type="button"
                                          id="top"
                                          class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                          >
                                          <img src="/Templates/Template_13.png">
                                          </button>
                                      </div>
                                  </div>
                                  <div class="top-btn-container m-2 flex justify-center">
                                      <div class="flex items-center justify-center">
                                          <button
                                          on:click={() =>
                                              addElement("ribbon",
                                              `
                                              /Ribbon/ribbon_14.png
                                              `)}
                                          type="button"
                                          id="top"
                                          class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                          >
                                          <img src="/Templates/Template_14.png">
                                          </button>
                                      </div>
                                  </div>
                                  <div class="top-btn-container m-2 flex justify-center">
                                      <div class="flex items-center justify-center">
                                          <button
                                          on:click={() =>
                                              addElement("ribbon",
                                              `
                                              /Ribbon/ribbon_15.png
                                              `)}
                                          type="button"
                                          id="top"
                                          class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                          >
                                          <img src="/Templates/Template_15.png">
                                          </button>
                                      </div>
                                  </div>
                                  <div class="top-btn-container m-2 flex justify-center">
                                      <div class="flex items-center justify-center">
                                          <button
                                          on:click={() =>
                                              addElement("ribbon",
                                              `
                                              /Ribbon/ribbon_16.png
                                              `)}
                                          type="button"
                                          id="top"
                                          class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                          >
                                          <img src="/Templates/Template_16.png">
                                          </button>
                                      </div>
                                  </div>
                                  <div class="top-btn-container m-2 flex justify-center">
                                      <div class="flex items-center justify-center">
                                          <button
                                          on:click={() =>
                                              addElement("ribbon",
                                              `
                                              /Ribbon/ribbon_17.png
                                              `)}
                                          type="button"
                                          id="top"
                                          class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                          >
                                          <img src="/Templates/Template_17.png">
                                          </button>
                                      </div>
                                  </div>
                                  <div class="top-btn-container m-2 flex justify-center">
                                      <div class="flex items-center justify-center">
                                          <button
                                          on:click={() =>
                                              addElement("ribbon",
                                              `
                                              /Ribbon/ribbon_18.png
                                              `)}
                                          type="button"
                                          id="top"
                                          class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                          >
                                          <img src="/Templates/Template_18.png">
                                          </button>
                                      </div>
                                  </div>
                                  <div class="top-btn-container m-2 flex justify-center">
                                      <div class="flex items-center justify-center">
                                          <button
                                          on:click={() =>
                                              addElement("ribbon",
                                              `
                                              /Ribbon/ribbon_19.png
                                              `)}
                                          type="button"
                                          id="top"
                                          class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                          >
                                          <img src="/Templates/Template_19.png">
                                          </button>
                                      </div>
                                  </div>
                                  <div class="top-btn-container m-2 flex justify-center">
                                      <div class="flex items-center justify-center">
                                          <button
                                          on:click={() =>
                                              addElement("ribbon",
                                              `
                                              /Ribbon/ribbon_20.png
                                              `)}
                                          type="button"
                                          id="top"
                                          class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                          >
                                          <img src="/Templates/Template_20.png">
                                          </button>
                                      </div>
                                  </div>
                                  <div class="top-btn-container m-2 flex justify-center">
                                      <div class="flex items-center justify-center">
                                          <button
                                          on:click={() =>
                                              addElement("ribbon",
                                              `
                                              /Ribbon/ribbon_21.png
                                              `)}
                                          type="button"
                                          id="top"
                                          class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                          >
                                          <img src="/Templates/Template_21.png">
                                          </button>
                                      </div>
                                  </div>
                                  <div class="top-btn-container m-2 flex justify-center">
                                      <div class="flex items-center justify-center">
                                          <button
                                          on:click={() =>
                                              addElement("ribbon",
                                              `
                                              /Ribbon/ribbon_22.png
                                              `)}
                                          type="button"
                                          id="top"
                                          class="ribon-icons flex items-center justify-center shadow-none hover:bg-gray-200 border rounded-lg"
                                          >
                                          <img src="/Templates/Template_22.png">
                                          </button>
                                      </div>
                                  </div>
                              </div> -->
                        {/if}
                    </div>
                </div>
            </div>
            <div class="col-span-5">
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
                        {#if activeElement && activeElement.type == "ribbon"}
                            {#each activeElement.colors as item}
                                <input type="color" bind:value={item['color']} on:input={() => updateElementStyle("ribbonColor", item)} />
                            {/each}
                        {/if}
                        {#if activeElement && activeElement.type == "bases"}
                            {#each activeElement.colors as item}
                                <input type="color" bind:value={item['color']} on:input={() => updateElementStyle("basesColor", item)} />
                            {/each}
                        {/if}
                        {#if activeElement && activeElement.type == "icons"}
                            {#each activeElement.colors as item}
                                <input type="color" bind:value={item['color']} on:input={() => updateElementStyle("iconColor", item)} />
                            {/each}
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
                                    on:click={() => (activeTab = "font")}
                                    type="button"
                                    class="{activeElement.prop.underline
                                        ? 'text-blue-700 dark:text-blue-400'
                                        : 'text-gray-900 dark:text-gray-400'} text-lg h-full p-2 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 flex justify-center items-center"
                                >
                                <svg width="11" height="18" viewBox="0 0 11 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8.40547 0.34C8.7788 0.34 9.1988 0.38 9.66547 0.459999C10.1455 0.526666 10.4855 0.599999 10.6855 0.679999V3.76H9.92547C9.59214 3.22667 9.18547 2.80667 8.70547 2.5C8.22547 2.18 7.7388 2.02 7.24547 2.02C6.63214 2.02 6.16547 2.29333 5.84547 2.84C5.5388 3.38667 5.38547 4.18667 5.38547 5.24V7.98H8.98547V8.8H5.38547V16.34L8.18547 17.2L7.78547 18H1.20547V17.38L2.98547 15.98V8.8H0.605469V7.98H2.98547V6.2C2.98547 5.17333 3.26547 4.20667 3.82547 3.3C4.38547 2.39333 5.08547 1.67333 5.92547 1.14C6.7788 0.606666 7.60547 0.34 8.40547 0.34Z" fill="black"/>
                                </svg>
                                    
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
                                <DropdownItem on:change={() => updateElementStyle("letterSpacing", letterspacing)}>
                                    <Label>Letter Spacing</Label>
                                    <Range id="range-minmax" min="0" max="10" bind:value={letterspacing}  size="sm"/>
                                    {#if letterspacing == 0}
                                    <p>Value: <Badge color="red">Notset</Badge></p>
                                    {:else}
                                        <p>Value: <Badge color="indigo">{letterspacing}</Badge></p>
                                    {/if}
                                </DropdownItem>
                                <DropdownItem on:change={() => updateElementStyle("lineSpacing", linespacing)}>
                                    <!-- <Label>Line Spacing</Label>
                                    <Range id="range-minmax" min="0" max="10" bind:value={linespacing}  size="sm"/>
                                    <p>Value: {linespacing}</p> -->
                                    <Label>Line Spacing</Label>
                                    <Range id="range-minmax" step="0.5" min="0" max="5" bind:value={linespacing} size="sm"/>
                                    {#if linespacing == 0}
                                    <p>Value: <Badge color="red">Notset</Badge></p>
                                    {:else}
                                        <p>Value: <Badge color="indigo">{linespacing}</Badge></p>
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
                                <DropdownItem on:change={() => updateElementStyle("transparency", transparency)}>
                                    <Label>Transparency</Label>
                                    <!-- on:input={updateTransparency} -->
                                    <Range id="range-minmax"  min="1" max="100" bind:value={transparency}  size="sm"/>
                                    <!-- <div class="range-container">
                                        <input
                                          type="range"
                                          min="0"
                                          max="99"
                                          value={100 - transparency}
                                          on:input={updateTransparency}
                                        />
                                      </div> -->
                                    {#if transparency == 0}
                                    <p>Value: <Badge color="red">Notset</Badge></p>
                                    {:else}
                                        <p>Value: <Badge color="indigo">{transparency}</Badge></p>
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
                            {#if activeElement.type !== "template" && activeElement.type !== "ribbon" && activeElement.type !== "bases" && activeElement.type !== "icons"}
                                <div
                                    style="background: rgba(57,76,96,.15); width: 1px; height: 24px;"
                                />
                            {/if}
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
                    on:mousedown|stopPropagation={() => {
                        activeId = null;
                        activeElement = null;
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
                                opacity={item.prop.opacity}
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
                                        style="word-break: break-word; white-space: pre-line;"
                                    >{item.content}</span>
                                {:else if item.type == "attribute"}
                                    <span
                                        class="w-full"
                                        style="word-break: break-word; white-space: pre-line;"
                                        >{item.content}</span
                                    >
                                {:else if item.type == "image"}
                                    <img alt="{item.type}"
                                        class="relative h-full w-full object-cover"
                                        src={item.content}
                                    />
                                {:else if item.type == "ribbon"}
                                {@html item.content}
                                {:else if item.type == "bases"}
                                {@html item.content}
                                {:else if item.type == "icons"}
                                {@html item.content}
                                {:else if item.type == "template"}
                                <!-- {item.content} -->
                                <!-- <img alt="{item.type}"
                                    class="relative h-full w-full object-cover"
                                    src={item.content}
                                /> -->
                                {@html item.content}
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
    .ribon-icons {
        height: 120px;
        width: 120px;
        padding-left: 5px;
        padding-right: 5px;
    }

    .pos-icons {
        height: 45px;
        width: 75px; 
    }

    .icons-btn {
        height: 60px;
        width: 60px;
        padding-left: 5px;
        padding-right: 5px;
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
</style>
