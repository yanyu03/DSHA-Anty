import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
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
//#region dist/domain/apple/jvmClassFile.js
var ClassFileCursor, readConstantPool, readConstant, poolHasTag, hasValidPoolReferences, validMethodHandle, readAttributes, readMembers, isJvmClassFile;
function init_jvmClassFile() {
	return (init_jvmClassFile = __esmMin((() => {
		ClassFileCursor = class {
			bytes;
			offset = 0;
			view;
			constructor(bytes) {
				this.bytes = bytes;
				this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
			}
			get atEnd() {
				return this.offset === this.bytes.byteLength;
			}
			u1() {
				if (!this.has(1)) return null;
				return this.bytes[this.offset++];
			}
			u2() {
				if (!this.has(2)) return null;
				const value = this.view.getUint16(this.offset, false);
				this.offset += 2;
				return value;
			}
			u4() {
				if (!this.has(4)) return null;
				const value = this.view.getUint32(this.offset, false);
				this.offset += 4;
				return value;
			}
			skip(length) {
				if (!Number.isSafeInteger(length) || length < 0 || !this.has(length)) return false;
				this.offset += length;
				return true;
			}
			has(length) {
				return this.offset <= this.bytes.byteLength - length;
			}
		};
		readConstantPool = (cursor, count) => {
			const pool = {
				tags: Array.from({ length: count }, () => null),
				first: Array.from({ length: count }, () => null),
				second: Array.from({ length: count }, () => null)
			};
			for (let index = 1; index < count; index += 1) {
				const tag = cursor.u1();
				if (tag === null) return null;
				if (!readConstant(cursor, tag, index, pool)) return null;
				if (tag === 5 || tag === 6) index += 1;
			}
			return pool;
		};
		readConstant = (cursor, tag, index, pool) => {
			switch (tag) {
				case 1: {
					const length = cursor.u2();
					if (length === null || !cursor.skip(length)) return false;
					break;
				}
				case 3:
				case 4:
					if (cursor.u4() === null) return false;
					break;
				case 5:
				case 6:
					if (index + 1 >= pool.tags.length || !cursor.skip(8)) return false;
					break;
				case 7:
				case 8:
				case 16:
				case 19:
				case 20:
					pool.first[index] = cursor.u2();
					if (pool.first[index] === null) return false;
					break;
				case 9:
				case 10:
				case 11:
				case 12:
				case 17:
				case 18:
					pool.first[index] = cursor.u2();
					pool.second[index] = cursor.u2();
					if (pool.first[index] === null || pool.second[index] === null) return false;
					break;
				case 15:
					pool.first[index] = cursor.u1();
					pool.second[index] = cursor.u2();
					if (pool.first[index] === null || pool.second[index] === null) return false;
					break;
				default: return false;
			}
			pool.tags[index] = tag;
			return true;
		};
		poolHasTag = (pool, index, ...tags) => Number.isInteger(index) && index > 0 && tags.includes(pool.tags[index] ?? -1);
		hasValidPoolReferences = (pool, major) => {
			for (let index = 1; index < pool.tags.length; index += 1) {
				const tag = pool.tags[index] ?? null;
				const first = pool.first[index] ?? null;
				const second = pool.second[index] ?? null;
				if ([
					7,
					8,
					16,
					19,
					20
				].includes(tag ?? -1)) {
					if (first === null || !poolHasTag(pool, first, 1)) return false;
					if (tag === 16 && major < 51 || (tag === 19 || tag === 20) && major < 53) return false;
				} else if ([
					9,
					10,
					11
				].includes(tag ?? -1)) {
					if (first === null || second === null || !poolHasTag(pool, first, 7) || !poolHasTag(pool, second, 12)) return false;
				} else if (tag === 12) {
					if (first === null || second === null || !poolHasTag(pool, first, 1) || !poolHasTag(pool, second, 1)) return false;
				} else if (tag === 15 && !validMethodHandle(pool, first, second, major)) {
					return false;
				} else if (tag === 17 || tag === 18) {
					if (second === null || !poolHasTag(pool, second, 12) || major < (tag === 17 ? 55 : 51)) return false;
				}
			}
			return true;
		};
		validMethodHandle = (pool, kind, reference, major) => {
			if (kind === null || reference === null || kind < 1 || kind > 9 || major < 51) return false;
			if (kind <= 4) return poolHasTag(pool, reference, 9);
			if (kind === 5 || kind === 8) return poolHasTag(pool, reference, 10);
			if (kind === 6 || kind === 7) return poolHasTag(pool, reference, ...major >= 52 ? [10, 11] : [10]);
			return poolHasTag(pool, reference, 11);
		};
		readAttributes = (cursor, pool, count) => {
			for (let index = 0; index < count; index += 1) {
				const name = cursor.u2();
				const length = cursor.u4();
				if (name === null || !poolHasTag(pool, name, 1) || length === null || !cursor.skip(length)) return false;
			}
			return true;
		};
		readMembers = (cursor, pool) => {
			const count = cursor.u2();
			if (count === null) return false;
			for (let index = 0; index < count; index += 1) {
				if (cursor.u2() === null) return false;
				const name = cursor.u2();
				const descriptor = cursor.u2();
				const attributes = cursor.u2();
				if (name === null || descriptor === null || !poolHasTag(pool, name, 1) || !poolHasTag(pool, descriptor, 1) || attributes === null || !readAttributes(cursor, pool, attributes)) return false;
			}
			return true;
		};
		isJvmClassFile = (bytes) => {
			const cursor = new ClassFileCursor(bytes);
			if (cursor.u4() !== 3405691582) return false;
			const minor = cursor.u2();
			const major = cursor.u2();
			const poolCount = cursor.u2();
			if (minor === null || major === null || major < 45 || poolCount === null || poolCount === 0) return false;
			const pool = readConstantPool(cursor, poolCount);
			if (pool === null || !hasValidPoolReferences(pool, major)) return false;
			if (cursor.u2() === null) return false;
			const thisClass = cursor.u2();
			const superClass = cursor.u2();
			if (thisClass === null || !poolHasTag(pool, thisClass, 7) || superClass === null || superClass !== 0 && !poolHasTag(pool, superClass, 7)) return false;
			const interfaces = cursor.u2();
			if (interfaces === null || !cursor.skip(interfaces * 2)) return false;
			if (!readMembers(cursor, pool) || !readMembers(cursor, pool)) return false;
			const attributes = cursor.u2();
			return attributes !== null && readAttributes(cursor, pool, attributes) && cursor.atEnd;
		};
	})))();
}

//#endregion
//#region dist/domain/apple/machoContainer.js
var FAT_MAGIC, FAT_MAGIC_64, FAT_CIGAM, FAT_CIGAM_64, MAX_FAT_ARCHITECTURES, KNOWN_MACHO_CPU_TYPES, MACHO_HEADER_MAGICS, readFatContainerHeader, classifyFatContainerIdentity, readFatSliceDeclarations, validateFatSlice, inspectFatSliceRange, validateFatSliceIdentity, safeNumber;
function init_machoContainer() {
	return (init_machoContainer = __esmMin((() => {
		init_jvmClassFile();
		FAT_MAGIC = 3405691582;
		FAT_MAGIC_64 = 3405691583;
		FAT_CIGAM = 3199925962;
		FAT_CIGAM_64 = 3216703178;
		MAX_FAT_ARCHITECTURES = 128;
		KNOWN_MACHO_CPU_TYPES = [
			7,
			16777223,
			12,
			16777228,
			33554444,
			18,
			16777234
		];
		MACHO_HEADER_MAGICS = [
			4277009102,
			4277009103,
			3472551422,
			3489328638
		];
		readFatContainerHeader = (bytes, fileSize) => {
			if (bytes.byteLength < 4) return { state: "not-fat" };
			const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
			const magic = view.getUint32(0, false);
			if (![
				FAT_MAGIC,
				FAT_MAGIC_64,
				FAT_CIGAM,
				FAT_CIGAM_64
			].includes(magic)) return { state: "not-fat" };
			if (!Number.isSafeInteger(fileSize) || fileSize < bytes.byteLength) return {
				state: "malformed",
				reason: "FAT file size is invalid or contradicts retained bytes"
			};
			if (bytes.byteLength === fileSize && isJvmClassFile(bytes)) return { state: "not-fat" };
			if (bytes.byteLength < 8) {
				return fileSize < 8 ? {
					state: "malformed",
					reason: "FAT header is truncated"
				} : {
					state: "needs-data",
					requiredBytes: 8
				};
			}
			const littleEndian = magic === FAT_CIGAM || magic === FAT_CIGAM_64;
			const wide = magic === FAT_MAGIC_64 || magic === FAT_CIGAM_64;
			const count = view.getUint32(4, littleEndian);
			if (count === 0) return {
				state: "malformed",
				reason: "FAT header declares no architectures"
			};
			if (count > MAX_FAT_ARCHITECTURES) return { state: "not-fat" };
			const tableEnd = 8 + count * (wide ? 32 : 20);
			if (tableEnd > fileSize) return { state: "not-fat" };
			if (tableEnd > bytes.byteLength) return {
				state: "needs-data",
				requiredBytes: tableEnd
			};
			const declarations = readFatSliceDeclarations(bytes.subarray(8, tableEnd), {
				count,
				wide,
				littleEndian
			});
			return declarations.status === "parsed" ? {
				state: "parsed",
				magic,
				count,
				wide,
				littleEndian,
				tableEnd,
				slices: declarations.slices,
				rangeIssues: declarations.slices.map((slice) => inspectFatSliceRange(slice, fileSize, tableEnd))
			} : {
				state: "malformed",
				reason: declarations.reason
			};
		};
		classifyFatContainerIdentity = (header, sliceHeaderAt) => {
			const hasKnownCpu = header.slices.some(({ cpuType }) => KNOWN_MACHO_CPU_TYPES.includes(cpuType));
			const invalidRange = header.rangeIssues.find((issue) => issue !== null);
			if (hasKnownCpu) return invalidRange === undefined ? { state: "mach-o" } : {
				state: "malformed",
				...invalidRange
			};
			const validRanges = header.slices.filter((_slice, index) => header.rangeIssues[index] === null);
			const missingHeaders = [];
			let observedMachO = false;
			for (const slice of validRanges) {
				const magic = sliceHeaderAt(slice.offset);
				if (magic === undefined) missingHeaders.push(slice.offset);
				else if (magic !== null && MACHO_HEADER_MAGICS.includes(magic)) observedMachO = true;
			}
			if (observedMachO) {
				return invalidRange === undefined ? { state: "mach-o" } : {
					state: "malformed",
					...invalidRange
				};
			}
			if (missingHeaders.length > 0) return {
				state: "needs-slice-header",
				offsets: missingHeaders
			};
			return { state: "not-mach-o" };
		};
		readFatSliceDeclarations = (tableBytes, options) => {
			const { count, wide, littleEndian } = options;
			const entrySize = wide ? 32 : 20;
			if (tableBytes.byteLength < count * entrySize) return {
				status: "malformed",
				reason: "FAT table is truncated"
			};
			const view = new DataView(tableBytes.buffer, tableBytes.byteOffset, tableBytes.byteLength);
			const slices = [];
			for (let index = 0; index < count; index++) {
				const base = index * entrySize;
				const offset = wide ? safeNumber(view.getBigUint64(base + 8, littleEndian)) : view.getUint32(base + 8, littleEndian);
				const size = wide ? safeNumber(view.getBigUint64(base + 16, littleEndian)) : view.getUint32(base + 12, littleEndian);
				if (offset === null || size === null) return {
					status: "malformed",
					reason: "FAT offset or size exceeds the safe range"
				};
				slices.push({
					index,
					offset,
					size,
					alignmentExponent: view.getUint32(base + (wide ? 24 : 16), littleEndian),
					cpuType: view.getUint32(base, littleEndian),
					cpuSubtype: view.getUint32(base + 4, littleEndian)
				});
			}
			return {
				status: "parsed",
				slices
			};
		};
		validateFatSlice = (declaration, containerSize, tableEnd, embedded) => {
			const rangeIssue = inspectFatSliceRange(declaration, containerSize, tableEnd);
			if (rangeIssue !== null) return rangeIssue.reason;
			return embedded === undefined ? null : validateFatSliceIdentity(declaration, embedded);
		};
		inspectFatSliceRange = (declaration, containerSize, tableEnd) => {
			const { index, offset, size, alignmentExponent } = declaration;
			if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(size) || size <= 0 || offset < tableEnd) return {
				category: "malformed",
				reason: `FAT architecture ${index} has an invalid slice range`
			};
			if (offset > containerSize || size > containerSize - offset) return {
				category: "malformed",
				reason: `FAT architecture ${index} slice range extends beyond the file`
			};
			if (!Number.isInteger(alignmentExponent) || alignmentExponent < 0 || alignmentExponent > 52) return {
				category: "unsupported",
				reason: `FAT architecture ${index} alignment exponent ${alignmentExponent} is unsupported`
			};
			if (offset % 2 ** alignmentExponent !== 0) return {
				category: "malformed",
				reason: `FAT architecture ${index} offset is not aligned to 2^${alignmentExponent}`
			};
			return null;
		};
		validateFatSliceIdentity = (declaration, embedded) => embedded.cpuType === declaration.cpuType && embedded.cpuSubtype === declaration.cpuSubtype ? null : `FAT architecture ${declaration.index} CPU type/subtype disagrees with its Mach-O header`;
		safeNumber = (value) => value > BigInt(Number.MAX_SAFE_INTEGER) ? null : Number(value);
	})))();
}

//#endregion
export { init_OwnedFileHandle as S, assertRegularFileActive as _, validateFatSlice as a, sameRegularFileState as b, RegularFileCleanupFailure as c, withOwnedFileHandle as d, withOwnedRegularFile as f, RegularFileOperationCancelled as g, RegularFileChangedError as h, readFatSliceDeclarations as i, init_OwnedRegularFile as l, RegularFileAdmissionFailure as m, init_machoContainer as n, validateFatSliceIdentity as o, NonRegularFileReadError as p, readFatContainerHeader as r, RegularFileCancelled as s, classifyFatContainerIdentity as t, regularFileCancellation as u, init_RegularFile as v, OwnedFileHandle as x, openRegularFile as y };