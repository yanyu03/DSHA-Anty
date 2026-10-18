import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { i as init_ArtifactReader, t as ArtifactReaderFailure } from "./ArtifactReader-BrnwNaKY.js";
import { P as init_InvestigationProviders, v as ARTIFACT_GRAPH_PROVIDER } from "./callerPath-CpPnMZyN.js";
import { o as init_artifactToolContracts, t as ARTIFACT_ANALYSIS_OPERATIONS } from "./artifactToolContracts-C9dRDo-D.js";
import { Readable } from "node:stream";

//#region dist/filesystem/OwnedDirectoryHandle.js
var OwnedDirectoryHandle;
function init_OwnedDirectoryHandle() {
	return (init_OwnedDirectoryHandle = __esmMin((() => {
		OwnedDirectoryHandle = class {
			handle;
			#state = { kind: "open" };
			constructor(handle) {
				this.handle = handle;
			}
			close() {
				if (this.#state.kind === "closed") return Promise.resolve();
				if (this.#state.kind === "closing") return this.#state.attempt;
				if (this.#state.kind === "failed") return Promise.reject(this.#state.cause);
				const attempt = Promise.resolve().then(async () => {
					try {
						await this.handle.close();
						this.#state = { kind: "closed" };
					} catch (cause) {
						this.#state = {
							kind: "failed",
							cause
						};
						throw cause;
					}
				});
				this.#state = {
					kind: "closing",
					attempt
				};
				return attempt;
			}
		};
	})))();
}

//#endregion
//#region dist/filesystem/readFileHandleChunks.js
var FileReadCancelled, readFileHandleChunks, fileOffset;
function init_readFileHandleChunks() {
	return (init_readFileHandleChunks = __esmMin((() => {
		FileReadCancelled = class extends Error {
			reason;
			constructor(reason) {
				super("File read cancelled", { cause: reason });
				this.reason = reason;
				this.name = "FileReadCancelled";
			}
		};
		readFileHandleChunks = (handle, options = {}) => {
			const start = fileOffset(options.start ?? 0);
			const unlimited = options.end === undefined || options.end === Infinity;
			const end = unlimited ? undefined : fileOffset(options.end);
			if (start === undefined || !unlimited && end === undefined || end !== undefined && end < start) throw new RangeError("Invalid file read range");
			let readPending = false;
			let totalBytes = 0n;
			let coverage;
			const cancellationFailure = () => options.cancellationFailure?.(options.signal?.reason) ?? new FileReadCancelled(options.signal?.reason);
			const assertActive = () => {
				if (options.signal?.aborted) throw cancellationFailure();
			};
			const source = Readable.from((async function* () {
				let position = start;
				while (end === undefined || position <= end) {
					assertActive();
					const remaining = end === undefined ? undefined : end - position + 1n;
					const chunk = Buffer.allocUnsafe(remaining === undefined || remaining > 64n * 1024n ? 64 * 1024 : Number(remaining));
					readPending = true;
					let bytesRead;
					try {
						({bytesRead} = await handle.read(chunk, 0, chunk.length, position));
					} finally {
						readPending = false;
					}
					totalBytes += BigInt(bytesRead);
					if (bytesRead === 0) coverage = Object.freeze({
						kind: "complete",
						bytes: totalBytes,
						boundary: "eof"
					});
					else if (end !== undefined && position + BigInt(bytesRead) > end) coverage = Object.freeze({
						kind: "complete",
						bytes: totalBytes,
						boundary: "range"
					});
					assertActive();
					if (bytesRead === 0) return;
					position += BigInt(bytesRead);
					yield chunk.subarray(0, bytesRead);
				}
			})(), { objectMode: false });
			const onAbort = () => {
				if (!readPending && !source.destroyed) source.destroy(cancellationFailure());
			};
			options.signal?.addEventListener("abort", onAbort, { once: true });
			source.once("close", () => options.signal?.removeEventListener("abort", onAbort));
			if (options.signal?.aborted) onAbort();
			return Object.assign(source, { readCoverage: () => coverage ?? Object.freeze({
				kind: "incomplete",
				bytes: totalBytes
			}) });
		};
		fileOffset = (value) => {
			if (typeof value === "bigint") return value >= 0n ? value : undefined;
			return Number.isSafeInteger(value) && value >= 0 ? BigInt(value) : undefined;
		};
	})))();
}

//#endregion
//#region dist/artifacts/readArtifactFileChunks.js
var readArtifactFileChunks;
function init_readArtifactFileChunks() {
	return (init_readArtifactFileChunks = __esmMin((() => {
		init_readFileHandleChunks();
		init_ArtifactReader();
		readArtifactFileChunks = (handle, options = {}) => readFileHandleChunks(handle, {
			...options,
			cancellationFailure: (reason) => new ArtifactReaderFailure("cancelled", "Artifact file read cancelled", { cause: reason })
		});
	})))();
}

//#endregion
//#region dist/artifacts/ArtifactProviderMetadata.js
var artifactCapabilities;
function init_ArtifactProviderMetadata() {
	return (init_ArtifactProviderMetadata = __esmMin((() => {
		init_InvestigationProviders();
		init_artifactToolContracts();
		artifactCapabilities = (platform = process.platform) => Object.freeze(ARTIFACT_ANALYSIS_OPERATIONS.map((operation) => {
			const common = {
				provider: ARTIFACT_GRAPH_PROVIDER,
				operation,
				effects: Object.freeze({
					mutatesArtifact: false,
					launchesProcess: operation !== "decode_interface_builder" && operation !== "inspect_keyed_archive" && operation !== "trace_dylib_resolution",
					mayShowUi: false,
					mayAccessNetwork: false,
					mayWriteFilesystem: operation === "extract_artifact" || operation === "inspect_artifact" || operation === "inventory_artifact",
					changesPermissions: false,
					requiresRoot: false
				}),
				limitations: Object.freeze(["DMG child inventory automatically uses a read-only native macOS mount; PKG remains root-hash-only.", "ASAR files discovered in filesystem-backed inventories are expanded without bulk extraction; other nested containers remain recorded only."])
			};
			return Object.freeze(operation === "inspect_asset_catalog" && platform !== "darwin" ? {
				...common,
				available: false,
				availabilityCode: "unsupported_host",
				reason: "Apple asset catalogs require macOS assetutil."
			} : {
				...common,
				available: true,
				reason: null
			});
		}));
	})))();
}

//#endregion
export { OwnedDirectoryHandle as a, readArtifactFileChunks as i, init_ArtifactProviderMetadata as n, init_OwnedDirectoryHandle as o, init_readArtifactFileChunks as r, artifactCapabilities as t };