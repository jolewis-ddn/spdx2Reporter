/* jshint node: true */

/*
 * Usage:
 * `node app.js filename.rdf licensePrefixToRemove`
 */

const debug = require('debug')('sax');

const fs = require('fs');
const strict = true;
const options = {};

var saxStream = require("sax/lib/sax").createStream(strict, options);

const globalFilePrefix = process.argv[3] || "";

let infile = false;
let infilename = false;
let filename = "";

let lic = [];

let currTag = "";

saxStream.on("error", function(e) {
	// unhandled errors will throw, since this is a proper node
	// event emitter.
	console.error("error!", e);
	// clear the error
	this._parser.error = null;
	this._parser.resume();
});

saxStream.on("opentag", (node) => {
	// same object as above
	currTag = node.name;
	switch (node.name) {
		case 'spdx:hasFile':
			infile = true;
			break;
		case 'spdx:fileName':
			infilename = true;
			break;
		case 'spdx:licenseInfoInFile':
			debug(`in licenseInfoInFile for ${filename}`);
			if (infile && filename) {
				lic.push(node.attributes['rdf:resource'].replace('http://spdx.org/licenses/', ''));
				debug(`pushing to lic for ${filename}`);
			}
			break;
		default:
			// no-op
			break;
	}
});

saxStream.on("closetag", (node) => {
	switch (node) {
		case 'spdx:hasFile':
			debug(`leaving hasFile ${lic.length}`);
			if (lic.length > 0) {
				console.log(`${filename}\t${lic.join('\t')}`);
				lic = [];
			}
			infile = false;
			filename = "";
			break;
		case 'spdx:fileName':
			infilename = false;
			break;
		default:
			infilename = false;
			break;
	}
});

saxStream.on("text", (t) => {
	if (infilename && t.trim().length > 0) {
		filename = t.trim().substring(globalFilePrefix.length);
		debug(`setting filename to ${filename}`);
	}
});

fs.createReadStream(process.argv[2])
	.pipe(saxStream);
