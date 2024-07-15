// @ts-check
import lex           from 'pug-lexer'
import parse         from 'pug-parser'
import walk          from 'pug-walk'
import {stripIndent} from 'common-tags'

/**
 * Mithril types
 * @typedef {import("mithril").VnodeDOM} Vnode
 * @typedef {import("mithril").Children} Vdom
 *
 * Our own internal types
 * @typedef {(...args: any[]) => Vdom} Template
 */

/**
 * Used to pass a plain string to Pug lexer & parser,
 * then replaced with interpolations in Mithril vdom construction.
 */
const substitutionPrefix = 'emjay_substitution'
const substitutionRegExp = /emjay_substitution(\d+)/dg

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
 * @arg {TemplateStringsArray} strings
 * @returns {Template}
 */
export function construct(strings){
  let dynamism = strings.length - 1

  // Optimal path: no substitutions,
  // entire vtree is processed once, cached, and returned directly
  if(dynamism === 0){
    const vdom = process(strings[0])

    return function idempotentTemplate(){
      return vdom
    }
  }

  /** @type {string} */
  let string = strings[dynamism]

  for(let i = dynamism - 1; i >= 0; i--)
    string = /** @type {string} */ (strings.at(i) + substitutionPrefix + i + string)

  const vdom = process(string)

  return function dynamicTemplate(interpolations){
    return substitute(vdom, interpolations)
  }
}

/**
 * Takes a Pug source string and passes through the necessary steps to produce Mithril virtual DOM
 * @arg {string} string
 * @returns {Vnode}
 **/
function process(string){
  // @ts-expect-error
  // Don't understand why Typescript can't parse the reducer logic here
  return [stripIndent, lex, parse, transform].reduce((input, visitor) => visitor(input), string)
}

/**
 * Converts a Pug abstract syntax tree object into a Mithril virtual DOM tree
 * @arg {object} ast
 * @returns {Vnode}
 */
function transform(ast){
  return walk(ast,
    function before(){},
    function after(node, replace){
      // Pug parser is eagerly creates redundant Blocks
      // (ie 'fragments' ie groups of adjacent nodes)
      // Much of the time they can be replaced with their contents
      if(node.type === 'Block'){
        // If a block has no contents, simply remove it
        if(!node.nodes?.length)
          replace()

        // We needn't express a Block if we can simply express an array
        else if(replace.arrayAllowed)
          replace(node.nodes)

        // A single child should take the place of the Block expression
        else if(node.nodes.length === 1)
          replace(node.nodes[0])

        // Other cases are legitimate :)
        else
          replace(vnode('[', node.nodes))
      }
      else if(node.type === 'Text'){
        replace(vnode('#', node.val))
      }
      else if(node.type === 'Tag'){
        replace(
          vnode(
            node.name,

            // More Block / fragment unwrapping
            node.block ? node.block?.tag === '[' ? node.block.children : [node.block] : undefined,

            attribute(node.attrs),
          )
         )
      }
    },
  )
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
    // For some reason, Pug double-quotes shorthand ids and classes
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
 * Shorthand function for creating
 * @arg {undefined | string}         [tag]
 * @arg {undefined | string | array} [children]
 * @arg {undefined | object}         [attrs]
 * @returns {Vnode}
 */
function vnode(tag, children, attrs){
  return {
    /** @type {undefined | string} */
    // @ts-expect-error
    // Mithril type can allow components - out of scope for template runtime
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
    // @ts-expect-error
    // Mithril type expects dom assignment - out of scope for template runtime
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
 * @typedef {(vnode: Vnode, replace: (vnode: Vnode) => {}) => {}} Visitor
 */

/**
 * Iterate through Mithril vtree with the same API as Pug AST walker
 * @arg {Vnode} input
 * @arg {any[]} interpolations
 * @returns {Vnode}
 */
function substitute(input, interpolations){
  // We need to create new objects in order to comply with Mithrils diffing algorithm
  const output = {...input}

  // Any kind of vdom interpolation will be encoded as a mere text substitution
  if(typeof input.children === 'string'){
    const text = input.children

    if(substitutionRegExp.test(input.children)){
      // ...So we explode the children into an array and replace piecemeal
      const matches  = Array.from(input.children.matchAll(substitutionRegExp))
      const children = []

      let lastIndex = 0

      for(const match of matches){
        children.push(
          text.substring(lastIndex, match['indices'].at(0).at(0))
        )
        children.push(
          interpolations.at(Number(match.at(1)))
        )

        lastIndex = match['indices'].at(0).at(1)
      }

      children.push(
        text.substring(lastIndex)
      )

      output.children = children
    }
  }
  else if(Array.isArray(input.children)){
    output.children = input.children.map(child => substitute(child, interpolations))
  }

  if(input.attrs){
    const attrs = {}

    attributeLoop: for(let [key, value] of Object.entries(input.attrs)){
      if(substitutionRegExp.test(key)){
        const interpolation = interpolations.at(
          Number(/** @type {RegExpExecArray} */(substitutionRegExp.exec(key)).at(1))
        )

        if(value === true){
          if(typeof interpolation === 'function' && interpolation.name){
            attrs[interpolation.name] = interpolation
          }
          else if(typeof interpolation === 'object'){
            for(const [key, value] of interpolation){
              attrs[key] = value
            }
          }
          else {
            attrs[key] = true
          }

          // Subsitution complete, move on
          continue attributeLoop
        }
        else {
          key = interpolation
        }
      }

      // Simple case, mere value interpolation
      if(substitutionRegExp.test(value)){
        output.attrs[key] = interpolations.at(
          Number(/** @type {RegExpExecArray} */(substitutionRegExp.exec(value)).at(1))
        )
      }
      // No substitution
      else {
        output.attrs[key] = value
      }
    }

    output.attrs = attrs
  }

  return output
}
