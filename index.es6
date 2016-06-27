import pugLexer  from 'pug-lexer'
import pugParser from 'pug-parser'
import { html }  from 'common-tags'

const attrs_to_hash = attrs => {
  const hash = {}

  for( const i = 0; i < attrs.length; i++ )
    hash[attrs[i].name] = attrs[i].val

  return hash
}

const pug_to_vdom = ( { type, attrs, nodes, block, name, val } ) => {
  if( type == 'Block' )
    return nodes.map( pug_to_vdom )

  if( type == 'Tag' )
    return  {
      tag      : name,
      attrs    : attrs_to_hash( attrs ),
      children : block.nodes.map( pug_to_vdom )
    }

  return val || ''
}

export default ( ...input ) =>
  pug_to_vdom( pugParser( pugLexer( html( ...input ) ) ) )
