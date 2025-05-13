window.addEventListener("DOMContentLoaded", () => {
    addImageClicks();
    switchBannerImage();
});

function addImageClicks() {
    images: for (var image of document.querySelectorAll("img[src]")) {
        let x = image.parentElement;
        while (x) {
            if (x.tagName === "A") {
                // it's in a link, so leave it the default behavior
                // (i.e. open the link target, not the image)
                continue images;
            }
            x = x.parentElement;
        }
        // must use function not arrow function to be able to have 'this'
        // reliably point to the image that was clicked, not the last
        // image in the loop
        // in an arrow function, 'this' is the global object
        image.addEventListener("click", function () {
            window.open(this.getAttribute("src"), "_blank");
        });
    }
}

function switchBannerImage() {
    const tagsEl = document.querySelector("meta[name=tags]");
    const bannerImage = document.querySelector("#banner-image");
    const tags = tagsEl ? tagsEl.getAttribute("content").split(",").map(s => s.trim()) : [];

    var name;
    if (Math.random() < 0.05) name = "chicken";
    else if (tags.includes("robotics")) name = "armdroid";
    else if (tags.includes("gamedev")) name = "gaming";
    else if (tags.includes("electronics")) name = "soldering";
    else if (tags.includes("reverse-engineering")) name = "microscope";
    else {
        const a = ["lounging", "lounging", "working", ""];
        name = a[Math.floor(a.length * Math.random())];
        if (!name) return; // empty = use default
    }
    bannerImage.src = `/images/yazani/yazani_${name}_extracted.png`;
}
