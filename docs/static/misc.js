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