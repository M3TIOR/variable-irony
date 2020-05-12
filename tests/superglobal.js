/**
 *   Copyright (c) 2019 Ruby Allison Rose (aka: M3TIOR)
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 *
 *   The above copyright notice and this permission notice shall be included in all
 *   copies or substantial portions of the Software.
 *
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *   SOFTWARE.
 */


// strict mode for optimization
'use strict';



// Internal Includes
//const { superglobal } = require("../lib/universal.js");

// External Includes
const dedent = require('dedent-js');

// Standard Includes
const path = require('path');
const fs = require('fs');
const os = require('os');



const filestore = fs.mkdtempSync(path.join(os.tempdir(), "variable-irony-tests"));

// Write the files needed for testing into the memory file system
// Not using a helper because it requires more overhead and since there isn't
// much needing done here, keeping everything in one file is more ideal.
const virtualfs = {
	"set-superglobal.js": dedent(`
		const { superglobal } = require('${__dirname}/../src/universal.js');

		superglobal.test_assignment = true;
	`),
	"get-superglobal.js": dedent(`
		module.exports = global;
	`),
	"get-superglobal-noglobalref.js": dedent(`
		module.exports = test_assignment;
	`),
};



beforeAll(()=>{
	for (let [filename, content] of Object.entries(virtualfs))
		fs.writeFileSync(path.join(filestore, filename), content);

	// preload external global
	require(path.join(filestore, "set-superglobal.js"));
});

afterAll(()=>{
	// Register cleanup action.
	fs.unlinkSync(filestore);
});

describe("Superglobal Tests:", ()=>{
	test("Preserves variables across imports/requires in global scope object", ()=>{
		expect(global.test_assignment).toBeTruthy();
	});
	test("Preserves variables across imports/requires in other modules", ()=>{
		expect(require(path.join(filestore, 'get-superglobal.js')).test_assignment).toBeTruthy();
	});
	test("Allows unscoped access", ()=>{
		// eslint-disable-next-line
		expect(test_assignment).toBeTruthy();

		expect(require(path.join('get-superglobal-noglobalref.js'))).toBeTruthy();
	});
});
