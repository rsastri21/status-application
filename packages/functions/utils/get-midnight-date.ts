export const getMidnightEpoch = (): number => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset date to midnight
    return now.getTime();
};
