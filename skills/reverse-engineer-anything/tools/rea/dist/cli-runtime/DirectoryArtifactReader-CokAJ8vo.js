import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { compareUnicodeCodePoints, init_artifactIdentity, init_unicodeCodePointOrder, logicalPathNfc } from "./reconstructionObligationLedgerSchemas-Bi6sect1.js";
import { OwnedFileHandle, init_OwnedFileHandle } from "./OwnedRegularFile-D1f5nUCx.js";
import { ArtifactReaderFailure, init_ArtifactReader, sameArtifactSourceIdentity } from "./ArtifactReader-DMwm42bk.js";
import { OwnedDirectoryHandle, init_OwnedDirectoryHandle, init_readArtifactFileChunks, readArtifactFileChunks } from "./readArtifactFileChunks-BbTL_PtB.js";
import { extname, isAbsolute, join, posix, relative, sep } from "node:path";
import { constants } from "node:fs";
import { lstat, open, opendir, realpath } from "node:fs/promises";
import { Readable } from "node:stream";

//#region dist/artifacts/StreamBytes.js
var streamChunkToBuffer;
function init_StreamBytes() {
	return (init_StreamBytes = __esmMin((() => {
		streamChunkToBuffer = (value) => {
			if (Buffer.isBuffer(value)) return value;
			if (value instanceof Uint8Array) return Buffer.from(value);
			if (typeof value === "string") return Buffer.from(value);
			throw new TypeError("Readable stream emitted a non-byte chunk");
		};
	})))();
}

//#endregion
//#region dist/artifacts/ArtifactPaths.js
var DRIVE_PREFIX, ENGLISH_UNICODE_CASE_NOTE, ENGLISH_UNICODE_CASE_INVENTORY_LIMITATION, DESTINATION_CASE_COLLISION_PREFIX, normalizeArtifactPath, ArtifactPathRegistry, emptyCaseNode, englishCaseFold, annotateEnglishUnicodeCaseCollisions, caseCollisionLimitation, destinationCaseCollisionMessage, englishUnicodeCaseCollisions, collisionsAlong;
function init_ArtifactPaths() {
	return (init_ArtifactPaths = __esmMin((() => {
		init_artifactIdentity();
		init_unicodeCodePointOrder();
		init_ArtifactReader();
		DRIVE_PREFIX = /^[A-Za-z]:/u;
		ENGLISH_UNICODE_CASE_NOTE = "This comparison is not a filesystem observation.";
		ENGLISH_UNICODE_CASE_INVENTORY_LIMITATION = `Logical archive names collide under English (en-US) Unicode case folding; a case-insensitive destination cannot store both spellings. ${ENGLISH_UNICODE_CASE_NOTE}`;
		DESTINATION_CASE_COLLISION_PREFIX = "Destination filesystem cannot store both ";
		normalizeArtifactPath = (input) => {
			if (input.includes("\0") || input.startsWith("/") || DRIVE_PREFIX.test(input)) throw new ArtifactReaderFailure("path", `Artifact path is absolute or unsafe: ${JSON.stringify(input)}`);
			const normalized = logicalPathNfc(input).replace(/\/+$/u, "");
			const parts = normalized.split("/");
			if (normalized.length === 0 || parts.some((part) => part === "" || part === "." || part === "..") || posix.normalize(normalized) !== normalized) throw new ArtifactReaderFailure("path", `Artifact path is not normalized: ${JSON.stringify(input)}`);
			return normalized;
		};
		ArtifactPathRegistry = class {
			#root = {
				kind: undefined,
				children: new Map()
			};
			add(path, kind) {
				const parts = path.split("/");
				let node = this.#root;
				for (const [index, part] of parts.entries()) {
					if (node.kind !== undefined && node.kind !== "directory") throw new ArtifactReaderFailure("path", `Artifact prefix conflict: ${path}`);
					let child = node.children.get(part);
					if (child === undefined) {
						child = {
							kind: undefined,
							children: new Map()
						};
						node.children.set(part, child);
					}
					node = child;
					if (index === parts.length - 1) {
						if (node.kind !== undefined && node.kind !== kind) throw new ArtifactReaderFailure("path", `Artifact path collision: ${path}`);
						if (kind !== "directory" && node.children.size > 0) throw new ArtifactReaderFailure("path", `Artifact prefix conflict: ${path}`);
					}
				}
				node.kind = kind;
			}
		};
		emptyCaseNode = () => ({
			bySpelling: new Map(),
			spellingsByFold: new Map(),
			terminals: []
		});
		englishCaseFold = (part) => part.toLocaleLowerCase("en-US");
		annotateEnglishUnicodeCaseCollisions = (occurrences) => {
			const collisions = englishUnicodeCaseCollisions(occurrences.map(({ logical_path }) => logical_path));
			if (collisions.size === 0) return undefined;
			for (const occurrence of occurrences) for (const collision of collisions.get(occurrence.logical_path) ?? []) occurrence.limitations.push(caseCollisionLimitation(occurrence.logical_path, collision));
			return ENGLISH_UNICODE_CASE_INVENTORY_LIMITATION;
		};
		caseCollisionLimitation = (path, { prefix, other, additional }) => {
			const others = additional === 0 ? other : `${other} and ${String(additional)} other spelling${additional === 1 ? "" : "s"}`;
			const subject = prefix === path ? `Logical path ${path} collides` : `Logical path ${path} is under ${prefix}, which collides`;
			return `${subject} under English (en-US) Unicode case folding with ${others}; a case-insensitive destination cannot store both. ${ENGLISH_UNICODE_CASE_NOTE}`;
		};
		destinationCaseCollisionMessage = (requestedPath, existingNames) => {
			const slash = requestedPath.lastIndexOf("/");
			const segment = slash < 0 ? requestedPath : requestedPath.slice(slash + 1);
			if (existingNames.includes(segment)) return undefined;
			const folded = englishCaseFold(segment);
			const existing = existingNames.filter((name) => englishCaseFold(name) === folded).sort(compareUnicodeCodePoints)[0];
			if (existing === undefined) return undefined;
			const parent = slash < 0 ? "" : requestedPath.slice(0, slash + 1);
			return `${DESTINATION_CASE_COLLISION_PREFIX}${requestedPath} and ${parent}${existing}; inventory retains both logical names.`;
		};
		englishUnicodeCaseCollisions = (paths) => {
			const root = emptyCaseNode();
			for (const path of paths) {
				if (path.length === 0 || path === ".") continue;
				let node = root;
				for (const part of path.split("/")) {
					let child = node.bySpelling.get(part);
					if (child === undefined) {
						const folded = englishCaseFold(part);
						const spellings = node.spellingsByFold.get(folded);
						if (spellings === undefined) node.spellingsByFold.set(folded, [part]);
						else spellings.push(part);
						child = emptyCaseNode();
						node.bySpelling.set(part, child);
					}
					node = child;
				}
				node.terminals.push(path);
			}
			const collisions = new Map();
			const pending = [{
				node: root,
				prefix: undefined,
				chain: undefined
			}];
			for (let item = pending.pop(); item !== undefined; item = pending.pop()) {
				const { node, prefix, chain } = item;
				if (chain !== undefined) for (const path of node.terminals) collisions.set(path, collisionsAlong(chain));
				for (const spellings of node.spellingsByFold.values()) spellings.sort(compareUnicodeCodePoints);
				for (const [spelling, child] of node.bySpelling) {
					const childPrefix = prefix === undefined ? spelling : `${prefix}/${spelling}`;
					const spellings = node.spellingsByFold.get(englishCaseFold(spelling)) ?? [];
					const other = spellings[0] === spelling ? spellings[1] : spellings[0];
					pending.push({
						node: child,
						prefix: childPrefix,
						chain: other === undefined ? chain : {
							collision: {
								prefix: childPrefix,
								other: prefix === undefined ? other : `${prefix}/${other}`,
								additional: spellings.length - 2
							},
							parent: chain
						}
					});
				}
			}
			return collisions;
		};
		collisionsAlong = (chain) => {
			const collisions = [];
			let link = chain;
			while (link !== undefined) {
				collisions.push(link.collision);
				link = link.parent;
			}
			return collisions.reverse();
		};
	})))();
}

//#endregion
//#region dist/artifacts/hostExecutableMarking.js
var windowsLaunchableExtensions, hostExecutableMarking;
function init_hostExecutableMarking() {
	return (init_hostExecutableMarking = __esmMin((() => {
		windowsLaunchableExtensions = new Set([
			".bat",
			".cmd",
			".com",
			".exe"
		]);
		hostExecutableMarking = (path, metadata, platform = process.platform) => platform === "win32" ? metadata.isFile() && windowsLaunchableExtensions.has(extname(path).toLowerCase()) : typeof metadata.mode === "bigint" ? (metadata.mode & 73n) !== 0n : (metadata.mode & 73) !== 0;
	})))();
}

//#endregion
//#region dist/artifacts/DirectoryArtifactReader.js
var DirectoryArtifactTraversalLimit, DirectoryArtifactReader, unsupportedEntryKind, artifactEntry, safeArtifactSize, directoryIoFailure, failureMessage, mapStableFileRead, withDirectoryIoContext, abortIfNeeded, assertContainedDirectory;
function init_DirectoryArtifactReader() {
	return (init_DirectoryArtifactReader = __esmMin((() => {
		init_ArtifactReader();
		init_hostExecutableMarking();
		init_OwnedDirectoryHandle();
		init_OwnedFileHandle();
		init_readArtifactFileChunks();
		DirectoryArtifactTraversalLimit = class extends ArtifactReaderFailure {
			examinedEntries;
			maximumEntries;
			constructor(examinedEntries, maximumEntries) {
				super("limit", "Directory traversal reached its examined-entry budget", { boundary: "capacity" });
				this.examinedEntries = examinedEntries;
				this.maximumEntries = maximumEntries;
			}
		};
		DirectoryArtifactReader = class {
			format = "directory";
			#rootPromise;
			#rootIdentity;
			#rootPath;
			#directories = new Set();
			#files = new Map();
			constructor(root) {
				this.#rootPath = root;
			}
			/** Enumerate entries, optionally restricting descent while retaining directories. */
			async *entries(signal, selection) {
				const root = await this.#resolveRoot();
				const options = typeof selection === "function" ? { descendInto: selection } : selection;
				const maximum = options?.maximumEntries;
				if (maximum !== undefined && (!Number.isSafeInteger(maximum) || maximum < 0)) throw new RangeError("Directory traversal maximumEntries must be a nonnegative safe integer");
				let examined = 0;
				const examine = () => {
					if (maximum !== undefined && examined >= maximum) throw new DirectoryArtifactTraversalLimit(examined, maximum);
					examined += 1;
				};
				const pending = [root];
				while (pending.length > 0) {
					abortIfNeeded(signal);
					const directory = pending.pop();
					if (directory === undefined) break;
					await withDirectoryIoContext("inspect directory", directory, () => assertContainedDirectory(root, directory, this.#rootIdentity));
					for await (const entry of this.#readDirectory(directory, pending, signal, options, examine)) yield entry;
					await withDirectoryIoContext("inspect directory", directory, () => assertContainedDirectory(root, directory, this.#rootIdentity));
				}
			}
			async #resolveRoot() {
				return this.#rootPromise ??= (async () => {
					const root = await realpath(this.#rootPath);
					const metadata = await lstat(root, { bigint: true });
					if (metadata.isSymbolicLink() || !metadata.isDirectory()) throw new ArtifactReaderFailure("path", "Artifact root changed during traversal");
					this.#rootIdentity = {
						dev: metadata.dev,
						ino: metadata.ino
					};
					return root;
				})().catch((cause) => {
					if (cause instanceof ArtifactReaderFailure) throw cause;
					throw directoryIoFailure("resolve artifact root", this.#rootPath, cause);
				});
			}
			async *#readDirectory(directory, pending, signal, options, examine) {
				const root = await this.#resolveRoot();
				const handle = new OwnedDirectoryHandle(await opendir(directory).catch((cause) => {
					throw directoryIoFailure("open directory", directory, cause);
				}));
				this.#directories.add(handle);
				const childDirectories = [];
				let traversal = { kind: "complete" };
				try {
					for (;;) {
						await withDirectoryIoContext("inspect directory", directory, () => assertContainedDirectory(root, directory, this.#rootIdentity));
						const child = await handle.handle.read();
						if (child === null) break;
						examine();
						abortIfNeeded(signal);
						const absolute = join(directory, child.name);
						const metadata = await lstat(absolute, { bigint: true }).catch((cause) => {
							throw directoryIoFailure("inspect entry", absolute, cause);
						});
						const path = relative(root, absolute).split(sep).join("/");
						const entry = artifactEntry(path, absolute, metadata);
						if (entry === undefined) {
							options?.onOmission?.({
								path,
								kind: unsupportedEntryKind(metadata)
							});
							continue;
						}
						yield entry;
						if (entry.kind === "directory") {
							if (options?.descendInto?.(path) ?? true) childDirectories.push(absolute);
							else options?.onOmission?.({
								path,
								kind: "directory-descendants"
							});
						}
					}
				} catch (cause) {
					traversal = {
						kind: "failed",
						cause: cause instanceof ArtifactReaderFailure ? cause : directoryIoFailure("read directory", directory, cause)
					};
				} finally {
					await this.#finishDirectory(handle, directory, traversal);
				}
				if (traversal.kind === "failed") throw traversal.cause;
				childDirectories.reverse();
				pending.push(...childDirectories);
			}
			async #finishDirectory(handle, path, traversal) {
				try {
					await handle.close();
					this.#directories.delete(handle);
				} catch (cause) {
					const closeFailure = directoryIoFailure("close directory", path, cause);
					if (traversal.kind === "failed") throw ArtifactReaderFailure.withCleanup(traversal.cause, ArtifactReaderFailure.cleanupObservation(closeFailure, path));
					throw closeFailure;
				}
			}
			async open(entry, signal) {
				abortIfNeeded(signal);
				if (entry.kind !== "file") throw new ArtifactReaderFailure("format", "Only regular files can be opened");
				const fileHandle = await open(entry.adapterKey, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK).catch((cause) => {
					throw directoryIoFailure("open entry", entry.adapterKey, cause);
				});
				const owner = new OwnedFileHandle(fileHandle);
				this.#files.set(owner, entry.adapterKey);
				try {
					const observed = await owner.handle.stat({ bigint: true }).catch((cause) => {
						throw directoryIoFailure("inspect opened entry", entry.adapterKey, cause);
					});
					if (!observed.isFile() || !sameArtifactSourceIdentity(entry.sourceIdentity, observed)) {
						throw new ArtifactReaderFailure("integrity", `Directory entry changed before open: ${entry.path}`);
					}
					abortIfNeeded(signal);
					const source = Readable.from(mapStableFileRead(owner.handle, entry, signal), { objectMode: false });
					source.once("close", () => {
						void this.#closeFile(owner).catch(() => undefined);
					});
					return source;
				} catch (cause) {
					try {
						await this.#closeFile(owner);
					} catch (closeCause) {
						throw ArtifactReaderFailure.withCleanup(cause, ArtifactReaderFailure.cleanupObservation(directoryIoFailure("close opened entry", entry.adapterKey, closeCause), entry.adapterKey));
					}
					throw cause;
				}
			}
			async close() {
				const failures = [];
				for (const [owner, path] of this.#files) {
					try {
						await this.#closeFile(owner);
					} catch (cause) {
						failures.push(directoryIoFailure("close opened entry", path, cause));
					}
				}
				for (const owner of this.#directories) {
					try {
						await owner.close();
						this.#directories.delete(owner);
					} catch (cause) {
						failures.push(directoryIoFailure("close directory", owner.handle.path, cause));
					}
				}
				if (failures.length > 0) {
					const reason = failures.map(failureMessage).join("; ");
					throw new ArtifactReaderFailure("io", `Directory artifact cleanup failed: ${reason}`, {
						cause: new AggregateError(failures),
						cleanup: {
							reason,
							resources: [...this.#files.values(), ...[...this.#directories].map((owner) => owner.handle.path)]
						}
					});
				}
			}
			async #closeFile(owner) {
				await owner.close();
				this.#files.delete(owner);
			}
			provenance() {
				return [];
			}
		};
		unsupportedEntryKind = (metadata) => metadata.isFIFO() ? "fifo" : metadata.isSocket() ? "socket" : metadata.isBlockDevice() ? "block-device" : metadata.isCharacterDevice() ? "character-device" : "unsupported";
		artifactEntry = (path, absolute, metadata) => {
			const kind = metadata.isSymbolicLink() ? "symlink" : metadata.isDirectory() ? "directory" : metadata.isFile() ? "file" : undefined;
			if (kind === undefined) return undefined;
			return {
				path,
				kind,
				declaredSize: kind === "file" ? safeArtifactSize(metadata.size) : null,
				compressedSize: null,
				executable: hostExecutableMarking(absolute, metadata),
				encrypted: false,
				byteOffset: null,
				declaredSha256: null,
				unpacked: false,
				limitations: kind === "symlink" ? ["Symlink target was not followed or disclosed."] : [],
				adapterKey: absolute,
				...kind === "file" ? { sourceIdentity: {
					device: metadata.dev,
					inode: metadata.ino,
					size: metadata.size,
					mode: metadata.mode,
					mtimeNs: metadata.mtimeNs,
					ctimeNs: metadata.ctimeNs
				} } : {}
			};
		};
		safeArtifactSize = (size) => {
			if (size < 0n || size > BigInt(Number.MAX_SAFE_INTEGER)) return null;
			return Number(size);
		};
		directoryIoFailure = (operation, path, cause) => {
			if (cause instanceof ArtifactReaderFailure) return cause;
			const code = typeof cause === "object" && cause !== null && "code" in cause && typeof cause.code === "string" ? ` (${cause.code})` : "";
			const detail = failureMessage(cause);
			return new ArtifactReaderFailure("io", `Could not ${operation} at ${path}${code}: ${detail}`, { cause });
		};
		failureMessage = (cause) => cause instanceof Error ? cause.message : String(cause);
		mapStableFileRead = async function* (handle, entry, signal) {
			let bytes = 0n;
			try {
				const expectedBytes = entry.sourceIdentity?.size;
				if (expectedBytes === undefined) throw new ArtifactReaderFailure("integrity", `Directory entry has no captured file state: ${entry.path}`);
				for await (const chunk of readArtifactFileChunks(handle, {
					end: expectedBytes,
					signal
				})) {
					abortIfNeeded(signal);
					bytes += BigInt(chunk.length);
					yield chunk;
				}
				abortIfNeeded(signal);
				const [opened, current] = await Promise.all([handle.stat({ bigint: true }), lstat(entry.adapterKey, { bigint: true })]);
				abortIfNeeded(signal);
				if (!opened.isFile() || !current.isFile() || !sameArtifactSourceIdentity(entry.sourceIdentity, opened) || !sameArtifactSourceIdentity(entry.sourceIdentity, current) || bytes !== expectedBytes) throw new ArtifactReaderFailure("integrity", `Directory entry changed during read: ${entry.path}`);
			} catch (cause) {
				if (cause instanceof Error && "code" in cause && [
					"ENOENT",
					"ENOTDIR",
					"ELOOP"
				].includes(String(cause.code))) throw new ArtifactReaderFailure("integrity", `Directory entry changed during read: ${entry.path}`, { cause });
				if (!(cause instanceof ArtifactReaderFailure)) throw directoryIoFailure("validate read entry", entry.adapterKey, cause);
				throw cause;
			}
		};
		withDirectoryIoContext = async (operation, path, action) => {
			try {
				return await action();
			} catch (cause) {
				throw directoryIoFailure(operation, path, cause);
			}
		};
		abortIfNeeded = (signal) => {
			if (signal?.aborted === true) throw new ArtifactReaderFailure("cancelled", "Artifact traversal cancelled", { cause: signal.reason });
		};
		assertContainedDirectory = async (root, directory, rootIdentity) => {
			const canonical = await realpath(directory);
			const fromRoot = relative(root, canonical);
			const metadata = await lstat(directory);
			const currentRoot = await lstat(root, { bigint: true });
			if (rootIdentity === undefined || currentRoot.dev !== rootIdentity.dev || currentRoot.ino !== rootIdentity.ino || metadata.isSymbolicLink() || !metadata.isDirectory() || fromRoot === ".." || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) throw new ArtifactReaderFailure("path", "Directory traversal escaped or changed its artifact root");
		};
	})))();
}

//#endregion
export { ArtifactPathRegistry, DESTINATION_CASE_COLLISION_PREFIX, DirectoryArtifactReader, DirectoryArtifactTraversalLimit, annotateEnglishUnicodeCaseCollisions, destinationCaseCollisionMessage, hostExecutableMarking, init_ArtifactPaths, init_DirectoryArtifactReader, init_StreamBytes, init_hostExecutableMarking, normalizeArtifactPath, streamChunkToBuffer };