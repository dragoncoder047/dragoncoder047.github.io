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

// Dark mode hack
if (window.matchMedia('(prefers-color-scheme: dark)')) {
    document.querySelector('link[rel="icon"]').setAttribute('href', '/images/patrick_head_silhouette_white.svg');
    document.querySelector('link[rel="apple-touch-icon"]').setAttribute('href', '/images/patrick_head_silhouette_white.svg');
}
