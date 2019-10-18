/**
 * @file variable-irony/universal.js
 * @author Ruby Allison Rose
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


// the superglobal object is and will always be the global scope binding,
// no matter where it's bound to, both in nodejs and browser js.
// This is accomplished with a self executing function that abuses the
// default global scope of a function when declared by the Function constructor.
/**
 * @public
 * @global
 * @constant
 * @summary - A constant universal global scope binding.
 */
const superglobal = (new Function("return this;"))();


module.exports = { superglobal };