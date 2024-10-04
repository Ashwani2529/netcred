<script>
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    export let containerWidth = null; // Replace with your container width
    export let containerHeight = null; // Replace with your container height

    export let content = null;
    export let type = null;
    export let left = null;
    let _left = null;
    export let top = null;
    let _top = null;
    export let index = null;
    export let width = null;
    let _width = null;
    export let height = null;
    let _height = null;
    export let font = null;
    export let size = null;
    export let color = null;
    export let textAlign = null;
    export let bold = false;
    export let italic = false;
    export let underline = false;
    export let uppercase = false;
    export let letterSpacing = null;
    export let lineSpacing = null;
    // export let opacity = null;
    export let id; // Each draggable needs a unique identifier.
    export let active = false; // Whether this draggable is the one being interacted with.
    
    let moving = false;
    let resizing = false;
    let activeHandle = "";

    let section;
    
    // $: console.log("Active", active);

    // $: {
    //     if (!active && left.includes('px')) {
    //         onMouseUpAlt();
    //     }
    // }

    let dispatchEvent = (action) => {
        dispatch(action);
    }

    function onMouseDown(e) {
        if (type == "image") {
            e.preventDefault();
        }
        e.stopPropagation();
        dispatch("select", id); // Make this element active immediately

        if (e.target.classList.contains("resize-handle")) {
            resizing = true;
            activeHandle = e.target.dataset.handle;
        } else {
            moving = true;
        }
    }

    function onMouseMove(e) {
        if (!active) return;

        if (moving) {
            if (e.movementX > 0 && e.movementY > 0) {
                dispatch("moving", true);
            }

            if (left.includes('%')) {
                _left = (parseFloat(left.replace('%', '') / 100)) * containerWidth + 'px';
                _top = (parseFloat(top.replace('%', '') / 100)) * containerHeight + 'px';
                dispatch("moving", true);
            }

            _left = parseFloat(_left.replace('px', ''));
            _top = parseFloat(_top.replace('px', ''));
            _left += e.movementX;
            _top += e.movementY;
            _left = Math.min(
                Math.max(0, _left),
                containerWidth - section.clientWidth
            );
            _top = Math.min(
                Math.max(0, _top),
                containerHeight - section.clientHeight
            );

            left = (_left / containerWidth) * 100 + '%';
            top = (_top / containerHeight) * 100 + '%';
        }

        // if (resizing) {
        //     dispatch("moving", true);

        //     if (width) {
        //         if (width.includes('%')) {
        //             _width = (parseFloat(width.replace('%', '') / 100)) * containerWidth + 'px';
        //             _width = parseFloat(_width.replace('px', ''));
        //         } else {
        //             _width = parseFloat(width.replace('px', ''));
        //         }
        //     }

        //     if (height) {
        //         if (height.includes('%')) {
        //             _height = (parseFloat(height.replace('%', '') / 100)) * containerHeight + 'px';
        //             _height = parseFloat(_height.replace('px', ''));
        //         } else {
        //             _height = parseFloat(height.replace('px', ''));
        //         }
        //     }

        //     if (left.includes('%')) {
        //         _left = (parseFloat(left.replace('%', '') / 100)) * containerWidth + 'px';
        //         _top = (parseFloat(top.replace('%', '') / 100)) * containerHeight + 'px';
        //     }

        //     _left = parseFloat(_left.replace('px', ''));
        //     _top = parseFloat(_top.replace('px', ''));

        //     // let _left = parseFloat(left.replace('px', ''));
        //     // let _top = parseFloat(top.replace('px', ''));

        //     switch (activeHandle) {
        //         case "nw":
        //             _left += e.movementX;
        //             _top += e.movementY;
        //             _width -= e.movementX;
        //             _height -= e.movementY;
        //             break;
        //         case "ne":
        //             _top += e.movementY;
        //             _width += e.movementX;
        //             _height -= e.movementY;
        //             break;
        //         case "sw":
        //             _left += e.movementX;
        //             _width -= e.movementX;
        //             _height += e.movementY;
        //             break;
        //         case "se":
        //             _width += e.movementX;
        //             _height += e.movementY;
        //             break;
        //         case "w":
        //             _left += e.movementX;
        //             _width -= e.movementX;
        //             break;
        //         case "e":
        //             _width += e.movementX;
        //             break;
        //     }
            
        //     // Ensure we don't resize below the minimum dimensions
        //     if (width) {
        //         width = Math.max(10, _width);
        //         width = (width / containerWidth) * 100 + '%'
        //     }

        //     if (height) {
        //         height = Math.max(16, _height);
        //         height = (height / containerHeight) * 100 + '%';
        //     }

        //     // left = _left + 'px';
        //     // top = _top + 'px';

        //     left = (_left / containerWidth) * 100 + '%';
        //     top = (_top / containerHeight) * 100 + '%';
        // }

        if (resizing) {
            dispatch("moving", true);

            if (width) {
                if (width.includes('%')) {
                    _width = (parseFloat(width.replace('%', '') / 100)) * containerWidth;
                    _width = parseFloat(_width);
                } else {
                    _width = parseFloat(width.replace('px', ''));
                }
            }

            if (height) {
                if (height.includes('%')) {
                    _height = (parseFloat(height.replace('%', '') / 100)) * containerHeight;
                    _height = parseFloat(_height);
                } else {
                    _height = parseFloat(height.replace('px', ''));
                }
            }

            if (left.includes('%')) {
                _left = (parseFloat(left.replace('%', '') / 100)) * containerWidth;
                _top = (parseFloat(top.replace('%', '') / 100)) * containerHeight;
            }

            _left = parseFloat(_left);
            _top = parseFloat(_top);

            switch (activeHandle) {
                case "nw":
                    _left += e.movementX;
                    _top += e.movementY;
                    _width -= e.movementX;
                    _height -= e.movementY;
                    break;
                case "ne":
                    _top += e.movementY;
                    _width += e.movementX;
                    _height -= e.movementY;
                    break;
                case "sw":
                    _left += e.movementX;
                    _width -= e.movementX;
                    _height += e.movementY;
                    break;
                case "se":
                    _width += e.movementX;
                    _height += e.movementY;
                    break;
                case "w":
                    _left += e.movementX;
                    _width -= e.movementX;
                    break;
                case "e":
                    _width += e.movementX;
                    break;
            }
            
            // Ensure we don't resize beyond the canvas boundaries
            if (_left < 0) {
                _width += _left; // Adjust width to compensate for left overflow
                _left = 0;
            }
            if (_top < 0) {
                _height += _top; // Adjust height to compensate for top overflow
                _top = 0;
            }
            if (_left + _width > containerWidth) {
                _width = containerWidth - _left; // Adjust width to fit within container width
            }
            if (_top + _height > containerHeight) {
                _height = containerHeight - _top; // Adjust height to fit within container height
            }

            // Ensure we don't resize below the minimum dimensions
            if (width) {
                width = Math.max(10, _width);
                width = (width / containerWidth) * 100 + '%';
            }

            if (height) {
                height = Math.max(16, _height);
                height = (height / containerHeight) * 100 + '%';
            }

            left = (_left / containerWidth) * 100 + '%';
            top = (_top / containerHeight) * 100 + '%';
        }
    }

    function onMouseUp() {
        moving = false;
        resizing = false;
        activeHandle = "";
        dispatch("moving", false);
    }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- {opacity ? `opacity: ${100-opacity}%;` : ''} -->
<!-- { lineSpacing ? `line-height: ${lineSpacing};` : ''} -->

<section
    {id}
    bind:this={section}
    on:mousedown={onMouseDown}
    on:mouseup={onMouseUp}

    style="z-index:{index}; font-family: {font}; left: {left}; top: {top}; width: {width
        ? width
        : 'auto'}; height: {height
        ? height
        : 'auto'}; font-size: {size}em; color: {color}; text-align: {textAlign}; {bold
        ? 'font-weight: bold;'
        : ''} {underline ? 'text-decoration: underline;' : ''} {uppercase ? 'text-transform: uppercase;' : ''} 
        { letterSpacing ? `letter-spacing: ${letterSpacing - 1}px;` : ''} { lineSpacing ? `line-height: ${lineSpacing - 1};` : ''}
        { italic ? 'font-style: italic;' : ''}"
        
    class="draggable absolute box-content flex flex-col break-all visible border-transparent outline-none border-2 hover:cursor-grab border border-solid hover:border-[#8b3dff] {active
        ? 'selected'
        : ''}"
>
    <slot />

    <!-- {#if type != "attribute" || (type == "attribute" && content != "recipient.name")}
        <div class="actions">
            <button
                class="text-lg h-full p-2 text-gray-900 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 flex justify-center items-center"
                on:click={()=>dispatchEvent('delete')}
            >
                <i class="icon-trash-can" />
            </button>
            {#if type != "attribute"}
                <button
                    class="text-lg h-full p-2 text-gray-900 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 flex justify-center items-center"
                    on:click={()=>dispatchEvent('duplicate')}
                >
                    <i class="icon-copy" />
                </button>
            {/if}
        </div>
    {/if} -->

    <!-- TODO -->
    {#if type == "line-vertical"}
    <div
        class="resize-handle top"
        data-handle="ne"
    />
    <div
        class="resize-handle bottom"
        data-handle="se"
    />
     {:else} 
    <div
        class="resize-handle nw"
        data-handle="nw"
    />
    <div
        class="resize-handle ne"
        data-handle="ne"
    />
    <div
        class="resize-handle sw"
        data-handle="sw"
    />
    <div
        class="resize-handle se"
        data-handle="se"
    />
    
    <div class="resize-handle w" data-handle="w" />
    <!-- Left handle -->
    <div class="resize-handle e" data-handle="e" />
    <!-- Right handle -->
    {/if}
</section>

<svelte:window on:mouseup={onMouseUp} on:mousemove={onMouseMove} />

<style>
    :root {
        --drag-handle-size: 10px;
        --drag-handle-bg: black;
        --primary: #8b3dff;
        --resize-handle-bg: #fff;
        --resize-handle-shadow: 0 0 4px 1px rgba(57, 76, 96, 0.15), 0 0 0 1px rgba(43, 59, 74, 0.3);
        --action-button-bg: #fff;
        --action-button-shadow: 0 0 0 1px rgba(64, 87, 109, 0.07), 0 2px 12px rgba(53, 71, 90, 0.2);
    }

    .draggable {
        user-select: none;
        cursor: grab;
        position: absolute;
        overflow: visible;
    }
    
    .selected.draggable {
        transition: opacity 0.2s ease-in;
        border: 2px solid var(--primary);
    }

    .resize-handle {
        background: var(--drag-handle-bg);
        width: var(--drag-handle-size);
        height: var(--drag-handle-size);
        position: absolute;
        cursor: pointer;
        display: none;
    }

    .selected .resize-handle:hover {
        background-color: var(--primary);
    }

    .resize-handle {
        display: none; /* by default, handles are hidden */
    }

    .selected .resize-handle {
        display: block;
        border-radius: 50%;
        height: 8px;
        width: 8px;
        background-color: var(--resize-handle-bg);
        box-shadow: var(--resize-handle-shadow);
    }

    .selected .resize-handle.e,
    .selected .resize-handle.w {
        height: 14px;
    }

    .nw {
        top: -5px;
        left: -5px;
        cursor: nw-resize;
    }

    .ne {
        top: -5px;
        right: -5px;
        cursor: ne-resize;
    }

    .sw {
        bottom: -5px;
        left: -5px;
        cursor: sw-resize;
    }

    .se {
        bottom: -5px;
        right: -5px;
        cursor: se-resize;
    }

    .top {
        top: -5px;
        right: -2px;
        cursor: n-resize;
        transform: translateY(-50%);
    }

    .bottom {
        bottom: -5px;
        right: -5px;
        cursor: n-resize;
        transform: translateX(-50%);
    }

    /* Left handle */
    .w {
        top: 50%;
        left: -5px;
        cursor: w-resize;
        transform: translateY(-50%);
    }

    /* Right handle */
    .e {
        top: 50%;
        right: -5px;
        cursor: e-resize;
        transform: translateY(-50%); /* Center vertically */
    }

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
        top: -50px;
        bottom: auto;
        right: 0;
        left: 0;
        margin-left: auto;
        margin-right: auto;
        width: 80px;
        display: none;
    }

    .selected .actions {
        display: grid;
    }
</style>