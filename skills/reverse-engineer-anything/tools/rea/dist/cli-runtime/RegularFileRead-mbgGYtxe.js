import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { RegularFileCancelled, RegularFileChangedError, RegularFileCleanupFailure, RegularFileOperationCancelled, assertRegularFileActive, init_OwnedRegularFile, init_RegularFile, sameRegularFileState, withOwnedRegularFile } from "./OwnedRegularFile-D1f5nUCx.js";
import { init_BoundedFileBytes, readBoundedFileBytes } from "./BoundedFileBytes-DRtiQNAQ.js";
import { lstat, stat } from "node:fs/promises";

//#region dist/application/RegularFileRead.js
var InvalidUtf8FileError, retryRegularFileCleanup, retryRegularFileCleanupFailures, failureMessage, withRegularFile, readRegularFile, readRegularFileText, readRegularFileTextSnapshot, decodeFileText, readRegularFileContent;
function init_RegularFileRead() {
	return (init_RegularFileRead = __esmMin((() => {
		init_RegularFile();
		init_OwnedRegularFile();
		init_BoundedFileBytes();
		InvalidUtf8FileError = class extends TypeError {
			path;
			_tag = "InvalidUtf8FileError";
			constructor(path, cause) {
				super(`File is not valid UTF-8: ${path}`, { cause });
				this.path = path;
				this.name = this._tag;
			}
		};
		retryRegularFileCleanup = async (failure, resources, signal) => {
			const outcome = failure.outcome.kind === "failed" && failure.outcome.cause instanceof RegularFileOperationCancelled && !(signal?.aborted === true && failure.outcome.cause === signal.reason) ? {
				kind: "failed",
				cause: failure.outcome.cause.reason
			} : failure.outcome;
			const released = await resources.release({
				kind: "file-handle",
				handle: failure.owner,
				resource: failure.path
			});
			if (released.kind === "released") return { outcome };
			return {
				outcome,
				cleanup: {
					reason: `${failureMessage(failure.cleanupCause)}; retry: ${failureMessage(released.cause)}`,
					resources: [failure.path]
				}
			};
		};
		retryRegularFileCleanupFailures = async (failure, resources) => {
			const failures = [];
			const observations = [];
			let current = failure;
			let primary;
			for (;;) {
				failures.push(current);
				const retried = await retryRegularFileCleanup(current, resources);
				if (retried.cleanup !== undefined) observations.push(retried.cleanup);
				primary = retried.outcome.kind === "failed" ? retried.outcome.cause : current.cleanupCause;
				const nested = current.outcome.kind === "failed" ? current.outcome.cause : undefined;
				if (!(nested instanceof RegularFileCleanupFailure)) break;
				current = nested;
			}
			return {
				primary,
				failures,
				...observations.length === 0 ? {} : { cleanup: {
					reason: observations.map(({ reason }) => reason).join("; "),
					resources: observations.flatMap(({ resources }) => resources)
				} }
			};
		};
		failureMessage = (cause) => cause instanceof Error ? cause.message : String(cause);
		withRegularFile = async (path, read, options = {}) => {
			const { signal, resources } = options;
			let admitted;
			const operation = async () => {
				try {
					return await withOwnedRegularFile(path, {
						...signal === undefined ? {} : { signal },
						symlinks: options.symlinks ?? "follow"
					}, async (handle) => {
						admitted = handle;
						const stats = await handle.stat();
						assertRegularFileActive(signal);
						const value = await read(handle, stats);
						assertRegularFileActive(signal);
						const [opened, currentPath] = await Promise.all([handle.stat(), options.symlinks === "reject" ? lstat(path) : stat(path)]);
						if (!sameRegularFileState(stats, opened) || !sameRegularFileState(stats, currentPath)) throw new RegularFileChangedError(path);
						assertRegularFileActive(signal);
						return value;
					});
				} catch (cause) {
					if (signal?.aborted === true && cause === signal.reason) throw cause;
					if (cause instanceof RegularFileOperationCancelled) throw cause.reason;
					if (cause instanceof RegularFileCancelled && cause.owner.handle === admitted) throw cause.reason;
					if (!(cause instanceof RegularFileCleanupFailure) || resources === undefined) throw cause;
					const retry = await retryRegularFileCleanup(cause, resources, signal);
					if (retry.cleanup !== undefined) throw cause;
					if (retry.outcome.kind === "failed") throw retry.outcome.cause;
					return retry.outcome.value;
				}
			};
			const value = await (resources === undefined ? operation() : resources.run(operation));
			signal?.throwIfAborted();
			return value;
		};
		readRegularFile = (path, options = {}) => readRegularFileContent(path, (bytes) => bytes, options);
		readRegularFileText = (path, options = {}) => readRegularFileContent(path, (bytes) => decodeFileText(path, bytes), options);
		readRegularFileTextSnapshot = (path, options = {}) => readRegularFileContent(path, (bytes, state) => ({
			text: decodeFileText(path, bytes),
			state
		}), options);
		decodeFileText = (path, bytes) => {
			try {
				return new TextDecoder("utf-8", {
					fatal: true,
					ignoreBOM: true
				}).decode(bytes);
			} catch (cause) {
				if (!(cause instanceof TypeError)) throw cause;
				throw new InvalidUtf8FileError(path, cause);
			}
		};
		readRegularFileContent = (path, decode, options) => withRegularFile(path, async (handle, stats) => {
			const bytes = await readBoundedFileBytes(handle, stats.size, options.signal);
			if (bytes === undefined || bytes.length !== stats.size) throw new RegularFileChangedError(path);
			return decode(bytes, stats);
		}, options);
	})))();
}

//#endregion
export { InvalidUtf8FileError, init_RegularFileRead, readRegularFile, readRegularFileText, readRegularFileTextSnapshot, retryRegularFileCleanup, retryRegularFileCleanupFailures, withRegularFile };