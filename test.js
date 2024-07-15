import assert         from 'node:assert'
import {describe, it} from 'node:test'

import {html}    from 'common-tags'
import lexer     from 'pug-lexer'
import parser    from 'pug-parser'

import './mock_dom.js'

import m   from 'mithril'
import pug from './index.js'

const htmlOf = vdom => {
  m.render(window.document.body, vdom)

  delete window.document.body.vnodes

  return window.document.body.innerHTML
}

const assertHtmlParity = (...vdom) =>
  assert.equal(...vdom.map(htmlOf))

describe('static input', () => {
  describe('single elements', () => {
    it('plain', () => {
      assertHtmlParity(
        pug`br`,

        m(`br`),
      )
    })

    it('shorthand class', () => {
      assertHtmlParity(
        pug`.class`,

        m(`.class`),
      )
    })

    it('shorthand id', () => {
      assertHtmlParity(
        pug`#id`,

        m(`#id`),
      )
    })

    it('verbose attributes', () => {
      assertHtmlParity(
        pug`link(rel='stylesheet' href='/style.css')`,

        m(`link[rel='stylesheet'][href='/style.css']`),
      )
    })

    it('shorthand boolean attributes', () => {
      assertHtmlParity(
        pug`input(checked disabled)`,

        m(`input[checked][disabled]`),
      )
    })

    it('inline text', () => {
      assertHtmlParity(
        pug`p Some text`,

        m(`p`, `Some text`),
      )
    })

    it('kitchen sink', () => {
      assertHtmlParity(
        pug`p#id.class1.class2(class='class3' foo=bar boolean) Some text`,

        m(`p#id.class1.class2[class="class3"][foo="bar"][boolean]`, `Some text`),
      )
    })
  })

  describe('structured content', () => {
    it('block text', () => {
      assertHtmlParity(
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

    it('pipe text', () => {
      assertHtmlParity(
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

    it('adjacent elements', () => {
      assertHtmlParity(
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

    it('nested elements', () => {
      assertHtmlParity(
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

    it('inline elements', () => {
      assertHtmlParity(
        pug`h1: a(href='example.com') Nested link `,

        m(`h1`, m(`a[href=example.com]`, `Nested link`)),
      )
    })
  })
})

describe('interpolations', () => {
  describe('primitives', () => {
    it('inline text', () => {
      assertHtmlParity(
        pug`p ${ 'Hello' }`,

        m(`p`, `Hello`),
      )
    })
  })
})
