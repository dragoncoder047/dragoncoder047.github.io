# [dragoncoder047.github.io](dragoncoder047.github.io)

Static files and top-level content for my site.

The `aaaa/` directory is the source Markdown files for my site. I chose that name because the output directory that Pelican builds into is actually the root directory and I am pretty sure that I am not going to create anything called `aaaa` and have a name collision.

`build.py` is my pelicanconf file, but made executable with a shebang and this at the end:

```py3
if __name__ == '__main__':
    import os
    os.system(f'pelican {PATH} -o {OUTPUT_PATH} -s {__file__}')
```

No more clunky Makefile!
