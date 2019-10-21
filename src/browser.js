/**
 * @file variable-irony/browser.js
 * @author Ruby Allison Rose
 * @description The browser API module.
 *   This version of the API is for browsers only and features browser specific
 *   optimizations. It's also hosted as a minified package via the dist branch
 *   of the git repo for easy access from non-webpack pages.
 *
 *
 *   For more information please see the variable-irony/node.js module which
 *   contains the primary documentation.
 * @license
 *   <p><strong>Copyright (c) 2019 Ruby Allison Rose (aka: M3TIOR)</strong></p>
 *
 *   <p>
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   <ul style="list-style-type: disc;">
 *     <li>
 *       The above copyright notice and this permission notice shall be included in all
 *       copies or substantial portions of the Software.
 *     </li>
 *
 *     <li>
 *       THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *       IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *       FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *       AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *       LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *       OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *       SOFTWARE.
 *     </li>
 *   </ul></p>
 */

// strict mode for optimization
'use strict';



// Internal Includes
const { superglobal } = require("./universal.js");

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


/**
 * @param {string} name - The Environment Variable name spelled as it is natively.
 * @param {(string|null)} [realName=null] - Overrides the name of the Environment Variable natively.
 * @param {(string|null)} [initializer=""] - A default value for the variable when it's unset.
 * @param {object} [scope=superglobal] - The scope in which the variable will be defined.
 */
function linkEnvironmentVariable(name, realName, initializer, scope){
	// leave type checking for the linter

	// At least check that the name and realName values are not empty.
	if ( name && name.length == null )
		throw Error(`"name" argument cannot be empty.`);

	if ( realName && ! realName.length )
		throw Error(`"realName" argument cannot be empty.`);

	if ( initializer == null ) initializer = ""; // lazy equivalence for null is okay.
	if ( scope == null ) scope = superglobal; // No target scope? Use global!

	if (realName == null) {
		if (name.match(/(?:[a-z\d]+)(?:[A-Z][a-z\d]+)*/g)[0] === name){
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
		get:() => env[realName],
		set:(value) => env[realName] = String(value),
	});

	// finally, we set our initial value for the variable if we have one.
	if ( scope[name] == null )
		// only when our saved value is unset, otherwise it defeats the purpose
		scope[name] = initializer;

	return realName;
}


function createCachedVariable(name, initializer, scope){

	if ( ! name.length ) throw Error(`'name' cannot be empty.`);
	if ( scope === null ) scope = superglobal; // No target scope? Use global!

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
