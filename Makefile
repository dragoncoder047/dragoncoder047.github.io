.PHONY: build clean

build: clean
	./build.py

clean:
	rm -rf docs/
