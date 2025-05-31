Title: Stuff I do
Modified: 2025-05-31

<!-- markdownlint-disable no-emphasis-as-heading -->

## Electronics

<!-- cSpell: ignore Roboraptor -->

### ESP32 Car Hack

*Status: done*

In January 2025 I found an old cheap 1/24 scale toy RC car I had gotten from somewhere and the remote was broken. It's no fun to play with if it doesn't work, so I first hooked the remote's internal PCB into a breadboard and injected inputs into it using an ESP32 connected to my PS5 controller. Then when I got tired of having a third converter board, I took the car itself apart and squeezed the ESP32 (and a bunch of other things) into the car's body so I could connect the PS5 controller to it directly.

* [YouTube video 1 (converter board)](https://youtube.com/watch?v=mR6eZbIb-GU&si=0jpZpAx9GqCHcuqC)
* [YouTube video 2 (integrated electronics)](https://youtube.com/watch?v=lI0AvOpP5sQ&si=QdZHMJufsYyxe6Dc)
* [Instagram post (circuit diagram)](https://www.instagram.com/p/DGOJyuPuBau/)

### Roboraptor Upgrades

*Status: WIP*

In 2014 my parents bought me a [Roboraptor](https://wowwee.com/roboraptor-x), and as toys go it couldn't stand up to my style of playing with it --- a few years later it broke. Not to worry -- broken toys are not trash, the're canvases for further tinkering! Since I really enjoy robotics, electronics, and programming, I took the Roboraptor apart and set a goal to cram as many new features into the original housing as I could, while taking away as little as possible of the original functions. As I have learned new things with electronics, I've been constantly revising my plans.

* [Blog post series](https://dragoncoder047.github.io/blog/2022/shifting-gears/)
* [YouTube playlist](https://youtube.com/playlist?list=PLXg4OyDLVSdqz-7M6-BQkuVG3apBC2GT3&si=BEckmMnR1Ue5meKj)

### Armdroid

<!-- cSpell: ignore PLTW -->

*Status: Archived*

In early 2022 I discovered two old Armdroid 1000's and their accessories in the back of my engineering teacher's storage closet, remnants from the days that my school taught [PLTW Computer Integrated Manufaturing](https://www.pltw.org/computer-integrated-manufacturing-course-outline). I put together a website with pictures of the robots and links to other resources I found on the Web. This site also documents my efforts to reverse-engineer the Armdroid and control it with an Arduino Uno, which were successful. I have since graduated, and no longer have access to the Armdroid, so I will not be posting any more updates to this - the only reason I haven't archived the GitHub repository is because it would disable the GitHub Pages site.

* [Web page](/armdroid/)

## Games

### Parasite

*Status: WIP*

On August 18, 2023, I dreamed up an idea for a computer game. The basis of the idea would be that the player would be accompanied by a number of non-player agents controlled by neural networks. The level could only be beaten if the non-player agents completed the goal -- the goal cannot ever be completed by the player (that would defeat the purpose of the whole game). I chose snakes as the player characters, and the result was the game Parasite. Unfortunately, I'm a terrible level designer -- there aren't any! If you have any ideas for levels please do send them my way via a github issue.

* [Play (around with) it](/parasite/)
* [Source code](https://github.com/dragoncoder047/parasite/)

### Langton-Music

*Status: Complete, update in progress*

In late June 2022 I had the idea to try and create music from Langton's Ant and other types of two-dimensional Turing machines. The little simulator I built isn't terribly polished in terms of UI, but it works, and I actually managed to set it up so it is installable as a progressive web app. I haven't had much of a chance to play around with it.

* [Play it](/langton-music/index.html)
* [Source code](https://github.com/dragoncoder047/langton-music)
* [Submit bug report / feature request](https://github.com/dragoncoder047/langton-music/issues/)
* [Discuss on conwaylife.com](https://conwaylife.com/forums/viewtopic.php?f=11&p=147432)

---

## Tools

### Lynx

*Status: Mostly usable (need more nodes)*

I had this idea for a flow-based programming tool that stored the node data as a Scheme S-expression. I also decided to add a couple of other cool features to it and ended up producing some ridiculously idiotic bugs that I couldn't solve for a long time. But once I got it working I had an editor that actually gave helpful error messages (which is pretty neat) and a fairly-responsive renderer. Like a lot of the other things I have done, it's a pretty powerful engine but the data that the engine processes -- in this case, example flows -- is kind of skimpy (I am pretty good at making powerful agorithms and evaluation engines but actually using them requires a special kind of creativity that I don't really have).

* [Main page](https://dragoncoder047.github.io/lynx/)
* [Source code](https://github.com/dragoncoder047/lynx)

### Schemascii

<!-- cSpell: ignore Jovansonlee -->

*Status: Complete, update in progress*

In late September 2022 I was fooling around with the PCB's of the Armdroid (see above) and wanted to make circuit diagrams. [KiCanvas](https://kicanvas.org) does exist, but it's extremely alpha, and anyway KiCad files are overkill for just embedding an *image* of a circuit in a web page, so I decided to do ASCII art drawings. The closest thing to what I wanted -- Jovansonlee Cesar's [svgbob](https://github.com/ivanceras/svgbob) -- doesn't quite work the way I wanted it to, so I wrote my own program. Schemascii is designed specifically for circuit diagrams, and is written in Python so it can be embedded into a Python-Markdown-rendered site (such as my blog). There is also a CLI program for rendering standalone images. And if I get around to actually writing code for it, I might even get an exporter to KiCad netlist format

* [Source code](https://github.com/dragoncoder047/schemascii)
* [Run in browser (experimental)](https://dragoncoder047.github.io/schemascii/)

---

## Programming languages

### Cogni

*Status: Initial complete, optimizations in progress*

A while ago (years? I forget when) I discovered the [Cognate](https://cognate-lang.github.io/) programming language, created by Finn Barber. He only had a compiler written (er, a Cognate-to-C transpiler, which then passes its output to a C compiler). Unfortunately, I wanted to run Cognate on a microcontroller, but it's typically not possible to run a full compiler on a microcontroller. I ended up writing an interpreter for it in plain old C and largely in one (3,600 line) file.

* [Source code](https://github.com/dragoncoder047/cogni)

### PICKLE and Tinobsy

<!-- cSpell: ignore Tinobsy -->

*PICKLE Status: Concept*

*Tinobsy Status: Complete*

PICKLE is my latest idea of a programming language, designed around some clever syntactic features that allows embedding of arbitrary string data inside the code, as well as user-definable custom operators and operator overloading. Currently PICKLE itself is only a concept described in a series of blog posts.

* [PICKLE blog post series](/blog/2023/pickles/)
* [Tinobsy source code](https://github.com/dragoncoder047/tinobsy/)

### uLisp fork

*Status: WIP*

I wanted to be able to embed a scripting language on an Arduino so I don't have to use a C compiler on another computer to reprogram it. At the time, uLisp didn't quite work because it was difficult to add extensions, so I fooled around for a while and then settled on LIL (see below). In late March 2023 a new version of uLisp was released that makes extensions a lot easier, and so I decided I would use uLisp after all as a scripting language for my microcontroller (because it works and is well-supported) instead of LIL. In the process of working with it, I found a lot of bugs and was able to fix them, and also offer improvements, some of which have been merged upstream. And, after I got sick of the primitive Arduino serial monitor, I wrote my own Python bridge program that gives you a little nicer interaction experience when connected to a microcontroller running uLisp (although it does have a considerable number of bugs in and of itself).

* [Patch-it-yourself installation instructions](/pages/ulisp_howto.html)
* [Full source code](https://github.com/dragoncoder047/ulisp-esp32)

### LILduino

<!-- cSpell: ignore Lduino GPIO -->

*Status: Complete*

After several false starts with older versions of uLisp and writing my own languages, I found that [LIL](http://runtimeterror.com/tech/lil/) runs on a microcontroller. I wrote a few C++ extension modules that hook into a few Arduino functions and libraries (GPIO, SD, cards, infrared communication, regular expressions, etc.), and basically have turned LIL into a crude operating system for any microprocessor that has enough horsepower to run it.

* [Source code (also installable as arduino library)](https://github.com/dragoncoder047/lilduino)

### Phoo

<!-- cSpell: ignore Phoo -->

*Status: Abandoned*

Phoo was a little scripting language I invented based on the principle that everything is a stack. I abandoned it in May 2023 after it proved extremely difficult to maintain. Phoo started as a Javascript port of another scripting language called [Quackery](https://github.com/GordonCharlton/Quackery), but took a left turn early on in development and is nothing like Quackery anymore. Phoo, when it worked, was a whole lot faster than Quackery and the code is impressively concise compared to the equivalent Javascript or Python; but unfortunately when it broke, it gave sone of the most cryptic and unhelpful error messages of any programming language I've ever seen, second only to a C++ coredump -- not to mention it's a pain to debug in the Javascript debugger. (You learn from your failures!) I haven't used Phoo "in" anything, and probably never will, and the shell is broken, but if anyone ever gets it working again Phoo has loads of possibilities of what can be done because it is just a general purpose programming language.

* [Source code](https://github.com/dragoncoder047/phoo)
* [Documentation](/phoo/docs/index.html)

---

## Miscallaneous

### Thuepaste

<!-- cSpell: ignore Thue -->

*Status: Complete (I guess)*

For a brief spat in March 2022 I got myself obsessed with the [Thue programming language](https://en.wikipedia.org/wiki/Thue_(programming_language)) and wrote a little interpreter for it and a few demo programs, which are included along with a bunch of other demos I found on the internet. I came up with an idea for an algorithm that would determine the probability of any given Thue-machine halting, but without actually running it. Unfortunately, no matter what approach I took to trying to implement it, it either crashed, got stuck in a loop for hours, or ran out of memory. My idea seems like it would work, I just can't figure out how to implement it. Aside from making more demo programs, I don't think I'll get back to this much at all.

* [Try interpreter online](/thuepaste/)
