const endOfLine = require('os').EOL;
const fs = require('fs');
const { retrieveFile } = require('../../core/uri-retriever');

/**
 * @param { string[] } tarballs 
 * @param { string } outputFile 
 */
function saveToFile(tarballs, outputFile) {
    fs.writeFileSync(outputFile, tarballs.join(endOfLine));
}

/**
 * @param { string } uri
 * @returns { Promise<string[]> }
 */
async function readFromFile(uri, { logger }) {
    const text = await retrieveFile(uri, { logger });
    return text.toString().split(endOfLine);
}

module.exports = {
    saveToFile,
    readFromFile
}