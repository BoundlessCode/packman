import { EOL } from 'os';
import fs from 'fs';

export const endOfLine = EOL;

export function saveToFile(tarballs: string[], outputFile: string) {
    fs.writeFileSync(outputFile, tarballs.join(endOfLine));
}
