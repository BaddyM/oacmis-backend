import { SetMetadata } from '@nestjs/common';

export const REQUIRES_CLEARED_FEES = 'requires_cleared_fees';

/**
 * Withhold this route (or controller) from a pupil with an outstanding fee
 * balance. Staff are unaffected — see FeesClearedGuard, which must be listed in
 * the controller's @UseGuards after AuthGuard.
 */
export const RequiresClearedFees = () => SetMetadata(REQUIRES_CLEARED_FEES, true);
