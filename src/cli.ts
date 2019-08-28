import 'colors';

import { launchProgram, loadPackageProviderDefinitions, setLoggerVerbosity } from './core/commandInitializer';

setLoggerVerbosity();

bootstrap();

async function bootstrap() {
  const definitions = await loadPackageProviderDefinitions();
  await launchProgram(definitions);
}
