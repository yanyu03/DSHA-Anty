import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { constants } from "node:fs";
import { constants as constants$1 } from "node:os";
import { lstat, open, stat } from "node:fs/promises";

//#region dist/filesystem/OwnedFileHandle.js
var OwnedFileHandle;
function init_OwnedFileHandle() {
	return (init_OwnedFileHandle = __esmMin((() => {
		OwnedFileHandle = class {
			handle;
			#state = { kind: "open" };
			constructor(handle) {
				this.handle = handle;
			}
			/** Close the owned handle, retaining an unconfirmed close as a sticky failure. */
			close() {
				if (this.#state.kind === "closed") return Promise.resolve();
				if (this.#state.kind === "closing") return this.#state.attempt;
				if (this.#state.kind === "failed") return Promise.reject(this.#state.cause);
				if (this.handle.fd < 0) {
					const cause = new Error("File handle was invalidated before this owner confirmed its close");
					this.#state = {
						kind: "failed",
						cause
					};
					return Promise.reject(cause);
				}
				const attempt = Promise.resolve().then(() => this.#attemptClose());
				this.#state = {
					kind: "closing",
					attempt
				};
				return attempt;
			}
			async #attemptClose() {
				try {
					await this.handle.close();
					this.#state = { kind: "closed" };
				} catch (cause) {
					this.#state = this.handle.fd < 0 ? {
						kind: "failed",
						cause
					} : { kind: "open" };
					throw cause;
				}
			}
		};
	})))();
}

//#endregion
//#region dist/filesystem/RegularFile.js
var RegularFileOperationCancelled, assertRegularFileActive, NonRegularFileReadError, RegularFileAdmissionFailure, RegularFileChangedError, openRegularFile, nonRegularOpenFailure, errnos, UNOPENABLE_FILE_TYPE_ERRNOS, isUnopenableFileTypeError, sameRegularFileState;
function init_RegularFile() {
	return (init_RegularFile = __esmMin((() => {
		init_OwnedFileHandle();
		RegularFileOperationCancelled = class extends Error {
			reason;
			_tag = "RegularFileOperationCancelled";
			constructor(reason) {
				super("Regular file operation cancelled", { cause: reason });
				this.reason = reason;
				this.name = this._tag;
			}
		};
		assertRegularFileActive = (signal) => {
			if (signal?.aborted === true) throw new RegularFileOperationCancelled(signal.reason);
		};
		NonRegularFileReadError = class extends Error {
			path;
			code;
			constructor(path, directory) {
				super(`Selected input must be a regular file: ${path}`);
				this.path = path;
				this.name = "NonRegularFileReadError";
				this.code = directory ? "EISDIR" : "ENOTFILE";
			}
		};
		RegularFileAdmissionFailure = class extends Error {
			path;
			cleanupCause;
			owner;
			cause;
			constructor(path, admissionCause, cleanupCause, owner) {
				super(`Selected input failed admission and its descriptor close failed: ${path}`);
				this.path = path;
				this.cleanupCause = cleanupCause;
				this.owner = owner;
				this.name = "RegularFileAdmissionFailure";
				this.cause = admissionCause;
			}
		};
		RegularFileChangedError = class extends Error {
			path;
			code = "ESTALE";
			constructor(path, options) {
				super(`Selected input changed while being read: ${path}`, options);
				this.path = path;
				this.name = "RegularFileChangedError";
			}
		};
		openRegularFile = async (path, options) => {
			assertRegularFileActive(options.signal);
			const handle = await open(path, constants.O_RDONLY | (constants.O_NONBLOCK ?? 0) | (constants.O_NOCTTY ?? 0) | (options.symlinks === "reject" ? constants.O_NOFOLLOW ?? 0 : 0)).catch(async (cause) => {
				const nonRegular = await nonRegularOpenFailure(path, options.symlinks, cause);
				if (nonRegular === undefined) throw cause;
				throw nonRegular;
			});
			const owner = new OwnedFileHandle(handle);
			try {
				assertRegularFileActive(options.signal);
				const metadata = await handle.stat();
				if (!metadata.isFile()) throw new NonRegularFileReadError(path, metadata.isDirectory());
				assertRegularFileActive(options.signal);
				if (options.symlinks === "reject" && (constants.O_NOFOLLOW ?? 0) === 0) {
					const named = await lstat(path);
					if (named.isSymbolicLink()) throw new NonRegularFileReadError(path, false);
					if (!sameRegularFileState(metadata, named)) throw new RegularFileChangedError(path);
					assertRegularFileActive(options.signal);
				}
				return handle;
			} catch (cause) {
				try {
					await owner.close();
				} catch (cleanupCause) {
					throw new RegularFileAdmissionFailure(path, cause, cleanupCause, owner);
				}
				throw cause;
			}
		};
		nonRegularOpenFailure = async (path, symlinks, cause) => {
			if (!isUnopenableFileTypeError(cause)) return undefined;
			const metadata = await (symlinks === "reject" ? lstat : stat)(path).catch(() => undefined);
			if (metadata === undefined || metadata.isFile()) return undefined;
			return new NonRegularFileReadError(path, metadata.isDirectory());
		};
		errnos = constants$1.errno;
		UNOPENABLE_FILE_TYPE_ERRNOS = new Set([
			errnos.ENXIO,
			errnos.EOPNOTSUPP,
			errnos.ENOTSUP
		].flatMap((errno) => errno === undefined ? [] : [-errno]));
		isUnopenableFileTypeError = (cause) => cause instanceof Error && "errno" in cause && typeof cause.errno === "number" && UNOPENABLE_FILE_TYPE_ERRNOS.has(cause.errno);
		sameRegularFileState = (expected, observed) => observed.isFile() && expected.dev === observed.dev && expected.ino === observed.ino && expected.size === observed.size && expected.mode === observed.mode && ("mtimeNs" in expected && "mtimeNs" in observed ? expected.mtimeNs === observed.mtimeNs && expected.ctimeNs === observed.ctimeNs : expected.mtimeMs === observed.mtimeMs && expected.ctimeMs === observed.ctimeMs);
	})))();
}

//#endregion
//#region dist/filesystem/OwnedRegularFile.js
var RegularFileCancelled, RegularFileCleanupFailure, regularFileCancellation, withOwnedRegularFile, withOwnedFileHandle, retainOwner;
function init_OwnedRegularFile() {
	return (init_OwnedRegularFile = __esmMin((() => {
		init_OwnedFileHandle();
		init_RegularFile();
		RegularFileCancelled = class extends Error {
			path;
			owner;
			_tag = "RegularFileCancelled";
			outcome;
			reason;
			constructor(path, owner, completion) {
				super(`Regular file operation cancelled after closing ${path}`, { cause: completion.reason });
				this.path = path;
				this.owner = owner;
				this.name = this._tag;
				this.outcome = completion.outcome;
				this.reason = completion.reason;
			}
		};
		RegularFileCleanupFailure = class extends Error {
			path;
			owner;
			outcome;
			cleanupCause;
			retention;
			completionCancellation;
			constructor(path, owner, outcome, cleanupCause, retention = { kind: "not_requested" }, completionCancellation) {
				super(`Regular file cleanup failed for ${path}`, { cause: new AggregateError([
					...outcome.kind === "failed" ? [outcome.cause] : [],
					cleanupCause,
					...retention.kind === "callback_threw" ? [retention.cause] : []
				], "File operation and cleanup failures") });
				this.path = path;
				this.owner = owner;
				this.outcome = outcome;
				this.cleanupCause = cleanupCause;
				this.retention = retention;
				this.completionCancellation = completionCancellation;
				this.name = "RegularFileCleanupFailure";
			}
		};
		regularFileCancellation = (cause) => {
			const primary = cause instanceof RegularFileCleanupFailure && cause.outcome.kind === "failed" ? cause.outcome.cause : cause;
			if (primary instanceof RegularFileOperationCancelled || primary instanceof RegularFileCancelled) return { reason: primary.reason };
			return cause instanceof RegularFileCleanupFailure && cause.outcome.kind === "completed" ? cause.completionCancellation : undefined;
		};
		withOwnedRegularFile = async (path, options, operation) => {
			const handle = await openRegularFile(path, {
				symlinks: options.symlinks ?? "follow",
				signal: options.signal
			}).catch((cause) => {
				if (!(cause instanceof RegularFileAdmissionFailure)) throw cause;
				const retention = retainOwner(options.retainFailedClose, cause.owner);
				throw new RegularFileCleanupFailure(path, cause.owner, {
					kind: "failed",
					cause: cause.cause
				}, cause.cleanupCause, retention);
			});
			return withOwnedFileHandle(path, new OwnedFileHandle(handle), options, operation);
		};
		withOwnedFileHandle = async (path, owner, options, operation) => {
			const handle = owner.handle;
			let outcome;
			try {
				assertRegularFileActive(options.signal);
				outcome = {
					kind: "completed",
					value: await operation(handle)
				};
			} catch (cause) {
				outcome = {
					kind: "failed",
					cause
				};
			}
			try {
				await owner.close();
			} catch (cleanupCause) {
				const completionCancellation = outcome.kind === "completed" && options.signal?.aborted === true ? { reason: options.signal.reason } : undefined;
				throw new RegularFileCleanupFailure(path, owner, outcome, cleanupCause, retainOwner(options.retainFailedClose, owner), completionCancellation);
			}
			if (outcome.kind === "failed") throw outcome.cause;
			if (options.signal?.aborted === true) throw new RegularFileCancelled(path, owner, {
				outcome,
				reason: options.signal.reason
			});
			return outcome.value;
		};
		retainOwner = (retain, owner) => {
			if (retain === undefined) return { kind: "not_requested" };
			try {
				retain(owner);
				return { kind: "callback_returned" };
			} catch (cause) {
				return {
					kind: "callback_threw",
					cause
				};
			}
		};
	})))();
}

//#endregion
export { NonRegularFileReadError, OwnedFileHandle, RegularFileAdmissionFailure, RegularFileCancelled, RegularFileChangedError, RegularFileCleanupFailure, RegularFileOperationCancelled, assertRegularFileActive, init_OwnedFileHandle, init_OwnedRegularFile, init_RegularFile, openRegularFile, regularFileCancellation, sameRegularFileState, withOwnedFileHandle, withOwnedRegularFile };