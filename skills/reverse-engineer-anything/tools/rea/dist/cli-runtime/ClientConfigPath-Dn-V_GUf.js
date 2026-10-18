import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { OwnedFileHandle, RegularFileChangedError, RegularFileCleanupFailure, init_OwnedFileHandle, init_OwnedRegularFile, init_RegularFile, sameRegularFileState } from "./OwnedRegularFile-D1f5nUCx.js";
import { ArtifactReaderFailure, init_ArtifactReader } from "./ArtifactReader-DMwm42bk.js";
import { AnalysisCleanupLease, init_AnalysisCleanupLease } from "./AnalysisCleanupLease-CWfTGYKd.js";
import { ArtifactResourceRetryFailure, init_ArtifactResourceScope } from "./ArtifactResourceScope-CokZGcII.js";
import { init_RegularFileRead, readRegularFileTextSnapshot, retryRegularFileCleanupFailures } from "./RegularFileRead-mbgGYtxe.js";
import { OwnedStagedOutput, init_OwnedStagedOutput } from "./OwnedStagedOutput-D31dOozz.js";
import { basename, dirname, join, sep } from "node:path";
import { constants } from "node:fs";
import { link, lstat, mkdtemp, open, realpath, rename } from "node:fs/promises";

//#region dist/application/ClientConfigurationCleanup.js
var ClientConfigurationPublicationFailure, isClientConfigurationCleanupFailure, retryClientConfigurationCleanup;
function init_ClientConfigurationCleanup() {
	return (init_ClientConfigurationCleanup = __esmMin((() => {
		init_ArtifactResourceScope();
		init_ArtifactReader();
		init_RegularFileRead();
		ClientConfigurationPublicationFailure = class extends ArtifactResourceRetryFailure {
			path;
			outcome;
			cleanupCause;
			owner;
			cleanupLease;
			constructor(path, outcome, cleanupCause, owner, cleanupLease) {
				super([{
					owner,
					lease: cleanupLease
				}], "Configuration publication cleanup remains incomplete", {
					cause: new AggregateError([...outcome.kind === "failed" ? [outcome.cause] : [], cleanupCause], "Configuration operation and staging cleanup failures"),
					cleanup: ArtifactReaderFailure.cleanupObservation(cleanupCause, owner.resource)
				});
				this.path = path;
				this.outcome = outcome;
				this.cleanupCause = cleanupCause;
				this.owner = owner;
				this.cleanupLease = cleanupLease;
			}
		};
		isClientConfigurationCleanupFailure = (cause) => cause instanceof RegularFileCleanupFailure || cause instanceof ClientConfigurationPublicationFailure;
		retryClientConfigurationCleanup = async (failure, resources) => {
			const failures = [];
			const observations = [];
			let current = failure;
			let primary;
			for (;;) {
				let nested;
				if (current instanceof RegularFileCleanupFailure) {
					const retried = await retryRegularFileCleanupFailures(current, resources);
					failures.push(...retried.failures);
					if (retried.cleanup !== undefined) observations.push(retried.cleanup);
					primary = retried.primary;
					const last = retried.failures.at(-1);
					nested = last.outcome.kind === "failed" ? last.outcome.cause : undefined;
				} else {
					const released = await resources.release({
						kind: "lease",
						resource: current.owner.resource,
						lease: current.cleanupLease
					});
					if (released.kind === "failed") observations.push(ArtifactReaderFailure.cleanupObservation(released.cause, current.owner.resource));
					primary = current.outcome.kind === "failed" ? current.outcome.cause : current.cleanupCause;
					nested = current.outcome.kind === "failed" ? current.outcome.cause : undefined;
				}
				if (!isClientConfigurationCleanupFailure(nested)) break;
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
	})))();
}

//#endregion
//#region dist/application/ClientConfigurationPublication.js
var ClientConfigurationPublication, selectedConfiguration, assertSelectedConfiguration, releaseStaging;
function init_ClientConfigurationPublication() {
	return (init_ClientConfigurationPublication = __esmMin((() => {
		init_AnalysisCleanupLease();
		init_OwnedFileHandle();
		init_OwnedStagedOutput();
		init_RegularFile();
		init_RegularFileRead();
		init_ClientConfigurationCleanup();
		ClientConfigurationPublication = class ClientConfigurationPublication {
			path;
			contents;
			owner;
			staging;
			cleanup;
			constructor(path, contents, owner, staging, cleanup) {
				this.path = path;
				this.contents = contents;
				this.owner = owner;
				this.staging = staging;
				this.cleanup = cleanup;
			}
			static async write(path, contents, previous, mode) {
				const parent = await realpath(dirname(path));
				const destination = join(parent, basename(path));
				const input = await selectedConfiguration(destination, previous);
				const directory = await mkdtemp(`${parent}${sep}.rea-config-`);
				const staging = await OwnedStagedOutput.create(directory);
				const cleanup = new AnalysisCleanupLease(() => staging.close(), [directory]);
				try {
					const stagedPath = `${directory}${sep}content`;
					const owner = new OwnedFileHandle(await open(stagedPath, constants.O_RDWR | constants.O_CREAT | constants.O_EXCL | (constants.O_NONBLOCK ?? 0) | (constants.O_NOFOLLOW ?? 0), 384));
					staging.setFile(owner);
					await owner.handle.writeFile(contents, { encoding: "utf8" });
					const created = await owner.handle.stat();
					if (input !== undefined && (input.uid !== created.uid || input.gid !== created.gid)) await owner.handle.chown(input.uid, input.gid);
					await owner.handle.chmod(mode ?? (input?.mode ?? 384) & 4095);
					await owner.handle.sync();
					if ((await owner.handle.stat()).ino === 0) throw new RegularFileChangedError(stagedPath);
					await staging.assertReadyForPublication(stagedPath);
					await assertSelectedConfiguration(destination, input);
					if (input === undefined) {
						await link(stagedPath, destination);
					} else {
						await rename(stagedPath, destination);
						staging.recordPublishedRename();
					}
					return new ClientConfigurationPublication(destination, contents, owner, staging, cleanup);
				} catch (cause) {
					await releaseStaging(path, staging, cleanup, {
						kind: "failed",
						cause
					});
					throw cause;
				}
			}
			/** Keep all publication resources owned through the complete operation. */
			async verify(operation) {
				let outcome;
				try {
					outcome = {
						kind: "completed",
						value: await operation()
					};
				} catch (cause) {
					outcome = {
						kind: "failed",
						cause
					};
				}
				await releaseStaging(this.path, this.staging, this.cleanup, outcome);
				if (outcome.kind === "failed") throw outcome.cause;
				return outcome.value;
			}
			async assertCurrent() {
				const owned = await this.owner.handle.stat();
				const named = await lstat(this.path);
				if (owned.ino === 0 || named.isSymbolicLink() || !sameRegularFileState(owned, named)) throw new RegularFileChangedError(this.path);
			}
			/** State checks do not exclude a concurrent writer to the same inode. */
			async restore(original) {
				if (original === undefined) throw new Error("First-run configuration recovery requires manual removal; pathname deletion cannot prove ownership");
				const handle = this.owner.handle;
				const before = await handle.stat();
				const named = await lstat(this.path);
				if (before.ino === 0 || !before.isFile() || named.isSymbolicLink() || !sameRegularFileState(before, named) || !await this.#hasPublishedBytes(handle) || !sameRegularFileState(before, await handle.stat()) || !sameRegularFileState(before, await lstat(this.path))) throw new RegularFileChangedError(this.path);
				const bytes = Buffer.from(original, "utf8");
				for (let position = 0; position < bytes.length;) {
					const { bytesWritten } = await handle.write(bytes, position, bytes.length - position, position);
					if (bytesWritten === 0) throw new Error("Configuration restoration made no write progress");
					position += bytesWritten;
				}
				await handle.truncate(bytes.length);
				if (!sameRegularFileState(await handle.stat(), await lstat(this.path))) throw new RegularFileChangedError(this.path);
			}
			async #hasPublishedBytes(handle) {
				const expected = Buffer.from(this.contents, "utf8");
				if ((await handle.stat()).size !== expected.length) return false;
				const chunk = Buffer.allocUnsafe(Math.min(64 * 1024, expected.length));
				for (let position = 0; position < expected.length;) {
					const { bytesRead } = await handle.read(chunk, 0, Math.min(chunk.length, expected.length - position), position);
					if (bytesRead === 0 || !chunk.subarray(0, bytesRead).equals(expected.subarray(position, position + bytesRead))) return false;
					position += bytesRead;
				}
				return true;
			}
		};
		selectedConfiguration = async (path, previous) => {
			let selected;
			try {
				selected = await readRegularFileTextSnapshot(path, { symlinks: "reject" });
			} catch (cause) {
				if (!(cause instanceof Error && "code" in cause && cause.code === "ENOENT")) throw cause;
			}
			if (selected?.text !== previous || selected?.state.ino === 0) throw new RegularFileChangedError(path);
			return selected?.state;
		};
		assertSelectedConfiguration = async (path, selected) => {
			let current;
			try {
				current = await lstat(path);
			} catch (cause) {
				if (!(cause instanceof Error && "code" in cause && cause.code === "ENOENT")) throw cause;
			}
			if (selected === undefined ? current !== undefined : current === undefined || current.isSymbolicLink() || !sameRegularFileState(selected, current)) throw new RegularFileChangedError(path);
		};
		releaseStaging = async (path, staging, cleanup, outcome) => {
			try {
				await cleanup.release();
			} catch (cause) {
				throw new ClientConfigurationPublicationFailure(path, outcome, cause, {
					kind: "staged-output",
					resource: staging.directory,
					output: staging
				}, cleanup);
			}
		};
	})))();
}

//#endregion
//#region dist/application/ClientConfigPath.js
var systemFileSystem, resolveClientConfigTransactionPath, isMissing;
function init_ClientConfigPath() {
	return (init_ClientConfigPath = __esmMin((() => {
		systemFileSystem = {
			lstat,
			realpath
		};
		resolveClientConfigTransactionPath = async (requestedPath, fileSystem = systemFileSystem) => {
			let requestedStats;
			try {
				requestedStats = await fileSystem.lstat(requestedPath);
			} catch (cause) {
				return isMissing(cause) ? requestedPath : undefined;
			}
			if (!requestedStats.isSymbolicLink()) return requestedPath;
			const currentUid = typeof process.getuid === "function" ? process.getuid() : undefined;
			if (currentUid === undefined || requestedStats.uid !== currentUid || fileSystem.realpath === undefined) return undefined;
			try {
				const canonicalPath = await fileSystem.realpath(requestedPath);
				const targetStats = await fileSystem.lstat(canonicalPath);
				return targetStats.isFile?.() === true && targetStats.uid === currentUid ? canonicalPath : undefined;
			} catch (cause) {
				void cause;
				return undefined;
			}
		};
		isMissing = (cause) => cause instanceof Error && "code" in cause && cause.code === "ENOENT";
	})))();
}

//#endregion
export { ClientConfigurationPublication, init_ClientConfigPath, init_ClientConfigurationCleanup, init_ClientConfigurationPublication, isClientConfigurationCleanupFailure, resolveClientConfigTransactionPath, retryClientConfigurationCleanup };