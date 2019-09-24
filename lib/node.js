/**
 * @overview Advanced Variables API
 * @author Ruby Allison Rose
 * @module variable-irony/node.js
 * @summary - The node API module; this version of the API is for NodeJS only.
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
const fs = require('fs');
const path = require('path');



// Unnecessary in the browser.
/**
 * @constant
 * @package
 * @summary - A constant assignment containing the location of our data store.
 */
const appdata = process.env.APPDATA || ( // WINDOWS
	process.platform == 'darwin' ?
		process.env.HOME + 'Library/Preferences' : // MAC OS
		process.env.HOME + "/.local/share" // LINUX, ANDROID, SUNOS
);

/**
 * @constant
 * @package
 * @description - Declares a place for us to cache variables for saving in NodeJS.
 */
const cache_path = path.join(appdata, "irony-cache.json");
const cache = null;



/**
 * @public
 * @function linkEnvironmentVariable
 * @param {string} name - The Environment Variable name spelled as it is natively.
 * @param {string, null} [realName=null] - Overrides the name of the Environment Variable natively.
 * @param {sting, null} [initializer=""] - A default value for the variable when it's unset.
 * @param {object} [scope=superglobal] - The scope in which the variable will be defined.
 *
 * @description - Defines a cross-platform way to work with environment
 *   variables. Naturally in the browser, said environment variables
 *   are non-existent by default, This makes it easy to keep an API convention
 *   between both platforms. Removes the NodeJS scope nonsense that makes
 *   refferencing them a small pain. For convention adhearence, by default
 *   "realName" is unset, and will be deduced by the API upon definition
 *   based on your variable name assignment. At the moment only camelCase
 *   and snake_case are supported this way since they're the most common
 *   variable naming conventions regardless of the fact that Javascript's
 *   style guide recommends camelCase for special use cases such as
 *   in CoffeeScript. Environment Variables are assumed to be case insensitive
 *   by default and are bouund to their UPPERCASE counterparts for
 *   legacy / DOS support since most native Environment Variables in Linux
 *   also follow this convention but this can be overriden by passing the
 *   realName argument. Also supports the "scope" argument which works the
 *   same as in "createCachedVariable"
 *
 * @example <caption>Example binding assignment.</caption>
 *   ```javascript
 *   // Links the environment variable "LD_LIBRARY_PATH" to ldLibraryPath
 *   // Natively this variable is set to "LD_LIBRARY_PATH=/usr/lib/libsomelib.so"
 *   linkEnvironmentVariable("ldLibraryPath");
 *   console.log(ldLibraryPath); // prints "/usr/lib/libsomelib.so"
 *   // or
 *   linkEnvironmentVariable("ld_library_path");
 *   console.log(ld_library_path); // prints "/usr/lib/libsomelib.so"
 *
 *   // Note that in the browser this would print the default initializer
 *   // since the browser doesn't have a default environment exchange.
 *   console.log(ldLibraryPath);// from the browser prints ""
 *   ```
 */
function linkEnvironmentVariable(name, realName, initializer, scope){
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

	/***
	 * Presumed Nodejs environment since I don't know of any other JS
	 * technologies where this script would be applicable.
	 *
	 * @todo - ensure proper environment assignment for each NodeJS version.
	 */
	if (!process.env)
		throw new Error(`Process environment invalid: ${process.env}`);

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
		get:() => process.env[name],
		set:(value) => process.env[name] = String(value),
	})
}


/**
 * @public
 * @function createCachedVariable
 * @param {string} name - The new variable name.
 * @param {*} initializer - A json serializable value for the variable when it's unset.
 * @param {object} [scope=superglobal] - The scope in which the variable will be defined.
 * @fires scope#ldSave
 * @fires scope#ldLoad
 *
 * @description - Simplifies the process of reading and setting saved variables
 *   by creating a custom variable type that when accessed refferences
 *   a LocalStorage held item when in the browser, or a json cached
 *   item in NodeJS. Note that the two events this function is registered to
 *   fire are actually fired when the respective variable is set and retrieved.
 *   Said events are fired from the scope the variable is attatched to.
 *   So don't get any bright ideas and think you can catch the event from
 *   the variable itself. Because that would be dumb. In both instances,
 *   variables stored are serialized as json objects so function assignment
 *   will not work.
 *
 * @example <caption>Example global variable assignment.</caption>
 *   ```javascript
 *   // Creates a saved variable in the global scope by the name of "kip".
 *   createCachedVariable("kip", false);
 *   console.log(kip); // prints "false";
 *   ```
 *
 * @example <caption>Example of variable assignment within an object scope.</caption>
 *   ```javascript
 *   // Create the scope in which we want the variable stored.
 *   const container = {};
 *   // ...
 *   createCachedVariable("kip", true, container);
 *   console.log(container.kip); // prints "true";
 *   ```
 *
 * @example <caption>Setting the persistent variable and proof.</caption>
 *   ```javascript
 *   // Simply assign a value to the variable
 *   kip = "A string full of things that makes me sing!"
 *   console.log(kip); // A string full of ...
 *
 *   // Restart the browser
 *   console.log(kip); // A string full of ...
 *   ```
 */
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


	Object.defineProperty(scope, name, {
		// said variable will contain the standard getter and setter pair
		set:(value) => {

			/**
			 * @event ldWrite
			 * @type {object}
			 * @property {string} name - The variable name the value is assigned to.
			 * @property {*} value - The value of the variable being saved.
			 */
			let LDSaveEvent = new CustomEvent("ldWrite",{
				// the variable name is dispatched through the event's detail
				// and some other data goes there as well.
				detail: {
					name: name,
					value: value,
				}
			});

			// Use cache instead of browser LocalStorage API.
			cache[name] = value;
			this.dispatchEvent(LDSaveEvent);
		},
		get:() => {
			let value = cache[name];

			/**
			 * @event ldRead
			 * @type {object}
			 * @property {string} name - The variable name the value is assigned to.
			 * @property {*} value - The value of the variable being loaded.
			 */
			let LDLoadEvent = new CustomEvent("ldRead",{
				detail: {
					name: name,			// the variable name
					value: value,		// the current value
				}
			});

			this.dispatchEvent(LDLoadEvent);
			return value;
		}
	});
	// finally, we set our initial value for the variable if we have one.
	if (initializer !== null && cache[name] !== undefined)
		// Test for undefined instead of null because the LocalStorage API is
		// responsible for generating the null return.
		scope[name] = initializer;
}



// Execute On-Load
try{
	// Check that we have access to our cache object just in case we don't.
	// These are on separate lines so we can conditionally handle
	// each use case.
	fs.accessSync(cache_path, fs.constants.R_OK);
	fs.accessSync(cache_path, fs.constants.W_OK);

	for (let event of ['exit', 'SIGTERM', 'SIGINT', 'SIGHUP', ]) {
		process.on(event, (code)=>{
			/**
			 * @package
			 * @listens exit
			 * @listens SIGTERM
			 * @listens SIGINT
			 * @listens SIGHUP
			 * @description - Captures the before exit event to flush cache to disk.
			 *
			 * @todo - Maybe catch SIGHUP in own event that spawns detatched
			 *   background process to finish writing to the cache.
			 * @todo - Pass through SIGTERM & SIGINT default behavior because
			 *   catching those signals destroys the default event catch.
			 */
			fs.writeFileSync(appdata, JSON.stringify(cache), {encoding: "UTF-8"});
		});
	}

	cache = fs.readFileSync(cache_path, {encoding: "UTF-8"});
}
catch (err) {
	let lineNumber = err.stackTrace.split("at")[1].match(/.*(\d+):\d+$/)[1];
	switch (lineNumber){
		case "252": // Must match line number of accessSync Readable check.
			console.error(`Cannot read cache data from disk: ${err.message}`);

		case "253": // Must match line number of accessSync Writable check.
			// Create temporary empty cache.
			cache = {};
			// If we cannot read just assume we cannot write for data integrity.
			console.warning(`Cannot write to cache. Any cache data written will not be saved durring this session.`);
		break;

		default:
			throw Error(`Unknown access error signature: ${lineNumber}`);
	}
}


module.exports = {
	superglobal,
	createCachedVariable,
	linkEnvironmentVariable
};
