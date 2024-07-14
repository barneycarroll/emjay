import assert         from 'node:assert'
import {describe, it} from 'node:test'

import {html}    from 'common-tags'
import lexer     from 'pug-lexer'
import parser    from 'pug-parser'

import './mock_dom.js'

import m   from 'mithril'
import pug from './index.js'

const htmlOf= vdom => {
  m.render(window.document.body, vdom)

  delete window.document.body.vnodes

  return window.document.body.innerHTML
}

describe('static input', () => {
  describe('single elements', () => {
    it('plain', () => {
      assert.equal(
        htmlOf(
          pug`br`
        ),

        htmlOf(
          m(`br`)
        ),
      )
    })

    it('shorthand class', () => {
      assert.equal(
        htmlOf(
          pug`.class`
        ),

        htmlOf(
          m(`.class`)
        ),
      )
    })

    it('shorthand id', () => {
      assert.equal(
        htmlOf(
          pug`#id`
        ),

        htmlOf(
          m(`#id`)
        ),
      )
    })

    it('verbose attributes', () => {
      assert.equal(
        htmlOf(
          pug`link(rel='stylesheet' href='/style.css')`
        ),

        htmlOf(
          m(`link[rel='stylesheet'][href='/style.css']`)
        ),
      )
    })

    it('shorthand boolean attributes', () => {
      assert.equal(
        htmlOf(
          pug`input(checked disabled)`
        ),

        htmlOf(
          m(`input[checked][disabled]`)
        ),
      )
    })

    it('inline text', () => {
      assert.equal(
        htmlOf(
          pug`p Some text`
        ),

        htmlOf(
          m(`p`, `Some text`)
        ),
      )
    })

    it('kitchen sink', () => {
      assert.equal(
        htmlOf(
          pug`p#id.class1.class2(class='class3' foo=bar boolean) Some text`
        ),

        htmlOf(
          m(`p#id.class1.class2[class="class3"][foo="bar"][boolean]`, `Some text`)
        ),
      )
    })
  })

  describe('structured content', () => {
    it('block text', () => {
      assert.equal(
        htmlOf(pug`p.
                     Blocks

                     of text
        `),

        htmlOf(m(`p`,
                    `Blocks`,
                    `\n\n`,
                    `of text`,
        )),
      )
    })

    it('pipe text', () => {
      assert.equal(
        htmlOf(pug`p
                     | Piped
                     | text
        `),

        htmlOf(m(`p`,
                    `Piped`,
                    `\n`,
                    `text`,
        )),
      )
    })

    it('pipe text', () => {
      assert.equal(
        htmlOf(pug`p
                     | Piped
                     | text
        `),

        htmlOf(m(`p`,
                    `Piped`,
                    `\n`,
                    `text`,
        )),
      )
    })

    it('adjacent elements', () => {
      assert.equal(
        htmlOf(pug`
          p Element one
          p Element two
        `),

        htmlOf([
          m(`p`, `Element one`),
          m(`p`, `Element two`),
        ]),
      )
    })

    it('nested elements', () => {
      assert.equal(
        htmlOf(pug`
          ol
            li
              ol
                li 1.1
                li 1.2
            li
              ol
                li 2.1
                li 2.2
        `),

        htmlOf(
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
        ),
      )
    })

    it('inline elements', () => {
      assert.equal(
        htmlOf(pug`h1: a(href='example.com') Nested link `),

        htmlOf(m(`h1`, m(`a[href=example.com]`, `Nested link`))),
      )
    })
  })
})
