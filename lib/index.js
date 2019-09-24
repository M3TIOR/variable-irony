/**
 * @overview Advanced Variables API
 * @author Ruby Allison Rose
 * @module variable-irony
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

// Needed for execution check.
import { superglobal } from "./universal.js";


// Check if we're running in the browser or not.
// This works because in browsers the global 'this' variable has a self
// reference called 'window'. This self reference is not existent in Node.
/** @package @constant */
const isBrowser = this.window === superglobal;

var api = null;

if (isBrowser)
	api = require("./browser.js");
else
	api = require("./node.js");


// Bootstrap Environment Specific API.
module.exports = api;
