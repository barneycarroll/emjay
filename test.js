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
  it('elements', () => {
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

  it('renders ID + className selectors', {skip: true}, () => {
    assert.deepStrictEqual(
      pug`#foo.bar.baz`,

      m('#foo.bar.baz'),
    )
  })
})
