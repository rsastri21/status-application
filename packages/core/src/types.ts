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

export type UserUpdate = Partial<User> & Pick<Required<User>, "username">;

export type Relationship = {
    username: string;
    friend: string;
    isPending: boolean;
    requester: string;
    createdAt: number;
};

export type Session = {
    username: string;
    sessionId: string;
    createdAt: number;
    expiresAt: number;
};
