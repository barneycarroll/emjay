# emjay

Write [Pug](https://pugjs.org/) template strings, return [Mithril](https://mithril.js.org/) virtual DOM!

```js
import m   from 'mithril'
import pug from 'emjay'

import Footer from './Footer.js'

const Page = {
  view: ({attrs, children}) =>
    pug`
      header
        h1#title ${ attrs.title }

      main
        .container
          ${ children }

      ${m(Footer, pug`
        p.impressum.
          Etc
      `)}
    `
}
```

### Clean!

An extremely minimal, semantic whitespace template language for expressing DOM structure without worrying about where to close what brackets and other frustrating punctuation.

### Efficient!

Templates are tokenised and parsed into AST on first execution, then converted into a Mithril virtual DOM scaffold: the result is then cached by association with the template, so that subsequent executions retrieve it and merely recomputed interpolations.

In the case of templates without interpolations, the output virtual DOM itself is cached, meaning Mithril completely skips diffing for static sub-trees, and only recomputes the dynamic parts of templates.

### For convenience

Use the VSCode [Pug Template Literals](https://marketplace.visualstudio.com/items?itemName=zokugun.vscode-pug-template-literal) plugin for syntax highlighting (works on any template literal with the `pug` prefix).

Read `tests.js` for usage / feature demonstration.

### Divergence from Pug

#### No interpolated element names, & lossy text delimiters 

If Emjay encounters an interpolation where the Pug tokeniser would normally expect to find an element name (eg first non-whitespace entity on a new line), Emjay will instead defer to the interpolation value semantics, and treat string-like values as text node injections. This is to allow a more consistent and predictable interpretation of interpolations without explicit delimiters. By the same logic, interpolated strings, nullish values, component invocations and nested templates will be parsed even they are intended with a trailing `.` on the parent line, or on lines prefixed `|`. Text delimiters are still essential for static elements of template parsing and I recommend using them to indicate intent even if interpolated content overdetermines the actual logic.

#### Forgiving whitespace 

Emjay is reliant on and respectful of Pug whitespace rules, but allows two special exceptions owing to the critical difference that whereas Pug was designed to occupy entire files, Emjay is meant to be used in template literals within arbitrary source structures. 

As such:

##### Arbitrary indentation depth

A template can start at any level of indentation appropriate to surrounding code structures; the rest of the template nesting semantics will be parsed as relative to the *second* line indentation, with the second line assumed to be nested under the first if both contain nodes. This is because the template parser cannot infer ‘equivalent’ indentation of its first line, only subsequent lines.

##### Leading whitespace tolerance

Unlike Pug, Emjay allows templates to start with a new line. This is helps legibility in multi-line templates, and is the only way to ensure explicit positional semantics (nested, or adjacent?) between two first lines with block level contents.

##### Per-template indentation semantics

Indentation semantics are determined per-template, so a template interpolated into a parent template has no obligation to ensure depth-alignment.
