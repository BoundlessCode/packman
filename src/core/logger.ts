import pino, { Logger as PinoLogger } from 'pino';
// @ts-ignore TS2307: Cannot find module '@boco/pino-pretty'
import prettifier from '@boco/pino-pretty';

import processLevel from './log-processors/processLevel';

declare module "pino" {
  type NamedProcessor = string;
  interface AppliedProcessor {
    parse(input: any, context: any): any;
    build(lineParts: any, options: { prettified: { level: any; }; }): void;
  }
  type Processor = NamedProcessor | AppliedProcessor;

  interface PrettyOptions {
    processors?: Processor[]
    skipObjectKeys?: string[]
  }
}

const processors = [
  processLevel,
  'semicolon',
  'message',
  'eol',
  'error',
  'object'
];

export const logger = pino({
  prettyPrint: {
    processors,
    skipObjectKeys: ['command', 'area', 'method', 'entry', 'package', 'path'],
  },
  level: 'info',
  // @ts-ignore error TS2345: Argument of type '{ prettyPrint: { processors: (string | { parse(input: any, context: any): any; build(lineParts: any, { prettified: { level } }: { prettified: { level: any; }; }): void; })[]; skipObjectKeys: string[]; }; level: string; prettifier: any; }' is not assignable to parameter of type 'WritableStream | Writable | Duplex | Transform | SonicBoom | LoggerOptions | undefined'. Object literal may only specify known properties, and 'prettifier' does not exist in type 'WritableStream | Writable | Duplex | Transform | SonicBoom | LoggerOptions'.
  prettifier,
});

export type Logger = PinoLogger;

export type LoggerOptions = {
  logger: Logger
}

logger.debug(`logger initialized, level: ${logger.level}`);

export function setLoggerVerbosity() {
  if (process.argv.indexOf('--verbose') > -1) {
    logger.level = 'debug';
  }
}
