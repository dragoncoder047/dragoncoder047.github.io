Title: uLisp Extensions Requiring Major Edits

Click the links below for more information on how to add these extensions to your installation of uLisp.

Currently these are written for uLisp 4.4.

* [`:::lisp (catch)` and `:::lisp (throw)`]({filename}ulisp_howto/catch_throw.md)
* [Backquotes]({filename}ulisp_howto/backquote.md)

#### More coming soon!

## Note on my C++ conventions

* I put the asterisk in pointer types next to the base type (e.g. `:::cpp object* foo`) instead of next to the variable (e.g. `:::cpp object *foo`) because the variable *represents* a pointer type in and of itself, and is not just a pointer to an instance of a base type.
* I use 4 spaces for indentation, instead of 2. Blame PEP 8 for this one.

Neither of these matter as they're both just whitespace semantics and you can change them with a quick "find-and-replace-all" or "auto-format" in the Arduino IDE.
