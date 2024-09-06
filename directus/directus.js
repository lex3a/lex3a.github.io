const from = document.getElementById('from');
const to = document.getElementById('to');
const language = document.getElementById('languages');
const transform = document.getElementById('transform');

function sanitizeHTML(text) {
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function convertToDirectusCode(text, type) {
    const sanitizedText = sanitizeHTML(text);
    to.value = `<pre><code class=${type}>${sanitizedText}</code></pre>`
}

async function onTranslate() {
    convertToDirectusCode(from.value, language.value);
    to.select();
    to.setSelectionRange(0, 99999);
    await navigator.clipboard.writeText(to.value);
}