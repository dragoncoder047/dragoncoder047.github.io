window.addEventListener("DOMContentLoaded", () => {
    // Images click
    for (var image of document.querySelectorAll("img[src]")) {
        image.addEventListener('click', function () {
            window.open(this.getAttribute('src'), '_blank');
        });
    }
});
