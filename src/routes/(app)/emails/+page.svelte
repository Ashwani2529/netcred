<script>
    function applyStyle(tag) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const selectedText = range.extractContents();
        
        // Check if selected text is already wrapped in the specified tag
        const isAlreadyStyled = range.commonAncestorContainer.tagName === tag.toUpperCase();

        const styledText = document.createElement(isAlreadyStyled ? 'span' : tag);
        styledText.appendChild(selectedText);
        
        // If the text is already styled, remove the styling
        if (isAlreadyStyled) {
        range.commonAncestorContainer.replaceWith(selectedText);
        } else {
        range.insertNode(styledText);
        }
    }
</script>
<main class="p-4 md:ml-64 min-h-screen">

    <div class="grid grid-cols-12 gap-4 my-4">
        <div class="relative col-span-12 p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 sm:p-6 dark:bg-gray-800">
            <h3 class="mb-4 text-xl font-semibold dark:text-white">General information</h3>
            <button on:click={() => applyStyle('b')}>B</button>
            <div class="grid grid-cols-12 gap-4 my-4">
                <div class="relative col-span-8 p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 sm:p-6 dark:bg-gray-800">
                    <p style="text-align:center;padding-top:0px;padding-bottom:0px;"><img src="https://certifier-production-amplify.s3.eu-west-1.amazonaws.com/public/565302e3-5bff-4e5c-8b76-a7f0246fcb4a/email-templates/new-logo.png" id="ZU4WJCfpB4QRDL6HF1stu" style="margin-top:0px;margin-bottom:24px;display:inline-block;width:250px;"></p>
                    <p contenteditable="true">Hello World</p>
                    <button autocorrect="off" spellcheck="false" autocomplete="off" autocapitalize="off" style="display:inline-block;padding:16px 24px;text-decoration:none;color:#fff;font-size:16px;margin-top:0px;text-align:center;border-radius:50px;margin-bottom:16px;background-color:#2765d8;cursor:pointer;font-family:Helvetica, sans-serif;line-height:1.5;font-weight:normal;"><span contenteditable="true">View Credential</span></button>
                </div>
            </div>
        </div>
    </div>
</main>