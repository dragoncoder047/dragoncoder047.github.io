Title: Adding Backquote Templating to uLisp

The backquote special form and its reader-macro version are incredibly useful in macros and to make Lisp templates.

## Part 1 - the Functions

1. Move the table entries for `:::lisp cons` and `:::lisp append` around in the table so they are right after `:::lisp quote`. Then, add 3 new entries in the `:::cpp enum builtins`. You can also move the `string` and `doc` entries but you don't have to. Then, add table and builtins enum entries for the 3 new functions:

    ```{.cpp data-line="2-6"}
        { string13, sp_quote, 0311, NULL },
        { string57, fn_cons, 0122, doc57 },
        { string92, fn_append, 0107, doc92 },
        { stringbackquote, tf_backquote, 0211, docbackquote },
        { stringunquote, bq_invalid, 0311, docunquote },
        { stringuqsplicing, bq_invalid, 0311, docunquotesplicing },
        { string14, sp_defun, 0327, doc14 },
        { string15, sp_defvar, 0313, doc15 },
    ```

    ```{.cpp data-line=3}
    enum builtins: builtin_t { NIL, TEE, NOTHING, OPTIONAL, INITIALELEMENT, ELEMENTTYPE, BIT, AMPREST, LAMBDA, LET, LETSTAR,
    CLOSURE, PSTAR, QUOTE,
    CONS, APPEND, BACKQUOTE, UNQUOTE, UNQUOTE_SPLICING,
    DEFUN, DEFVAR, CAR, FIRST, CDR, REST, NTH, AREF, STRINGFN, PINMODE, DIGITALWRITE,
    ANALOGREAD, REGISTER, FORMAT, 
     };
    ```

2. Add these functions and their table entries:

    ```cpp
    // see https://github.com/kanaka/mal/blob/master/process/guide.md#step-7-quoting
    // and https://github.com/kanaka/mal/issues/103#issuecomment-159047401

    object* reverse (object* what) {
        object* result = NULL;
        for (; what != NULL; what = cdr(what)) {
            push(car(what), result);
        }
        return result;
    }

    object* process_backquote (object* arg, size_t level = 0) {
        // "If ast is a map or a symbol, return a list containing: the "quote" symbol, then ast."
        if (arg == NULL || atom(arg)) return quoteit(QUOTE, arg);
        // "If ast is a list starting with the "unquote" symbol, return its second element."
        if (listp(arg) && symbolp(first(arg))) {
            switch (builtin(first(arg)->name)) {
                case BACKQUOTE: return process_backquote(second(arg), level + 1);
                case UNQUOTE: return level == 0 ? second(arg) : process_backquote(second(arg), level - 1);
                default: break;
            }
        }
        // "If ast is a list failing previous test, the result will be a list populated by the following process."
        // "The result is initially an empty list. Iterate over each element elt of ast in reverse order:"
        object* result = NULL;
        object* rev_arg = reverse(arg);
        for (; rev_arg != NULL; rev_arg = cdr(rev_arg)) {
            object* element = car(rev_arg);
            // "If elt is a list starting with the "splice-unquote" symbol,
            // replace the current result with a list containing: the "concat" symbol,
            // the second element of elt, then the previous result."
            if (listp(element) && symbolp(first(element)) && builtin(first(element)->name) == UNQUOTE_SPLICING) {
                object* x = second(element);
                if (level > 0) x = process_backquote(x, level - 1);
                result = cons(bsymbol(APPEND), cons(x, cons(result, nil)));
            }
            // "Else replace the current result with a list containing:
            // the "cons" symbol, the result of calling quasiquote with
            // elt as argument, then the previous result."
            else result = cons(bsymbol(CONS), cons(process_backquote(element, level), cons(result, nil)));
        }
        return result;
    }

    // "Add the quasiquote special form. This form does the same than quasiquoteexpand,
    // but evaluates the result in the current environment before returning it, either by
    // recursively calling EVAL with the result and env, or by assigning ast with the result
    // and continuing execution at the top of the loop (TCO)."
    object* tf_backquote (object* args, object* env) {
        object* result = process_backquote(first(args));
        // Tail call
        return result;
    }

    object* bq_invalid (object* args, object* env) {
        (void)args, (void)env;
        error2(PSTR("not valid outside backquote"));
        // unreachable
        return NULL;
    }
    ```

    ```cpp
    const char stringbackquote[] PROGMEM = "backquote";
    const char stringunquote[] PROGMEM = "unquote";
    const char stringuqsplicing[] PROGMEM = "unquote-splicing";
    ```

    ```cpp
    const char docbackquote[] PROGMEM = "(backquote form) or `form\n"
    "Expands the unquotes present in the form as a syntactic template. Most commonly used in macros.";
    const char docunquote[] PROGMEM = "(unquote form) or ,form\n"
    "Marks a form to be evaluated and the value inserted when (backquote) expands the template.";
    const char docunquotesplicing[] PROGMEM = "(unquote-splicing form) or ,@form\n"
    "Marks a form to be evaluated and the value spliced in when (backquote) expands the template.\n"
    "If the value returned when evaluating form is not a proper list (backquote) will bork very badly.";
    ```

## Part 2 - the Reader Macros

3. Add 3 new tokens to the `:::cpp enum tokens`: `BACKQUO`, `UNQUO`, and `UNSPLICE`:

    ```{.cpp data-line=2}
    enum token { UNUSED, BRA, KET, QUO, DOT,
    BACKQUO, UNQUO, UNSPLICE
    };
    ```

4. In `:::cpp nextitem()`, add the following code after the code that returns the existing tokens:

    ```{.cpp data-line="14-23"}
    object *nextitem (gfun_t gfun) {
        int ch = gfun();
        while(issp(ch)) ch = gfun();

        if (ch == ';') {
            do { ch = gfun(); if (ch == ';' || ch == '(') setflag(NOECHO); }
            while(ch != '(');
        }
        if (ch == '\n') ch = gfun();
        if (ch == -1) return nil;
        if (ch == ')') return (object *)KET;
        if (ch == '(') return (object *)BRA;
        if (ch == '\'') return (object *)QUO;
        if (ch == '`') return (object*)BACKQUO;
        if (ch == '@') return (object*)UNSPLICE; // maintain compatibility with old Dave Astels code
        if (ch == ',') {
            ch = gfun();
            if (ch == '@') return (object *)UNSPLICE;
            else {
                LastChar = ch;
                return (object *)UNQUO;
            }
        }
    ```

5. In the while loop of `:::cpp readrest()` add this:

    ```{.cpp data-line="4-6"}
    while (item != (object*)KET) {
        if (item == (object*)BRA) item = readrest(gfun);
        else if (item == (object*)QUO) item = cons(bsymbol(QUOTE), cons(read(gfun), NULL));
        else if (item == (object*)BACKQUO) item = cons(bsymbol(BACKQUOTE), cons(read(gfun), NULL));
        else if (item == (object*)UNQUO) item = cons(bsymbol(UNQUOTE), cons(read(gfun), NULL));
        else if (item == (object*)UNSPLICE) item = cons(bsymbol(UNQUOTE_SPLICING), cons(read(gfun), NULL));
        else if (item == (object*)PERIOD) {
    ```

6. And in `:::cpp read()` add this:

    ```{.cpp data-line="7-9"}
    object* read (gfun_t gfun) {
        object* item = nextitem(gfun);
        if (item == (object*)KET) error2(PSTR("unexpected close paren"));
        if (item == (object*)BRA) return readrest(gfun);
        if (item == (object*)DOT) return read(gfun);
        if (item == (object*)QUO) return cons(bsymbol(QUOTE), cons(read(gfun), NULL));
        if (item == (object*)BACKQUO) return cons(bsymbol(BACKQUOTE), cons(read(gfun), NULL));
        if (item == (object*)UNQUO) return cons(bsymbol(UNQUOTE), cons(read(gfun), NULL));
        if (item == (object*)UNSPLICE) return cons(bsymbol(UNQUOTE_SPLICING), cons(read(gfun), NULL));
        return item;
    }
    ```
