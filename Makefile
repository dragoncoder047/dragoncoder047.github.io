.PHONY: build clean

build: clean
	./build.py
	cp -r static/ docs/static/

clean:
	rm -rf docs/
