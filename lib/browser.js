/**
 * @overview Advanced Variables API
 * @author Ruby Allison Rose
 * @module variable-irony/browser.js
 * @summary - The browser API module; this version of the API is for browsers only.
 * @license
 * Copyright (c) 2019 Ruby Allison Rose (aka: M3TIOR)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// strict mode for optimization
'use strict'



// Internal Includes
import { superglobal } from "./universal.js";

// External Includes
//...

// Standard Includes
//...



/**
 * @constant
 * @package
 * @description - Declares a place for us to store environment variables
 *   independant of the targeted domain. This way in such cases as the browser
 *   where we don't have environment variables, we can keep the same archetecture.
 */
const env = {};


function linkEnvironmentVariable(name, initializer, scope){
	/***
	 * Test for required variables and type constraints,
	 * throwing errors when necessary.
	 */
	if (typeof name !== 'string')
		throw Error('"name" argument must be a string, not "'+typeof name+'"');

	if (initializer === null) initializer = "";
	else if (typeof initializer !== 'string')
		throw Error('"initializer" argument must be type "string" but got "'+typeof scope+'".');

	if (scope === null) scope = superglobal; // No target scope? Use global!
	else if (!Object.isObject(scope))
		throw Error('"scope" argument must be an object, not "'+typeof scope+'"');

	if (realName === null) {
		if (name.search(/(?:[a-z\d]+)(?:[A-Z][a-z\d]+)*/g)[0] === name){
			// Try parsing as camelCase for TypeScript and JavaScript
			realName = name.replace(/([A-Z])/g, "_$1").toUpperCase();
		}
		else {
			// Try parsing as snake_case for CoffeeScript
			// Or well... if a CoffeeScript user likes python and uses snake_case;
			// since I just learned CoffeeScript uses camelCase standard too...
			realName = name.toUpperCase();
		}
	}

	Object.defineProperty(scope, name, {
		get:() => env[name],
		set:(value) => env[name] = String(value),
	});
}


function createCachedVariable(name, initializer, scope){
	/***
	 * Test for required variables and type constraints,
	 * throwing errors when necessary.
	 */
	if (typeof name !== 'string')
		throw Error(`'name' argument must be a string, not '${typeof name}'.`);

	if (!initializer)
		throw Error(`'initializer' argument must be defined and was unset.`);

	if (scope === null) scope = superglobal; // No target scope? Use global!
	else if (!Object.isObject(scope))
		throw Error(`'scope' argument must be an object, not '${typeof scope}'.`);


	/***
	 *  Then we need to use the Object.defineProperty function
	 *  to attatch a psuedo variable to our specified scope
	 */
	Object.defineProperty(scope, name, {
		// said variable will contain the standard getter and setter pair
		set:(value) => {
			// from within the setter, we define a custom save event
			// to allow extra external handling for our save event.
			let LDSaveEvent = new CustomEvent("ldWrite",{
				// the variable name is dispatched through the event's detail
				// and some other data goes there as well.
				detail: {
					name: name,					// the variable name
					//previous: scope[name].valueOf(),	// the previous value
					// can't call scope[name] in here because it would
					// trigger the load event.
					value: value,				// the new value
					/* XXX: Non Standard
					 *	Function.caller is not standard and if used, should
					 *	always be tested for by applications using it.
					 *
					 * NOTE: Cannot call in strict mode
					 */
					// caller: Object.getOwnPropertyDescriptor(scope, name)
					// 	.set.caller || null // the function who saved our value
				}
			});
			// converting the saved object to a JSON string before
			// being set in localdata enables us to store native Javascript
			// values and broadens the use of our localdata
			localStorage.setItem(name, JSON.stringify(value));
			// then we dispatch the save event to our binding scope so external
			// processes can catch our saves
			this.dispatchEvent(LDSaveEvent);
		},
		get:() => {
			// first we actually have to load in the value from memory
			// just in case someone changed it behind our back.
			let value = JSON.parse(localStorage.getItem(name));
			// otherwise the load event could be fooled by an application
			// changing the value manually through localStorage.setItem
			// which would result in the ability to spoof the load events!

			// now, after retreiving the value, we'll define a custom
			// load event, so that external applications can process
			// when the variable is accessed.
			let LDLoadEvent = new CustomEvent("ldRead",{
				detail: {
					name: name,			// the variable name
					value: value,		// the current value
					/* XXX: Non Standard
					 *  Function.caller is not standard and if used, should
					 *  always be tested for by applications using it.
					 *
					 * NOTE: Cannot call in strict mode
					 */
					// caller: Object.getOwnPropertyDescriptor(scope, name)
					//  .get.caller || null // the function who loaded our value
				}
			});
			// since, we aren't modifying the value of our variable, the
			// placement of our event's dispatcher is arbitrary.
			this.dispatchEvent(LDLoadEvent);
			// but it has to come before the return...
			return value;
		}
	});
	// finally, we set our initial value for the variable if we have one.
	if (initializer !== null && localStorage.getItem(name) === null)
		// only when our saved value is unset, otherwise it defeats the purpose
		scope[name] = initializer;
}


module.exports = {
	superglobal,
	createCachedVariable,
	linkEnvironmentVariable
};
