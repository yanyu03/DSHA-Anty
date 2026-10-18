import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { err, init_result, ok } from "./reconstructionObligationLedgerSchemas-Bi6sect1.js";
import { AnalysisCancelledError, AnalysisInputError, AnalysisResourceConstraintError, init_analysisErrorCore } from "./errorSchemas-Ixz_q7qt.js";
import { NonRegularFileReadError, OwnedFileHandle, RegularFileChangedError, RegularFileCleanupFailure, init_OwnedFileHandle, init_OwnedRegularFile, init_RegularFile } from "./OwnedRegularFile-D1f5nUCx.js";
import { ArtifactReaderFailure, init_ArtifactReader } from "./ArtifactReader-DMwm42bk.js";
import { EvidenceFileError, init_evidenceErrors } from "./cliResultOutput-10sd6xGx.js";
import { init_safeJson, safeParseJson } from "./safeJson-DKKACtdy.js";
import { init_RegularFileRead, withRegularFile } from "./RegularFileRead-mbgGYtxe.js";
import { OwnedStagedOutput, init_OwnedStagedOutput } from "./OwnedStagedOutput-D31dOozz.js";
import { basename, dirname, resolve } from "node:path";
import { createHash } from "node:crypto";
import { link, lstat, mkdtemp, open, realpath, rename } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { constants } from "node:buffer";
import { getHeapStatistics } from "node:v8";
import { asStream, none } from "stream-chain";
import fun from "stream-chain/fun.js";
import parser from "stream-json/parser.js";
import streamValues from "stream-json/streamers/stream-values.js";
import streamArray from "stream-json/streamers/stream-array.js";

//#region dist/application/Utf8JsonInput.js
var JSON_INPUT_RESOURCE_REMEDIATION, JSON_BYTE_ORDER_MARK_MESSAGE, parseUtf8Json;
function init_Utf8JsonInput() {
	return (init_Utf8JsonInput = __esmMin((() => {
		init_analysisErrorCore();
		init_safeJson();
		JSON_INPUT_RESOURCE_REMEDIATION = "Provide a smaller valid JSON value. For Evidence workflows, re-analyze a smaller selection of the original target and use its complete Evidence; splitting JSON text or trimming Evidence fields does not produce valid workflow input.";
		JSON_BYTE_ORDER_MARK_MESSAGE = "JSON input begins with a UTF-8 byte-order mark (EF BB BF), which strict JSON input does not accept. Save the file as UTF-8 without a byte-order mark.";
		parseUtf8Json = (bytes, operation, path, boundary = "json-input") => {
			const stringLimitFailure = (cause, decodedUnits) => new AnalysisResourceConstraintError(operation, "memory", "JSON input exceeds the runtime's maximum decoded string length", {
				boundary,
				input_path: path,
				input_bytes: bytes.byteLength,
				max_string_code_units: constants.MAX_STRING_LENGTH,
				...decodedUnits === undefined ? {} : { decoded_string_code_units_at_least: decodedUnits }
			}, {
				...cause === undefined ? {} : { cause },
				remediationAction: JSON_INPUT_RESOURCE_REMEDIATION
			});
			let text;
			try {
				const decoder = new TextDecoder("utf-8", {
					fatal: true,
					ignoreBOM: true
				});
				if (bytes.byteLength <= constants.MAX_STRING_LENGTH) {
					text = decoder.decode(bytes);
				} else {
					const parts = [];
					let decodedUnits = 0;
					const append = (part) => {
						decodedUnits += part.length;
						if (decodedUnits > constants.MAX_STRING_LENGTH) throw stringLimitFailure(undefined, decodedUnits);
						parts.push(part);
					};
					const chunkBytes = 1024 * 1024;
					for (let offset = 0; offset < bytes.byteLength; offset += chunkBytes) append(decoder.decode(bytes.subarray(offset, offset + chunkBytes), { stream: true }));
					append(decoder.decode());
					text = parts.join("");
				}
			} catch (cause) {
				if (cause instanceof AnalysisResourceConstraintError) throw cause;
				const code = typeof cause === "object" && cause !== null && "code" in cause ? cause.code : undefined;
				if (code === "ERR_STRING_TOO_LONG") throw stringLimitFailure(cause);
				if (code !== "ERR_ENCODING_INVALID_ENCODED_DATA") throw cause;
				return {
					ok: false,
					error: "JSON input is not valid UTF-8",
					cause
				};
			}
			if (text.startsWith("﻿")) return {
				ok: false,
				error: JSON_BYTE_ORDER_MARK_MESSAGE,
				cause: undefined
			};
			return safeParseJson(text);
		};
	})))();
}

//#endregion
//#region dist/application/JsonInputFile.js
async function* decodedChunks(handle, admittedBytes, path, signal, observe) {
	const decoder = new TextDecoder("utf-8", {
		fatal: true,
		ignoreBOM: true
	});
	let leading = true;
	const checked = (text) => {
		if (leading && text.length > 0) {
			leading = false;
			if (text.startsWith("﻿")) throw new JsonByteOrderMarkError();
		}
		return text;
	};
	const bytes = Buffer.allocUnsafe(READ_CHUNK_BYTES);
	let observedBytes = 0;
	while (true) {
		signal?.throwIfAborted();
		const read = await handle.read(bytes, 0, Math.min(bytes.length, admittedBytes - observedBytes + 1), observedBytes);
		signal?.throwIfAborted();
		if (read.bytesRead === 0) break;
		observedBytes += read.bytesRead;
		if (observedBytes > admittedBytes) throw new RegularFileChangedError(path);
		const chunk = bytes.subarray(0, read.bytesRead);
		observe?.(chunk);
		yield checked(decoder.decode(chunk, { stream: true }));
	}
	if (observedBytes !== admittedBytes) throw new RegularFileChangedError(path);
	yield checked(decoder.decode());
}
var READ_CHUNK_BYTES, PACKED_TOKEN_PART_CODE_UNITS, NATIVE_PARSE_READ_BUDGET, nativeParseFits, readJsonObjectFile, memberConsumer, readJsonInputFile, jsonReadFailure, packJsonScalars, admitJsonAssembly, requireStringAssemblyHeadroom, JsonByteOrderMarkError, readPrefix, readNativeJson, invalidJson;
function init_JsonInputFile() {
	return (init_JsonInputFile = __esmMin((() => {
		init_RegularFile();
		init_RegularFileRead();
		init_Utf8JsonInput();
		init_analysisErrorCore();
		init_result();
		READ_CHUNK_BYTES = 64 * 1024;
		PACKED_TOKEN_PART_CODE_UNITS = 64 * 1024;
		NATIVE_PARSE_READ_BUDGET = 8 * 1024 * 1024;
		nativeParseFits = (inputBytes) => inputBytes <= NATIVE_PARSE_READ_BUDGET && inputBytes * 72 + READ_CHUNK_BYTES <= getHeapStatistics().total_available_size;
		readJsonObjectFile = (path, operation, scans, signal, resources) => withRegularFile(path, async (handle, stats) => {
			let previousDigest;
			try {
				const native = await readNativeJson(handle, stats.size, path, operation, signal);
				if (native !== undefined) {
					if (!native.ok) return native;
					const value = native.value;
					if (typeof value !== "object" || value === null || Array.isArray(value)) return err(invalidJson(operation, "JSON document root must be an object"));
					for (const members of scans) for (const [key, member] of members) {
						if (!Object.hasOwn(value, key)) continue;
						signal?.throwIfAborted();
						member.begin();
						const selected = Reflect.get(value, key);
						if (member.mode === "array" && !Array.isArray(selected)) {
							member.reject(new TypeError(`JSON member ${key} must be an array`));
							continue;
						}
						for (const item of member.mode === "array" && Array.isArray(selected) ? selected : [selected]) {
							signal?.throwIfAborted();
							try {
								await member.accept(item);
							} catch (cause) {
								member.reject(cause);
							}
						}
					}
					return ok(undefined);
				}
				for (const members of scans) {
					const hash = createHash("sha256");
					let rootObject = false;
					let depth = 0;
					let key;
					let consume;
					await pipeline(decodedChunks(handle, stats.size, path, signal, (bytes) => {
						hash.update(bytes);
					}), asStream(fun(parser({
						jsonStreaming: false,
						streamValues: false,
						packKeys: false,
						packStrings: false,
						packNumbers: false
					}), packJsonScalars(operation, stats.size, path), (token) => {
						const opens = token.name === "startObject" || token.name === "startArray";
						const closes = token.name === "endObject" || token.name === "endArray";
						if (depth === 0) {
							rootObject = token.name === "startObject";
						} else if (rootObject && depth === 1 && token.name === "keyValue") {
							key = token.value;
						} else if (rootObject && depth === 1 && !closes) {
							const member = key === undefined ? undefined : members.get(key);
							consume = undefined;
							if (member !== undefined) {
								member.begin();
								if (member.mode === "array" && token.name !== "startArray") {
									member.reject(new TypeError(`JSON member ${key} must be an array`));
								} else {
									consume = memberConsumer(member, operation, stats.size, path);
								}
							}
							key = undefined;
						}
						const selected = consume;
						if (opens) depth += 1;
						if (closes) depth -= 1;
						if (rootObject && depth === 1 && token.name !== "keyValue") consume = undefined;
						if (selected === undefined) return none;
						return selected(token);
					})), signal === undefined ? {} : { signal });
					if (!rootObject) return err(invalidJson(operation, "JSON document root must be an object"));
					const digest = hash.digest("hex");
					if (previousDigest !== undefined && digest !== previousDigest) throw new RegularFileChangedError(path);
					previousDigest = digest;
				}
				return ok(undefined);
			} catch (cause) {
				const failure = jsonReadFailure(cause, operation, stats.size, path);
				if (failure !== undefined) return err(failure);
				throw cause;
			}
		}, {
			signal,
			...resources === undefined ? {} : { resources }
		});
		memberConsumer = (member, operation, size, path) => {
			let admit = admitJsonAssembly(operation, size, path);
			const streamer = member.mode === "array" ? streamArray() : streamValues();
			const consume = fun((token) => admit(token), streamer, (row) => {
				if (typeof row !== "object" || row === null || !("value" in row)) throw new Error("Unexpected JSON member parser result");
				admit = admitJsonAssembly(operation, size, path);
				try {
					const accepted = member.accept(row.value);
					if (accepted instanceof Promise) return accepted.then(() => none, (cause) => {
						member.reject(cause);
						return none;
					});
				} catch (cause) {
					member.reject(cause);
				}
				return none;
			});
			return (token) => {
				const consumed = consume(token);
				return consumed instanceof Promise ? consumed.then(() => none) : none;
			};
		};
		readJsonInputFile = (path, operation, signal, resources) => withRegularFile(path, async (handle, stats) => {
			let found = false;
			let value;
			try {
				const native = await readNativeJson(handle, stats.size, path, operation, signal);
				if (native !== undefined) return native;
				await pipeline(decodedChunks(handle, stats.size, path, signal), asStream(fun(parser({
					jsonStreaming: false,
					streamValues: false,
					packKeys: false,
					packStrings: false,
					packNumbers: false
				}), packJsonScalars(operation, stats.size, path), admitJsonAssembly(operation, stats.size, path), streamValues(), (row) => {
					if (found || typeof row !== "object" || row === null || !("key" in row) || row.key !== 0 || !("value" in row)) throw new Error("Unexpected JSON parser result");
					found = true;
					value = row.value;
					return none;
				})), signal === undefined ? {} : { signal });
				return found ? ok(value) : err(invalidJson(operation, "JSON document is empty"));
			} catch (cause) {
				const failure = jsonReadFailure(cause, operation, stats.size, path);
				if (failure !== undefined) return err(failure);
				throw cause;
			}
		}, {
			signal,
			...resources === undefined ? {} : { resources }
		});
		jsonReadFailure = (cause, operation, size, path) => {
			if (cause instanceof AnalysisResourceConstraintError) return cause;
			if (cause instanceof TypeError && "code" in cause && cause.code === "ERR_ENCODING_INVALID_ENCODED_DATA") return invalidJson(operation, "JSON input is not valid UTF-8", cause);
			if (cause instanceof SyntaxError || cause instanceof Error && cause.message.startsWith("Parser ")) return invalidJson(operation, cause.message, cause);
			if (cause instanceof Error && (cause instanceof RangeError && cause.message === "Invalid string length" || "code" in cause && cause.code === "ERR_STRING_TOO_LONG")) return new AnalysisResourceConstraintError(operation, "memory", "An individual JSON string or number token exceeds the runtime string limit", {
				input_path: path,
				input_file_bytes: size,
				max_string_code_units: constants.MAX_STRING_LENGTH
			}, {
				cause,
				remediationAction: JSON_INPUT_RESOURCE_REMEDIATION
			});
			return undefined;
		};
		packJsonScalars = (operation, inputFileBytes, path) => {
			let kind;
			let length = 0;
			let value = "";
			let parts = [];
			let partLength = 0;
			return (token) => {
				if (typeof token !== "object" || token === null || !("name" in token)) throw new Error("Unexpected JSON parser token");
				switch (token.name) {
					case "startKey":
					case "startString":
						kind = token.name === "startKey" ? "keyValue" : "stringValue";
						break;
					case "startNumber":
						kind = "numberValue";
						break;
					case "numberChunk":
					case "stringChunk":
						if (kind === undefined || !("value" in token) || typeof token.value !== "string") throw new Error("Unexpected JSON scalar fragment");
						length += token.value.length;
						if (length > constants.MAX_STRING_LENGTH) throw new RangeError("Invalid string length");
						parts.push(token.value);
						partLength += token.value.length;
						if (partLength >= PACKED_TOKEN_PART_CODE_UNITS) {
							requireStringAssemblyHeadroom(operation, inputFileBytes, path, length);
							value += parts.join("");
							parts = [];
							partLength = 0;
						}
						break;
					case "endKey":
					case "endString":
					case "endNumber": {
						if (kind === undefined) throw new Error("Unexpected JSON scalar end");
						requireStringAssemblyHeadroom(operation, inputFileBytes, path, length);
						const packed = {
							name: kind,
							value: value + parts.join("")
						};
						kind = undefined;
						length = 0;
						value = "";
						parts = [];
						partLength = 0;
						return packed;
					}
					default: return token;
				}
				return none;
			};
		};
		admitJsonAssembly = (operation, inputFileBytes, path) => {
			let projectedBytes = 0;
			let nextCheck = 0;
			return (token) => {
				if (typeof token !== "object" || token === null || !("name" in token)) throw new Error("Unexpected JSON assembly token");
				if (token.name === "startObject" || token.name === "startArray") {
					projectedBytes += 128;
				} else if (token.name === "keyValue" || token.name === "stringValue") {
					if (!("value" in token) || typeof token.value !== "string") throw new Error("Unexpected packed JSON string");
					projectedBytes += 64 + token.value.length * 2;
				} else if (token.name === "numberValue" || token.name === "nullValue" || token.name === "trueValue" || token.name === "falseValue") {
					projectedBytes += 64;
				}
				if (projectedBytes >= nextCheck) {
					const heap = getHeapStatistics();
					const requiredBytes = projectedBytes + READ_CHUNK_BYTES;
					if (requiredBytes > heap.total_available_size) throw new AnalysisResourceConstraintError(operation, "memory", "Insufficient heap headroom to materialize the complete JSON value", {
						input_path: path,
						input_file_bytes: inputFileBytes,
						projected_value_bytes: projectedBytes,
						assembly_headroom_bytes: requiredBytes,
						available_heap_bytes: heap.total_available_size,
						heap_size_limit_bytes: heap.heap_size_limit
					}, { remediationAction: JSON_INPUT_RESOURCE_REMEDIATION });
					nextCheck = projectedBytes + READ_CHUNK_BYTES;
				}
				return token;
			};
		};
		requireStringAssemblyHeadroom = (operation, inputFileBytes, path, stringCodeUnits) => {
			if (stringCodeUnits < PACKED_TOKEN_PART_CODE_UNITS) return;
			const heap = getHeapStatistics();
			const requiredBytes = 2 * (stringCodeUnits + PACKED_TOKEN_PART_CODE_UNITS);
			if (requiredBytes > heap.total_available_size) throw new AnalysisResourceConstraintError(operation, "memory", "Insufficient heap headroom to assemble a complete JSON string", {
				input_path: path,
				input_file_bytes: inputFileBytes,
				string_code_units: stringCodeUnits,
				string_assembly_headroom_bytes: requiredBytes,
				available_heap_bytes: heap.total_available_size,
				heap_size_limit_bytes: heap.heap_size_limit
			}, { remediationAction: JSON_INPUT_RESOURCE_REMEDIATION });
		};
		JsonByteOrderMarkError = class extends SyntaxError {
			constructor() {
				super(JSON_BYTE_ORDER_MARK_MESSAGE);
			}
		};
		readPrefix = async (handle, size, signal) => {
			const bytes = Buffer.allocUnsafe(size);
			let offset = 0;
			while (offset < bytes.length) {
				signal?.throwIfAborted();
				const read = await handle.read(bytes, offset, bytes.length - offset, null);
				signal?.throwIfAborted();
				if (read.bytesRead === 0) return {
					bytes: bytes.subarray(0, offset),
					complete: true
				};
				offset += read.bytesRead;
			}
			return {
				bytes,
				complete: false
			};
		};
		readNativeJson = async (handle, size, path, operation, signal) => {
			if (!nativeParseFits(size)) return undefined;
			const prefix = await readPrefix(handle, size + 1, signal);
			if (!prefix.complete || prefix.bytes.length !== size) throw new RegularFileChangedError(path);
			const parsed = parseUtf8Json(prefix.bytes, operation, path, "json-file-input");
			return parsed.ok ? ok(parsed.value) : err(invalidJson(operation, parsed.error, parsed.cause));
		};
		invalidJson = (operation, message, cause) => new AnalysisInputError(operation, cause === undefined ? undefined : { cause }, [{
			path: [],
			reason: "invalid_format",
			expected: "JSON",
			message
		}]);
	})))();
}

//#endregion
//#region dist/application/JsonFiles.js
function writeTextParts(parts, path, overwrite, resources, cancellation) {
	return resources.run(() => writeTextPartsOwned(parts, path, overwrite, resources, cancellation)).catch((cause) => {
		const cleanup = cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined ? cause.cleanup : undefined;
		return err(new EvidenceFileError("write", "io", {
			cause,
			path: resolve(path),
			...cleanup === undefined ? {} : { cleanup }
		}));
	});
}
var readJsonFile, readJsonObjectMembersFile, readJsonFileInput, writeTextFile, writeTextPartsOwned, missingOrIo, publishFile, StagedOutputCleanupFailure, failureMessage, writeStagedParts, assertWriteActive, fileErrorCode;
function init_JsonFiles() {
	return (init_JsonFiles = __esmMin((() => {
		init_evidenceErrors();
		init_analysisErrorCore();
		init_result();
		init_JsonInputFile();
		init_RegularFile();
		init_RegularFileRead();
		init_ArtifactReader();
		init_OwnedFileHandle();
		init_OwnedStagedOutput();
		readJsonFile = async (path, signal, resources) => readJsonFileInput(path, (selected) => readJsonInputFile(selected, "read_evidence_file", signal, resources), signal);
		readJsonObjectMembersFile = (path, scans, signal, resources) => readJsonFileInput(path, (selected) => readJsonObjectFile(selected, "read_evidence_file", scans, signal, resources), signal);
		readJsonFileInput = async (path, read, signal) => {
			const requestedPath = resolve(path);
			try {
				const decoded = await read(requestedPath);
				if (!decoded.ok) {
					if (decoded.error instanceof AnalysisResourceConstraintError) return err(decoded.error);
					return err(new EvidenceFileError("read", "invalid-json", {
						cause: decoded.error.cause ?? new SyntaxError(decoded.error.issues[0]?.message ?? decoded.error.message),
						path: requestedPath
					}));
				}
				return ok(decoded.value);
			} catch (cause) {
				if (cause instanceof RegularFileCleanupFailure) throw cause;
				if (cause instanceof AnalysisResourceConstraintError) return err(cause);
				if (signal?.aborted === true) throw cause;
				return err(new EvidenceFileError("read", cause instanceof NonRegularFileReadError ? "not-file" : missingOrIo(cause), {
					cause,
					path: requestedPath
				}));
			}
		};
		writeTextFile = async (encoded, path, overwrite, resources) => writeTextParts([encoded], path, overwrite, resources);
		writeTextPartsOwned = async (parts, path, overwrite, resources, cancellation) => {
			const requestedPath = resolve(path);
			try {
				assertWriteActive(cancellation);
				const canonicalParent = await realpath(dirname(requestedPath));
				const destination = resolve(canonicalParent, basename(requestedPath));
				const existing = await lstat(destination).catch((cause) => {
					if (fileErrorCode(cause) === "ENOENT") return undefined;
					throw cause;
				});
				if (existing !== undefined) {
					if (!overwrite) return err(new EvidenceFileError("write", "exists", { path: requestedPath }));
					if (!existing.isFile() || existing.isSymbolicLink()) return err(new EvidenceFileError("write", "not-file", { path: requestedPath }));
				}
				assertWriteActive(cancellation);
				const bytes = await publishFile(destination, parts, overwrite, resources, cancellation);
				return ok({
					path: requestedPath,
					bytes
				});
			} catch (cause) {
				if (cause instanceof StagedOutputCleanupFailure) {
					const cleanup = {
						reason: failureMessage(cause.cleanupCause),
						resources: [cause.owner.directory]
					};
					if (cause.outcome.ok) return err(new EvidenceFileError("write", "io", {
						cause,
						path: requestedPath,
						cleanup,
						published: {
							...cause.outcome.value,
							path: requestedPath
						}
					}));
					if (cause.outcome.error instanceof AnalysisCancelledError) return err(new AnalysisCancelledError(cause.outcome.error.operation, {
						cause,
						cleanup
					}));
					return err(new EvidenceFileError("write", missingOrIo(cause.outcome.error), {
						cause,
						path: requestedPath,
						cleanup
					}));
				}
				if (cancellation?.signal.aborted === true && cause instanceof AnalysisCancelledError && cause.operation === cancellation.operation) return err(cause);
				if (!overwrite && fileErrorCode(cause) === "EEXIST") return err(new EvidenceFileError("write", "exists", {
					cause,
					path: requestedPath
				}));
				return err(new EvidenceFileError("write", missingOrIo(cause), {
					cause,
					path: requestedPath
				}));
			}
		};
		missingOrIo = (cause) => {
			const code = fileErrorCode(cause);
			return code === "ENOENT" || code === "ENOTDIR" ? "missing" : "io";
		};
		publishFile = async (destination, parts, overwrite, resources, cancellation) => {
			const stagingDirectory = await mkdtemp(resolve(dirname(destination), ".rea-write-"));
			const owner = await OwnedStagedOutput.create(stagingDirectory);
			let outcome;
			const staged = resolve(stagingDirectory, "content");
			try {
				const file = await open(staged, "wx", 384);
				owner.setFile(new OwnedFileHandle(file));
				let written;
				try {
					const bytes = await writeStagedParts(file, parts, cancellation);
					assertWriteActive(cancellation);
					await file.sync();
					written = ok(bytes);
				} catch (cause) {
					written = err(cause);
				}
				try {
					await owner.closeFile();
				} catch (cause) {
					if (written.ok) written = err(cause);
				}
				if (!written.ok) throw written.error;
				assertWriteActive(cancellation);
				await owner.assertReadyForPublication(staged);
				assertWriteActive(cancellation);
				if (overwrite) {
					await rename(staged, destination);
					owner.recordPublishedRename();
				} else await link(staged, destination);
				outcome = ok({
					path: destination,
					bytes: written.value
				});
			} catch (cause) {
				outcome = err(cause);
			}
			const released = await resources.release({
				kind: "staged-output",
				resource: owner.directory,
				output: owner
			});
			if (released.kind === "failed") throw new StagedOutputCleanupFailure(outcome, released.cause, owner);
			if (!outcome.ok) throw outcome.error;
			return outcome.value.bytes;
		};
		StagedOutputCleanupFailure = class extends Error {
			outcome;
			cleanupCause;
			owner;
			constructor(outcome, cleanupCause, owner) {
				super("Staged output cleanup failed", { cause: outcome.ok ? cleanupCause : outcome.error });
				this.outcome = outcome;
				this.cleanupCause = cleanupCause;
				this.owner = owner;
			}
		};
		failureMessage = (cause) => cause instanceof Error ? cause.message || cause.name : String(cause);
		writeStagedParts = async (file, parts, cancellation) => {
			assertWriteActive(cancellation);
			const iterator = parts[Symbol.iterator]();
			let exhausted = false;
			let bytes = 0;
			try {
				for (;;) {
					assertWriteActive(cancellation);
					const part = iterator.next();
					if (part.done) exhausted = true;
					assertWriteActive(cancellation);
					if (part.done) return bytes;
					await file.writeFile(part.value, { encoding: "utf8" });
					bytes += Buffer.byteLength(part.value, "utf8");
				}
			} finally {
				if (!exhausted) iterator.return?.();
			}
		};
		assertWriteActive = (cancellation) => {
			if (cancellation?.signal.aborted === true) throw new AnalysisCancelledError(cancellation.operation);
		};
		fileErrorCode = (cause) => typeof cause === "object" && cause !== null && "code" in cause ? cause.code : undefined;
	})))();
}

//#endregion
export { init_JsonFiles, init_JsonInputFile, readJsonFile, readJsonInputFile, readJsonObjectMembersFile, writeTextFile, writeTextParts };