/**
 * This module imports a fast and good-enough DOM mock library
 * to allow integration tests to work.
 *
 * It does not export aything: importing the module will setup
 * one faked DOM environment and expose parts of it as globals –
 * but only inasmuch as is necessary to make Mithril register
 * it correctly (we don't need to completely polute the runtime
 * with 100% faked browser globals).
*/

import {parseHTML} from 'linkedom'

const {window} = parseHTML('...')

/*
 * Mithril expects a globally available `requestAnimationFrame` in
 * order to make redraw scheduling work. An honest polyfill would
 * emulate the ascynchronous nature of the function, but we don't
 * need to test for asynchronous DOM vagaries, so we make it instant
 * for much simpler testing.
 *
 * This means standard m.redraw() calls and procedural triggers
 * (bound event handler execution) will cause synchronous redraws:
 * complex tests can be written without worrying about race conditions.
 */
const requestAnimationFrame = callback => {
  callback()
}

Object.assign(globalThis, {window, requestAnimationFrame})
