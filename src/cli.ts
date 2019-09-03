import 'colors';

import { logger } from './core/logger';
import { launchProgram, loadPackageProviderDefinitions, setLoggerVerbosity } from './core/commandInitializer';

setLoggerVerbosity();

bootstrap();

async function bootstrap() {
  logger.debug('bootstrap: starting');
  const definitions = await loadPackageProviderDefinitions();
  logger.debug('bootstrap: launching');
  await launchProgram(definitions);
  logger.debug('bootstrap: done');
}
