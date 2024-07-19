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
