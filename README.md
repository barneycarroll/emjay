# emjay

Convert Jade template snippets to Mithril virtual DOM

## What's this?

Mithril is fantastic at expressing DOM as a function of state & input, but the structural requirements of DOM - often dictated by esoteric accessibility and styling concerns - don't play well at scale with the punctuation of JS. One of the worst things in Mithril is reading (let alone debugging!) a mismatched closing bracket in a structure like this:

```js
      } )
    ] )
  )
}
```

Necessarily complex DOM can end up sharing the appearance of [the pyramid of doom](https://en.wikipedia.org/wiki/Pyramid_of_doom_(programming)).

Indentation isn't so much of a problem in strucural code (the 'pyramid' is only a problem in code if the glaring indentation is useless or counter-intuitive in interpreting the meaning of the code it shapes), but trailing brackets are especially ugly and unhelpful in reading view functions.


## That's why 'designers love HTML'

Traditionally the DOM has always been a dynamic abstration of structures written in HTML, so you can understand why people feel comfortable sticking to HTML-like representations such as JSX. Closing tags solve the problem of noisy and semantically ambiguous closing tokens by providing big fat tokens that clearly label the thing being closed. Our example above would look like this, which is far more meaningful:

```jsx
      } }
      </input>
    </label>
  </form>
}
```

If you like the sound of that, use MSX.

But I contest the idea that XML-like languages are the best idiom for view functions: XML notation promotes tag structure to excess, drowning out the salient points of logic and dynamic interpolation with semantically slim but visually heavy tags. It's ironic that XML-like JSX was introduced alongside ES6 features: ES6 arrow functions allow you to express a function minimally (`input => output`), freeing us from having to write `function` and `return` everywhere, focusing instead on the contents and behaviour. In contrast, XML is downright regressive. Far better would be to omit structural closing tags altogether:

```js
      } }
}
```

## How?

The first argument accepted by `m` recognises that XML is too verbose, and uses well-known and intuitive CSS selector syntax to express the static aspects of tags instead. This isn't new: Jade, a very popular back-end templating language for Node, was doing this ages ago. Jade uses indentation alone to determine nesting.

Emjay uses the same lexer and parser as Jade, and converts the output into a Mithril virtual DOM structure.

Use it as an ES6 template tag function for minimal punctuation:

```es6
import j from 'emjay'

export default {
  view : ( ctrl, { inputs } ) => j`
    h1#title.
      The forest, and the trees

    form( target='postbackFrame' )
      ${ inputs.map( input =>
        j`
          label
            | ${ input.name }
            input( value=${ input.value } )
        `
      ) }

    h2.
      Clarity of structural content and logical expression in harmony

    iframe( name='postbackFrame' )
  `
}
```

## What's the catch?

* No tests!
* It's currently impossible to fold JS non-primitives (objects and functions) as attributes into nodes opened in Jade syntax. I'm working on it!
* This places source code elegance above performance. Running this in production means parsing text as Jade & converting it into virtual DOM on every view execution. Ideally this function would be partially pre-compiled according to similar principles as Pat Cavit's [Mithril objectify](https://github.com/tivac/mithril-objectify/)
