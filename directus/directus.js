const from = document.getElementById('from');
const to = document.getElementById('to');
const language = document.getElementById('languages');
const transform = document.getElementById('transform');

function convertToDirectusCode(text, type) {
    to.value = `<pre><code class=${type}>${text}</code></pre>`
}

function onTranslate() {
    convertToDirectusCode(from.value, language.value);
    to.select();
    to.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(to.value);
}