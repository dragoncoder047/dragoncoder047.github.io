#! /usr/bin/env python3
import base64
import zlib

# PORT = 8080
# BIND = "192.168.1.158"
# SITEURL = f"http://{BIND}:{PORT}"

AUTHOR = "dragoncoder047"
SITENAME = "dragoncoder047&rsquo;s site"
SITESUBTITLE = "projects, ideas, and everything else"
SITEURL = "https://dragoncoder047.github.io"
LOGO = "/images/yazani/yazani_1_extracted_bg.png"
LOGO_AREA_HTML = ('<a href="/" class="flex-row"><div class="flex-row">'
                  f'<img src="{LOGO}" style="max-height:10em" '
                  'id="banner-image" />'
                  '<div id="sitename-text">'
                  f'<h1>{SITENAME}</h1><h2>{SITESUBTITLE}</h2>'
                  '</div></div></a>')
ICON = "/images/yazani/yazani_1_extracted_bg_big_eyes_cropped.png"
ICON_MIMETYPE = "image/png"
THEME_CSS_FILE = "/static/css/theme.css"
THEME_MAIN_CSS = "/static/css/main.css"
EXTRA_JS = "/static/misc.js"
THEME_STATIC_DIR = "static/"
USE_FOLDER_AS_CATEGORY = False

GOOGLE_TAG = "G-XR0F89CCGK"  # cSpell: ignore ccgk

PATH = "markdown/"
OUTPUT_PATH = "docs/"

TIMEZONE = "America/New_York"

DEFAULT_LANG = "en_US"

# maybe later...
FEED_ALL_ATOM = None
CATEGORY_FEED_ATOM = None
TRANSLATION_FEED_ATOM = None
AUTHOR_FEED_ATOM = None
AUTHOR_FEED_RSS = None

SEO_REPORT = True

DISPLAY_PAGES_ON_MENU = DISPLAY_CATEGORIES_ON_MENU = False
AUTHOR_SAVE_AS = AUTHORS_SAVE_AS = TAG_SAVE_AS = TAGS_SAVE_AS = ""
CATEGORY_SAVE_AS = CATEGORIES_SAVE_AS = ARCHIVES_SAVE_AS = ""
FILENAME_METADATA = r"(?P<slug>.*)"

# Blogroll
LINKS = (
    ("Conwaylife.com Forums", "https://www.conwaylife.com/"),
    ("Python", "https://www.python.org/"),
    ("uLisp", "http://www.ulisp.com/"),
)

# Social
SOCIAL = (
    (f"{AUTHOR} on GitHub", f"https://github.com/{AUTHOR}"),
    (f"{AUTHOR} on YouTube", f"https://youtube.com/@{AUTHOR}"),
    (f"{AUTHOR} on Instagram", f"https://instagram.com/{AUTHOR}/"),
)

MENUITEMS = (
    # ("Archives", f"/archives.html"),
    ("Blog", "/blog"),
    ("Projects", "#", (
        ("Armdroid", f"https://{AUTHOR}.github.io/armdroid"),
        ("Langton&rsquo;s Ant Music",
         f"https://{AUTHOR}.github.io/langton-music"),
        ("Lynx", f"https://{AUTHOR}.github.io/lynx"),
        ("Schemascii", f"https://{AUTHOR}.github.io/schemascii"),
        ("Parasite", f"https://{AUTHOR}.github.io/parasite"),
        ("Thuepaste", f"https://{AUTHOR}.github.io/thuepaste"),
    )),
    ("uLisp Extensions", f"{SITEURL}/pages/ulisp_howto.html"),
    ("Doodles", f"{SITEURL}/pages/doodles/index.html"),
)

DEFAULT_PAGINATION = 10
DEFAULT_ORPHANS = 3
PAGINATION_PATTERNS = (
    (1, "{name}{extension}", "{name}{extension}"),
    (2, "{name}_{number}{extension}", "{name}_{number}{extension}"),
)

PATH_METADATA = r"(?P<path_no_ext>.*)\.[^.]*"
ARTICLE_URL = ARTICLE_SAVE_AS = PAGE_URL = PAGE_SAVE_AS = "{path_no_ext}.html"

THEME = "./pelicantheme"

RELATIVE_URLS = False

READERS = {"html": None}


def lv_fence(source, language, css_class, options, md, **kwargs):
    return (f'<div class="lifeviewer"><textarea>{source}</textarea>'
            f'<canvas height="{options.get("height", 400)}" '
            f'width="{options.get("width", 600)}"></canvas></div>')


def kroki_fence(source, language, css_class, options, md, **kwargs):
    data = base64.urlsafe_b64encode(zlib.compress(
        source.encode("utf-8"), 9)).decode("ascii")
    lang = options.get("type", options.get("name", "svgbob"))
    attr = ""
    if "width" in options and "height" in options:
        attr = f' width="{options["width"]}" height="{options["height"]}"'
    return f'<img src="https://kroki.io/{lang}/svg/{data}"{attr} />'


def named_kroki(name):
    def named_fence(source, language, css_class, options, md, **kwargs):
        return kroki_fence(source, language, css_class,
                           options | {"type": name}, md, **kwargs)
    return {"name": name, "class": name, "format": named_fence}


def circuit_fence(source, language, css_class, options, md, **kwargs):
    return '<span style="color: red; background: yellow;">TODO</span>'


def default_fence(source, language, css_class, options, md, **kwargs):
    """this is needed because the default superfences block puts the
    language class on the code element and breaks prismjs
    """
    source = source.replace("&", "&amp;").replace(
        "<", "&lt;").replace(">", "&gt;")
    classes = kwargs.get("classes", [])
    attrs = kwargs.get("attrs", {})
    other_attrs = "".join(map(lambda x: f' {x[0]}=\"{x[1]}\"', attrs.items()))
    classes.append("highlight")
    classes.append("language-" + language)
    return f"<pre class=\"{" ".join(classes)}\"{other_attrs}><code>{
        source}</code></pre>"


MARKDOWN = {
    "extension_configs": {
        "meta": {},
        "pymdownx.extra": {},
        "pymdownx.caret": {},
        "pymdownx.details": {},
        "pymdownx.highlight": {
            "use_pygments": False,  # I use Prism.js
        },
        "pymdownx.inlinehilite": {},
        "pymdownx.superfences": {
            "custom_fences": [
                # covered by kroki, but needed for compatibility with github
                named_kroki("mermaid"),
                named_kroki("svgbob"),
                {
                    "name": "lifeviewer",
                    "class": "lifeviewer",
                    "format": lv_fence
                },
                {
                    "name": "kroki",
                    "class": "kroki",
                    "format": kroki_fence
                },
                {
                    "name": "*",
                    "format": default_fence,
                    "class": "foo"  # need something here or it doesn't work
                }
            ]
        },
        "pymdownx.saneheaders": {},
        "pymdownx.magiclink": {},
        "pymdownx.smartsymbols": {},
        "smarty": {},
        "pymdownx.tabbed": {},
        "pymdownx.tasklist": {},
        "pymdownx.tilde": {},
        "sane_lists": {},
        "admonition": {},
        "abbr": {},
        "def_list": {},
        "toc": {},
        "footnotes": {},
        "attr_list": {},
        "markdown_figcap": {},
        "python_markdown_comments:CommentsExtension": {},
    },
    "output_format": "html5",
}

PLUGINS = [
    # "seo",
    # "sitemap",
    "pelican.plugins.related_posts",
    "minchin.pelican.plugins.nojekyll",
    "pelican.plugins.read_more",
    "jinja2content",
    "series",
]

if __name__ == "__main__":
    import os
    import shlex
    os.system(f"""pelican {
        shlex.quote(PATH)
    } -o {
        shlex.quote(OUTPUT_PATH)
    } -s {
        shlex.quote(__file__)}""")
