Title: dragoncoder047's homepage
Save_as: index.html
Modified: 2023-09-16

Just so you know who you are dealing with...

I am a high school student. I enjoy programming in Python, C/C++, and Javascript, as well as reverse-engineering, hacking, and building robots, especially the electronics side of stuff.

Below are some of the more notable ideas I have done, along with some relevant links. I will note here that this list may, at times, be out of date. The best place to check is [my Github repositories list](https://github.com/dragoncoder047?tab=repositories) which includes everything and is sorted by when I last did something with it.

## PICKLE and Tinobsy

PICKLE is my latest idea of a programming language, designed around some clever syntactic features that allows embedding of arbitrary string data inside the code, as well as user-definable custom operators and operator overloading. Currently PICKLE itself is only described in [a series of blog posts](/blog/pickles.html), but Tinobsy, the underlying type system and garbage collector that will soon form PICKLE, has been implemented [here](https://github.com/dragoncoder047/tinobsy/).

---

## uLisp fork

I wanted to be able to embed a scripting language on an Arduino so I don't have to use a C compiler on another computer to reprogram it. At the time, uLisp didn't quite work because it was difficult to add extensions, so I fooled around for a while and then settled on LIL (see below). In late March 2023 a new version of uLisp was released that makes extensions a lot easier, and so I decided I would use uLisp after all as a scripting language for my microcontroller (because it works and is well-supported) instead of LIL. In the process of working with it, I found a lot of bugs and was able to fix them, and also offer improvements, some of which have been merged upstream. I also wrote [some of my own extensions](/pages/ulisp_howto.html). And, after I got sick of the primitive Arduino serial monitor, I wrote my own Python bridge program that gives you a little nicer interaction experience when connected to a microcontroller running uLisp (although it does have a considerable number of bugs in and of itself). The code is here: <https://github.com/dragoncoder047/ulisp-esp32>

---

## Schemascii

In late September 2022 I was fooling around with the PCB's of the Armdroid (see below) and wanted to make circuit diagrams. I am not trained in and major EDA software like KiCad, and none I know of run in a web browser at any rate, so I decided to do ASCII art drawings. The closest thing to what I wanted -- Jovansonlee Cesar's [svgbob](https://github.com/ivanceras/svgbob) -- doesn't quite work the way I wanted it to, so I wrote my own program. Schemascii is designed specifically for circuit diagrams, and is written in Python so it can be embedded into a Python-Markdown-rendered site (such as my blog). There is also a CLI program for rendering standalone images. Schemascii is on GitHub: <https://github.com/dragoncoder047/schemascii> In May 2023 I added a web playground (quite crude at the moment) that runs Schemascii locally using Pyodide -- here: </schemascii/>.

---

## LILduino

After several false starts with older versions of uLisp and writing my own languages, I found that [LIL](http://runtimeterror.com/tech/lil/) runs on a microcontroller. I wrote a few C++ extension modules that hook into a few Arduino functions and libraries (GPIO, SD, cards, infrared communication, regular expressions, etc.), and basically have turned LIL into a crude operating system for any microprocessor that has enough horsepower to run it. Code here: <https://github.com/dragoncoder047/lilduino>

---

## Armdroid

In early 2022 I discovered two old Armdroid 1000's and their accessories in the back of my engineering teacher's storage closet, remnants from the days that my school taught [PLTW Computer Integrated Manufaturing](https://www.pltw.org/computer-integrated-manufacturing-course-outline). I put together a website with pictures of the robots and links to other resources I found on the Web. [Have a look at it here.](/armdroid/) This site also documents my efforts to reverse-engineer the Armdroid and control it with an Arduino Uno, which have been, so far, successful. Don't expect any updates here during the summer because I'm out of school and don't have any access to the Armdroid.

---

## Langton-Music

In late June 2022 I had the idea to try and create music from Langton's Ant and other types of two-dimensional Turing machines. The little simulator I built isn't terribly polished in terms of UI, but it works, and I actually managed to set it up so it is installable as a progressive web app. I haven't had much of a chance to play around with it. [You can find it here](/langton-music/index.html). Bug reports and feature requests can go on [GitHub Issues](https://github.com/dragoncoder047/langton-music/issues/), and everything else can go on [this conwaylife.com forum thread](https://conwaylife.com/forums/viewtopic.php?f=11&p=147432).

---

## Phoo

A little scripting language I invented based on the principle that everything is a stack. I abandoned it in May 2023 after it proved extremely difficult to maintain. Phoo started as a Javascript port of another scripting language called [Quackery](https://github.com/GordonCharlton/Quackery), but took a left turn early on in development and is nothing like Quackery anymore. Phoo, when it works, is a whole lot faster than Quackery and the code is impressively concise compared to the equivalent Javascript or Python; but unfortunately when it breaks, it gives sone of the most cryptic and unhelpful error messages of any programming language I've ever seen, second only to a C++ coredump -- not to mention it's a pain to debug in the Javascript debugger. (You learn from your failures!) I haven't used Phoo "in" anything, and probably never will, and the shell is broken, but if anyone ever gets it working again Phoo has loads of possibilities of what can be done because it is just a general purpose programming language. Javascript source code [on Github](https://github.com/dragoncoder047/phoo). Phoo's [documentation](/phoo/docs/index.html) is a bit primitive, cobbled together by a little Python script, but everything that needs to be documented is documented relatively thouroughly on that link for the outward-facing Phoo words, and as JSDoc comments for Phoo's internals.

---

## Thuepaste

For a brief spat in March 2022 I got myself obsessed with the [Thue programming language](https://en.wikipedia.org/wiki/Thue_(programming_language)) and wrote [a little interpreter for it](/thuepaste/) and a few demo programs, which are included along with a bunch of other demos I found on the internet. I came up with an idea for an algorithm that would determine the probability of any given Thue-machine halting, but without actually running it. Unfortunately, no matter what approach I took to trying to implement it, it either crashed, got stuck in a loop for hours, or ran out of memory. My idea seems like it would work, I just can't figure out how to implement it. Aside from making more demo programs, I don't think I'll get back to this much at all.
