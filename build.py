#! /usr/bin/env python3
import base64
import zlib
import pymdownx.superfences

PORT = 8080
BIND = '192.168.1.158'
SITEURL = f'http://{BIND}:{PORT}'

AUTHOR = 'dragoncoder047'
SITENAME = 'dragoncoder047&rsquo;s site'
SITESUBTITLE = 'projects, ideas, and everything else'
SITEURL = 'https://dragoncoder047.github.io'
LOGO = '/images/patrick.svg'
LOGO_AREA_HTML = f'<a href="/"><div class="flex-row"><img src="{LOGO}" width="141" alt="Patrick the purple dragon" height="85" /><div id="sitename-text" class="flex-column"><h1>{SITENAME}</h1><h2>{SITESUBTITLE}</h2></div></div></a>'
ICON = '/images/patrick_head_silhouette.svg'
ICON_MIMETYPE = 'image/svg+xml'
THEME_CSS_FILE = '/static/css/theme.css'
THEME_MAIN_CSS = '/static/css/main.css'
EXTRA_JS = '/static/misc.js'
THEME_STATIC_DIR = 'static/'
USE_FOLDER_AS_CATEGORY = False

PATH = 'aaaa/'
OUTPUT_PATH = './'

TIMEZONE = 'America/New_York'

DEFAULT_LANG = 'en_US'

# maybe later...
FEED_ALL_ATOM = None
CATEGORY_FEED_ATOM = None
TRANSLATION_FEED_ATOM = None
AUTHOR_FEED_ATOM = None
AUTHOR_FEED_RSS = None

SEO_REPORT = True

DISPLAY_PAGES_ON_MENU = DISPLAY_CATEGORIES_ON_MENU = False
AUTHOR_SAVE_AS = AUTHORS_SAVE_AS = TAG_SAVE_AS = TAGS_SAVE_AS = CATEGORY_SAVE_AS = CATEGORIES_SAVE_AS = ARCHIVES_SAVE_AS = ''
FILENAME_METADATA = r'(?P<slug>.*)'

# Blogroll
LINKS = (
    ('Conwaylife', 'https://www.conwaylife.com/'),
    ('Python', 'https://www.python.org/'),
)

# Social
SOCIAL = (
    (f'{AUTHOR} on GitHub', f'https://github.com/{AUTHOR}'),
)

MENUITEMS = (
    #('Archives', f'/archives.html'),
    ('Blog', '/blog'),
    ('Projects', '#', (
        ('Thuepaste', f'https://{AUTHOR}.github.io/thuepaste'),
        ('Armdroid', f'https://{AUTHOR}.github.io/armdroid'),
        ('Langton\'s Ant Music', f'https://{AUTHOR}.github.io/langton-music'),
        ('Schemascii', f'https://{AUTHOR}.github.io/schemascii'),
    )),
)

DEFAULT_PAGINATION = 10
DEFAULT_ORPHANS = 3
PAGINATION_PATTERNS = (
    (1, '{name}{extension}', '{name}{extension}'),
    (2, '{name}_{number}{extension}', '{name}_{number}{extension}'),
)

PATH_METADATA = r'(?P<path_no_ext>.*)\.[^.]*'
ARTICLE_URL = ARTICLE_SAVE_AS = PAGE_URL = PAGE_SAVE_AS = '{path_no_ext}.html'

THEME = './pelicantheme'

RELATIVE_URLS = False

READERS = {'html': None}


def lv_fence(source, language, css_class, options, md, **kwargs):
    return f'<div class="lifeviewer"><textarea>{source}</textarea><canvas height="{options.get("height", 400)}" width="{options.get("width", 600)}"></canvas></div>'


def kroki_fence(source, language, css_class, options, md, **kwargs):
    data = base64.urlsafe_b64encode(zlib.compress(
        source.encode('utf-8'), 9)).decode('ascii')
    lang = options.get('type', options.get('name', 'svgbob'))
    attr = ''
    if 'width' in options and 'height' in options:
        attr = f' width="{options["width"]}" height="{options["height"]}"'
    return f'<img src="https://kroki.io/{lang}/svg/{data}"{attr} />'


def named_kroki(name):
    def named_fence(source, language, css_class, options, md, **kwargs):
        return kroki_fence(source, language, css_class, options | {'type': name}, md, **kwargs)
    return {'name': name, 'class': name, 'format': named_fence}


def circuit_fence(source, language, css_class, options, md, **kwargs):
    return '<span style="color: red; background: yellow;">TODO</span>'


MARKDOWN = {
    'extension_configs': {
        'meta': {},
        'pymdownx.extra': {},
        'pymdownx.caret': {},
        'pymdownx.details': {},
        'pymdownx.highlight': {
            'use_pygments': False,  # I use Prism.js
        },
        'pymdownx.inlinehilite': {},
        "pymdownx.superfences": {
            "custom_fences": [
                # covered by kroki, but needed for compatibility with github
                named_kroki('mermaid'),
                named_kroki('svgbob'),
                {
                    'name': 'lifeviewer',
                    'class': 'lifeviewer',
                    'format': lv_fence
                },
                {
                    'name': 'kroki',
                    'class': 'kroki',
                    'format': kroki_fence
                }
            ]
        },
        'pymdownx.saneheaders': {},
        'pymdownx.magiclink': {},
        'pymdownx.smartsymbols': {},
        'smarty': {},
        'pymdownx.tabbed': {},
        'pymdownx.tasklist': {},
        'pymdownx.tilde': {},
        'sane_lists': {},
        'admonition': {},
        'abbr': {},
        'def_list': {},
        'toc': {},
        'footnotes': {},
        'attr_list': {},
        'markdown_figcap': {},
        'python_markdown_comments:CommentsExtension': {},
    },
    'output_format': 'html5',
}

PLUGINS = [
    # 'seo',
    'pelican.plugins.share_post',
    # 'sitemap',
    'pelican.plugins.related_posts',
    'minchin.pelican.plugins.nojekyll',
    'pelican.plugins.read_more',
    'jinja2content',
    'series',
    'pelican.plugins.more_categories'
]

if __name__ == '__main__':
    import os
    os.system(f'pelican {PATH} -o {OUTPUT_PATH} -s {__file__}')
