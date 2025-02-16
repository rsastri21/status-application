export type Image = {
    image: string;
    width: number;
    height: number;
};

type Reaction = {
    emoji: string;
    author: string;
};

export type User = {
    username: string;
    name: string;
    email: string;
    password: string;
    profile: Image;
    salt: string;
    createdAt: number;
};

export type UserUpdate = Partial<User> & Pick<Required<User>, "username">;

export type Reply = {
    author: string;
    reply: string;
};

export type Comment = {
    author: string;
    content: string;
    replies?: Reply[];
};

export type Post = {
    username: string;
    postId: string;
    primaryImage?: Image;
    secondaryImage?: Image;
    caption: string;
    likes: number;
    reactions: Reaction[];
    comments: Comment[];
    createdAt: number;
};

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
