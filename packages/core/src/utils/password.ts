import crypto from "crypto";

const ITERATIONS = 10000;

export function getSalt() {
    return crypto.randomBytes(128).toString("base64");
}

export async function hashPassword(plainTextPassword: string, salt: string) {
    return new Promise<string>((resolve, reject) => {
        crypto.pbkdf2(
            plainTextPassword,
            salt,
            ITERATIONS,
            64,
            "sha512",
            (err, derivedKey) => {
                if (err) reject(err);
                resolve(derivedKey.toString("hex"));
            }
        );
    });
}

export async function verifyPassword(
    plainTextPassword: string,
    salt: string,
    password: string
) {
    const hash = await hashPassword(plainTextPassword, salt);
    return hash === password;
}
