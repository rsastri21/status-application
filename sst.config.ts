/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
    app(input) {
        return {
            name: "status-application",
            removal: input?.stage === "production" ? "retain" : "remove",
            home: "aws",
        };
    },
    async run() {
        await import("./infra/storage");
        await import("./infra/database");
        await import("./infra/api");
    },
});
