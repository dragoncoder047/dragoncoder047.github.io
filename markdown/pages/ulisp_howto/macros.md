Title: Adding Macros to uLisp

The Lisp form `:::list defmacro` allows for more powerful syntactic constructs.

## Part 1 - the Functions

1. Add these functions and their table entries:

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
        protect(form);
        form = closure(0, sym(NIL), car(form), cdr(form), &env);
        object* result = eval(form, env);
        unprotect();
        return result;
    }

    object* fn_macroexpand1 (object* args, object* env) {
        bool dummy;
        return macroexpand1(first(args), env, &dummy);
    }

    object* macroexpand (object* form, object* env) {
        bool done = false;
        protect(form);
        while (!done) {
            form = macroexpand1(form, env, &done);
            car(GCStack) = form;
        }
        unprotect();
        return form;
    }

    object* fn_macroexpand (object* args, object* env) {
        return macroexpand(first(args), env);
    }
    ```

    ```cpp
    const char stringbackquote[] PROGMEM = "backquote";
    const char stringunquote[] PROGMEM = "unquote";
    const char stringuqsplicing[] PROGMEM = "unquote-splicing";
    ```

    ```cpp
    const char docmacro[] PROGMEM = "(macro (parameter*) form*)\n"
    "Creates an unnamed lambda-macro with parameters. The body is evaluated with the parameters as local variables\n"
    "whose initial values are defined by the values of the forms after the macro form;\n"
    "the resultant Lisp code returned is then evaluated again, this time in the scope of where the macro was called.";
    const char docdefmacro[] PROGMEM = "(defmacro name (parameters) form*)\n"
    "Defines a syntactic macro.";
    ```

    ```cpp
    { stringmacro, NULL, MINMAX(OTHER_FORMS, 1, UNLIMITED), docmacro },
    { stringdefmacro, sp_defmacro, MINMAX(SPECIAL_FORMS, 2, UNLIMITED), docdefmacro },
    { stringmacroexpand1, fn_macroexpand1, MINMAX(FUNCTIONS, 1, 1), docmacroexpand1 },
    { stringmacroexpand, fn_macroexpand, MINMAX(FUNCTIONS, 1, 1), docmacroexpand },
    ```

2. Wire up the evaluator to expand the macros:

    ```{.cpp data-line="6"}
    // in object* eval (object* form, object* env)
    if (symbolp(form)) {
        // snip
    }
    // Expand macros
    form = macroexpand(form, env);
    ```

## Part 2 - Stack overflow checking'

The macro evaluator is recursive and I couldn't find a way to do it with tail-call elimination, so stack overflow checks have to be added. The nice part is that they also prevent normal functions from exploding the stack (like a naive `:::list (let ((foo (lambda (f) (f f) (f f)))) (foo foo))` would).

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
