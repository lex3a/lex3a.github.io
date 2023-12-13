const from = document.getElementById('from');
const to = document.getElementById('to');
const language = document.getElementById('languages');
const transform = document.getElementById('transform');

function convertToDirectusCode(text, type) {
    to.value = `<pre><code class=${type}>${text}</code></pre>`
}

async function onTranslate() {
    convertToDirectusCode(from.value, language.value);
    to.select();
    to.setSelectionRange(0, 99999);
    await navigator.clipboard.writeText(to.value);
}