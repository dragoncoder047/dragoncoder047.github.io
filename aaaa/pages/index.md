Title: dragoncoder047's homepage
Save_as: index.html
Status: hidden
Modified: 2023-03-07

Hi, I guess.

Just so you know who you are dealing with... I am a high school student. I enjoy programming in Python, C++, and Javascript, as well as reverse-engineering, hacking, and building robots.

Below are some of the more notable ideas I have done, along with links to their description pages. I will note here that this list may, at times, be out of date. The best place to check is [my Github repositories list](https://github.com/dragoncoder047?tab=repositories) which includes everything and is sorted by when I last did something with it.

## LILduino

I wanted to be able to embed a scripting language on an Arduino so I don't have to use a C compiler on another computer to reprogram it. After several false starts with Lisp, Tcl, and writing my own language, I discovered [LIL](http://runtimeterror.com/tech/lil/). It's written in C and even though it has no garbage collector (memory is managed very carefully by duplicating and freeing values when needed) it works very well. I wrote a bunch of C++ "extension modules" that hook into Arduino functions and libraries (GPIO, SD, cards, infrared communication, regular expressions, etc.), and basically have turned LIL into a crude operating system for any microprocessor that has enough horsepower to run it. Code here: <https://github.com/dragoncoder047/lilduino>

---

## Schemascii

In late September 2022 I was fooling around with the PCB's of the Armdroid and wanted to make circuit diagrams. I am not trained in and major EDA software like KiCad, and none I know of run in a Web browser at any rate, so I decided to do ASCII art drawings. The closest thing to what I wanted -- Jovansonlee Cesar's [svgbob](https://github.com/ivanceras/svgbob) -- doesn't quite work the way I want it to, so I wrote my own program. Schemascii is designed specifically for circuit diagrams, and is written in Python so it can be embedded into a Python-Markdown-rendered site (such as my blog). There is also a CLI program for rendering standalone images. Schemascii is on GitHub: <https://github.com/dragoncoder047/schemascii>

---

## Armdroid

In early 2022 I discovered two old Armdroid 1000's and their accessories in the back of my engineering teacher's storage closet, remnants from the days that my school taught [PLTW Computer Integrated Manufaturing](https://www.pltw.org/computer-integrated-manufacturing-course-outline). I put together a website with pictures of the robots and links to other resources I found on the Web. [Have a look at it here.](/armdroid/) This site also documents my efforts to reverse-engineer the Armdroid and control it with an Arduino Uno, which have been mildly successful.

---

## Langton-Music

In late June 2022 I had the idea to try and create music from Langton's Ant and other types of two-dimensional Turing machines. The little simulator I built isn't terribly polished in terms of UI, but it works, and I actually managed to set it up so it is installable as a progressive web app. I haven't had much of a chance to play around with it. [You can find it here](/langton-music/index.html). Bug reports and feature requests can go on [GitHub Issues](https://github.com/dragoncoder047/langton-music/issues/), and everything else can go on [this conwaylife.com forum thread](https://conwaylife.com/forums/viewtopic.php?f=11&p=147432).

---

## Phoo

A little scripting language I invented based on the principle that everything is a stack. Phoo started as a Javascript port of another scripting language called [Quackery](https://github.com/GordonCharlton/Quackery), but took a left turn early on in development and is nothing like Quackery anymore. Phoo is a whole lot faster than Quackery and works well and the code is impressively concise compared to the equivalent Javascript or Python. I haven't used Phoo "in" anything yet, and the shell is kind of broken, but Phoo has loads of possibilities of what can be done because it is just a general purpose programming language. Javascript source code [on Github](https://github.com/phoo-lang/phoo). Phoo's [documentation](https://phoo-lang.github.io/docs/index.html) is a bit primitive, cobbled together by a little Python script, but everything that needs to be documented is documented relatively thouroughly on that link for the outward-facing Phoo words, and as JSDoc comments for Phoo's internals.

---

## Thuepaste

For a brief spat in March 2022 I got myself obsessed with the [Thue programming language](https://en.wikipedia.org/wiki/Thue_(programming_language)) and wrote [a little interpreter for it](/thuepaste/) and a few demo programs, which are included along with a bunch of other demos I found on the internet. I came up with an idea for an algorithm that would determine the probablilty of any given Thue-machine halting, but without actually running it. Unfortunately, no matter what approach I took to trying to implement it, it either crashed, got stuck in a loop for hours, ran out of memory, or did some other horrible thing to my browser to make it so slow I had to force-quit and restart it on multiple occasions. My idea seems like it would work, I just can't figure out how to implement it. Aside from making more demo programs, I don't think I'll get back to this much at all.
