#!/usr/bin/env node
declare class MCPStdioServer {
    private logger;
    private walletServerUrl;
    constructor();
    start(): Promise<void>;
    private handleMessage;
    private handleInitialize;
    private handleToolsList;
    private handleToolCall;
    private executeToolCall;
    private callWalletAPI;
    private sendResponse;
    private shutdown;
}
export { MCPStdioServer };
//# sourceMappingURL=stdio-server.d.ts.map