.PHONY: build clean deps testserve

build: clean
	./build.py
	cp -r static/ docs/static/
	cp -r .well-known/ docs/.well-known
	cp markdown/images/pixelated.png docs/images/pixelated.png
# TEMP HACK

clean:
	rm -rf docs/

deps:
	sudo python3 -m pip install -r requirements.txt

testserve:
	python3 -m http.server 8888 -b localhost -d docs
