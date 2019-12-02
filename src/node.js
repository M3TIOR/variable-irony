/**
 * @file variable-irony/node.js
 * @author Ruby Allison Rose
 * @summary The node API module; this version of the API is for NodeJS only.
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
const fs = require('fs');
const os = require('os');
const path = require('path');



/**
 * @constant
 * @package
 * @summary - A constant assignment containing the location of our data store.
 */
const dataStore = (
	process.env.APPDATA || // WINDOWS, should always be full path.
	os.platform() !== "win32" && os.homedir() ?
			path.join( os.homedir(), process.platform == 'darwin' ?
					'Library/Preferences' : // MAC OS
					'.local/share' /* LINUX, ANDROID, SUNOS */ ) :
	fs.mkdtempSync(path.join(os.tmpdir(), "variable-irony.datastore.tmp.")) // Environment shield.
);

/**
 * @constant
 * @package
 * @description Declares a place for us to cache variables for saving in NodeJS.
 */
const persistent_cache_path = path.join(dataStore, "irony-cache.json");
const temporary_cache_path
const memory_cache = {};



/**
 * @public
 * @function linkEnvironmentVariable
 * @param {string} name - The Environment Variable name spelled as it is natively.
 * @param {(string|null)} [realName=null] - Overrides the name of the Environment Variable natively.
 * @param {(string|null)} [initializer=""] - A default value for the variable when it's unset.
 * @param {object} [scope=superglobal] - The scope in which the variable will be defined.
 *
 * @description Defines a cross-platform way to work with environment
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
 */
function linkEnvironmentVariable(name, realName, initializer, scope){

	if ( name && name.length == null )
		throw Error(`"name" argument cannot be empty.`);

	if ( realName && ! realName.length )
		throw Error(`"realName" argument cannot be empty.`);

	if (initializer == null) initializer = "";
	if (scope == null) scope = superglobal; // No target scope? Use global!

	if (realName == null) {
		if (name.match(/(?:[\da-z]+)(?:[A-Z][\da-z]+)*/g)[0] === name){
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
		get:() => process.env[realName],
		set:(value) => process.env[realName] = String(value),
	});

	if (scope[name] == null)
		scope[name] = String(initializer);

	return realName;
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
 *   // Creates a saved variable in the global scope by the name of "kip".
 *   createCachedVariable("kip", false);
 *   console.log(kip); // prints "false";
 *
 * @example <caption>Example of variable assignment within an object scope.</caption>
 *   // Create the scope in which we want the variable stored.
 *   const container = {};
 *   // ...
 *   createCachedVariable("kip", true, container);
 *   console.log(container.kip); // prints "true";
 *
 * @example <caption>Setting the persistent variable and proof.</caption>
 *   // Simply assign a value to the variable
 *   kip = "A string full of things that makes me sing!"
 *   console.log(kip); // A string full of ...
 *
 *   // Restart the browser
 *   console.log(kip); // A string full of ...
 */
function createCachedVariable(name, initializer, scope){
	/***
	 * Test for required variables and type constraints,
	 * throwing errors when necessary.
	 */
	if ( ! name.length ) throw Error(`'name' argument cannot be empty.`);
	if ( scope == null ) scope = superglobal; // No target scope? Use global!


	Object.defineProperty(scope, name, {
		// said variable will contain the standard getter and setter pair
		set:(value) => {

			/**
			 * @event ldWrite
			 * @type {object}
			 * @property {string} name - The variable name the value is assigned to.
			 * @property {*} value - The value of the variable being saved.
			 * @description Dispatched to the container object whenever the cache is
			 *   written to.
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
			 * @description Dispatched to the container object whenever the cache is
			 *   read from.
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

function trySaveToDisk(object, location){
	try{
		// Check that we have access to our cache object just in case we don't.
		// These are on separate lines so we can conditionally handle
		// each use case.
		if ( fs.existsSync(location) ) {
			fs.accessSync(location, fs.constants.R_OK);
			fs.accessSync(location, fs.constants.W_OK);
		}
		else {
			fs.mkdirSync()
		}

		for (let event of ['exit', 'SIGTERM', 'SIGINT', 'SIGHUP', ]) {
			// @ts-ignore
			process.on(event, ()=>{ // (code)
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
				fs.writeFileSync(cache_path, JSON.stringify(cache), {encoding: "UTF-8"});

				// Remove temporary data store.
				if ( dataStore.startsWith(os.tmpdir()) ) {
					let remaining = fs.readdirSync(dataStore, { withFileTypes: true })
						.map(dirent => dirent.name = path.join(dataStore, dirent.name));

					for (let dirent of remaining) {
						if ( dirent.isDirectory() ) {
							let contents = fs.readdirSync(dirent.name, { withFileTypes: true })
								.map(dirent => dirent.name = path.join(dataStore, dirent.name));

							if ( contents.length )
								remaining.push.apply( null, contents.concat([dirent]));
							else
								fs.rmdirSync(current_dir);
						}
						else {
							fs.unlinkSync(dirent.name);
						}

						remaining_dirents.shift();
					}
					fs.rmdirSync(dataStore);
				}
			});
		}

		if ( fs.existsSync(cache_path) ) {
			let loaded = JSON.parse(fs.readFileSync(cache_path, {encoding: "UTF-8"}));
			Object.assign(cache, loaded);
		}

		// ensure our temporary data store is available when we need it.
		if ( dataStore.startsWith(os.tmpdir()) )
			fs.mkdirSync(dataStore, { recursive: true });
	}
	catch (err) {
		console.error(err);

		// switch (lineNumber){
		// case "252": // Must match line number of accessSync Readable check.
		// 	console.error(`Cannot read cache data from disk: ${err.message}`);
		// case "253": // Must match line number of accessSync Writable check.
		// 	// If we cannot read just assume we cannot write for data integrity.
		// 	console.warn(`Cannot write to cache. Any cache data written will not be saved durring this session.`);
		// break; // eslint-disable-line
		//
		// default:
		// 	throw Error(`Unknown access error signature: ${lineNumber}`);
		// }
	}
}
}

/**
 * @public
 * @function IronicEnvironment
 * @param {object} defaults - An object containing values to be garranteed
 *   set in the global environment upon initialization.
 *
 * @description - A proxy scope generator for environment variables.
 *   Initially, we were planning on making this more fully featured, with added
 *   support for environment encapsulation and other "usefull" things. But we
 *   realized that the only current use for an operating environment is at the
 *   operating system level, there's no use for it in the browser currently.
 *   So now, this API feature is implemented as a platform independent way of
 *   accessing and modifying environment variables.
 */
class IronicEnvironment extends Proxy {
	constructor(defaults) {
		if (typeof settings !== "object")
			throw Error(`Expected 'overrides' object be of type 'object' but got '${typeof overrides}.'`);

		// Sanitize the overrides so they comply with environment variable standards;
		for ( variable in settings.overrides )
			overrides[variable] = String(overrides[variable]);

		// copy process.env variables overtop overrides and re-assign global.
		process.env = Object.assign(overrides, process.env);

		super(process.env, {
			set:(target, property, value, reciever) => {
				// Also sanitize the newly passed variables upon set.
				target[property] = String(value);
				return value;
			}
			get:(target, property, reciever) => {
				return target[property];
			}
		});
	}
}

/**
 * @public
 * @function SessionIrony
 *
 * @description - A proxy scope generator for cached data. Used to create
 *   a session cache object which can be added to instantaniously from
 *   within javascript, and will be available until application reload.
 *
 */
class SessionIrony extends Proxy {
	constructor() {
		let session_cache = {};

		super(session_cache, {
			set:(target, property, value, reciever) => {
				reciever.dispatchEvent(CacheWriteEvent(property, value));
				target[property] = value;
				return value;
			}
			get:(target, property, reciever) => {
				reciever.dispatchEvent(CacheReadEvent(property, target[property]));
				return target[property];
			}
		});
	}
}

/**
 * @public
 * @function PersistentIrony
 *
 * @description - A proxy scope generator for cached data. Used to create
 *   a persistent storage object which can be added to instantaniously from
 *   within javascript, and will be available after application reload with
 *   the same states from previous runs.
 *
 */
class PersistentIrony extends Proxy{
	constructor(nameOLoc, saveFrequencyMS) {
		let cache = {};

		if (saveFrequencyMS != null) {
			let intSaveFrequencyMS = parseInt(saveFrequencyMS);
			if (! isNaN(intSaveFrequencyMS)) {
				let saveTimerLoop = function(){

				};

				while (true) {
					// Use while loop to recur over try catch statement,
					// this way error logging doesn't get potentially screwed.
					let iv = null;
					try { iv = setInterval(saveTimerLoop, intSaveFrequencyMS); }
					catch(error) {

					}
				}
			}
			else {

			}
		}
		else { // null / undefined
			// Only save upon close / shutdown.
		}

		super(cache, {
			set:(target, property, value, reciever) => {
				reciever.dispatchEvent(CacheWriteEvent(property, value));
				target[property] = value;
				return value;
			}
			get:(target, property, reciever) => {
				reciever.dispatchEvent(CacheReadEvent(property, target[property]));
				return target[property];
			}
		});
}



// Execute On-Load



module.exports = {
	superglobal,
	createCachedVariable,
	linkEnvironmentVariable
};
