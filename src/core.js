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
// const ps = require('ps-node'); (will probs make my own native lib for this)

// Standard Includes
const fs = require('fs');
const os = require('os');
const path = require('path');




let persistentDataStore = null;
let temporaryDataStore = null;
const metadataSignature = new RegExp([
		t`^I(?<knownInstance>\d+)`,
		t`T(?<startTime>\d+)`,
		t`PID(?<pid>\d+)`,
		t`-.*`,
	].join("") // for once I don't need the global flag.
);
const rhetoricRegistry = new Map();



/**
 * @package
 * @summary - creates a temporary data store using the identity provided.
 */
function getTemporaryDataStore(options){
	if (temporaryDataStore != null) return temporaryDataStore;

	const programExtension = path.extname(process.argv0);
	const programName = path.basename(process.argv0, programExtension);

	// TODO: perhaps use package name via package.json first instead of path.

	const defaults = {
		// Options passed directly to the getTemporaryDataStore
		programName,
		attemptRecovery: false,
	};

	options = Object.assign(options, {
		// assign default arguments
		attemptRecovery: false, // will be disabled until further notice.
	});

	const tmpdir = os.tmpdir(); // slightly quicker than calling the native twice.
	const { username } = os.userInfo(); // get from OS Userinfo (cross platform)
	const pid = process.pid.toString();
	let kI = 0;

	// if (options.attemptRecovery == true) {
	// 	const recoveryOptions = fs.readDirSync(tmpdir);
	// 		.map((dirname) => {
	// 			const progusersignature = `${programname}U${username}`;
	// 			if (dirname.startsWith(progusersignature)) {
	// 				const identityMetadata = dirname.slice(progusersignature.length);
	// 				const result = identityMetadata.match(metadataSignature);
	//
	// 				if (result[0] === dirname) return result.groups;
	// 			}
	// 		})
	// 		.filter((signature)=>{
	//
	// 		});
	//
	// 	for (const dir of recoveryOptions) {
	//
	// 	}
	// }
	// else if (typeof options.attemptRecovery === 'string') {
	// 	return path.join(tmpdir, options.attemptRecovery);
	// }

	const time = Date.now();
	const identity = `${programname}U${username}I${kI}T${time}PID${pid}-`;
	return fs.mktmpdir(path.join(tmpdir, identity));
}

/**
 * @package
 * @summary - creates the persistent data store using the identity provided.
 */
function getPersistentDataStore(options){
	if (persistentDataStore != null)
		return persistentDataStore;

	const programExtension = path.extname(process.argv0);
	const programName = path.basename(process.argv0, programExtension);

	const defaults = {
		// Options passed directly to the getTemporaryDataStore
		programName,
		strict: false,
		temporaryFallbackOptions:{ programName, attemptRecovery: true },
	};

	// Assign default arguments, overwrite them with passed options.
	options = Object.assign(defaults, options);

	// Try not to allocate the result memory unless we need it.
	let resultPath = null;
	if (process.env.APPDATA) {
		// Winderps has to be the only one to break the Posix standard...
		resultPath = path.join(process.env.APPDATA, options.options.programName);
	}
	else {
		const homedir = os.homedir();

		if (homedir) {
			const platform = os.platform();

			if (platform === 'win32')
				resultPath = path.join(homedir, options.programName);
			else if (platform === 'darwin') // MAC OS
				resultPath = path.join(homedir, 'Library/Preferences', options.programName);
			else /* LINUX, ANDROID, SUNOS */
				resultPath = path.join(homedir, '.local/share', options.programName);
		}
		else {
			// TODO: improve this error reporting with an error type instantiator
			//   that will improve the available methods for error handling.
			if (strict)
				throw "Could not find the persistent Data Store.";

			// As a fallback, if for some reason we can't find the persistent
			// data store, use the temporary one instead. (only when strict is disabled)
			return persistentDataStore = getTemporaryDataStore(options.temporaryFallbackOptions);
		}
	}

	// assignment fallthrough (Should == resultPath)
	return persistentDataStore = os.mkdirSync(resultPath, { recursive: true });
}

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

class Metacommunication extends EventEmitter {
	constructor() {
		super(); // Initialize EventEmitter features
		this._context = {};

		this._revocable = Proxy.revocable(this._context, {
			set:(target, property, value, reciever) => {
				//console.log(`target: ${target}\n property: ${property}\n value: ${value}\nreciever: ${reciever}`);
				//reciever.dispatchEvent(CacheWriteEvent(property, value));
				this.emit("writing-irony", property, value);
				target[property] = value;
				return value;
			},
			get:(target, property, reciever) => {
				//console.log(`target: ${target}\n property: ${property}\nreciever: ${reciever}`);
				//reciever.dispatchEvent(CacheReadEvent(property, target[property]));
				const value = target[property];
				this.emit("reading-irony", property, value);
				return value;
			}
		});

		this.store = this._revocable.proxy;
	}

	revoke() {
		// You don't want to be funny the right way!? Well too fuckin' bad!
		this.emit("revoking-irony");
		this._revokable.revoke();
	}
}

/**
 * @public
 * @function TemporaryRhetorical
 *
 * @description - A proxy scope generator for cached data. Used to create
 *   a cache object which will last until the operating system is rebooted.
 */
class TemporaryRhetorical extends Metacommunication {
	constructor(name, options) {
		super(); // other things

		// Optional argument permutations.
		if (options.dataStore == null) {
			options.dataStore = getTemporaryDataStore({
				programName: options.programName,
			});
		}

		if (options.serializer == null) {
			options.serializer = JSON;
		}

		this.name = name;
		this.fileLocation = path.join(options.dataStore, `${this.name}.irony`);
		this.serializer = options.serializer;
		this.saveFrequency = options.saveFrequency;

		this._iv = null;
		const saveFN = this.save.bind(this);
		if (typeof this.saveFrequency === 'integer') {
			this._iv = setInterval(saveFN, this.saveFrequency);
		}
		else if (typeof this.saveFrequency === 'string') {
			if (this.saveFrequency === "on-write") {
				this.on("writing-irony", this.save);
				this._iv = true;
			}
		}
		else {
			this._iv = false;
		}

		// TODO:
		//   attempt reload after I get the temporary store recovery feature
		//   up and running. (That's a way down the line).
	}

	async save(){
		const ivType = typeof this._iv;

		// Publishing even happens outside the safety query because otherwise
		// it may break things.
		this.emit("publishing-irony");

		if (ivType !== 'undefined') {
			const data = this.serializer.stringify(this._context);
			const options = {}; // just in case we need to edit these later.

			fs.writeFile(this.fileLocation, data, options, (err) => {
				if (err) {
					if (this._iv == true) {
						if (typeof this._iv === 'integer')
							clearInterval(this._iv);
						else if (typeof this._iv === 'boolean' && this._iv === true)
							this.removeListener('writing-irony', this.save);

						console.error(`Stopping save loop for rhetorical '${this.name}';`);
					}

					console.error(`An error occured: ${err.message}.`);
					console.error(`Saving rhetorical '${this.name}' is now disabled.`)
					this._iv = null;
				}
			});
		}
	}
}

function makeTemporaryIrony(name, options) {
	const rhetorical = new TemporaryRhetorical(name, options);
	rhetoricRegistry.set(manager.store, rhetorical);
	return {store: rhetorical.store, rhetorical};
}


export default {
	superglobal,
	createCachedVariable,
	linkEnvironmentVariable,

}
