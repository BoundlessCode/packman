import 'colors';

import { logger, setLoggerVerbosity } from './core/logger';
import { launchProgram, loadPackageProviderDefinitions } from './core/commandInitializer';

setLoggerVerbosity();

bootstrap();

async function bootstrap() {
  logger.debug('bootstrap: starting');
  const definitions = await loadPackageProviderDefinitions();
  logger.debug('bootstrap: launching');
  await launchProgram(definitions);
  logger.debug('bootstrap: done');
}
