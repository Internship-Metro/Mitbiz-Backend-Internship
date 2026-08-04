/**
 * src/common/middlewares/logger.middleware.ts
 *
 * TUJUAN: Log setiap HTTP request yang masuk ke server.
 * Berguna untuk monitoring dan debugging.
 *
 * Format log (development): GET /api/v1/products 200 45ms
 * Format log (production): format singkat, tanpa detail yang tidak perlu
 *
 * CARA PAKAI: sudah disetup di app.ts via app.use(morganLogger)
 */

import morgan from 'morgan';
import { env } from '@config/env';

// 'dev' = format berwarna untuk development: METHOD URL STATUS TIME
// 'combined' = format Apache standard untuk production (lebih detail, cocok untuk log aggregator)
export const morganLogger = morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined');
