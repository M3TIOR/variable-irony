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
const { linkEnvironmentVariable, superglobal } = require(`../../src/index.js`);

// External Includes
const dedent = require('dedent-js');

// Standard Includes
const subprocess = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');


const filestore = fs.mkdtempSync(path.join(os.tmpdir(), "variable-irony-tests"));


function levhelp(binding, real, def, env){
	let args = [];
	if (binding) args.push(`-b${binding}`);
	if (real) args.push(`-r${real}`);
	if (def) args.push(`-d${def}`);

	return new Promise((resolve, reject) => {
		let proc = subprocess.execFile(
			"tests/helpers/linkEnvironmentVariable.js", args,
			{
				env: Object.assign(env, process.env)
			},
			(error, stdout, stderr) => {
				if (error)
					reject(error);

				resolve({stdout, stderr});
			}
		);
	});
}

beforeAll(()=>{
	// Register cleanup action.
	process.on('exit', () => fs.unlinkSync(filestore));
});


describe("LinkEnvironmentVariable API Function - Platform Dependent", ()=>{
	test("Reads environment correctly", ()=>{
	 	Object.assign(process.env, {README: "PASSED"});
		linkEnvironmentVariable("readme", null);
		expect(superglobal["readme"]).toBe("PASSED");
	});
	// TODO: Implement as platform specific tests.
	// test("Sets environment correctly", ()=>{
	// 	linkEnvironmentVariable("setme", null);
	// });
	test("Default works correctly", ()=>{
		linkEnvironmentVariable("defme", null, "PASSED");
		expect(superglobal["defme"]).toBe("PASSED");
	});
	test("Accepts camelCase assignment translation", async () => {
		let tcc = await levhelp("testCamelCase", null, "DEFAULT", { TEST_CAMEL_CASE: "PASSED" });
		let tc = await levhelp("testCamel", null, "DEFAULT", { TEST_CAMEL: "PASSED" });
		let t = await levhelp("test", null, "DEFAULT", { TEST: "PASSED" });

		expect(tcc.stdout).toBe("PASSED");
		expect(tc.stdout).toBe("PASSED");
		expect(t.stdout).toBe("PASSED");
	});
	test("Accepts snake_case assignment translation", async () => {
		let tsc = await levhelp("test_snake_case", null, "DEFAULT", { TEST_SNAKE_CASE: "PASSED" });
		let ts = await levhelp("test_snake", null, "DEFAULT", { TEST_SNAKE: "PASSED" });
		let t = await levhelp("test", null, "DEFAULT", { TEST: "PASSED" });

		expect(tsc.stdout).toBe("PASSED");
		expect(ts.stdout).toBe("PASSED");
		expect(t.stdout).toBe("PASSED");
	});
	test("Accepts alternate variable name assignment", async ()=>{
		let tt = await levhelp("test_snake_case", "ALTY", "DEFAULT", { ALTY: "PASSED" });

		expect(tt.stdout).toBe('PASSED');
	});
});

describe("createCachedVariable API Function - Platform Dependent", ()=>{
	test("Reads cache after restart correctly", ()=>{});
	test("Reads cache after restart correctly", ()=>{});
	test("Reads cache after restart correctly", ()=>{});
	test("Reads cache after restart correctly", ()=>{});
	test("Reads cache after restart correctly", ()=>{});
	test("Reads cache after restart correctly", ()=>{});
});
