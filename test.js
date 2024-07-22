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

    test('`style` attribute objects', () => {
      assertNodeParity(
        pug`header(style=${{border: '1px solid', background: 'red'}})`,
        m(`header`, {style: {border: '1px solid', background: 'red'}}),
      )
    })
  })
})

suite('special attributes', () => {
  test('`key` assignment', t => {
    const key = Date.now()

    t.assert.deepEqual(
      pug`p(${ {key} })`,

      m('p', {key}),
    )
  })

  test('lifecycle', () => {
    // These are all the lifecycle methods,
    // in sequential order of execution
    const sequence = [
      // oninit & oncreate are executed in the first render
      // before & after the subtree view is executed and persisted to DOM
      'oninit',
      'oncreate',
      // onbeforeupdate & onupdate execute in subsequent renders
      // before & after the subtree view is executed and persisted to DOM
      'onbeforeupdate',
      'onupdate',
      // onbeforeupdate & onupdate execute when the entity is removed from view
      // before & after the subtree view is executed and persisted to DOM
      'onbeforeremove',
      'onremove',
    ]

    // A dictionary to pass as attributes, each with a simple mock
    const lifecycle = {
      oninit         : mock.fn(),
      oncreate       : mock.fn(),
      onbeforeupdate : mock.fn(),
      onupdate       : mock.fn(),
      onbeforeremove : mock.fn(),
      onremove       : mock.fn(),
    }

    // Returns an array of current call counts for the lifecycle attributes
    const callCounts = () =>
      sequence.map(key => lifecycle[key].mock.callCount())

    m.render(body, pug`div(${ lifecycle })`)

    test('first render executes `oninit` & `oncreate`', () => {
      assert.deepEqual(callCounts, [1, 1, 0, 0, 0, 0])
    })

    m.render(body, pug`div(${ lifecycle })`)

    test('second render executes `onbeforeupdate` & `onupdate`', () => {
      assert.deepEqual(callCounts, [1, 1, 1, 1, 0, 0])
    })

    m.render(body, pug`div(${ lifecycle })`)

    test('third render re-executes `onbeforeupdate` & `onupdate`', () => {
      assert.deepEqual(callCounts, [1, 1, 2, 2, 0, 0])
    })

    m.render(body, pug`div(${ lifecycle })`)

    test('second render triggers `onbeforeupdate` & `onupdate`', () => {
      assert.deepEqual(callCounts, [1, 1, 2, 2, 0, 0])
    })

    m.render(body, undefined)

    test('removal executes `onbeforeremove` & `onremove`', () => {
      assert.deepEqual(callCounts, [1, 1, 2, 2, 1, 1])
    })
  })
})
