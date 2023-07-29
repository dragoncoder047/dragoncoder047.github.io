# [dragoncoder047.github.io](https://dragoncoder047.github.io)

All top-level content for my site (CSS, JS, 404 page, etc) lives here. It's a static website built using the amazing [Pelican](https://getpelican.com) static site generator.

`build.py` is my pelicanconf file, but made executable with a shebang and this at the end:

```py3
if __name__ == '__main__':
    import os
    os.system(f'pelican {PATH} -o {OUTPUT_PATH} -s {__file__}')
```

That way, all the makefile has to do is run `build.py`. (It's actually a bit more ompilcated here, because the static files do not live in the theme folder, so they must be copied over manually.)

`markdown/` contains the source files, `docs/` contains the output HTML. I would call it something different, but Github Pages only let you deploy from either the root or `docs/`, and I got tired of all the output HTML cluttering up the root, so `docs/` it is.
