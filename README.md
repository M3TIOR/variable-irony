# variable-irony
A pseudo-variable library for managing cached data and environment variables.

By irony I'm of course referring to this definition in which we are the characters:
> A literary technique, originally used in Greek tragedy,
> by which the full significance of a character's words or
> actions are clear to the audience or reader although unknown to the character.

A long time ago in a young mind far away, I had an idea. I was going to make
make a variable that referenced the LocalStorage API somehow. I needed it for
my website and I desperately needed more experience with JavaScript.
You're staring at the result. It's not a large library, nor is it very
feature-full, but it does what I want. Cached variables, and Environment
variables by proxy.

For the full documentation you may direct your browsers ... To this markdown
because I don't have my website finished yet. :confetti_ball: Yay! :expressionless:
:confetti_ball:

Due to my also incomplete consensus project, this thing is not spectrum tested
and may break upon use so please be weary of that and submit bug reports
when and if you can. I'd really appreciate it.

On to the code:

## THE MODULE!
As of right now, the library is pretty simple. It only has a few functions
and a single constant which you may find below. I designed this library
originally for the browser alone, but decided to port it when trying to find
a suitable library to use for Environment Variable management in NodeJS.
To keep both platforms operating as fast as possible, I split them into two
files. The API described here applies to both platforms, but each platform has
it's own specific optimizations. For use with browsers, you may want to directly
link `variable-irony/browser.js` into your project. For NodeJS specifically
you can use `variable-irony/node.js`. The index of this library will work for
directing you to the appropriate version in either use case, however it packs
some extra overhead while loading so I'd recommend against it. The browser
specific version of this library can also be found minified in the dist branch
for static webpages and userscripts.

* [variable-irony](#variable-irony)
    * [superglobal](#superglobal)
    * [linkEnvironmentVariable(name, [realName], [initializer], [scope])](#linkEnvironmentVariable)
    * [createCachedVariable(name, initializer, [scope])](#createCachedVariable)
    * ["ldWrite"](#event_ldWrite)
    * ["ldRead"](#event_ldRead)


## Constants

<a name="superglobal"></a>
### superglobal
**Kind**: global constant  
**Access**: public  
**Summary**:
A constant universal global scope binding.

## Functions

<a name="linkEnvironmentVariable"></a>
### linkEnvironmentVariable(name, [realName], [initializer], [scope])
Defines a cross-platform way to work with environment
variables. Naturally in the browser, said environment variables
are non-existent by default, This makes it easy to keep an API convention
between both platforms. Removes the NodeJS scope nonsense that makes
refferencing them a small pain. For convention adhearence, by default
&quot;realName&quot; is unset, and will be deduced by the API upon definition
based on your variable name assignment. At the moment only camelCase
and snake_case are supported this way since they're the most common
variable naming conventions regardless of the fact that Javascript's
style guide recommends camelCase for special use cases such as
in CoffeeScript. Environment Variables are assumed to be case insensitive
by default and are bouund to their UPPERCASE counterparts for
legacy / DOS support since most native Environment Variables in Linux
also follow this convention but this can be overriden by passing the
realName argument. Also supports the &quot;scope&quot; argument which works the
same as in &quot;createCachedVariable&quot;

**Kind**: function  
**Access**: public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | <code>string</code> |  | <p>The Environment Variable name spelled as it is natively.</p> |
| [realName] | <code>string</code> \| <code>null</code> | <code>null</code> | <p>Overrides the name of the Environment Variable natively.</p> |
| [initializer] | <code>string</code> \| <code>null</code> | <code>&quot;\&quot;\&quot;&quot;</code> | <p>A default value for the variable when it's unset.</p> |
| [scope] | <code>object</code> | <code>superglobal</code> | <p>The scope in which the variable will be defined.</p> |

**Example** *(Environment variable binding.)*  
```js
  // Links the environment variable "LD_LIBRARY_PATH" to ldLibraryPath
  // Natively this variable is set to "LD_LIBRARY_PATH=/usr/lib/libsomelib.so"
  linkEnvironmentVariable("ldLibraryPath");
  console.log(ldLibraryPath); // prints "/usr/lib/libsomelib.so"
  // or
  linkEnvironmentVariable("ld_library_path");
  console.log(ld_library_path); // prints "/usr/lib/libsomelib.so"

  // Note that in the browser this would print the default initializer
  // since the browser doesn't have a default environment exchange.
  console.log(ldLibraryPath);// from the browser prints ""
```

<a name="createCachedVariable"></a>
### createCachedVariable(name, initializer, [scope])
Simplifies the process of reading and setting saved variables
by creating a custom variable type that when accessed refferences
a LocalStorage held item when in the browser, or a json cached
item in NodeJS. Note that the two events this function is registered to
fire are actually fired when the respective variable is set and retrieved.
Said events are fired from the scope the variable is attatched to.
So don't get any bright ideas and think you can catch the event from
the variable itself. Because that would be dumb ~~and exactly what I wanted it to do~~. In both instances,
variables stored are serialized as json objects so function assignments
are prohibited.

**Kind**: function  
**Emits**: <code>event:ldWrite</code>, <code>event:ldRead</code>  
**Access**: public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | <code>string</code> |  | <p>The new variable name.</p> |
| initializer | <code>\*</code> |  | <p>A json serializable value for the variable when it's unset.</p> |
| [scope] | <code>object</code> | <code>superglobal</code> | <p>The scope in which the variable will be defined.</p> |

**Example** *(Global variable assignment.)*  
```js
  // Creates a saved variable in the global scope by the name of "kip".
  createCachedVariable("kip", false);
  console.log(kip); // prints "false";
```
**Example** *(Variable assignment within an object scope.)*  
```js
  // Create the scope in which we want the variable stored.
  const container = {};
  // ...
  createCachedVariable("kip", true, container);
  console.log(container.kip); // prints "true";
```
**Example** *(Setting the persistent variable and proof.)*  
```js
  // Simply assign a value to the variable
  createCachedVariable("kip", true);
  if (kip === true)
  	kip = "A string full of things that makes me sing!";
  console.log(kip); // A string full of ...

  // Restart the browser
  //...
  console.log(kip); // A string full of ...
```

## Events

<a name="event_ldWrite"></a>
### "ldWrite"
Dispatched to the container object whenever the cache is
written to.

**Kind**: event emitted
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | <p>The variable name the value is assigned to.</p> |
| value | <code>\*</code> | <p>The value of the variable being saved.</p> |


<a name="event_ldRead"></a>
### "ldRead"
Dispatched to the container object whenever the cache is
read from.

**Kind**: event emitted  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | <p>The variable name the value is assigned to.</p> |
| value | <code>\*</code> | <p>The value of the variable being loaded.</p> |
