import { SetMetadata } from '@nestjs/common';
import type { PageKey } from './page-access';

export const REQUIRES_PAGE_KEY = 'requires_page';

/**
 * Restrict a route (or a whole controller) to users who can open at least one
 * of the listed pages. Read by PagePermissionsGuard, which runs after AuthGuard.
 *
 * List every page whose screen legitimately needs this data — the check is an
 * OR. A controller with no decorator is unrestricted beyond authentication,
 * which is right for reference data and self-service endpoints.
 */
export const RequiresPage = (...pages: PageKey[]) => SetMetadata(REQUIRES_PAGE_KEY, pages);

/**
 * Opt a single route out of a controller-level @RequiresPage. Used for
 * self-service endpoints (`/students/me/...`) that a pupil must reach even
 * though the rest of the controller is staff-only — they return only the
 * caller's own data, so page access is the wrong question to ask.
 */
export const SelfServiceRoute = () => SetMetadata(REQUIRES_PAGE_KEY, []);
