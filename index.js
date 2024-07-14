// @ts-check
import lex           from 'pug-lexer'
import parse         from 'pug-parser'
import walk          from 'pug-walk'
import {stripIndent} from 'common-tags'

/**
 * Mithril types
 * @typedef {import("mithril")} Vnode
 * @typedef {import("mithril")} Component
 * @typedef {import("mithril")} ChildArrayOrPrimitive
 * @typedef {Vnode | ChildArrayOrPrimitive} Vdom
 *
 * Our own internal types
 * @typedef {(...args: any[]) => Vdom} Template
 */

/**
 * String prefix for temporary substitution placeholders.
 * Used to pass a plain string to Pug lexer & parser,
 * then replaced with interpolations in Mithril vdom construction.
 */
const sPrefix = 'emjay_substitution_'
const rPrefix = new RegExp('^' + sPrefix + '(\\d+)$')

/**
 * Cache Pug lexing and parsing per template
 * @type {WeakMap.<TemplateStringsArray, Template>}
 */
const templates = new WeakMap

/**
 * Convert a Pug template literal into Mithril virtual DOM
 * @arg {TemplateStringsArray} strings
 * @arg {any[]}                interpolations
 * @returns {Vdom}
 */
export default function emjay(strings, ...interpolations){
  if(!templates.has(strings)){
    var template = construct(strings)

    templates.set(strings, template)
  }
  else {
    var template = /** @type {Template} */ (templates.get(strings))
  }

  return template(interpolations)
}

/**
 * @arg {undefined | string}         [tag]
 * @arg {undefined | string | array} [children]
 * @arg {undefined | object}         [attrs]
 * @returns m.Vnode
 */
function vnode(tag, children, attrs){
  return {
    /** @type {undefined | string | Component} */
    tag      : tag,
    /** @type {undefined | string | number} */
    key      : attrs?.key,
    /** @type {object} */
    attrs    : attrs,
    /** @type {undefined | string | array} */
    children : children,
    /** @type {undefined | string} */
    text     : undefined,
    /** @type {undefined | Node} */
    dom      : undefined,
    /** @type {undefined | number} */
    domSize  : undefined,
    /** @type {undefined | object} */
    state    : undefined,
    /** @type {undefined | object} */
    events   : undefined,
    /** @type {undefined | Vdom} */
    instance : undefined,
  }
}

/**
 * @arg {array} attributes
 * @returns {object | undefined}
*/
function attribute(attributes){
  if(!attributes.length)
    return

  const dict    = {}
  const classes = new Set

  for(let {name, val} of attributes){
    if(typeof val === 'string' && val.startsWith(`'`) && val.endsWith(`'`))
      val = val.slice(1, -1)

    if(name === 'class')
      classes.add(val)

    else
      dict[name] = val
  }

  if(classes.size)
    dict.className = Array.from(classes.values()).join(' ')

  return dict
}

/**
 * @arg {TemplateStringsArray} strings
 * @returns {Template}
 */
export function construct(strings){
  let dynamism = strings.length - 1

  if(dynamism === 0){
    const tokens = lex(stripIndent(strings[0]))

    const ast    = parse(tokens)

    const vdom   = walk(ast,
      function before(){},
      function after(node, replace){
        if(node.type === 'Block'){
          if(!node.nodes?.length){
            replace()
          }
          else if(replace.arrayAllowed){
            replace(node.nodes)
          }
          else {
            replace(vnode('[', node.nodes))
          }
        }
        else if(node.type === 'Text'){
          replace(vnode('#', node.val))
        }
        else if(node.type === 'Tag'){
          replace(
            vnode(
              node.name,
              node.block ? node.block?.tag === '[' ? node.block.children : [node.block] : undefined,
              attribute(node.attrs.concat(node.attributeBlocks))
            )
           )
        }
      },
    )

    return function idempotentTemplate(){
      return vdom
    }
  }

  // 1. Flatten template input to a plain string with substition markers for interpolations
  /** @type {string} */
  let string   = strings[dynamism]

  // The backwards iteration method is computationaly simpler
  for(let i = dynamism; i > 0; i--)
    string = /** @type {string} */ (strings.at(i) + sPrefix + i + string)

  // 2. Tokenize the string
  const tokens = lex(string)

  // 2.1. While making semantic insertions to qualify templated interpolations
  for(let i = 0; i < tokens.length; i++){
    const token = tokens[i]
  }

  // 3. Convert the qualified Pug AST into Mithril vDOM
  const ast     = parse(string)

  return function template(){
    return ast
  }
}
