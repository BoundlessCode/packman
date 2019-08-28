import { EOL as endOfLine } from 'os';
import fs from 'fs';

import { LoggerOptions } from '../../../core/logger';
import { retrieveFile } from '../../../core/uri-retriever';

export function saveToFile(tarballs: string[], outputFile: string) {
    fs.writeFileSync(outputFile, tarballs.join(endOfLine));
}

type ReadFromFileOptions = LoggerOptions & {
}

export async function readFromFile(uri: string, { logger }: ReadFromFileOptions): Promise<string[]> {
    const text = await retrieveFile(uri, { logger });
    return text.toString().split(endOfLine);
}
