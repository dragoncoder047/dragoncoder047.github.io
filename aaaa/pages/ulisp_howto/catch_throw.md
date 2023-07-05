Title: Adding (catch) / (throw) to uLisp

The Lisp primitives `:::lisp (catch)` and `:::lisp (throw)` can be used for non-local control flow.

## How to add

1. Add a variable `Thrown` next to the existing `:::cpp object *GCStack;` in the forward references section. This variable holds the tag and the value that was thrown if `:::lisp (throw)` is ever called.

    ```{.cpp data-line="2"}
    object *GlobalEnv;
    object* Thrown;
    object *GCStack = NULL;
    object *GlobalString;
    object *GlobalStringTail;
    int GlobalStringIndex = 0;
    ```

2. Make sure `Thrown` gets marked during garbage collection, in case that ever gets triggered during a `:::lisp (throw)` but before `:::lisp (catch)` catches it:

    ```{.cpp data-line="8"}
    void gc (object *form, object *env) {
        #if defined(printgcs)
        int start = Freespace;
        #endif
        markobject(tee);
        markobject(GlobalEnv);
        markobject(GCStack);
        markobject(Thrown);
        markobject(form);
        markobject(env);
        sweep();
        #if defined(printgcs)
        pfl(pserial); pserial('{'); pint(Freespace - start, pserial); pserial('}');
        #endif
    }
    ```

3. Add a new flag `INCATCH` to the `:::cpp enum flag`.
4. Because there are already 8 flags, search for "Flags" and find all the lines that look like `:::cpp char temp = Flags;` and change them to `:::cpp uint16_t temp = Flags`, as well as changing  the `Flags` variable itself to `:::cpp uint16_t`.
5. Now all that's left to do is add the functions and table entries:

    ```cpp
    /*
        (catch 'tag form*)
        Evaluates the forms, and of any of them call (throw) with the same
        tag, returns the "thrown" value. If none throw, returns the value returned by the
        last form.
    */
    object* sp_catch (object* args, object* env) {
        object* current_GCStack = GCStack;

        jmp_buf dynamic_handler;
        jmp_buf *previous_handler = handler;
        handler = &dynamic_handler;

        uint16_t temp = Flags;
        builtin_t catchcon = Context;
        setflag(INCATCH);

        object* tag = first(args);
        object* forms = rest(args);
        push(tag, GCStack);
        tag = eval(tag, env);
        car(GCStack) = tag;
        push(forms, GCStack);

        object* result;

        if (!setjmp(dynamic_handler)) {
            // First: run forms
            result = eval(tf_progn(forms, env), env);
            // If we get here nothing was thrown
            GCStack = current_GCStack;
            handler = previous_handler;
            Flags = temp;
            return result;
        } else {
            // Something was thrown, check if it is the same tag
            GCStack = current_GCStack;
            handler = previous_handler;
            Flags = temp;
            if (Thrown == NULL) {
                // Not a (throw) --> propagate the error
                longjmp(*handler, 1);
            }
            else if (!eq(car(Thrown), tag)) {
                // Wrong tag
                if (tstflag(INCATCH)) {
                    // Try next-in-line catch
                    GCStack = NULL;
                    longjmp(*handler, 1);
                } else {
                    // No upper catch
                    Context = catchcon;
                    error(PSTR("no matching tag"), car(Thrown));
                }
            } else {
                // Caught!
                result = cdr(Thrown);
                Thrown = NULL;
                return result;
            }
        }
    }

    /*
        (throw 'tag [value])
        Exits the (catch) form opened with the same tag (using eq).
        It is an error to call (throw) without first entering a (catch) with
        the same tag.
    */
    object* fn_throw (object* args, object* env) {
        if (!tstflag(INCATCH)) error2(PSTR("not in a catch"));
        object* tag = first(args);
        args = rest(args);
        object* value = NULL;
        if (args != NULL) value = first(args);
        Thrown = cons(tag, value);
        longjmp(*handler, 1);
        // unreachable
        return NULL;
    }
    ```

    ```cpp
    const char stringcatch[] PROGMEM = "catch";
    const char stringthrow[] PROGMEM = "throw";
    ```

    ```cpp
    const char doccatch[] PROGMEM = "(catch 'tag form*)\n"
    "Evaluates the forms, and of any of them call (throw) with the same\n"
    "tag, returns the \"thrown\" value. If none throw, returns the value returned by the\n"
    "last form.";
    const char docthrow[] PROGMEM = "(throw 'tag [value])\n"
    "Exits the (catch) form opened with the same tag (using eq).\n"
    "It is an error to call (throw) without first entering a (catch) with\n"
    "the same tag.";
    ```

    ```cpp
        { stringcatch, sp_catch, 0327, doccatch },
        { stringthrow, fn_throw, 0212, docthrow },
    ```
