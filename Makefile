.PHONY: build clean

build: clean
	./build.py

clean:
	rm -f *.html
	rm -rf drafts
	rm -rf images
	rm -rf pages
