window.gebid = document.getElementById.bind(document);
window.qsel = document.querySelector.bind(document);
window.qselall = document.querySelectorAll.bind(document);

function fillEntirePage() {
    window.addEventListener('DOMContentLoaded', () => {
        document.querySelector('header').remove();
        document.querySelector('footer').remove();
        document.querySelector('#content').removeAttribute('id');
    });
}

(function () {
    // Dark mode hack
    var dmmq = window.matchMedia('(prefers-color-scheme: dark)');
    var icon = document.querySelector('link[rel="icon"]');
    var appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
    var giscusFrame;
    function updateThemedStuff() {
        if (!giscusFrame) giscusFrame = document.querySelector('iframe.giscus-frame');
        if (dmmq.matches) {
            // Dark theme
            icon.setAttribute('href', '/images/patrick_head_silhouette_white.svg');
            appleIcon.setAttribute('href', '/images/patrick_head_silhouette_white.svg');
            if (!giscusFrame) return;
            giscusFrame.contentWindow.postMessage({ giscus: { setConfig: { theme: 'dark' } } }, 'https://giscus.app');
        } else {
            // Light theme
            icon.setAttribute('href', '/images/patrick_head_silhouette.svg');
            appleIcon.setAttribute('href', '/images/patrick_head_silhouette.svg');
            if (!giscusFrame) return;
            giscusFrame.contentWindow.postMessage({ giscus: { setConfig: { theme: 'light' } } }, 'https://giscus.app');
        }
    }
    updateThemedStuff(); // change icon immediately
    setInterval(updateThemedStuff, 1000); // allow time for giscus frame to load; and afterwards if it takes longer
    dmmq.addEventListener('change', updateThemedStuff);
})();
