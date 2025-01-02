export type User = {
    username: string;
    name: string;
    email: string;
    password: string;
    profile: {
        image: string;
        width: number;
        height: number;
    };
    salt: string;
    createdAt: number;
};
