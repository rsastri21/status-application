import { sha256 } from "@oslojs/crypto/sha2";
import {
    encodeBase32LowerCaseNoPadding,
    encodeHexLowerCase,
} from "@oslojs/encoding";

export const generateSessionToken = (): string => {
    const bytes = new Uint8Array(20);
    crypto.getRandomValues(bytes);
    const token = encodeBase32LowerCaseNoPadding(bytes);
    return token;
};

export const getSessionIdFromToken = (token: string): string => {
    const sessionId = encodeHexLowerCase(
        sha256(new TextEncoder().encode(token))
    );
    return sessionId;
};
