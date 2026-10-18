const processShutdownEvents = {
    signals: process,
    stdin: process.stdin,
};
/** Register the process events that request shutdown and return their owner. */
export const registerProcessShutdown = (handler, events = processShutdownEvents) => {
    events.signals.on("SIGINT", handler);
    events.signals.on("SIGTERM", handler);
    events.stdin.on("end", handler);
    events.stdin.on("close", handler);
    return () => {
        events.signals.off("SIGINT", handler);
        events.signals.off("SIGTERM", handler);
        events.stdin.off("end", handler);
        events.stdin.off("close", handler);
    };
};
