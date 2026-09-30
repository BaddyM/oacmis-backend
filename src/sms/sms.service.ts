import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

// EgoSMS (Pahappa) JSON API. One endpoint serves every method; the body's
// `method` picks SendSms or Balance. Credentials are the EgoSMS account login.
//
//   EGOSMS_USERNAME / EGOSMS_PASSWORD   required
//   EGOSMS_SENDER_ID                    optional, must be approved on the account
//   EGOSMS_API_URL                      optional, e.g. the sandbox URL for testing
const DEFAULT_API_URL = 'https://www.egosms.co/api/v1/json/';

// Messages per SendSms request. EgoSMS accepts a msgdata array; keeping batches
// modest means one rejected request doesn't take a whole school's blast with it.
const BATCH_SIZE = 50;

export interface SmsMessage {
    phone: string;
    message: string;
}

export interface SmsSendResult {
    sent: number;
    failed: number;
    cost: number;
    // Distinct gateway error messages, for showing the user why sends failed.
    errors: string[];
    // Numbers dropped before sending because they aren't valid Ugandan mobiles.
    invalid: string[];
}

interface EgoResponse {
    Status?: string;
    Message?: string;
    Cost?: number | string;
    MsgFollowUpUniqueCode?: string;
    Balance?: number | string;
}

/**
 * Normalise a Ugandan phone number to the 256XXXXXXXXX form EgoSMS expects.
 * Accepts 07XXXXXXXX, 7XXXXXXXX, +256…, 256… and tolerates spaces/dashes.
 * Returns null for anything that isn't a 9-digit national mobile number.
 */
export function normaliseUgPhone(raw: string | null | undefined): string | null {
    if (!raw) return null;
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('256')) digits = digits.slice(3);
    else if (digits.startsWith('0')) digits = digits.slice(1);
    if (!/^7\d{8}$/.test(digits)) return null;
    return `256${digits}`;
}

@Injectable()
export class SmsService {
    private readonly logger = new Logger(SmsService.name);

    constructor(private readonly prisma: PrismaService) { }

    isConfigured() {
        return Boolean(process.env.EGOSMS_USERNAME && process.env.EGOSMS_PASSWORD);
    }

    private assertConfigured() {
        if (!this.isConfigured()) {
            throw new ServiceUnavailableException(
                'SMS is not set up. Add EGOSMS_USERNAME and EGOSMS_PASSWORD to the server environment.',
            );
        }
    }

    private async call(body: Record<string, unknown>): Promise<EgoResponse> {
        const res = await fetch(process.env.EGOSMS_API_URL || DEFAULT_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...body,
                userdata: {
                    username: process.env.EGOSMS_USERNAME,
                    password: process.env.EGOSMS_PASSWORD,
                },
            }),
            signal: AbortSignal.timeout(30_000),
        });
        if (!res.ok) throw new Error(`EgoSMS returned HTTP ${res.status}`);
        return (await res.json()) as EgoResponse;
    }

    /** The school's name from Settings → School Profile, to sign off parent messages. */
    async schoolName(): Promise<string> {
        const row = await this.prisma.appSetting.findUnique({ where: { key: 'school_profile' } });
        const name = (row?.value as { name?: unknown } | null)?.name;
        return typeof name === 'string' && name.trim() ? name.trim() : 'School';
    }

    /** Account credit in UGX, straight from EgoSMS. */
    async balance(): Promise<number> {
        this.assertConfigured();
        const res = await this.call({ method: 'Balance' });
        if (res.Status !== 'OK') {
            throw new ServiceUnavailableException(res.Message || 'Could not read the SMS balance');
        }
        return Number(res.Balance) || 0;
    }

    /**
     * Send one or more messages and log every one of them to SmsLog.
     * Never throws for gateway rejections — those come back as `failed` so a
     * caller (e.g. a sick bay visit) can save its own record regardless.
     */
    async send(messages: SmsMessage[], source: string, sourceId?: string): Promise<SmsSendResult> {
        this.assertConfigured();
        const result: SmsSendResult = { sent: 0, failed: 0, cost: 0, errors: [], invalid: [] };

        const valid: SmsMessage[] = [];
        for (const m of messages) {
            const phone = normaliseUgPhone(m.phone);
            if (phone) valid.push({ phone, message: m.message });
            else result.invalid.push(m.phone);
        }

        const senderid = process.env.EGOSMS_SENDER_ID || undefined;
        for (let i = 0; i < valid.length; i += BATCH_SIZE) {
            const batch = valid.slice(i, i + BATCH_SIZE);
            let status: 'sent' | 'failed' = 'failed';
            let error: string | undefined;
            let cost = 0;
            let providerRef: string | undefined;
            try {
                const res = await this.call({
                    method: 'SendSms',
                    msgdata: batch.map((m) => ({
                        number: m.phone,
                        message: m.message,
                        ...(senderid ? { senderid } : {}),
                        priority: '0',
                    })),
                });
                if (res.Status === 'OK') {
                    status = 'sent';
                    cost = Number(res.Cost) || 0;
                    providerRef = res.MsgFollowUpUniqueCode;
                } else {
                    error = res.Message || 'Rejected by EgoSMS';
                }
            } catch (err) {
                error = err instanceof Error ? err.message : 'Could not reach EgoSMS';
                this.logger.warn(`EgoSMS send failed: ${error}`);
            }

            if (status === 'sent') {
                result.sent += batch.length;
                result.cost += cost;
            } else {
                result.failed += batch.length;
                if (error && !result.errors.includes(error)) result.errors.push(error);
            }

            // EgoSMS prices the batch as a whole; spread it evenly so each log
            // row carries its share.
            const each = batch.length ? cost / batch.length : 0;
            await this.prisma.smsLog.createMany({
                data: batch.map((m) => ({
                    phone: m.phone,
                    message: m.message,
                    source,
                    sourceId: sourceId ?? null,
                    status,
                    cost: status === 'sent' ? each : null,
                    providerRef: providerRef ?? null,
                    error: error ?? null,
                })),
            });
        }

        return result;
    }
}
