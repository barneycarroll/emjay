import {parseHTML} from 'linkedom'

const {window} = parseHTML('...')

Object.assign(globalThis, {window})
