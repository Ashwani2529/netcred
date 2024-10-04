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
    export let id; // Each draggable needs a unique identifier.
    export let active = false; // Whether this draggable is the one being interacted with.
    
    let moving = false;
    let resizing = false;
    let activeHandle = "";

    let section;

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
        if (!active || type== "heading" || type == "inner-header" || type=="inner-footer") return;

       

    }

    function onMouseUp() {
        moving = false;
        resizing = false;
        activeHandle = "";
        dispatch("moving", false);
    }
</script>

<section
    {id}
    bind:this={section}
    on:mousedown={onMouseDown}
    on:mouseup={onMouseUp}
    style="z-index:{index}; padding:15px 10px 15px 10px; font-family: {font}; left: {left}; top:{top}; width: {width
        ? width
        : 'auto'}; height: {height
        ? height
        : 'auto'}; font-size: {size}em; color: {color}; text-align: {textAlign}; {bold
        ? 'font-weight: bold;'
        : ''} {underline ? 'text-decoration: underline;' : ''} {uppercase ? 'text-transform: uppercase;' : ''} 
        { letterSpacing ? `letter-spacing: ${letterSpacing - 1}px;` : ''} { lineSpacing ? `line-height: ${lineSpacing - 1};` : ''}
        { italic ? 'font-style: italic;' : ''}"
        
    class="draggable box-content flex flex-col break-all visible border-transparent outline-none border-[1px] hover:cursor-grab border-solid hover:border-[#8b3dff]"
>
    <slot />

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
        /* position: absolute;  */
        overflow: visible;
    }
    
    .selected.draggable {
        transition: opacity 0.2s ease-in;
        border: 1px solid var(--primary);
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
        top: -40px;
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