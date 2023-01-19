(function () {
    // Images click
    for (var image of document.querySelectorAll("img[src]")) {
        image.addEventListener('click', function() {
            window.open(this.getAttribute('src'), '_blank');
        });
    }
})();

//---------------------------------------------------------------------------------------------------------------

(function () {
    if (/armdroid/.test(location.pathname)) return; // The Armdroid site is its own sub thing so ignore it
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
