import { defineConfig } from '@playwright/test';
import base, { PERF_TESTS } from './playwright.config';

/**
 * Lasttests (Bildrate mit 500 Ständen, M3-23): nur `*perf.spec.ts`, seriell mit einem Worker, damit
 * keine parallel laufenden Browser die Messung verfälschen. Aufruf: `npm run test:perf`.
 */
export default defineConfig({
  ...base,
  testIgnore: undefined,
  testMatch: PERF_TESTS,
  fullyParallel: false,
  workers: 1,
  retries: 0,
});
