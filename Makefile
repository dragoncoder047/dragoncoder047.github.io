.PHONY: build clean deps

build: clean
	./build.py
	cp -r static/ docs/static/

clean:
	rm -rf docs/

deps:
	sudo python3 -m pip install -r requirements.txt
