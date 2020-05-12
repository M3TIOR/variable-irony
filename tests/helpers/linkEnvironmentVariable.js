#!/usr/bin/env node
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

'use-strict';

const { linkEnvironmentVariable, superglobal } = require('../../src/index.js');
const { ArgumentParser } = require('argparse');

const parser = new ArgumentParser({addHelp: false});
// Do~n't~ need to test variable assignments here; ~it's handled in the core test.~
// This external script is used to isolate the ENV from the parent process.
parser.addArgument(["-b"], { nargs: "?", type: String }); // sets target env bind name.
parser.addArgument(["-r"], { nargs: "?", type: String }); // sets target env real name.
parser.addArgument(["-d"], { nargs: "?", type: String }); // sets the default value.
// Variable set testing is handled in the core test as well.
const args = parser.parseArgs();

linkEnvironmentVariable(args.b, args.r, args.d);

// Just this method alone; accessing the variable is a sufficient get test.
process.stdout.write(superglobal[args.b]);
