Title: Adding Macros to uLisp

The Lisp form `:::lisp defmacro` allows for more powerful syntactic constructs. Note that this does not include backquote support -- there is a [separate page]({filename}backquote.md) for that.

*EDIT Feb. 28: In response to [all of the confusion](http://forum.ulisp.com/t/what-would-you-like-to-see-in-ulisp-in-2024/1350/36) I seem to have caused by posting this error-ridden guide, I have done my best to correct all of the errors. Hopefully, now it should be possible to to directly follow this guide from a vanilla uLisp to be able to add macros. I apologize for any confusion, compiler problems, and crashes caused by my sloppiness.*

*EDIT Nov. 24: again, corrected some more errors... my sincerest apologies for this undue insanity!*

## Part 1 - the Functions

1. Add the `MACRO` sentinel symbol, right after `LAMBDA` in the table and builtins:

    ```cpp
    const char stringmacro[] = "macro";
    ```

    ```cpp
    const char docmacro[] = "(macro (parameter*) form*)\n"
    "Creates an unnamed lambda-macro with parameters. The body is evaluated with the parameters as local variables\n"
    "whose initial values are defined by the values of the forms after the macro form;\n"
    "the resultant Lisp code returned is then evaluated again, this time in the scope of where the macro was called.";
    ```

    ```{.cpp data-line="2"}
    { string8, NULL, 0017, doc8 }, // string8 should be "lambda"
    { stringmacro, NULL, 0017, docmacro },
    { string9, NULL, 0017, doc9 },
    ```

    ```{.cpp data-line="4"}
    enum builtins: builtin_t { NIL, TEE, NOTHING, OPTIONAL,
    FEATURES, INITIALELEMENT, ELEMENTTYPE,
    TEST, EQ, BIT, AMPREST, LAMBDA, 
    MACRO,
    LET, LETSTAR,
    /* rest of them omitted for brevity */ }
    ```

2. Add these functions and their table entries:

    ```cpp
    bool is_macro_call (object* form, object* env) {
        if (form == nil) return false;
        CHECK:
        if (symbolp(car(form))) {
            object* pair = findpair(car(form), env);
            if (pair == NULL) return false;
            form = cons(cdr(pair), cdr(form));
            goto CHECK;
        }
        if (!consp(form)) return false;
        object* lambda = first(form);
        if (!consp(lambda)) return false;
        return isbuiltin(first(lambda), MACRO);
    }

    object* macroexpand1 (object* form, object* env, bool* done) {
        if (!is_macro_call(form, env)) {
            *done = true;
            return form;
        }
        while (symbolp(car(form))) form = cons(cdr(findvalue(car(form), env)), cdr(form));
        push(form, GCStack);
        form = closure(0, sym(NIL), car(form), cdr(form), &env);
        object* result = eval(form, env);
        pop(GCStack);
        return result;
    }

    object* fn_macroexpand1 (object* args, object* env) {
        bool dummy;
        return macroexpand1(first(args), env, &dummy);
    }

    object* macroexpand (object* form, object* env) {
        bool done = false;
        push(form, GCStack);
        while (!done) {
            form = macroexpand1(form, env, &done);
            car(GCStack) = form;
        }
        pop(GCStack);
        return form;
    }

    object* fn_macroexpand (object* args, object* env) {
        return macroexpand(first(args), env);
    }

    object* sp_defmacro (object* args, object* env) {
        (void) env;
        object* var = first(args);
        if (!symbolp(var)) error(notasymbol, var);
        object* val = cons(bsymbol(MACRO), cdr(args));
        object* pair = value(var->name, GlobalEnv);
        if (pair != NULL) cdr(pair) = val;
        else push(cons(var, val), GlobalEnv);
        return var;
    }
    ```

    ```cpp
    const char stringdefmacro[] = "defmacro";
    const char stringmacroexpand1[] = "macroexpand-1";
    const char stringmacroexpand[] = "macroexpand";
    ```

    ```cpp
    const char docdefmacro[] PROGMEM = "(defmacro name (parameters) form*)\n"
    "Defines a syntactic macro. No attempt is made to make it a "
    "hygienic macro.";
    const char docmacroexpand1[] = "(macroexpand-1 'form)\n"
    "If the form represents a call to a macro, expands the macro once and returns the expanded code.";
    const char docmacroexpand[] = "(macroexpand 'form)\n"
    "Repeatedly applies (macroexpand-1) until the form no longer represents a call to a macro,\n"
    "then returns the new form.";
    ```

    ```cpp
    { stringdefmacro, sp_defmacro, 0327, docdefmacro },
    { stringmacroexpand1, fn_macroexpand1, 0111, docmacroexpand1 },
    { stringmacroexpand, fn_macroexpand, 0111, docmacroexpand },
    ```

3. Wire up the evaluator to expand the macros:

    ```{.cpp data-line="6"}
    // in object* eval (object* form, object* env)
    if (symbolp(form)) {
        // snip
    }
    // Expand macros
    form = macroexpand(form, env);
    ```

## Part 2 - Stack overflow checking

The macro evaluator is recursive and I couldn't find a way to do it with tail-call elimination, so a C stack overflow check has to be added. The nice part is that in addition to recursive macros, it also prevents normal functions from exploding the stack (like a naive `:::lisp (let ((foo (lambda (f) (f f) (f f)))) (foo foo))` would).

3. Add a global variable:

    ```cpp
    #define MAX_STACK 10000
    void* StackBottom;
    ```

4. In setup() add two variables to init the stack bottom:

    ```{.cpp data-line="1-2"}
    int foo = 0;
    StackBottom = &foo;
    initworkspace();
    initenv();
    initsleep();
    initgfx();
    ```

5. Add a check in eval() to prevent stack overflow:

    ```{.cpp data-line="4-5"}
    // Escape
    if (tstflag(ESCAPE)) { clrflag(ESCAPE); error2(PSTR("escape!"));}
    if (!tstflag(NOESC)) testescape();
    // Stack overflow check
    if (abs(static_cast<int*>(StackBottom) - &TC) > MAX_STACK) error(PSTR("C stack overflow"), form);
    ```

## Part 3 (Optional) - `:::lisp setf` macro support

6. Forward-declare `is_macro_call` at the top:

    ```cpp
    bool is_macro_call (object*, object*);
    ```

7. Add a last case to `place()` like so:

    ```{.cpp data-line="2,9-12"}
    object** place (object* args, object* env, int* bit) {
        PLACE:
        *bit = -1;
        if (atom(args)) return &cdr(findvalue(args, env));
        object* function = first(args);
        if (symbolp(function)) {
            // snip
        }
        else if (is_macro_call(args, env)) {
            function = eval(function, env);
            goto PLACE;
        }
        error2(PSTR("illegal place"));
        return nil;
    }
    ```
