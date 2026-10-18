import { lstat, stat } from "node:fs/promises";
import { sameRegularFileState, RegularFileChangedError, RegularFileOperationCancelled, assertRegularFileActive, } from "../filesystem/RegularFile.js";
import { RegularFileCleanupFailure, RegularFileCancelled, withOwnedRegularFile, } from "../filesystem/OwnedRegularFile.js";
import { readBoundedFileBytes } from "../process/BoundedFileBytes.js";
export class InvalidUtf8FileError extends TypeError {
    path;
    _tag = "InvalidUtf8FileError";
    constructor(path, cause) {
        super(`File is not valid UTF-8: ${path}`, { cause });
        this.path = path;
        this.name = this._tag;
    }
}
export { RegularFileCleanupFailure } from "../filesystem/OwnedRegularFile.js";
/** Retry a failed close through its retained owner and report any remaining cleanup. */
export const retryRegularFileCleanup = async (failure, resources, signal) => {
    const outcome = failure.outcome.kind === "failed" &&
        failure.outcome.cause instanceof RegularFileOperationCancelled &&
        !(signal?.aborted === true && failure.outcome.cause === signal.reason)
        ? { kind: "failed", cause: failure.outcome.cause.reason }
        : failure.outcome;
    const released = await resources.release({
        kind: "file-handle",
        handle: failure.owner,
        resource: failure.path,
    });
    if (released.kind === "released")
        return { outcome };
    return {
        outcome,
        cleanup: {
            reason: `${failureMessage(failure.cleanupCause)}; retry: ${failureMessage(released.cause)}`,
            resources: [failure.path],
        },
    };
};
/** Retry every explicit nested operation owner; close rejection values grant no authority. */
export const retryRegularFileCleanupFailures = async (failure, resources) => {
    const failures = [];
    const observations = [];
    let current = failure;
    let primary;
    for (;;) {
        failures.push(current);
        const retried = await retryRegularFileCleanup(current, resources);
        if (retried.cleanup !== undefined)
            observations.push(retried.cleanup);
        primary =
            retried.outcome.kind === "failed"
                ? retried.outcome.cause
                : current.cleanupCause;
        const nested = current.outcome.kind === "failed" ? current.outcome.cause : undefined;
        if (!(nested instanceof RegularFileCleanupFailure))
            break;
        current = nested;
    }
    return {
        primary,
        failures,
        ...(observations.length === 0
            ? {}
            : {
                cleanup: {
                    reason: observations.map(({ reason }) => reason).join("; "),
                    resources: observations.flatMap(({ resources }) => resources),
                },
            }),
    };
};
const failureMessage = (cause) => cause instanceof Error ? cause.message : String(cause);
/** Admit one regular-file handle, retain it through the consumer, and always close it. */
export const withRegularFile = async (path, read, options = {}) => {
    const { signal, resources } = options;
    let admitted;
    const operation = async () => {
        try {
            return await withOwnedRegularFile(path, {
                ...(signal === undefined ? {} : { signal }),
                symlinks: options.symlinks ?? "follow",
            }, async (handle) => {
                admitted = handle;
                const stats = await handle.stat();
                assertRegularFileActive(signal);
                const value = await read(handle, stats);
                assertRegularFileActive(signal);
                const [opened, currentPath] = await Promise.all([
                    handle.stat(),
                    options.symlinks === "reject" ? lstat(path) : stat(path),
                ]);
                if (!sameRegularFileState(stats, opened) ||
                    !sameRegularFileState(stats, currentPath))
                    throw new RegularFileChangedError(path);
                assertRegularFileActive(signal);
                return value;
            });
        }
        catch (cause) {
            // Caller reasons are opaque, including objects shaped like file failures.
            // They do not transfer ownership of any descriptor to this operation.
            if (signal?.aborted === true && cause === signal.reason)
                throw cause;
            if (cause instanceof RegularFileOperationCancelled)
                throw cause.reason;
            if (cause instanceof RegularFileCancelled &&
                cause.owner.handle === admitted)
                throw cause.reason;
            if (!(cause instanceof RegularFileCleanupFailure) ||
                resources === undefined)
                throw cause;
            const retry = await retryRegularFileCleanup(cause, resources, signal);
            if (retry.cleanup !== undefined)
                throw cause;
            if (retry.outcome.kind === "failed")
                throw retry.outcome.cause;
            return retry.outcome.value;
        }
    };
    const value = await (resources === undefined
        ? operation()
        : resources.run(operation));
    // A retained close may have recovered after the descriptor owner's outcome
    // was captured. Include that retry and the scope's finalization in cancellation.
    signal?.throwIfAborted();
    return value;
};
/** Admit a regular file without waiting for a pipe, then read its verified handle. */
export const readRegularFile = (path, options = {}) => readRegularFileContent(path, (bytes) => bytes, options);
/** Read valid UTF-8 without replacing source bytes or stripping an initial BOM. */
export const readRegularFileText = (path, options = {}) => readRegularFileContent(path, (bytes) => decodeFileText(path, bytes), options);
/** Retain the read owner's verified file state together with its decoded text. */
export const readRegularFileTextSnapshot = (path, options = {}) => readRegularFileContent(path, (bytes, state) => ({
    text: decodeFileText(path, bytes),
    state,
}), options);
const decodeFileText = (path, bytes) => {
    try {
        return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
    }
    catch (cause) {
        if (!(cause instanceof TypeError))
            throw cause;
        throw new InvalidUtf8FileError(path, cause);
    }
};
const readRegularFileContent = (path, decode, options) => withRegularFile(path, async (handle, stats) => {
    const bytes = await readBoundedFileBytes(handle, stats.size, options.signal);
    if (bytes === undefined || bytes.length !== stats.size)
        throw new RegularFileChangedError(path);
    return decode(bytes, stats);
}, options);
