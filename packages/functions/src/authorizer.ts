import {
    deleteSession,
    getSession,
    SESSION_EXPIRY_TIME,
    updateSession,
} from "@status-application/core/queries/sessions";
import { Session } from "@status-application/core/types";
import { Handler } from "aws-lambda";

const unauthorized = {
    statusCode: 401,
    body: { message: "Unauthorized" },
};

const validateRequest = async (
    authToken: string | undefined,
    user: string | undefined
) => {
    /**
     * Invalidate request if no auth token or user identifier is present.
     */
    if (!authToken || !user) {
        return unauthorized;
    }

    try {
        /**
         * Check DDB for a valid user session.
         */
        const sessionResponse = await getSession(user, authToken);

        if (!sessionResponse.Item) {
            return { isAuthorized: false };
        }

        const session = sessionResponse.Item as Session;

        /**
         * Check that the session is valid and delete it if not.
         * Refresh the session expiry time if halfway through.
         */
        if (session.expiresAt > Date.now()) {
            if (Date.now() >= session.expiresAt - SESSION_EXPIRY_TIME / 2) {
                await updateSession({
                    ...session,
                    expiresAt: Date.now() + SESSION_EXPIRY_TIME,
                });
            }
            return { isAuthorized: true };
        }
        await deleteSession(user, authToken);
        return { isAuthorized: false };
    } catch (error) {
        return {
            statusCode: 400,
            body: { message: "Request authorization failed", error },
        };
    }
};

export const handler: Handler = async (event, context) => {
    const authToken = event.identitySource[0];
    const user = event.identitySource[1];

    return await validateRequest(authToken, user);
};
