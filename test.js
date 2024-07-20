import util from 'node:util'

import assert               from 'node:assert'
import {
  beforeEach,
  suite,
  mock,
  test,
} from 'node:test'

import './mock_dom.js'

import m   from 'mithril'
import pug from './index.js'

const {body} = window.document

// Takes two vnodes, renders them side by side,
// and compares them with `isEqualNode`
const assertNodeParity = (a, b) => {
  m.render(body, [m('div', a), m('div', b)])

  assert(
    body.children[0].isEqualNode(body.children[1])
  )
}

// Clear the virtual DOM cache before each test
// To prevent subsequent renders unintentionally
// diffing with previous
beforeEach(() => {
  delete body.vnodes
})

suite('static input', () => {
  suite('single elements', () => {
    test('plain', () => {
      assertNodeParity(
        pug`br`,

        m(`br`),
      )
    })

    test('shorthand class', () => {
      assertNodeParity(
        pug`.class`,

        m(`.class`),
      )
    })

    test('shorthand id', () => {
      assertNodeParity(
        pug`#id`,

        m(`#id`),
      )
    })

    test('verbose attributes', () => {
      assertNodeParity(
        pug`link(rel='stylesheet' href='/style.css')`,

        m(`link[rel='stylesheet'][href='/style.css']`),
      )
    })

    test('shorthand boolean attributes', () => {
      assertNodeParity(
        pug`input(checked disabled)`,

        m(`input[checked][disabled]`),
      )
    })

    test('inline text', () => {
      assertNodeParity(
        pug`p Some text`,

        m(`p`, `Some text`),
      )
    })

    test('kitchen sink', () => {
      assertNodeParity(
        pug`p#id.class1.class2(class='class3' foo=bar boolean) Some text`,

        m(`p#id.class1.class2[class="class3"][foo="bar"][boolean]`, `Some text`),
      )
    })
  })

  suite('structured content', () => {
    test('block text', () => {
      assertNodeParity(
        pug`p.
          Blocks

          of text
        `,

        m(`p`,
          `Blocks`,
          `\n\n`,
          `of text`,
        ),
      )
    })

    test('pipe text', () => {
      assertNodeParity(
        pug`p
            | Piped
            | text
        `,

        m(`p`,
          `Piped`,
          `\n`,
          `text`,
        ),
      )
    })

    test('adjacent elements', () => {
      assertNodeParity(
        pug`
          p Element one
          p Element two
        `,

        [
          m(`p`, `Element one`),
          m(`p`, `Element two`),
        ],
      )
    })

    test('nested elements', () => {
      assertNodeParity(
        pug`
          ol
            li
              ol
                li 1.1
                li 1.2
            li
              ol
                li 2.1
                li 2.2
        `,

        m(`ol`,
          m(`li`,
            m(`ol`,
              m(`li`, `1.1`),
              m(`li`, `1.2`),
            ),
          ),
          m(`li`,
            m(`ol`,
              m(`li`, `2.1`),
              m(`li`, `2.2`),
            ),
          ),
        ),
      )
    })

    test('inline elements', () => {
      assertNodeParity(
        pug`h1: a(href='example.com') Nested link `,

        m(`h1`, m(`a[href=example.com]`, `Nested link`)),
      )
    })
  })
})

suite('interpolations', () => {
  suite('primitives', () => {
    test('inline text', () => {
      const text = 'Hello'

      assertNodeParity(
        pug`p ${ text }`,

        m(`p`, text),
      )
    })

    test('block text', () => {
      const multiline = `
        Hello
        world
      `

      assertNodeParity(
        pug`p.
          ${ multiline }
        `,

        m(`p`,
          multiline
        ),
      )
    })

    test('piped text', () => {
      const plain      = 'Interpolated'
      const emphasised = 'values'

      assertNodeParity(
        pug`p
          | ${ plain }
          em ${ emphasised }
        `,

        m(`p`,
          plain,
          m(`em`, emphasised),
        ),
      )
    })

    test('shorthand selectors', () => {
      const id        = 'app'
      const className = 'container'

      assertNodeParity(
        pug`#${ id }.${ className }`,

        m(`#${ id }.${ className }`),
      )
    })

    test('verbose attributes', () => {
      assertNodeParity(
        pug`input(tabIndex=${ 0 } checked=${ true } value=${ 'foo' })`,

        m(`input`, {tabIndex: 0, checked: true, value: 'foo'}),
      )
    })

    test('primitive vnodes', () => {
      assertNodeParity(
        pug`
          article
            ${ 0 }
            ${ 1 }
            ${ null }
            ${ true }
            ${ false }
            ${ undefined }
        `,

        m(`article`,
          0,
          1,
          null,
          true,
          false,
          undefined,
        ),
      )
    })
  })

  suite('complex', () => {
    test('nested templates', () => {
      assertNodeParity(
        pug`p ${
          pug`em
            | Pugs within pugs
          `
        }`,

        m(`p`,
          m(`em`,
            `Pugs within pugs`
          )
        ),
      )
    })

    test('nested components', () => {
      const PugComponent = {
        view({children}){
          return pug`
            h1 Welcome
            ${ children }
          `
        }
      }
      const MithrilComponent = {
        view({children}){
          return [
            m(`h1`, `Welcome`),
            children,
          ]
        }
      }

      assertNodeParity(
        pug`
          main ${
            m(PugComponent, pug`
              p Everyone!
            `)
          }
        `,

        m(`main`,
          m(MithrilComponent,
            m(`p`, `Everyone!`)
          )
        ),
      )
    })

    test('attribute dictionary', () => {
      assertNodeParity(
        // Order is reversed for some reason, check fails
        // when attributes assigned in different order.
        pug`main(${{ id: 'id', class: 'className'}})`,

        m(`main`, {class: 'className', id: 'id'}),
      )
    })

    test('event handler attributes', () => {
      const value = Symbol()

      const pugVdom = pug`button(onclick=${ () => value })`
      const mVdom   = m('button', {onclick: () => value})

      assertNodeParity(
        pugVdom,
        mVdom,
      )

      assert.equal(
        pugVdom.events.onclick(),
        value
      )
    })

    test('style attribute objects', () => {
      assertNodeParity(
        pug`header(style=${{border: '1px solid', background: 'red'}})`,
        m(`header`, {style: {border: '1px solid', background: 'red'}}),
      )
    })
  })
})

suite('special attributes', async () => {
  test('`key` assignment', () => {
    const key = Date.now()

    assert.deepEqual(
      pug`p(${ {key} })`,

      m('p', {key}),
    )
  })

  test('lifecycle', async context => {
    const sequence = `
      oninit
      oncreate
      onbeforeupdate
      onupdate
      onbeforeremove
      onremove
    `
      .trim().split(/\s+/)

    context.plan(
      // Each hook checks the execution state of each other hook
      sequence.length * (sequence.length - 1)
      +
      // We also check each hooks state after each of 3 render passes
      sequence.length * 3
    )

    const {promise, resolve} = Promise.withResolvers()

    const lifecycle = Object.fromEntries(
      sequence.map((k1, i1) =>
        [k1, mock.fn(() => {
          context.test(k1, () => {
            sequence.map((k2, i2) => {
                  if(i2 < i1)
                context.assert(
                  lifecycle[k2].mock.callCount() === 1,
                  `${k2} didn't execute before ${k1}`
                )
              else if(i2 > i1)
                context.assert(
                  lifecycle[k2].mock.callCount() === 0,
                  `${k2} executed before ${k1}`
                )

              if('onremove' === k1 && k1 === k2)
                resolve()
            })
          })
        })
      ])
    )

    m.render(body, pug`div(${ lifecycle })`)

    context.test('first render triggers `oninit` & `oncreate`', () => {
      context.assert(lifecycle.oninit        .mock.callCount() === 1)
      context.assert(lifecycle.oncreate      .mock.callCount() === 1)
      context.assert(lifecycle.onbeforeupdate.mock.callCount() === 0)
      context.assert(lifecycle.onupdate      .mock.callCount() === 0)
      context.assert(lifecycle.onbeforeremove.mock.callCount() === 0)
      context.assert(lifecycle.onremove      .mock.callCount() === 0)
    })

    m.render(body, pug`div(${ lifecycle })`)

    context.test('second render triggers `onbeforeupdate` & `onupdate`', () => {
      context.assert(lifecycle.oninit        .mock.callCount() === 1)
      context.assert(lifecycle.oncreate      .mock.callCount() === 1)
      context.assert(lifecycle.onbeforeupdate.mock.callCount() === 1)
      context.assert(lifecycle.onupdate      .mock.callCount() === 1)
      context.assert(lifecycle.onbeforeremove.mock.callCount() === 0)
      context.assert(lifecycle.onremove      .mock.callCount() === 0)
    })

    m.render(body, undefined)

    context.test('third render triggers `onbeforeremove` & `onremove`', () => {
      context.assert(lifecycle.oninit        .mock.callCount() === 1)
      context.assert(lifecycle.oncreate      .mock.callCount() === 1)
      context.assert(lifecycle.onbeforeupdate.mock.callCount() === 1)
      context.assert(lifecycle.onupdate      .mock.callCount() === 1)
      context.assert(lifecycle.onbeforeremove.mock.callCount() === 1)
      context.assert(lifecycle.onremove      .mock.callCount() === 1)
    })

    return promise
  })
})
