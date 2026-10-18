import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { b as init_snapshotEnvironment, d as spawnOwnedProviderProcess, f as ProviderStartupDeadline, l as ProviderProcessSupervisor, m as waitForAbortableDelay, p as init_ProviderDeadline, u as init_ProviderProcess, x as snapshotEnvironment } from "./OwnedCommand-BW1jBSt9.js";
import { A as err, D as AnalysisError, M as ok, O as init_analysisErrorBase, a as AnalysisCapabilityUnavailableError, b as jsonValueSchema, f as init_analysisErrorCore, i as AnalysisCancelledError, j as init_result, k as resolvedAnalysisError, l as AnalysisResourceConstraintError, n as AnalysisAccessDeniedError, o as AnalysisInputError, r as AnalysisArtifactChangedError, s as AnalysisOutputError, u as AnalysisTimeoutError, v as init_jsonValue } from "./analysisErrorCore-BIEP7tvF.js";
import { O as init_configurationErrors, T as BinaryTargetError, d as init_evidenceErrors, l as EvidenceIntegrityError, n as projectAnalysisError, t as init_analysisErrorProjection } from "./analysisErrorProjection-B8teQwwD.js";
import { C as incompletePlistNumberLimitation, Ft as objcSwiftMetadataSchema, Lt as init_swiftSymbolClassification, Nt as isAppleDispatchMetadataTarget, Pt as nativeDispatchMetadataResultSchema, Rt as isSwiftMangledSymbolName, S as createPlistNumberProjection, fn as isMachOFormat, jt as init_objcSwiftMetadata, un as init_binaryTargetTypes, w as init_plistNumbers } from "./nativeValueTrace-BEZbDieM.js";
import { C as signalProcessWithStartIdentity, D as init_DarwinProcessRunTokenReader, E as SWIFTC_INTERRUPT, I as init_ExecFileOutput, M as ExecFileOutputCancelledError, P as execFileOutput, d as cleanupOwnedProcessGroup, g as init_ProcessOwnershipObservation, i as artifactFilePrimaryFailure, n as ArtifactFileCleanupFailure, o as bindArtifactFileCleanup, p as init_ProcessOwnership, r as artifactFileCancellationCause, s as init_ArtifactFileOperation, u as withArtifactRegularFile, y as observeProcessStartIdentity } from "./ArtifactFileOperation-64cQKI7B.js";
import { n as safeParseJson, t as init_safeJson } from "./safeJson-NeGfpkrI.js";
import { i as init_ArtifactReader, t as ArtifactReaderFailure } from "./ArtifactReader-BrnwNaKY.js";
import { S as init_OwnedFileHandle, _ as assertRegularFileActive, a as validateFatSlice, c as RegularFileCleanupFailure, g as RegularFileOperationCancelled, h as RegularFileChangedError, i as readFatSliceDeclarations, l as init_OwnedRegularFile, n as init_machoContainer, s as RegularFileCancelled, u as regularFileCancellation, v as init_RegularFile, x as OwnedFileHandle } from "./machoContainer-CMSxUBlK.js";
import { a as init_AnalysisCleanupLease, i as AnalysisCleanupLeaseGroup, n as init_providerCleanupError, r as AnalysisCleanupLease, t as ProviderCleanupError } from "./providerCleanupError-DIRHxzWo.js";
import { n as ArtifactResourceScope, r as init_ArtifactResourceScope, t as ArtifactResourceRetryFailure } from "./ArtifactResourceScope-zi3Dkqzy.js";
import { _ as hashStableFile, a as init_PrivateRuntimeRoot, i as PrivateRuntimeRoot, n as init_NativeMacOSProviderMetadata, r as nativeMacOSCapabilities, t as NATIVE_MACOS_PROVIDER_IDENTITY, v as init_StableFileHash, y as stableFileHashCause } from "./NativeMacOSProviderMetadata-B_RH4KXF.js";
import { n as readBoundedFileBytes, t as init_BoundedFileBytes } from "./BoundedFileBytes-DYt5q9G2.js";
import { l as init_unicodeCodePointOrder, s as compareUnicodeCodePoints } from "./providerOperationHealth-9DRSGM8N.js";
import { r as init_AnalysisProvider, t as createAnalysisExecution } from "./AnalysisProvider-BABWbLoM.js";
import { i as init_providerAdapterError, r as ProviderAdapterError } from "./browserObservationError-C5okJ5el.js";
import { n as init_analysisErrorCleanup, t as analysisErrorWithCleanupFailure } from "./analysisErrorCleanup-Q344SnTO.js";
import { c as init_machoCpuIdentity, l as machoCpuSubtypeBase } from "./electronFuses-D5SS7XXw.js";
import { Cn as nativeCallObservationResultSchema, Ct as nonFiniteRealLimitation, Et as unknownRealLimitation, Sn as nativeCallObservationInputSchema, St as negativeZeroRealLimitation, Tn as nativeCodeLocationSchema, Tt as unknownDateLimitation, _n as nativeUiResultSchema, ar as listArchitecturesSchema, bn as init_nativeCallObservation, bt as init_plistValue, er as demangleSwiftSchema, gn as nativeUiObservationInputSchema, hn as init_nativeUiObservation, ir as inspectSignatureSchema, nr as inspectMachoSchema, rr as inspectPlistSchema, tr as init_nativeInspection, va as analysisInputErrorFromIssues, vn as nativeUiScenarioInputSchema, wn as nativeCapturedOutputSchema, wt as projectPlistValue, xn as nativeCallEventSchema, xt as negativeZeroReal, ya as init_inputIssueProjection, yn as nativeUiSnapshotSchema } from "./toolOutputSchemaGroups-MJ_f-PMK.js";
import { i as parseXmlPropertyList, n as omitPrototypeKeys, r as omittedPrototypeKeysLimitation, t as init_propertyListKeys } from "./propertyListKeys-BfCo0k4w.js";
import { in as init_nativeToolContracts, n as init_toolContracts, r as toolContract, rn as NATIVE_TOOL_CONTRACTS } from "./toolContracts-BPoHQdlC.js";
import { a as NativeCommandFailure, c as init_CommandRunner, i as NATIVE_COMMAND_TIMEOUT_MS, l as resolveXcrunTool, n as parseLipoOutput, o as XcrunCommandRunner, r as NATIVE_COMMAND_OUTPUT_BUDGET_BYTES, s as failureCapture, t as init_lipo } from "./lipo-DSTgUqL1.js";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { constants } from "node:fs";
import { z } from "zod";
import { tmpdir } from "node:os";
import { lstat, mkdir, mkdtemp, open, realpath, rm, stat, symlink, writeFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";

//#region dist/native/NativePlistSource.js
var resolveNativePlistSelection, macOSBundleRoot, unreadablePlist, nativePlistFailure, readPlistFile, requireRegularPlist, PLIST_MARKUP_PROBE_BYTES, plistSourceFormat;
function init_NativePlistSource() {
	return (init_NativePlistSource = __esmMin((() => {
		init_analysisErrorCore();
		init_configurationErrors();
		init_providerAdapterError();
		init_providerCleanupError();
		init_analysisErrorProjection();
		init_result();
		init_ArtifactReader();
		init_ArtifactFileOperation();
		init_NativeMacOSProviderMetadata();
		resolveNativePlistSelection = async (target, requested) => {
			try {
				if (requested !== undefined && isAbsolute(requested)) return ok({
					path: resolve(requested),
					origin: "selected"
				});
				if (requested === undefined && target.kind === "artifact" && target.format === "plist") return ok({
					path: target.path,
					origin: "selected"
				});
				const source = target.sourcePath ?? target.path;
				const sourceMetadata = await stat(source);
				const root = sourceMetadata.isDirectory() ? source : macOSBundleRoot(target.path) ?? dirname(target.path);
				if (requested !== undefined) return ok({
					path: resolve(root, requested),
					origin: "selected"
				});
				return ok({
					path: target.bundleInfoPlist ?? resolve(root, "Contents/Info.plist"),
					origin: "default"
				});
			} catch (cause) {
				return err(new ProviderAdapterError(NATIVE_MACOS_PROVIDER_IDENTITY.id, "inspect_plist", { cause }));
			}
		};
		macOSBundleRoot = (path) => {
			const programs = dirname(path);
			const contents = dirname(programs);
			return basename(programs) === "MacOS" && basename(contents) === "Contents" ? dirname(contents) : undefined;
		};
		unreadablePlist = (selection, reason, options) => {
			const { path } = selection;
			const sentence = reason.endsWith(".") ? reason : `${reason}.`;
			const missingDefault = `The target has no readable default plist at ${path}: ${sentence} Select another plist in the target with the path input (CLI: --relative-path).`;
			return selection.origin === "default" ? new AnalysisCapabilityUnavailableError(NATIVE_MACOS_PROVIDER_IDENTITY.id, "inspect_plist", missingDefault, {
				...options,
				userMessage: missingDefault
			}) : new AnalysisInputError("inspect_plist", options, [{
				path: ["path"],
				reason: "invalid_value",
				message: `Cannot inspect ${path}: ${sentence}`
			}]);
		};
		nativePlistFailure = (cause, selection, capturedOutput) => {
			if (cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined) {
				const physical = cause instanceof ArtifactFileCleanupFailure ? cause.fileCleanupFailure : undefined;
				const previous = physical?.outcome.kind === "failed" ? nativePlistFailure(artifactFilePrimaryFailure(cause), selection, capturedOutput) : physical?.completionCancellation === undefined ? undefined : new AnalysisCancelledError("inspect_plist", {
					cause: physical.completionCancellation.reason,
					capturedOutput
				});
				const previousProjection = previous === undefined ? null : projectAnalysisError(previous);
				const previousDetails = previousProjection?.details;
				const { captured_output: _capture, ...reasonDetails } = previousDetails ?? {};
				const previousError = previousProjection === null ? null : {
					...previousProjection,
					...previousDetails === undefined ? {} : { details: reasonDetails }
				};
				const failure = new ProviderCleanupError(NATIVE_MACOS_PROVIDER_IDENTITY.id, cause.cleanup.resources, {
					reason: cause.cleanup.reason,
					previous_error: previousError
				}, {
					operation: "inspect_plist",
					cause,
					cleanupPrimary: previous,
					capturedOutput
				});
				bindArtifactFileCleanup(cause, failure);
				return failure;
			}
			if (cause instanceof ArtifactReaderFailure && cause.reason === "cancelled") return new AnalysisCancelledError("inspect_plist", {
				cause: artifactFileCancellationCause(cause),
				capturedOutput
			});
			if (cause instanceof ArtifactReaderFailure && cause.reason === "unavailable") return new AnalysisCapabilityUnavailableError(NATIVE_MACOS_PROVIDER_IDENTITY.id, "inspect_plist", cause.message, {
				cause,
				capturedOutput
			});
			if (selection === undefined) return new ProviderAdapterError(NATIVE_MACOS_PROVIDER_IDENTITY.id, "inspect_plist", {
				cause,
				capturedOutput,
				diagnostics: {
					phase: "plist-scope",
					reason: cause instanceof Error ? cause.message : String(cause)
				}
			});
			const { path } = selection;
			const code = cause instanceof Error && "code" in cause ? cause.code : undefined;
			if (code === "ENOENT" || code === "ENOTDIR") return unreadablePlist(selection, "no file exists there", {
				cause,
				capturedOutput
			});
			if (code === "EISDIR" || code === "ENOTFILE") return unreadablePlist(selection, "it is not a regular file", {
				cause,
				capturedOutput
			});
			if (code === "EACCES" || code === "EPERM") return new BinaryTargetError(path, `permission denied while reading plist (${code})`, {
				cause,
				capturedOutput
			});
			return new ProviderAdapterError(NATIVE_MACOS_PROVIDER_IDENTITY.id, "inspect_plist", {
				cause,
				capturedOutput,
				diagnostics: {
					path,
					phase: "plist-file",
					reason: cause instanceof Error ? cause.message : String(cause)
				}
			});
		};
		readPlistFile = async (input, read) => {
			try {
				return ok(await withArtifactRegularFile(input.selection.path, input.resources, input.signal, read, "follow"));
			} catch (cause) {
				return err(nativePlistFailure(cause, input.selection, input.capturedOutput));
			}
		};
		requireRegularPlist = (input) => readPlistFile(input, async () => null);
		PLIST_MARKUP_PROBE_BYTES = 4096;
		plistSourceFormat = async (description, input) => {
			if (/binary property list/iu.test(description)) return ok("binary");
			if (/\bXML\b/iu.test(description)) return ok("xml");
			if (/\bJSON\b/iu.test(description)) return ok("json");
			if (!/\btext\b/iu.test(description)) return ok("unknown");
			return readPlistFile(input, async (file) => {
				const head = Buffer.alloc(PLIST_MARKUP_PROBE_BYTES);
				const { bytesRead } = await file.read(head, 0, head.length, 0);
				const encoding = head[0] === 255 && head[1] === 254 ? "utf-16le" : head[0] === 254 && head[1] === 255 ? "utf-16be" : "utf-8";
				const text = new TextDecoder(encoding).decode(head.subarray(0, bytesRead)).trimStart();
				return /^<(?:[!?]|(?:plist|dict|array|string|integer|real|data|date|true|false)[\s/>])/u.test(text) ? "xml" : "unknown";
			});
		};
	})))();
}

//#endregion
//#region dist/native/AppleDispatchCoverage.js
var describeFixups, pushDispatchCoverage, formatIssue;
function init_AppleDispatchCoverage() {
	return (init_AppleDispatchCoverage = __esmMin((() => {
		describeFixups = (fixups) => {
			const unread = fixups.unreadRebaseBytes > 0 ? `LC_DYLD_INFO rebase opcodes were not decoded (${fixups.unreadRebaseBytes} bytes)` : undefined;
			const kind = fixups.kind === "chained" ? `chained fixups: ${fixups.formats.join(", ") || "no fixup segments"}` : fixups.kind === "dyld-info" ? "LC_DYLD_INFO bind opcodes" : unread === undefined ? "no fixup load commands" : undefined;
			return [unread, kind].filter((line) => line !== undefined).join("; ");
		};
		pushDispatchCoverage = (input) => {
			const { result, failures, categoryIssues, examined, categoriesExamined, truncated, objcListScanTruncated, objcClassListScanTruncated, fixups, vtables, swift } = input;
			const classOwnedMethods = result.objc_dispatch_implementations.filter(({ category }) => category === undefined);
			const classRecords = [
				...result.objc_classes.flatMap((record) => record.decode?.status === "decoded" ? [] : [`class ${record.name}: ${record.decode?.reason ?? record.decode?.status ?? "decode_status_missing"}`]),
				...result.objc_protocol_records.flatMap((record) => record.decode.status === "decoded" ? [] : [`protocol ${record.name}: ${record.decode.reason ?? record.decode.status}`]),
				...classOwnedMethods.flatMap((record) => record.decode.status === "decoded" ? [] : [`method ${record.class_name} ${record.method_type} ${record.selector}: ${record.decode.reason ?? record.decode.status}`]),
				...result.objc_ivars.flatMap((record) => record.decode.status === "decoded" ? [] : [`ivar ${record.class_name}.${record.name}: ${record.decode.reason ?? record.decode.status}`])
			];
			const classReasons = [
				...failures,
				...classRecords,
				...truncated || objcListScanTruncated ? ["max_records_reached"] : []
			];
			const categoryMethods = result.objc_dispatch_implementations.filter(({ category }) => category !== undefined);
			const categoryMethodReasons = categoryMethods.flatMap((record) => record.decode.status === "decoded" ? [] : [`category method ${record.category} ${record.class_name} ${record.method_type} ${record.selector}: ${record.decode.reason ?? record.decode.status}`]);
			result.coverage.push({
				facet: "objc_class_method_ivar_metadata",
				status: classReasons.length > 0 ? "partial" : "complete",
				reason: classReasons.join("; ") || null,
				examined,
				decoded: result.objc_classes.filter(({ decode }) => decode?.status === "decoded").length
			});
			const relativePointerReasons = [...truncated || objcClassListScanTruncated ? ["max_records_reached"] : [], ...result.relative_pointers.some((item) => item.decode.status !== "decoded") ? ["relative_pointer_targets_unresolved"] : []];
			result.coverage.push({
				facet: "binary_relative_pointers",
				status: relativePointerReasons.length > 0 ? "partial" : "complete",
				reason: relativePointerReasons.join("; ") || null,
				examined: result.relative_pointers.length,
				decoded: result.relative_pointers.filter((item) => item.decode.status === "decoded").length
			});
			const categoryFailures = categoryIssues.map(({ code, location, message }) => `${code}${location === undefined ? "" : ` at ${location}`}: ${message}`);
			result.coverage.push({
				facet: "objc_properties_categories",
				status: truncated || objcClassListScanTruncated || categoryFailures.length > 0 || result.objc_categories.some(({ decode }) => decode.status !== "decoded") || categoryMethodReasons.length > 0 ? "partial" : "complete",
				reason: [
					...categoryFailures,
					...categoryMethodReasons,
					...truncated || objcClassListScanTruncated ? ["max_records_reached"] : []
				].join("; ") || null,
				examined: categoriesExamined,
				decoded: result.objc_categories.filter(({ decode }) => decode.status === "decoded").length
			});
			const fixupReason = [describeFixups(fixups), ...fixups.issues.map(({ code, location, message }) => `${code}${location === undefined ? "" : ` at ${location}`}: ${message}`)].filter((line) => line.length > 0).join("; ");
			result.coverage.push({
				facet: "pointer_fixups",
				status: fixups.issues.length > 0 || fixups.unreadRebaseBytes > 0 ? "partial" : fixups.examined === 0 ? "unsupported" : "complete",
				reason: fixupReason.length > 0 ? fixupReason : null,
				examined: fixups.examined,
				decoded: fixups.decoded
			});
			result.coverage.push({
				facet: "swift_generic_resilient_witnesses_overrides_async_coroutines",
				status: "unsupported",
				reason: "This reader admits simple Swift conformance/static witness records and non-generic, non-resilient class vtables; generic/resilient tables and other Swift metadata families are not decoded",
				examined: 0,
				decoded: 0
			});
			result.coverage.push({
				facet: "swift_conformances_static_witness_slots",
				status: swift.exhaustive && !truncated && !result.swift_conformances.some(({ decode }) => decode.status !== "decoded") && !result.swift_dispatch_slots.some(({ table_kind, decode }) => table_kind === "witness_table" && decode.status !== "decoded") ? "complete" : "partial",
				reason: [
					...swift.issues.map(formatIssue),
					...truncated ? ["max_records_reached"] : [],
					...result.swift_conformances.some(({ decode }) => decode.status !== "decoded") || result.swift_dispatch_slots.some(({ table_kind, decode }) => table_kind === "witness_table" && decode.status !== "decoded") ? ["swift_records_unresolved"] : []
				].join("; ") || null,
				examined: swift.examined,
				decoded: swift.decoded
			});
			result.coverage.push({
				facet: "swift_class_vtable_descriptors",
				status: vtables.exhaustive && !truncated && !result.swift_dispatch_slots.some(({ table_kind, decode }) => table_kind === "class_vtable" && decode.status !== "decoded") ? "complete" : "partial",
				reason: [
					...vtables.issues.map(formatIssue),
					...truncated ? ["max_records_reached"] : [],
					...result.swift_dispatch_slots.some(({ table_kind, decode }) => table_kind === "class_vtable" && decode.status !== "decoded") ? ["vtable_implementations_unresolved"] : []
				].join("; ") || null,
				examined: vtables.examined,
				decoded: vtables.decoded
			});
		};
		formatIssue = ({ code, location, message }) => `${code}${location === undefined ? "" : ` at ${location}`}: ${message}`;
	})))();
}

//#endregion
//#region dist/native/AppleDispatchDecodeFacts.js
var issue;
function init_AppleDispatchDecodeFacts() {
	return (init_AppleDispatchDecodeFacts = __esmMin((() => {
		issue = (facet, code, message, location) => ({
			facet,
			code,
			message,
			...location === undefined ? {} : { location }
		});
	})))();
}

//#endregion
//#region dist/native/AppleMachoFixups.js
var POINTER_FORMATS, bits, signed, libraryName, cString, readImport, decodeChainedPointer, readChainedPage, chainedFixups, uleb, sleb, setBindRegister, readBindStream, parsePointerFixups;
function init_AppleMachoFixups() {
	return (init_AppleMachoFixups = __esmMin((() => {
		init_AppleDispatchDecodeFacts();
		POINTER_FORMATS = {
			1: "DYLD_CHAINED_PTR_ARM64E",
			2: "DYLD_CHAINED_PTR_64",
			6: "DYLD_CHAINED_PTR_64_OFFSET",
			9: "DYLD_CHAINED_PTR_ARM64E_USERLAND",
			12: "DYLD_CHAINED_PTR_ARM64E_USERLAND24"
		};
		bits = (value, from, width) => value >> BigInt(from) & (1n << BigInt(width)) - 1n;
		signed = (value, width) => value >= 1n << BigInt(width - 1) ? value - (1n << BigInt(width)) : value;
		libraryName = (ordinal, dylibs) => {
			if (ordinal > 0) return dylibs[ordinal - 1] ?? null;
			return null;
		};
		cString = (bytes, offset, end) => {
			const stop = bytes.indexOf(0, offset);
			if (offset < 0 || offset >= end || stop < 0 || stop >= end) throw new RangeError("Fixup symbol name is outside the symbol pool");
			return bytes.toString("utf8", offset, stop);
		};
		readImport = (data, header, index) => {
			const { bytes, base, end, dylibs } = data;
			const size = header.format === 3 ? 16 : header.format === 2 ? 8 : 4;
			if (header.format < 1 || header.format > 3) throw new RangeError(`Unsupported chained import format ${header.format}`);
			if (!Number.isSafeInteger(header.count) || base + header.offset + header.count * size > end) throw new RangeError("Chained import table exceeds the fixup data");
			if (index < 0 || index >= header.count) throw new RangeError("Chained import index is outside the table");
			const at = base + header.offset + index * size;
			if (header.format === 3) {
				const word = bytes.readBigUInt64LE(at);
				const encodedOrdinal = Number(bits(word, 0, 16));
				const ordinal = encodedOrdinal > 65520 ? encodedOrdinal - 65536 : encodedOrdinal;
				return {
					symbol: cString(bytes, base + header.symbols + Number(bits(word, 32, 32)), end),
					library: libraryName(ordinal, dylibs),
					weak: bits(word, 16, 1) === 1n,
					addend: bytes.readBigInt64LE(at + 8)
				};
			}
			const word = bytes.readUInt32LE(at);
			const encodedOrdinal = word & 255;
			const ordinal = encodedOrdinal > 240 ? encodedOrdinal - 256 : encodedOrdinal;
			return {
				symbol: cString(bytes, base + header.symbols + (word >>> 9), end),
				library: libraryName(ordinal, dylibs),
				weak: (word >>> 8 & 1) === 1,
				addend: header.format === 2 ? BigInt(bytes.readInt32LE(at + 4)) : 0n
			};
		};
		decodeChainedPointer = (raw, format, baseAddress, imports) => {
			const bind = (ordinal, addend) => {
				const target = typeof imports === "function" ? imports(Number(ordinal)) : imports[Number(ordinal)];
				if (target === undefined) throw new RangeError(`Chained bind ordinal ${ordinal} has no import`);
				return {
					kind: "bind",
					...target,
					addend: target.addend + addend
				};
			};
			if (format === 2 || format === 6) {
				if (bits(raw, 63, 1) === 1n) return bind(bits(raw, 0, 24), bits(raw, 24, 8));
				const target = bits(raw, 0, 36) | bits(raw, 36, 8) << 56n;
				return {
					kind: "rebase",
					target: format === 6 ? target + baseAddress : target
				};
			}
			if (format === 1 || format === 9 || format === 12) {
				const auth = bits(raw, 63, 1) === 1n;
				if (bits(raw, 62, 1) === 1n) return bind(bits(raw, 0, format === 12 ? 24 : 16), auth ? 0n : signed(bits(raw, 32, 19), 19));
				if (auth) return {
					kind: "rebase",
					target: bits(raw, 0, 32) + baseAddress
				};
				const target = bits(raw, 0, 43) | bits(raw, 43, 8) << 56n;
				return {
					kind: "rebase",
					target: format === 1 ? target : target + baseAddress
				};
			}
			throw new RangeError(`Unsupported chained pointer format ${format}`);
		};
		readChainedPage = (bytes, source) => {
			let locations = new Uint8Array(0);
			let lastOffset;
			let failure;
			try {
				if ((source.start & 32768) !== 0) throw new RangeError("Multiple chained starts are not valid for 64-bit pointers");
				if (source.start + 8 > source.size) throw new RangeError("Chained pointer leaves its file-backed page");
				locations = new Uint8Array(Math.ceil(source.size / 8));
				const generic = source.format === 2 || source.format === 6;
				let at = source.start;
				while (true) {
					locations[at >>> 3] = (locations[at >>> 3] ?? 0) | 1 << (at & 7);
					lastOffset = at;
					const raw = bytes.readBigUInt64LE(source.offset + at);
					const next = Number(bits(raw, 51, generic ? 12 : 11)) * (generic ? 4 : 8);
					if (next === 0) break;
					if (at + next + 8 > source.size) throw new RangeError("Chained pointer link leaves its file-backed page");
					at += next;
				}
			} catch (cause) {
				failure = cause instanceof Error ? cause.message : String(cause);
			}
			return {
				locations,
				lastOffset,
				failure
			};
		};
		chainedFixups = (image, range, unreadRebaseBytes) => {
			const { bytes, segments, dylibs, baseAddress } = image;
			const base = range.offset;
			const end = range.offset + range.size;
			if (!Number.isSafeInteger(base) || base < 0 || !Number.isSafeInteger(range.size) || range.size < 28 || end > bytes.length) throw new RangeError("Chained fixup header exceeds the target");
			if (bytes.readUInt32LE(base) !== 0) throw new RangeError("Unsupported chained fixup header version");
			const startsOffset = bytes.readUInt32LE(base + 4);
			const importHeader = {
				offset: bytes.readUInt32LE(base + 8),
				symbols: bytes.readUInt32LE(base + 12),
				count: bytes.readUInt32LE(base + 16),
				format: bytes.readUInt32LE(base + 20)
			};
			const importSize = importHeader.format === 3 ? 16 : importHeader.format === 2 ? 8 : 4;
			const importTableEnd = base + importHeader.offset + importHeader.count * importSize;
			if (importHeader.format < 1 || importHeader.format > 3) throw new RangeError(`Unsupported chained import format ${importHeader.format}`);
			if (importHeader.offset < 28 || importHeader.symbols < importHeader.offset || importTableEnd > base + importHeader.symbols || base + importHeader.symbols > end) throw new RangeError("Chained import table exceeds the fixup data");
			const imports = (index) => readImport({
				bytes,
				base,
				end,
				dylibs
			}, importHeader, index);
			if (bytes.readUInt32LE(base + 24) !== 0) throw new RangeError("Compressed chained-fixup symbol names are not supported");
			const starts = base + startsOffset;
			const startsEnd = base + importHeader.offset;
			const requireStartsRange = (at, size) => {
				if (at < base + 28 || at > startsEnd - size) throw new RangeError("Chained starts table exceeds its fixup data");
			};
			requireStartsRange(starts, 4);
			const segmentCount = bytes.readUInt32LE(starts);
			if (segmentCount > segments.length) throw new RangeError("Chained starts segment count exceeds the Mach-O layout");
			requireStartsRange(starts, 4 + segmentCount * 4);
			const ranges = [];
			const maximumCachedPages = Math.ceil(bytes.length / 4096) + 2 * segmentCount;
			let remainingLocationBytes = Math.ceil(bytes.length / 8);
			const cachedPages = new Map();
			const pageFacts = (chain, page, start) => {
				const pageOffset = page * chain.pageSize;
				const source = {
					offset: chain.segment.offset + pageOffset,
					size: Math.min(chain.pageSize, Number(chain.segment.size) - pageOffset, bytes.length - chain.segment.offset - pageOffset),
					format: chain.format,
					start
				};
				const key = `${source.offset}:${source.size}:${source.format}:${source.start}`;
				const cached = cachedPages.get(key);
				if (cached !== undefined) return cached;
				const retain = cachedPages.size < maximumCachedPages && Math.ceil(Math.max(source.size, 0) / 8) <= remainingLocationBytes;
				const facts = readChainedPage(bytes, source);
				if (retain) {
					remainingLocationBytes -= facts.locations.byteLength;
					cachedPages.set(key, facts);
				}
				return facts;
			};
			for (let index = 0; index < segmentCount; index++) {
				const infoOffset = bytes.readUInt32LE(starts + 4 + index * 4);
				if (infoOffset === 0) continue;
				const segment = segments[index];
				if (segment === undefined) throw new RangeError("Chained fixup segment table is out of range");
				const info = starts + infoOffset;
				requireStartsRange(info, 22);
				const infoSize = bytes.readUInt32LE(info);
				const pageSize = bytes.readUInt16LE(info + 4);
				const pageCount = bytes.readUInt16LE(info + 20);
				if (infoSize < 22 + pageCount * 2) throw new RangeError("Chained page starts exceed the segment table size");
				requireStartsRange(info, infoSize);
				if (pageSize !== 4096 && pageSize !== 16384) throw new RangeError("Chained page size must be 4096 or 16384 bytes");
				if (bytes.readBigUInt64LE(info + 8) !== segment.address - baseAddress) throw new RangeError("Chained segment offset disagrees with its Mach-O layout");
				ranges.push({
					segment,
					format: bytes.readUInt16LE(info + 6),
					pageSize,
					pageCount,
					pageStarts: info + 22
				});
			}
			const formats = [...new Set(ranges.map(({ format }) => POINTER_FORMATS[format] ?? `format-${format}`))];
			const issues = ranges.flatMap(({ format, segment }) => POINTER_FORMATS[format] === undefined ? [issue("pointer_fixups", "unsupported_pointer_format", `Unsupported chained pointer format ${format}`, `0x${segment.address.toString(16)}`)] : []);
			const examinedViews = new Map();
			const decodedRanges = new Set();
			for (const [chainIndex, chain] of ranges.entries()) {
				if (POINTER_FORMATS[chain.format] === undefined) continue;
				const view = `${chain.pageStarts}:${chain.segment.offset}:${chain.segment.size}:${chain.segment.address}:${chain.format}:${chain.pageSize}:${chain.pageCount}`;
				const prior = examinedViews.get(view);
				if (prior !== undefined) {
					if (prior) decodedRanges.add(chainIndex);
					continue;
				}
				let complete = true;
				for (let page = 0; page < chain.pageCount; page++) {
					const start = bytes.readUInt16LE(chain.pageStarts + page * 2);
					if (start === 65535) continue;
					const facts = pageFacts(chain, page, start);
					if (facts.failure !== undefined) {
						complete = false;
						issues.push(issue("pointer_fixups", "chained_pointer_walk_failed", facts.failure, `0x${(chain.segment.address + BigInt(page * chain.pageSize)).toString(16)}`));
						break;
					}
				}
				examinedViews.set(view, complete);
				if (complete) decodedRanges.add(chainIndex);
			}
			const failures = issues.map(({ message }) => message);
			return {
				kind: "chained",
				formats,
				failures,
				issues,
				examined: Math.max(ranges.length, 1),
				get decoded() {
					return ranges.length === 0 ? 1 : decodedRanges.size;
				},
				unreadRebaseBytes,
				decode(address, raw) {
					const chainIndex = ranges.findIndex(({ segment }) => address >= segment.address && address < segment.address + segment.size);
					const chain = ranges[chainIndex];
					if (chain === undefined) return {
						kind: "rebase",
						target: raw
					};
					const within = Number(address - chain.segment.address);
					const page = Math.floor(within / chain.pageSize);
					if (page >= chain.pageCount) return {
						kind: "rebase",
						target: raw
					};
					const start = bytes.readUInt16LE(chain.pageStarts + page * 2);
					if (start === 65535) return {
						kind: "rebase",
						target: raw
					};
					if (POINTER_FORMATS[chain.format] === undefined) return {
						kind: "unsupported",
						reason: `Unsupported chained pointer format ${chain.format}`
					};
					try {
						const facts = pageFacts(chain, page, start);
						const at = within % chain.pageSize;
						const locations = facts.locations;
						if (((locations[at >>> 3] ?? 0) & 1 << (at & 7)) !== 0) return decodeChainedPointer(raw, chain.format, baseAddress, imports);
						if (facts.failure !== undefined && (facts.lastOffset === undefined || at > facts.lastOffset)) throw new RangeError(facts.failure);
						return {
							kind: "rebase",
							target: raw
						};
					} catch (cause) {
						const reason = cause instanceof Error ? cause.message : String(cause);
						const location = `0x${address.toString(16)}`;
						if (!issues.some((entry) => entry.code === "chained_pointer_decode_failed" && entry.location === location)) {
							issues.push(issue("pointer_fixups", "chained_pointer_decode_failed", reason, location));
							failures.push(reason);
						}
						decodedRanges.delete(chainIndex);
						return {
							kind: "unsupported",
							reason
						};
					}
				}
			};
		};
		uleb = (bytes, cursor, end) => {
			let value = 0n;
			let shift = 0;
			for (;;) {
				if (cursor.at >= end) throw new RangeError("Truncated bind opcode operand");
				const byte = bytes[cursor.at++] ?? 0;
				const slice = byte & 127;
				if (shift === 63 && slice > 1 || shift === 64 && slice !== 0) throw new RangeError("Oversized bind opcode operand");
				if (shift < 64) value |= BigInt(slice) << BigInt(shift);
				shift = Math.min(64, shift + 7);
				if ((byte & 128) === 0) return value;
			}
		};
		sleb = (bytes, cursor, end) => {
			let value = 0n;
			let shift = 0;
			let byte = 0;
			do {
				if (cursor.at >= end) throw new RangeError("Truncated bind opcode operand");
				byte = bytes[cursor.at++] ?? 0;
				const slice = byte & 127;
				if (shift === 63 && slice !== 0 && slice !== 127 || shift === 64 && slice !== (value < 0n ? 127 : 0)) throw new RangeError("Oversized bind opcode operand");
				if (shift < 64) value = BigInt.asIntN(64, value | BigInt(slice) << BigInt(shift));
				shift = Math.min(64, shift + 7);
			} while ((byte & 128) !== 0);
			return shift < 64 && (byte & 64) !== 0 ? value - (1n << BigInt(shift)) : value;
		};
		setBindRegister = (image, stream, state, byte) => {
			const { bytes } = image;
			const { cursor, end } = stream;
			const immediate = byte & 15;
			switch (byte & 240) {
				case 16:
					state.ordinal = immediate;
					return true;
				case 32:
					state.ordinal = Number(uleb(bytes, cursor, end));
					return true;
				case 48:
					state.ordinal = immediate === 0 ? 0 : immediate - 16;
					return true;
				case 64: {
					const stop = bytes.indexOf(0, cursor.at);
					if (stop < 0 || stop >= end) throw new RangeError("Unterminated bind symbol");
					state.symbol = bytes.toString("utf8", cursor.at, stop);
					state.weak = (immediate & 1) !== 0;
					cursor.at = stop + 1;
					return true;
				}
				case 80: return true;
				case 96:
					state.addend = sleb(bytes, cursor, end);
					return true;
				case 112: {
					const segment = image.segments[immediate];
					if (segment === undefined) throw new RangeError("Bind segment index is out of range");
					state.segmentIndex = immediate;
					state.address = segment.address + uleb(bytes, cursor, end);
					return true;
				}
				case 128:
					state.address = state.address + uleb(bytes, cursor, end) & 18446744073709551615n;
					return true;
				default: return false;
			}
		};
		readBindStream = (image, range, binds) => {
			const { bytes } = image;
			const end = range.offset + range.size;
			if (end > bytes.length) throw new RangeError("Bind opcodes exceed the target");
			const cursor = { at: range.offset };
			const state = {
				ordinal: 0,
				segmentIndex: -1,
				symbol: "",
				weak: false,
				addend: 0n,
				address: 0n
			};
			const preflightRun = (count, skip) => {
				if (count === 0n) return;
				const segment = image.segments[state.segmentIndex];
				if (segment === undefined) throw new RangeError("Bind location has no selected segment");
				const stride = 8n + skip;
				const end = state.address + (count - 1n) * stride + 8n;
				if (state.address < segment.address || end > segment.address + segment.size) throw new RangeError("Bind expansion leaves its file-backed segment");
			};
			const bind = (count, skip) => {
				if (count === 0n) return;
				preflightRun(count, skip);
				const stride = 8n + skip;
				const binding = {
					symbol: state.symbol,
					library: range.stream === "weak" ? null : libraryName(state.ordinal, image.dylibs),
					weak: state.weak,
					addend: state.addend
				};
				const previous = binds.at(-1);
				if (previous !== undefined && previous.stride === stride && previous.start + previous.count * stride === state.address && previous.binding.symbol === binding.symbol && previous.binding.library === binding.library && previous.binding.weak === binding.weak && previous.binding.addend === binding.addend) {
					previous.count += count;
				} else {
					binds.push({
						start: state.address,
						count,
						stride,
						binding
					});
				}
				state.address = state.address + count * stride & 18446744073709551615n;
			};
			while (cursor.at < end) {
				const byte = bytes[cursor.at++] ?? 0;
				if (setBindRegister(image, {
					cursor,
					end
				}, state, byte)) continue;
				switch (byte & 240) {
					case 0:
						if (range.stream !== "lazy") return;
						break;
					case 144:
						bind(1n, 0n);
						break;
					case 160:
						bind(1n, uleb(bytes, cursor, end));
						break;
					case 176:
						bind(1n, BigInt(byte & 15) * 8n);
						break;
					case 192: {
						if (range.stream === "lazy") throw new RangeError("Lazy bind streams do not support repeated bind opcodes");
						const count = uleb(bytes, cursor, end);
						const skip = uleb(bytes, cursor, end);
						bind(count, skip);
						break;
					}
					default: throw new RangeError(`Unsupported bind opcode 0x${byte.toString(16)}`);
				}
			}
		};
		parsePointerFixups = (bytes, commands, segments, baseAddress) => {
			const image = {
				bytes,
				segments,
				dylibs: commands.dylibs,
				baseAddress
			};
			const unreadRebaseBytes = commands.rebases.reduce((total, rebase) => total + rebase.size, 0);
			if (commands.chained !== null) {
				return chainedFixups(image, commands.chained, unreadRebaseBytes);
			}
			if (commands.binds.length === 0) return {
				kind: "none",
				formats: [],
				failures: [],
				issues: [],
				examined: 0,
				decoded: 0,
				unreadRebaseBytes,
				decode: (_address, raw) => ({
					kind: "rebase",
					target: raw
				})
			};
			const binds = [];
			const failures = [];
			let decoded = 0;
			for (const stream of commands.binds) try {
				readBindStream(image, stream, binds);
				decoded++;
			} catch (cause) {
				failures.push(`${stream.stream} bind opcodes: ${cause instanceof Error ? cause.message : String(cause)}`);
			}
			return {
				kind: "dyld-info",
				formats: [],
				failures,
				issues: failures.map((message) => issue("pointer_fixups", "bind_stream_decode_failed", message)),
				examined: commands.binds.length,
				decoded,
				unreadRebaseBytes,
				decode(address, raw) {
					let match;
					for (const run of binds) {
						const { start, count, stride } = run;
						const distance = address - start;
						if (distance >= 0n && distance % stride === 0n && distance / stride < count) {
							if (match !== undefined) return {
								kind: "unsupported",
								reason: `Ambiguous bind records target pointer location 0x${address.toString(16)}`
							};
							match = run;
						}
					}
					return match === undefined ? {
						kind: "rebase",
						target: raw
					} : {
						kind: "bind",
						...match.binding
					};
				}
			};
		};
	})))();
}

//#endregion
//#region dist/native/MachoArchitectureSelection.js
var MACHO_ARCHITECTURE_POLICIES, machoSubtypeRank, selectMachoArchitectureName;
function init_MachoArchitectureSelection() {
	return (init_MachoArchitectureSelection = __esmMin((() => {
		init_machoCpuIdentity();
		MACHO_ARCHITECTURE_POLICIES = {
			x86: {
				cpuType: 7,
				subtypes: [{
					subtype: 3,
					name: "i386"
				}]
			},
			x86_64: {
				cpuType: 16777223,
				subtypes: [{
					subtype: 3,
					name: "x86_64"
				}]
			},
			arm: {
				cpuType: 12,
				subtypes: [],
				variantName: /^arm$/u
			},
			arm64: {
				cpuType: 16777228,
				subtypes: [
					{
						subtype: 0,
						name: "arm64"
					},
					{
						subtype: 2,
						name: "arm64e"
					},
					{
						subtype: 1,
						name: "arm64v8"
					}
				],
				variantName: /^arm64e\.[A-Za-z0-9_]+$/u
			}
		};
		machoSubtypeRank = (policy, subtype) => {
			const rank = policy.subtypes.findIndex((candidate) => candidate.subtype === machoCpuSubtypeBase(subtype));
			return rank < 0 ? policy.subtypes.length : rank;
		};
		selectMachoArchitectureName = (policy, available) => {
			let selected;
			let bestRank = Number.POSITIVE_INFINITY;
			for (const architecture of available) {
				if (architecture.cpu_type_code !== null && architecture.cpu_type_code !== policy.cpuType) continue;
				const namedSubtype = policy.subtypes.find(({ name }) => name === architecture.name);
				const recognizedName = namedSubtype !== undefined || policy.variantName?.test(architecture.name);
				if (!recognizedName && (architecture.cpu_type_code === null || architecture.cpu_subtype_base === null)) continue;
				const subtype = architecture.cpu_subtype_base ?? namedSubtype?.subtype;
				const rank = subtype === undefined ? policy.subtypes.length : machoSubtypeRank(policy, subtype);
				if (rank >= bestRank) continue;
				selected = architecture.name;
				bestRank = rank;
			}
			return selected;
		};
	})))();
}

//#endregion
//#region dist/native/AppleMachoSelection.js
var hex$2, fatHeaderFormat, selectMachoSlice, MH_MAGIC, MH_CIGAM, parseMachoLayout, collectSegment$1, LC_DYLD_INFO, LC_DYLD_INFO_ONLY, LC_DYLD_CHAINED_FIXUPS, DYLIB_COMMANDS$1, collectFixupCommand;
function init_AppleMachoSelection() {
	return (init_AppleMachoSelection = __esmMin((() => {
		init_MachoArchitectureSelection();
		init_machoCpuIdentity();
		init_machoContainer();
		hex$2 = (value) => `0x${value.toString(16)}`;
		fatHeaderFormat = (magic) => {
			switch (magic) {
				case 3405691582: return {
					littleEndian: false,
					fat64: false
				};
				case 3405691583: return {
					littleEndian: false,
					fat64: true
				};
				case 3199925962: return {
					littleEndian: true,
					fat64: false
				};
				case 3216703178: return {
					littleEndian: true,
					fat64: true
				};
				default: return null;
			}
		};
		selectMachoSlice = (bytes, architecture) => {
			const magic = bytes.readUInt32BE(0);
			const header = fatHeaderFormat(magic);
			if (header === null) return {
				slice: 0,
				sliceEnd: bytes.length
			};
			const { littleEndian, fat64 } = header;
			const stride = fat64 ? 32 : 20;
			const readUInt32 = littleEndian ? (offset) => bytes.readUInt32LE(offset) : (offset) => bytes.readUInt32BE(offset);
			const byteOrder = littleEndian ? "little-endian" : "big-endian";
			const malformed = (reason) => new RangeError(`${reason} (FAT header byte order: ${byteOrder})`);
			const invalid = (reason) => new TypeError(`${reason} (FAT header byte order: ${byteOrder})`);
			if (bytes.length < 8) throw malformed("Malformed FAT architecture table");
			const count = readUInt32(4);
			const headerEnd = 8 + count * stride;
			if (count > 128 || headerEnd > bytes.length) throw malformed("Malformed FAT architecture table");
			const policy = MACHO_ARCHITECTURE_POLICIES[architecture];
			if (policy === undefined) throw invalid("Requested FAT architecture is absent");
			const declarations = readFatSliceDeclarations(bytes.subarray(8, headerEnd), {
				count,
				wide: fat64,
				littleEndian
			});
			if (declarations.status !== "parsed") throw malformed(declarations.reason);
			let best;
			let bestRank = Number.POSITIVE_INFINITY;
			let ambiguous = false;
			for (const declaration of declarations.slices) {
				const issue = validateFatSlice(declaration, bytes.length, headerEnd);
				if (issue !== null) throw malformed(issue);
				if (declaration.cpuType !== policy.cpuType) continue;
				const rank = machoSubtypeRank(policy, declaration.cpuSubtype);
				if (best !== undefined && rank >= bestRank) {
					if (rank === bestRank && machoCpuSubtypeBase(declaration.cpuSubtype) === machoCpuSubtypeBase(best.cpuSubtype)) ambiguous = true;
					continue;
				}
				best = declaration;
				bestRank = rank;
				ambiguous = false;
			}
			if (best === undefined) throw invalid("Requested FAT architecture is absent");
			if (ambiguous) throw invalid("Ambiguous FAT architecture slice");
			const selected = {
				slice: best.offset,
				sliceEnd: best.offset + best.size,
				fatDeclaration: {
					...best,
					tableEnd: headerEnd
				}
			};
			if (selected.slice + 4 > bytes.length) throw malformed("Truncated Mach-O header");
			const sliceMagic = bytes.readUInt32LE(selected.slice);
			if (sliceMagic === MH_MAGIC || sliceMagic === MH_CIGAM) throw invalid(`Unsupported 32-bit Mach-O metadata for requested CPU type ${architecture}`);
			return selected;
		};
		MH_MAGIC = 4277009102;
		MH_CIGAM = 3472551422;
		parseMachoLayout = (bytes, architecture) => {
			if (bytes.length < 4) throw new RangeError("Truncated Mach-O header");
			const selection = selectMachoSlice(bytes, architecture);
			const { slice, sliceEnd } = selection;
			if (slice === 0 && sliceEnd === bytes.length && bytes.length < 32) throw new RangeError("Truncated Mach-O header");
			if (slice + 32 > sliceEnd || bytes.readUInt32LE(slice) !== 4277009103) throw new TypeError("Only little-endian 64-bit Mach-O metadata is supported");
			const fat = selection.fatDeclaration;
			if (fat !== undefined) {
				const issue = validateFatSlice(fat, bytes.length, fat.tableEnd, {
					cpuType: bytes.readUInt32LE(slice + 4),
					cpuSubtype: bytes.readUInt32LE(slice + 8)
				});
				if (issue !== null) throw new TypeError(issue);
			}
			const commands = bytes.readUInt32LE(slice + 16);
			const commandEnd = slice + 32 + bytes.readUInt32LE(slice + 20);
			if (commands > 4096 || commandEnd > sliceEnd) throw new RangeError("Malformed Mach-O command bounds");
			const state = {
				slice,
				sliceEnd,
				segments: [],
				sections: [],
				dylibs: [],
				binds: [],
				rebases: [],
				chained: null,
				baseAddress: undefined
			};
			let cursor = slice + 32;
			for (let index = 0; index < commands; index++) {
				if (cursor + 8 > commandEnd) throw new RangeError("Truncated load command");
				const command = {
					cursor,
					kind: bytes.readUInt32LE(cursor),
					size: bytes.readUInt32LE(cursor + 4)
				};
				if (command.size < 8 || cursor + command.size > commandEnd) throw new RangeError("Invalid load command size");
				if (command.kind === 25) collectSegment$1(bytes, command, state);
				else collectFixupCommand(bytes, command, state);
				cursor += command.size;
			}
			const { segments, sections, chained, binds, rebases, dylibs } = state;
			const offset = (address, size = 1) => {
				const matches = segments.filter((segment) => address >= segment.address && address + BigInt(size) <= segment.address + segment.size);
				if (matches.length !== 1) throw new RangeError(`Unmapped or ambiguous metadata pointer ${hex$2(address)}`);
				const segment = matches[0];
				if (segment === undefined) throw new RangeError("Missing metadata segment");
				return segment.offset + Number(address - segment.address);
			};
			return {
				segments,
				sections,
				offset,
				fixups: {
					chained,
					binds,
					rebases,
					dylibs
				},
				baseAddress: state.baseAddress ?? 0n
			};
		};
		collectSegment$1 = (bytes, { cursor, size }, state) => {
			if (size < 72) throw new RangeError("Truncated segment command");
			const address = bytes.readBigUInt64LE(cursor + 24), fileSize = bytes.readBigUInt64LE(cursor + 48), fileOffset = bytes.readBigUInt64LE(cursor + 40);
			if (fileOffset + fileSize > BigInt(state.sliceEnd - state.slice)) throw new RangeError("Segment file range exceeds target bytes");
			state.segments.push({
				address,
				size: fileSize,
				offset: state.slice + Number(fileOffset),
				executable: (bytes.readUInt32LE(cursor + 60) & 4) !== 0
			});
			if (fileOffset === 0n && fileSize > 0n) state.baseAddress ??= address;
			const count = bytes.readUInt32LE(cursor + 64);
			if (72 + count * 80 > size) throw new RangeError("Truncated section table");
			for (let section = 0; section < count; section++) {
				const position = cursor + 72 + section * 80;
				const sectionSize = bytes.readBigUInt64LE(position + 40);
				if (sectionSize > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError("Section size exceeds exact numeric range");
				state.sections.push({
					name: bytes.subarray(position, position + 16).toString("latin1").replace(/\0.*$/u, ""),
					address: bytes.readBigUInt64LE(position + 32),
					size: Number(sectionSize)
				});
			}
		};
		LC_DYLD_INFO = 34;
		LC_DYLD_INFO_ONLY = 2147483682;
		LC_DYLD_CHAINED_FIXUPS = 2147483700;
		DYLIB_COMMANDS$1 = [
			12,
			2147483672,
			2147483679,
			32,
			2147483683
		];
		collectFixupCommand = (bytes, { cursor, kind, size }, state) => {
			const range = (at) => {
				const offset = state.slice + bytes.readUInt32LE(at);
				const length = bytes.readUInt32LE(at + 4);
				if (offset + length > state.sliceEnd) throw new RangeError("Fixup data exceeds the Mach-O slice");
				return {
					offset,
					size: length
				};
			};
			if (kind === LC_DYLD_CHAINED_FIXUPS) {
				if (size < 16) throw new RangeError("Truncated chained-fixups command");
				state.chained = range(cursor + 8);
			} else if (kind === LC_DYLD_INFO || kind === LC_DYLD_INFO_ONLY) {
				if (size < 48) throw new RangeError("Truncated dyld-info command");
				const rebase = range(cursor + 8);
				if (rebase.size > 0) state.rebases.push(rebase);
				for (const [at, stream] of [
					[cursor + 16, "bind"],
					[cursor + 24, "weak"],
					[cursor + 32, "lazy"]
				]) {
					const bound = range(at);
					if (bound.size > 0) state.binds.push({
						...bound,
						stream
					});
				}
			} else if (DYLIB_COMMANDS$1.includes(kind)) {
				if (size < 24) throw new RangeError("Truncated dylib command");
				const nameOffset = bytes.readUInt32LE(cursor + 8);
				if (nameOffset < 24 || nameOffset >= size) throw new RangeError("Dylib install name is outside its load command");
				const end = bytes.indexOf(0, cursor + nameOffset);
				if (end < 0 || end >= cursor + size) throw new RangeError("Unterminated dylib install name");
				state.dylibs.push(bytes.toString("utf8", cursor + nameOffset, end));
			}
		};
	})))();
}

//#endregion
//#region dist/native/AppleObjcProperties.js
var parsePropertyAttributes, decodePropertyAttributes, splitAttributes, readObjcPropertyList, readObjcPropertiesOf;
function init_AppleObjcProperties() {
	return (init_AppleObjcProperties = __esmMin((() => {
		init_AppleDispatchDecodeFacts();
		parsePropertyAttributes = (name, attributes) => decodePropertyAttributes(name, attributes).property;
		decodePropertyAttributes = (name, attributes) => {
			const { tokens, complete } = attributes.length === 0 ? {
				tokens: [],
				complete: true
			} : splitAttributes(attributes);
			const typeAttributes = tokens.filter((token) => token[0] === "T");
			const typeAttribute = typeAttributes.length === 1 ? typeAttributes[0] : undefined;
			const typeEncoding = typeAttribute !== undefined && typeAttribute.length > 1 ? typeAttribute.slice(1) : null;
			const value = (code) => tokens.find((token) => token[0] === code)?.slice(1) ?? null;
			const defaultsEstablished = typeEncoding !== null && complete;
			const property = {
				name,
				type_encoding: typeEncoding,
				attributes: tokens.map((token) => ({
					name: token.slice(0, 1),
					value: token.slice(1)
				})),
				atomicity: tokens.includes("N") ? "nonatomic" : defaultsEstablished ? "atomic" : null,
				is_readonly: tokens.includes("R") ? true : defaultsEstablished ? false : null,
				getter: value("G"),
				setter: value("S")
			};
			return {
				property,
				complete
			};
		};
		splitAttributes = (attributes) => {
			const tokens = [];
			let current = "";
			let quoted = false;
			for (const character of attributes) {
				if (character === "\"") quoted = !quoted;
				if (character === "," && !quoted) {
					tokens.push(current);
					current = "";
				} else current += character;
			}
			tokens.push(current);
			return {
				tokens: tokens.filter((token) => token.length > 0),
				complete: !quoted
			};
		};
		readObjcPropertyList = (read, list, admit) => {
			const properties = [];
			const issues = [];
			if (list === 0n) return {
				properties,
				issues
			};
			const entrySize = read.u32(list) & ~3;
			const count = read.u32(list + 4n);
			if (entrySize !== 16) throw new TypeError(`Unsupported Objective-C property entry size ${entrySize}`);
			for (let index = 0; index < count; index++) {
				if (!admit()) break;
				const entry = list + 8n + BigInt(index * entrySize);
				const location = `0x${entry.toString(16)}`;
				try {
					const name = read.string(read.pointer(entry));
					if (name.length === 0) throw new TypeError("the property name is empty");
					const decoded = decodePropertyAttributes(name, read.string(read.pointer(entry + 8n)));
					properties.push(decoded.property);
					if (!decoded.complete) issues.push({
						code: "property_attributes_incomplete",
						message: `property ${name} has an unterminated quoted class name in its type attribute, so atomicity and unestablished read-only state are unknown`,
						location
					});
				} catch (cause) {
					issues.push({
						code: "property_decode_failed",
						message: `property ${String(index)} could not be decoded: ${cause instanceof Error ? cause.message : String(cause)}`,
						location
					});
				}
			}
			return {
				properties,
				issues
			};
		};
		readObjcPropertiesOf = (read, list, context) => {
			try {
				const { properties, issues } = readObjcPropertyList(read, list, context.admit);
				for (const item of issues) context.issues.push(issue("objc_properties_categories", item.code, `${context.owner}: ${item.message}`, item.location));
				return properties;
			} catch (cause) {
				context.issues.push(issue("objc_properties_categories", "property_decode_failed", `${context.owner}: ${cause instanceof Error ? cause.message : String(cause)}`, context.location));
				return [];
			}
		};
	})))();
}

//#endregion
//#region dist/native/AppleObjcCategories.js
var CLASS_SYMBOL, boundClassName, decodeObjcCategories;
function init_AppleObjcCategories() {
	return (init_AppleObjcCategories = __esmMin((() => {
		init_AppleObjcProperties();
		init_AppleDispatchDecodeFacts();
		CLASS_SYMBOL = /^_OBJC_(?:META)?CLASS_\$_(.+)$/u;
		boundClassName = (read, field) => {
			const bound = read.bound(field);
			return bound === undefined ? undefined : CLASS_SYMBOL.exec(bound.symbol)?.[1];
		};
		decodeObjcCategories = (input) => {
			const { read, result } = input;
			let examined = 0;
			for (const section of input.sections.filter(({ name }) => name === "__objc_catlist")) {
				if (section.size % 8 !== 0) throw new RangeError("Misaligned Objective-C category list");
				for (let index = 0; index < section.size / 8; index++) {
					if (!input.admit()) break;
					examined++;
					const field = section.address + BigInt(index * 8);
					try {
						const category = read.pointer(field);
						const name = read.string(read.pointer(category));
						if (name.length === 0) throw new TypeError("Objective-C category has an empty name");
						const external = boundClassName(read, category + 8n);
						const local = read.pointer(category + 8n);
						let className = external ?? null;
						if (external === undefined && local !== 0n) try {
							className = input.localClassName(local);
						} catch (cause) {
							input.issues.push(issue("objc_properties_categories", "category_class_unresolved", `Category ${name} class reference 0x${local.toString(16)}: ${cause instanceof Error ? cause.message : String(cause)}`, `0x${(category + 8n).toString(16)}`));
						}
						const owner = className ?? `(${name})`;
						result.objc_categories.push({
							name,
							class_name: className,
							class_source: external !== undefined ? "external" : className === null ? "unresolved" : "local",
							instance_methods: input.methods(read.pointer(category + 16n), owner, "instance", name),
							class_methods: input.methods(read.pointer(category + 24n), owner, "class", name),
							protocols: input.protocols(read.pointer(category + 32n)),
							properties: readObjcPropertiesOf(read, read.pointer(category + 40n), {
								owner: `category ${name}`,
								admit: input.admit,
								issues: input.issues,
								location: `0x${read.pointer(category + 40n).toString(16)}`
							}),
							location: read.location(category),
							decode: className === null ? {
								status: "partial",
								reason: "category_class_unresolved"
							} : {
								status: "decoded",
								reason: null
							},
							evidence: read.evidence(category, "Objective-C category_t record")
						});
					} catch (cause) {
						const message = cause instanceof Error ? cause.message : String(cause);
						input.issues.push(issue("objc_properties_categories", "category_decode_failed", message, `0x${field.toString(16)}`));
					}
				}
			}
			return examined;
		};
	})))();
}

//#endregion
//#region dist/native/AppleObjcProtocols.js
var createObjcProtocolReader;
function init_AppleObjcProtocols() {
	return (init_AppleObjcProtocols = __esmMin((() => {
		createObjcProtocolReader = (input) => {
			const { readers: read, result, failures } = input;
			const visited = new Set();
			const name = (address) => read.string(read.pointer(address + 8n));
			const list = (address) => {
				if (address === 0n) return [];
				const count = read.u64(address);
				if (count > 20000n) throw new RangeError("Protocol list exceeds 20000 entries");
				const names = [];
				for (let index = 0n; index < count; index++) {
					if (!read.admit()) break;
					const protocol = read.pointer(address + 8n + index * 8n);
					names.push(name(protocol));
					record(protocol);
				}
				return names;
			};
			const methods = (address, required, instance, emptySelectors) => {
				const output = [];
				if (address === 0n) return output;
				const flags = read.u32(address), count = read.u32(address + 4n);
				const relative = (flags & 2147483648) !== 0;
				const stride = flags & 65532;
				if (stride !== (relative ? 12 : 24)) throw new TypeError("Unsupported Objective-C protocol method entry size");
				for (let index = 0; index < count; index++) {
					if (!read.admit()) break;
					const entry = address + 8n + BigInt(index * stride);
					let selector = relative ? entry + BigInt(read.i32(entry)) : read.pointer(entry);
					if (relative && (flags & 1073741824) === 0) selector = read.pointer(selector);
					const selectorName = read.string(selector);
					if (selectorName.length === 0) {
						emptySelectors.push(`${required ? "required" : "optional"} ${instance ? "instance" : "class"} method ${String(index)} at 0x${entry.toString(16)} has an empty selector`);
						continue;
					}
					output.push({
						selector: selectorName,
						method_type: instance ? "instance" : "class",
						address: null,
						is_required: required,
						is_optional: !required
					});
				}
				return output;
			};
			const record = (address) => {
				if (address === 0n || visited.has(address) || !read.admit()) return;
				visited.add(address);
				try {
					if (read.u32(address + 64n) < 72) throw new RangeError("Truncated Objective-C protocol declaration");
					const protocolName = name(address);
					const adopted = list(read.pointer(address + 16n));
					if (protocolName.length === 0) throw new TypeError("Objective-C protocol has an empty name");
					const skipped = [];
					const required = [...methods(read.pointer(address + 24n), true, true, skipped), ...methods(read.pointer(address + 32n), true, false, skipped)];
					const optional = [...methods(read.pointer(address + 40n), false, true, skipped), ...methods(read.pointer(address + 48n), false, false, skipped)];
					for (const message of skipped) failures.push(`Protocol 0x${address.toString(16)}: Objective-C protocol ${protocolName} ${message}`);
					result.objc_protocols.push({
						name: protocolName,
						methods: required,
						optional_methods: optional,
						properties: []
					});
					result.objc_protocol_records.push({
						name: protocolName,
						adopted_protocols: adopted,
						methods: required,
						optional_methods: optional,
						location: read.location(address),
						decode: skipped.length === 0 ? {
							status: "decoded",
							reason: null
						} : {
							status: "partial",
							reason: "protocol_method_selector_empty"
						},
						evidence: read.evidence(address, "Objective-C protocol declaration and encoded method lists; IMP fields are not handler targets")
					});
				} catch (cause) {
					failures.push(`Protocol 0x${address.toString(16)}: ${cause instanceof Error ? cause.message : String(cause)}`);
				}
			};
			return {
				list,
				record
			};
		};
	})))();
}

//#endregion
//#region dist/native/AppleObjcDispatchFacets.js
var hex$1, decoded$1, readLocalClass, resolveSuperclass, decodeObjcDispatchFacets;
function init_AppleObjcDispatchFacets() {
	return (init_AppleObjcDispatchFacets = __esmMin((() => {
		init_result();
		init_AppleObjcCategories();
		init_AppleObjcProperties();
		init_AppleObjcProtocols();
		hex$1 = (value) => `0x${value.toString(16)}`;
		decoded$1 = {
			status: "decoded",
			reason: null
		};
		readLocalClass = (read, address) => {
			const ro = read.pointer(address + 32n) & ~7n;
			const name = read.string(read.pointer(ro + 24n));
			if (name.length === 0) throw new TypeError(`Objective-C class at ${hex$1(address)} has an empty name`);
			return {
				ro,
				name
			};
		};
		resolveSuperclass = (read, address, className, failures) => {
			const external = boundClassName(read, address + 8n);
			if (external !== undefined) return {
				name: external,
				address: null
			};
			const superclass = read.pointer(address + 8n);
			if (superclass === 0n) return {
				name: null,
				address: null
			};
			try {
				return {
					name: readLocalClass(read, superclass).name,
					address: hex$1(superclass)
				};
			} catch (cause) {
				failures.push(`Superclass pointer ${hex$1(superclass)} of ${className} could not be decoded: ${cause instanceof Error ? cause.message : String(cause)}`);
				return {
					name: null,
					address: hex$1(superclass)
				};
			}
		};
		decodeObjcDispatchFacets = (input) => {
			const { bytes, sections, segments, readers: read, budget, maxListSlots, result } = input;
			const failures = [];
			const categoryIssues = [];
			let examined = 0;
			const methods = (list, className, methodType, category) => {
				const selectors = [];
				if (list === 0n) return selectors;
				const flags = read.u32(list), count = read.u32(list + 4n), relative = (flags & 2147483648) !== 0;
				const stride = flags & 65532;
				if (stride !== (relative ? 12 : 24)) throw new TypeError(`Unsupported method stride/flags at ${hex$1(list)}`);
				for (let index = 0; index < count; index++) {
					if (!budget.admit()) break;
					const entry = list + 8n + BigInt(index * stride);
					const rel = (field) => {
						const displacement = bytes.readInt32LE(read.offset(field, 4));
						const target = field + BigInt(displacement);
						let fileOffset = null;
						try {
							fileOffset = read.offset(target);
						} catch (cause) {
							void cause;
						}
						if (budget.admit()) result.relative_pointers.push({
							field: read.location(field),
							target: {
								address: hex$1(target),
								file_offset: fileOffset
							},
							displacement,
							indirectable: false,
							indirect: false,
							decode: fileOffset === null ? {
								status: "partial",
								reason: "relative_target_unmapped"
							} : decoded$1,
							evidence: read.evidence(field, "Signed-relative Objective-C method-list pointer")
						});
						return target;
					};
					let selectorAddress = relative ? rel(entry) : read.pointer(entry);
					if (relative && (flags & 1073741824) === 0) selectorAddress = read.pointer(selectorAddress);
					const implementation = relative ? rel(entry + 8n) : read.pointer(entry + 16n);
					let implementationLocation = null;
					try {
						if (!segments.some((segment) => segment.executable && implementation >= segment.address && implementation < segment.address + segment.size)) throw new RangeError("Method implementation is not in an executable segment");
						implementationLocation = read.location(implementation);
					} catch (cause) {
						void cause;
					}
					const selector = read.string(selectorAddress);
					if (selector.length === 0) throw new TypeError("Objective-C method has an empty selector");
					selectors.push(selector);
					result.objc_dispatch_implementations.push({
						class_name: className,
						selector,
						method_type: methodType,
						...category === undefined ? {} : { category },
						implementation_address: implementationLocation?.address ?? null,
						location: read.location(entry),
						decode: implementationLocation === null ? {
							status: "partial",
							reason: "implementation_pointer_unmapped_or_encoded"
						} : decoded$1,
						evidence: read.evidence(entry, relative ? "Encoded relative Objective-C method entry" : "Encoded absolute Objective-C method entry")
					});
				}
				return selectors;
			};
			const protocolReader = createObjcProtocolReader({
				readers: {
					u32: read.u32,
					pointer: read.pointer,
					string: read.string,
					location: read.location,
					evidence: read.evidence,
					admit: () => budget.admit(),
					i32: read.i32,
					u64: read.u64
				},
				result,
				failures
			});
			let objcListScanTruncated = false;
			let objcClassListScanTruncated = false;
			const createListSlotReader = () => {
				let listSlotsExamined = 0;
				return (field) => {
					if (listSlotsExamined >= maxListSlots) {
						objcListScanTruncated = true;
						return err("exhausted");
					}
					listSlotsExamined++;
					try {
						return ok(read.pointer(field));
					} catch (cause) {
						const admitted = budget.admit();
						failures.push(`${hex$1(field)}: ${cause instanceof Error ? cause.message : String(cause)}`);
						return err(admitted ? "unmapped" : "exhausted");
					}
				};
			};
			const readProtocolListSlot = createListSlotReader();
			const readClassListSlot = createListSlotReader();
			for (const section of sections.filter(({ name }) => name === "__objc_protolist")) {
				if (section.size % 8 !== 0) throw new RangeError("Misaligned Objective-C protocol list");
				for (let index = 0; index < section.size / 8; index++) {
					if (budget.isFull()) {
						budget.markTruncated();
						break;
					}
					const field = section.address + BigInt(index * 8);
					const pointer = readProtocolListSlot(field);
					if (!pointer.ok) {
						if (pointer.error === "exhausted") break;
						continue;
					}
					try {
						protocolReader.record(pointer.value);
					} catch (cause) {
						failures.push(`${hex$1(field)}: ${cause instanceof Error ? cause.message : String(cause)}`);
					}
				}
			}
			const visited = new Set();
			const readClass = (address, meta = false) => {
				if (address === 0n || visited.has(hex$1(address)) || !budget.admit()) return;
				visited.add(hex$1(address));
				const { ro, name } = readLocalClass(read, address);
				const root = (read.u32(ro) & 2) !== 0;
				const superclass = resolveSuperclass(read, address, name, failures);
				if (superclass.name === null && superclass.address === null && !root) failures.push(`Superclass of ${name} requires external binding resolution`);
				const ivarList = read.pointer(ro + 48n);
				let ivarCount = meta ? null : 0;
				if (ivarList !== 0n && !meta) {
					const stride = read.u32(ivarList), count = read.u32(ivarList + 4n);
					if (stride !== 32) throw new TypeError("Unsupported Objective-C ivar entry size");
					ivarCount = count;
					for (let index = 0; index < count; index++) {
						if (!budget.admit()) break;
						const entry = ivarList + 8n + BigInt(index * stride);
						const encodedOffset = read.pointer(entry);
						let value = null;
						try {
							value = read.u32(encodedOffset);
						} catch (cause) {
							void cause;
							failures.push(`Unresolved ivar offset pointer ${hex$1(encodedOffset)}`);
						}
						const ivarName = read.string(read.pointer(entry + 8n));
						if (ivarName.length === 0) throw new TypeError("Objective-C ivar has an empty name");
						const alignment = read.u32(entry + 24n);
						result.objc_ivars.push({
							class_name: name,
							name: ivarName,
							type_encoding: read.string(read.pointer(entry + 16n)),
							offset: value,
							size: read.u32(entry + 28n),
							alignment: alignment === 4294967295 ? 8 : alignment < 31 ? 2 ** alignment : null,
							location: read.location(entry),
							decode: value === null ? {
								status: "partial",
								reason: "ivar_offset_pointer_unresolved"
							} : decoded$1,
							evidence: read.evidence(entry, "Objective-C ivar entry and encoded offset storage")
						});
					}
				}
				methods(read.pointer(ro + 32n), name, meta ? "class" : "instance");
				result.objc_classes.push({
					name,
					super_class: superclass.name,
					is_meta_class: meta,
					is_root_class: root,
					methods: result.objc_dispatch_implementations.filter((item) => item.class_name === name && item.method_type === (meta ? "class" : "instance")).map((item) => ({
						selector: item.selector,
						method_type: item.method_type,
						address: item.implementation_address !== null && BigInt(item.implementation_address) <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(BigInt(item.implementation_address)) : null,
						is_required: null,
						is_optional: null
					})),
					properties: readObjcPropertiesOf(read, read.pointer(ro + 64n), {
						owner: name,
						admit: () => budget.admit(),
						issues: categoryIssues,
						location: hex$1(read.pointer(ro + 64n))
					}),
					protocols: protocolReader.list(read.pointer(ro + 40n)),
					ivar_count: ivarCount,
					instance_size: read.u32(ro + 8n),
					location: read.location(address),
					superclass_address: superclass.address,
					metaclass_address: meta ? null : hex$1(read.pointer(address)),
					decode: superclass.name === null && !root ? {
						status: "partial",
						reason: "superclass_binding_unresolved"
					} : decoded$1,
					evidence: read.evidence(address, "Objective-C class and class_ro_t records")
				});
				if (!meta) {
					try {
						readClass(read.pointer(address), true);
					} catch (cause) {
						failures.push(`Metaclass of ${name}: ${cause instanceof Error ? cause.message : String(cause)}`);
					}
				}
			};
			for (const section of sections.filter(({ name }) => name === "__objc_classlist")) {
				if (section.size % 8 !== 0) throw new RangeError("Misaligned Objective-C class-list size");
				for (let index = 0; index < section.size / 8; index++) {
					if (budget.isFull()) {
						budget.markTruncated();
						break;
					}
					const field = section.address + BigInt(index * 8);
					const pointer = readClassListSlot(field);
					if (pointer.ok || pointer.error === "unmapped") examined++;
					if (!pointer.ok) {
						if (pointer.error === "exhausted") {
							objcClassListScanTruncated = true;
							break;
						}
						continue;
					}
					try {
						readClass(pointer.value);
					} catch (cause) {
						failures.push(`${hex$1(field)}: ${cause instanceof Error ? cause.message : String(cause)}`);
					}
				}
			}
			const categoriesExamined = decodeObjcCategories({
				sections,
				read,
				result,
				issues: categoryIssues,
				admit: () => budget.admit(),
				methods,
				protocols: (list) => protocolReader.list(list),
				localClassName: (address) => readLocalClass(read, address).name
			});
			return {
				failures,
				categoryIssues,
				examined,
				categoriesExamined,
				objcListScanTruncated,
				objcClassListScanTruncated
			};
		};
	})))();
}

//#endregion
//#region dist/native/AppleSwiftDispatchFacets.js
var hex, decoded, createSwiftRelativeReader, decodeSwiftDispatchFacets;
function init_AppleSwiftDispatchFacets() {
	return (init_AppleSwiftDispatchFacets = __esmMin((() => {
		init_AppleDispatchDecodeFacts();
		hex = (value) => `0x${value.toString(16)}`;
		decoded = {
			status: "decoded",
			reason: null
		};
		createSwiftRelativeReader = (input) => {
			const { bytes, readers: read, budget, result } = input;
			return (field, indirectable = false) => {
				const displacement = bytes.readInt32LE(read.offset(field, 4));
				const indirect = indirectable && (displacement & 1) !== 0;
				let target = displacement === 0 ? 0n : field + BigInt(indirectable ? displacement & ~1 : displacement);
				let fileOffset = null;
				let reason = null;
				try {
					if (indirect && target !== 0n) target = read.pointer(target);
					if (target !== 0n) fileOffset = read.offset(target);
				} catch (cause) {
					reason = cause instanceof Error ? cause.message : String(cause);
				}
				if (budget.admit()) result.relative_pointers.push({
					field: read.location(field),
					target: {
						address: target === 0n ? null : hex(target),
						file_offset: fileOffset
					},
					displacement,
					indirectable,
					indirect,
					decode: reason === null ? decoded : {
						status: "partial",
						reason
					},
					evidence: read.evidence(field, "Swift ABI signed-relative metadata pointer")
				});
				if (reason !== null) throw new RangeError(reason);
				return target;
			};
		};
		decodeSwiftDispatchFacets = (input) => {
			const { sections, segments, readers: read, relative, budget, result } = input;
			const swiftFailures = [];
			const issues = [];
			let swiftExamined = 0;
			let decodedRecords = 0;
			for (const section of sections.filter(({ name }) => name === "__swift5_proto")) {
				if (section.size % 4 !== 0) throw new RangeError("Misaligned Swift conformance section");
				for (let index = 0; index < section.size / 4; index++) {
					if (!budget.admit()) break;
					swiftExamined++;
					const field = section.address + BigInt(index * 4);
					try {
						const descriptor = relative(field);
						const flags = read.u32(descriptor + 12n);
						const protocol = relative(descriptor, true);
						if ((read.u32(protocol) & 31) !== 3) throw new TypeError("Unsupported Swift protocol descriptor kind");
						const protocolName = read.string(relative(protocol + 8n));
						const typeKind = flags >>> 3 & 7;
						if (typeKind !== 0 && typeKind !== 1) throw new TypeError("Unsupported Swift conformance type-reference kind");
						let type = relative(descriptor + 4n);
						if (typeKind === 1) type = read.pointer(type);
						if (![
							16,
							17,
							18
						].includes(read.u32(type) & 31)) throw new TypeError("Unsupported Swift type descriptor kind");
						const typeName = read.string(relative(type + 8n));
						const witness = relative(descriptor + 8n);
						const staticWitness = witness !== 0n && (flags & ~56) === 0 && (read.u32(type) & 128) === 0;
						let witnessReason = staticWitness ? null : "Conditional, generic, resilient or missing static witness table is not decoded";
						if (staticWitness && read.pointer(witness) !== descriptor) witnessReason = "Witness-table conformance header is unresolved or encoded";
						const conformanceDecode = witnessReason === null ? {
							status: "decoded",
							reason: null
						} : {
							status: "partial",
							reason: witnessReason
						};
						result.swift_conformances.push({
							type_name: typeName,
							protocol_name: protocolName,
							module: null,
							witness_table: witness === 0n ? {
								address: null,
								file_offset: null
							} : read.location(witness),
							location: read.location(descriptor),
							decode: conformanceDecode,
							evidence: read.evidence(descriptor, "Swift protocol conformance descriptor and directly encoded type/protocol names")
						});
						if (conformanceDecode.status === "decoded") decodedRecords++;
						if (witnessReason !== null) {
							swiftFailures.push(`${typeName}: ${witnessReason}`);
							issues.push(issue("swift_conformances_static_witness_slots", "conformance_decode_partial", witnessReason, hex(descriptor)));
							continue;
						}
						const count = read.u32(protocol + 16n);
						const signatureCount = read.u32(protocol + 12n);
						if (count > 2e4 || signatureCount > 2e4) throw new RangeError("Swift witness requirement count exceeds 20000");
						for (let slot = 0; slot < count; slot++) {
							if (!budget.admit()) break;
							const entry = witness + BigInt((slot + 1) * 8);
							const implementation = read.pointer(entry);
							const requirementFlags = read.u32(protocol + 24n + BigInt(signatureCount * 12 + slot * 8));
							const kind = requirementFlags & 15;
							const synchronousFunction = kind >= 1 && kind <= 4 && (requirementFlags & 32) === 0;
							const executable = synchronousFunction && segments.some((segment) => segment.executable && implementation >= segment.address && implementation < segment.address + segment.size);
							const slotDecode = executable ? {
								status: "decoded",
								reason: null
							} : {
								status: "partial",
								reason: "Witness slot is non-function, async, nil, external, authenticated or encoded; implementation target is unresolved"
							};
							result.swift_dispatch_slots.push({
								owner: `${typeName}: ${protocolName}`,
								table_kind: "witness_table",
								slot_index: slot + 1,
								requirement: null,
								implementation: null,
								implementation_address: executable ? hex(implementation) : null,
								thunk_address: null,
								location: read.location(entry),
								decode: slotDecode,
								evidence: read.evidence(entry, "Static Swift witness slot, indexed after the conformance-descriptor header")
							});
							if (slotDecode.status !== "decoded") issues.push(issue("swift_conformances_static_witness_slots", "witness_slot_unresolved", slotDecode.reason, hex(entry)));
						}
					} catch (cause) {
						const message = cause instanceof Error ? cause.message : String(cause);
						swiftFailures.push(`${hex(field)}: ${message}`);
						issues.push(issue("swift_conformances_static_witness_slots", "conformance_decode_failed", message, hex(field)));
					}
				}
			}
			return {
				facet: "swift_conformances_static_witness_slots",
				examined: swiftExamined,
				decoded: decodedRecords,
				exhaustive: !budget.truncated && issues.length === 0,
				issues
			};
		};
	})))();
}

//#endregion
//#region dist/native/AppleSwiftVtables.js
var decodeSwiftClassVtables;
function init_AppleSwiftVtables() {
	return (init_AppleSwiftVtables = __esmMin((() => {
		init_AppleDispatchDecodeFacts();
		decodeSwiftClassVtables = (input) => {
			const { readers: read, result } = input;
			const failures = [];
			const issues = [];
			let examined = 0;
			let decoded = 0;
			for (const field of input.entries) {
				if (!read.admit()) {
					failures.push("max_records_reached");
					issues.push(issue("swift_class_vtable_descriptors", "record_budget_exhausted", "max_records_reached", `0x${field.toString(16)}`));
					break;
				}
				examined++;
				try {
					const descriptor = read.relative(field);
					const flags = read.u32(descriptor);
					if ((flags & 31) !== 16) continue;
					const specific = flags >>> 16;
					if ((flags & 128) !== 0 || (specific & 8192) !== 0) throw new TypeError("Generic class or resilient superclass metadata is unsupported");
					if ((specific & 32768) === 0) continue;
					const initialization = specific & 3;
					if (initialization === 3) throw new TypeError("Unknown metadata initialization kind");
					const header = descriptor + 44n + BigInt(initialization === 1 ? 12 : initialization === 2 ? 4 : 0);
					const tableOffset = read.u32(header);
					const count = read.u32(header + 4n);
					const positiveWords = read.u32(descriptor + 28n);
					if (count > 2e4 || tableOffset + count > positiveWords) throw new RangeError("Swift vtable count or offset exceeds declared metadata bounds");
					const owner = read.string(read.relative(descriptor + 8n));
					if (owner.length === 0) throw new RangeError("Swift class vtable descriptor class name is empty");
					for (let index = 0; index < count; index++) {
						const entry = header + 8n + BigInt(index * 8);
						if (!read.admit()) {
							failures.push("max_records_reached");
							issues.push(issue("swift_class_vtable_descriptors", "record_budget_exhausted", "max_records_reached", `0x${entry.toString(16)}`));
							break;
						}
						const methodFlags = read.u32(entry);
						const synchronous = (methodFlags & 64) === 0 && (methodFlags & 15) <= 3;
						const implementation = read.relative(entry + 4n);
						const resolved = synchronous && read.executable(implementation);
						result.swift_dispatch_slots.push({
							owner,
							table_kind: "class_vtable",
							slot_index: tableOffset + index,
							requirement: null,
							implementation: null,
							implementation_address: resolved ? `0x${implementation.toString(16)}` : null,
							thunk_address: null,
							location: read.location(entry),
							decode: resolved ? {
								status: "decoded",
								reason: null
							} : {
								status: "partial",
								reason: "Async, coroutine, external or unmapped vtable implementation is unresolved"
							},
							evidence: read.evidence(entry, "Swift class vtable method descriptor; slot index is a metadata word offset, not a source method ordinal")
						});
						if (resolved) decoded++;
						else issues.push(issue("swift_class_vtable_descriptors", "vtable_implementation_unresolved", "Async, coroutine, external or unmapped vtable implementation is unresolved", `0x${entry.toString(16)}`));
					}
					if ((specific & 16384) !== 0) {
						failures.push(`${owner}: inherited override descriptors are unsupported`);
						issues.push(issue("swift_class_vtable_descriptors", "inherited_override_descriptors_unsupported", "Inherited override descriptors are unsupported", `0x${descriptor.toString(16)}`));
					}
				} catch (cause) {
					const message = cause instanceof Error ? cause.message : String(cause);
					failures.push(`0x${field.toString(16)}: ${message}`);
					issues.push(issue("swift_class_vtable_descriptors", "vtable_decode_failed", message, `0x${field.toString(16)}`));
				}
			}
			return {
				facet: "swift_class_vtable_descriptors",
				examined,
				decoded,
				exhaustive: issues.length === 0,
				issues
			};
		};
	})))();
}

//#endregion
//#region dist/native/AppleDispatchMetadata.js
var decodeAppleDispatchMetadata, inspectAppleDispatchMetadata, OPERATION$3, appleDispatchMetadataFailure;
function init_AppleDispatchMetadata() {
	return (init_AppleDispatchMetadata = __esmMin((() => {
		init_objcSwiftMetadata();
		init_binaryTargetTypes();
		init_analysisErrorCore();
		init_ArtifactFileOperation();
		init_ArtifactReader();
		init_analysisErrorBase();
		init_analysisErrorProjection();
		init_providerAdapterError();
		init_providerCleanupError();
		init_NativeMacOSProviderMetadata();
		init_BoundedFileBytes();
		init_evidenceErrors();
		init_AppleDispatchCoverage();
		init_AppleMachoFixups();
		init_AppleMachoSelection();
		init_AppleObjcDispatchFacets();
		init_AppleSwiftDispatchFacets();
		init_AppleSwiftVtables();
		decodeAppleDispatchMetadata = (bytes, maxRecords, provenance, architecture = "arm64") => {
			const layout = parseMachoLayout(bytes, architecture);
			const { segments, sections, offset } = layout;
			const fixups = parsePointerFixups(bytes, layout.fixups, segments, layout.baseAddress);
			const u32 = (address) => bytes.readUInt32LE(offset(address, 4));
			const decodePointer = (address) => fixups.decode(address, bytes.readBigUInt64LE(offset(address, 8)));
			/** Rebased target of a pointer; a bind to another image reads as 0. */
			const pointer = (address) => {
				const decodedPointer = decodePointer(address);
				return decodedPointer.kind === "rebase" ? decodedPointer.target : 0n;
			};
			const bound = (address) => {
				const decodedPointer = decodePointer(address);
				return decodedPointer.kind === "bind" ? decodedPointer : undefined;
			};
			const location = (address) => ({
				address: `0x${address.toString(16)}`,
				file_offset: offset(address)
			});
			const evidence = (address, description) => [{
				kind: "binary_metadata",
				description,
				location: location(address),
				artifact_path: provenance.path,
				artifact_sha256: provenance.sha256
			}];
			const string = (address) => {
				const start = offset(address);
				let end = start;
				while (end < bytes.length && end - start < 4096 && bytes[end] !== 0) end++;
				if (end === bytes.length || end - start >= 4096) throw new RangeError("Unterminated or oversized metadata string");
				offset(address, end - start + 1);
				return new TextDecoder("utf-8", {
					fatal: true,
					ignoreBOM: true
				}).decode(bytes.subarray(start, end));
			};
			const result = objcSwiftMetadataSchema.parse({ db_save_result: null });
			let records = 0;
			const budget = {
				truncated: false,
				isFull: () => records >= maxRecords,
				markTruncated: () => {
					budget.truncated = true;
				},
				admit: () => {
					if (records >= maxRecords) {
						budget.truncated = true;
						return false;
					}
					records++;
					return true;
				}
			};
			const readers = {
				u32,
				i32: (address) => bytes.readInt32LE(offset(address, 4)),
				u64: (address) => bytes.readBigUInt64LE(offset(address, 8)),
				pointer,
				bound,
				string,
				location,
				evidence,
				offset
			};
			const { failures, categoryIssues, examined, categoriesExamined, objcListScanTruncated, objcClassListScanTruncated } = decodeObjcDispatchFacets({
				bytes,
				sections,
				segments,
				readers,
				budget,
				maxListSlots: maxRecords,
				result
			});
			const swiftRelative = createSwiftRelativeReader({
				bytes,
				readers,
				budget,
				result
			});
			const swift = decodeSwiftDispatchFacets({
				sections,
				segments,
				readers,
				relative: swiftRelative,
				budget,
				result
			});
			const typeEntries = [];
			for (const section of sections.filter(({ name }) => name === "__swift5_types")) {
				if (section.size % 4 !== 0) throw new RangeError("Misaligned Swift type section");
				for (let index = 0; index < section.size / 4 && index < maxRecords; index++) typeEntries.push(section.address + BigInt(index * 4));
				if (section.size / 4 > maxRecords) budget.truncated = true;
			}
			const vtables = decodeSwiftClassVtables({
				entries: typeEntries,
				result,
				readers: {
					u32,
					relative: swiftRelative,
					string,
					location,
					evidence,
					admit: () => budget.admit(),
					executable: (address) => segments.some((segment) => segment.executable && address >= segment.address && address < segment.address + segment.size)
				}
			});
			pushDispatchCoverage({
				result,
				failures,
				categoryIssues,
				examined,
				categoriesExamined,
				objcListScanTruncated,
				objcClassListScanTruncated,
				truncated: budget.truncated,
				fixups,
				vtables,
				swift
			});
			return objcSwiftMetadataSchema.parse(result);
		};
		inspectAppleDispatchMetadata = async (target, maxRecords, resources, signal) => {
			if (target.kind !== "executable" || !isMachOFormat(target.format)) throw new TypeError("Apple dispatch metadata requires a Mach-O target");
			const maximumBytes = 64 * 1024 * 1024;
			const capacityError = () => new AnalysisResourceConstraintError("inspect_native_dispatch_metadata", "memory", "Apple static metadata input exceeds its 64 MiB snapshot budget", { input_bytes: maximumBytes });
			const cancelled = () => new AnalysisCancelledError("inspect_native_dispatch_metadata", { cause: signal?.reason });
			const { bytes, digest } = await withArtifactRegularFile(target.path, resources, signal, async (handle) => {
				const before = await handle.stat();
				if (before.size > maximumBytes) throw capacityError();
				if (signal?.aborted) throw cancelled();
				const read = await readBoundedFileBytes(handle, maximumBytes, signal).catch((cause) => {
					if (signal?.aborted === true && cause === signal.reason) throw cancelled();
					throw cause;
				});
				if (read === undefined) throw capacityError();
				const sha256 = createHash("sha256").update(read).digest("hex");
				if (sha256 !== target.sha256) throw new EvidenceIntegrityError("Apple metadata target digest changed after session binding");
				return {
					bytes: read,
					digest: sha256
				};
			}, "reject");
			return nativeDispatchMetadataResultSchema.parse({
				target_sha256: target.sha256,
				provider: {
					id: "native-macos",
					name: "macOS native inspection utilities",
					version: "apple-metadata-reader-1"
				},
				analysis_profile_digest: null,
				result: decodeAppleDispatchMetadata(bytes, maxRecords, {
					path: target.path,
					sha256: digest
				}, target.architecture)
			});
		};
		OPERATION$3 = "inspect_native_dispatch_metadata";
		appleDispatchMetadataFailure = (cause, path) => {
			if (cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined) {
				const physical = cause instanceof ArtifactFileCleanupFailure ? cause.fileCleanupFailure : undefined;
				const previous = physical?.outcome.kind === "failed" ? appleDispatchMetadataFailure(artifactFilePrimaryFailure(cause), path) : physical?.completionCancellation === undefined ? undefined : new AnalysisCancelledError(OPERATION$3, { cause: physical.completionCancellation.reason });
				const failure = new ProviderCleanupError(NATIVE_MACOS_PROVIDER_IDENTITY.id, cause.cleanup.resources, {
					reason: cause.cleanup.reason,
					previous_error: previous === undefined ? null : projectAnalysisError(previous)
				}, {
					operation: OPERATION$3,
					cause,
					cleanupPrimary: previous
				});
				bindArtifactFileCleanup(cause, failure);
				return failure;
			}
			if (cause instanceof AnalysisError) return cause;
			if (cause instanceof ArtifactReaderFailure && cause.reason === "cancelled") return new AnalysisCancelledError(OPERATION$3, { cause: artifactFileCancellationCause(cause) });
			if (cause instanceof ArtifactReaderFailure && cause.reason === "unavailable") return new AnalysisCapabilityUnavailableError(NATIVE_MACOS_PROVIDER_IDENTITY.id, OPERATION$3, cause.message, { cause });
			return new ProviderAdapterError(NATIVE_MACOS_PROVIDER_IDENTITY.id, OPERATION$3, {
				cause,
				diagnostics: {
					target_path: path,
					reason: cause instanceof Error ? cause.message : String(cause)
				}
			});
		};
	})))();
}

//#endregion
//#region dist/native/NativeUiCleanupError.js
var NativeUiCleanupError;
function init_NativeUiCleanupError() {
	return (init_NativeUiCleanupError = __esmMin((() => {
		init_AnalysisCleanupLease();
		init_providerCleanupError();
		NativeUiCleanupError = class extends ProviderCleanupError {
			runtimes;
			constructor(failures, operation, partialObservation) {
				const runtimes = failures.map(({ runtime }) => runtime);
				const resources = () => runtimes.filter((runtime) => !runtime.cleanupLease.released).flatMap((runtime) => runtime.resources());
				super("native-macos", resources(), {
					reason: "Native UI runtime cleanup remains incomplete",
					failures: failures.map(({ runtime, cause }) => ({
						resources: [...runtime.resources()],
						reason: cause instanceof Error ? cause.message : String(cause)
					}))
				}, {
					operation,
					cause: new AggregateError(failures.map(({ cause }) => cause), "Native UI runtime cleanup failed"),
					partialObservation
				});
				this.runtimes = runtimes;
				new AnalysisCleanupLeaseGroup(this, runtimes.map((runtime) => runtime.cleanupLease));
				this.bindCleanupResourceOwner({ get cleanupResources() {
					return resources();
				} });
			}
		};
	})))();
}

//#endregion
//#region dist/native/NativeUiOutputBudget.js
var HELPER_SUCCESS_WRAPPER, NATIVE_UI_OUTPUT_BUDGET_BYTES, NATIVE_UI_OUTPUT_WEIGHT, NATIVE_UI_HELPER_ENVELOPE_BYTES, NATIVE_UI_HELPER_MAX_BUFFER;
function init_NativeUiOutputBudget() {
	return (init_NativeUiOutputBudget = __esmMin((() => {
		HELPER_SUCCESS_WRAPPER = Buffer.from(JSON.stringify({
			ok: true,
			result: {}
		}));
		NATIVE_UI_OUTPUT_BUDGET_BYTES = 64 * 1024 * 1024;
		NATIVE_UI_OUTPUT_WEIGHT = 2;
		NATIVE_UI_HELPER_ENVELOPE_BYTES = HELPER_SUCCESS_WRAPPER.byteLength - Buffer.byteLength("{}");
		NATIVE_UI_HELPER_MAX_BUFFER = NATIVE_UI_OUTPUT_BUDGET_BYTES + NATIVE_UI_HELPER_ENVELOPE_BYTES;
	})))();
}

//#endregion
//#region dist/native/NativeUiHelperRuntime.js
var createNativeUiHelperRuntime;
function init_NativeUiHelperRuntime() {
	return (init_NativeUiHelperRuntime = __esmMin((() => {
		init_ArtifactResourceScope();
		init_AnalysisCleanupLease();
		init_snapshotEnvironment();
		init_DarwinProcessRunTokenReader();
		init_ExecFileOutput();
		init_safeJson();
		init_NativeUiOutputBudget();
		createNativeUiHelperRuntime = (environment) => {
			const selectedEnvironment = snapshotEnvironment(environment);
			const deadlineSignal = AbortSignal.timeout(18e4);
			const operations = new ArtifactResourceScope();
			let root;
			let preparation;
			const cleanupLease = new AnalysisCleanupLease(async () => {
				await operations.close();
				if (root !== undefined) {
					await rm(root, {
						recursive: true,
						force: true
					});
					root = undefined;
					preparation = undefined;
				}
			});
			const prepare = async (signal) => {
				root = await mkdtemp(join(tmpdir(), "rea-native-ui-"));
				const output = join(root, "observer");
				const main = join(root, "main.swift");
				await symlink(fileURLToPath(new URL("../../bridge/native/ReaNativeUI.swift", new URL("../native/NativeUiHelperRuntime.js", import.meta.url).href)), main);
				const compilerTemporary = join(root, "tmp");
				await mkdir(compilerTemporary);
				await execFileOutput("/usr/bin/xcrun", [
					"swiftc",
					"-module-cache-path",
					join(root, "modules"),
					fileURLToPath(new URL("../../bridge/native/NativeUIChildren.swift", new URL("../native/NativeUiHelperRuntime.js", import.meta.url).href)),
					main,
					"-o",
					output
				], {
					timeout: 6e4,
					maxBuffer: 1024 * 1024,
					stopSignal: SWIFTC_INTERRUPT,
					env: {
						...selectedEnvironment,
						TMPDIR: compilerTemporary
					},
					signal
				});
				return output;
			};
			const invoke = (parameters, callerSignal) => operations.run(async () => {
				const signal = callerSignal === undefined ? deadlineSignal : AbortSignal.any([callerSignal, deadlineSignal]);
				preparation ??= prepare(signal);
				const executable = await preparation;
				const output = await execFileOutput(executable, [JSON.stringify(parameters)], {
					timeout: 3e4,
					maxBuffer: NATIVE_UI_HELPER_MAX_BUFFER,
					stopSignal: "SIGTERM",
					env: selectedEnvironment,
					signal
				});
				const parsed = safeParseJson(output.stdout);
				if (!parsed.ok) throw new Error(`Native helper returned invalid JSON: ${parsed.error}`, { cause: parsed.cause });
				return parsed.value;
			});
			return {
				invoke,
				cleanupLease,
				signal: deadlineSignal,
				close: () => cleanupLease.release(),
				resources: () => root === undefined ? [] : [root]
			};
		};
	})))();
}

//#endregion
//#region dist/native/NativeUiObservation.js
var helper, passiveInputSchema, responseSchema, observeNativeUi, observeWithHelper, finishNativeUiObservation;
function init_NativeUiObservation() {
	return (init_NativeUiObservation = __esmMin((() => {
		init_ProviderDeadline();
		init_binaryTargetTypes();
		init_nativeUiObservation();
		init_analysisErrorCore();
		init_providerAdapterError();
		init_analysisErrorBase();
		init_analysisErrorCleanup();
		init_ExecFileOutput();
		init_NativeUiCleanupError();
		init_result();
		init_NativeUiHelperRuntime();
		init_NativeUiOutputBudget();
		helper = fileURLToPath(new URL("../../bridge/native/ReaNativeUI.swift", new URL("../native/NativeUiObservation.js", import.meta.url).href));
		passiveInputSchema = nativeUiObservationInputSchema.transform((input) => ({
			...input,
			steps: []
		}));
		responseSchema = z.discriminatedUnion("ok", [z.strictObject({
			ok: z.literal(true),
			result: nativeUiSnapshotSchema
		}), z.strictObject({
			ok: z.literal(false),
			code: z.string(),
			message: z.string()
		})]);
		observeNativeUi = async (target, operation, parameters, options) => {
			const runtime = options.runtime ?? createNativeUiHelperRuntime(options.environment);
			const signal = options.signal === undefined ? runtime.signal : AbortSignal.any([options.signal, runtime.signal]);
			let result;
			try {
				result = await observeWithHelper(target, operation, parameters, {
					signal,
					invoke: options.invoke ?? runtime.invoke
				});
			} catch (cause) {
				result = err(cause instanceof AnalysisError ? cause : new ProviderAdapterError("native-macos", operation, { cause }));
			}
			if (options.runtime === undefined) {
				try {
					await runtime.close();
				} catch (cause) {
					result = finishNativeUiObservation(result, operation, signal);
					const cleanup = new NativeUiCleanupError([{
						runtime,
						cause
					}], operation, result.ok ? result.value : undefined);
					return result.ok ? err(cleanup) : err(analysisErrorWithCleanupFailure(result.error, cleanup, operation).bindCleanupDependencies([result.error, cleanup]));
				}
			}
			return finishNativeUiObservation(result, operation, signal);
		};
		observeWithHelper = async (target, operation, parameters, options) => {
			const parsed = (operation === "observe_native_ui" ? passiveInputSchema : nativeUiScenarioInputSchema).safeParse(parameters);
			if (!parsed.success) return err(new AnalysisInputError(operation, { cause: parsed.error }));
			if (target.kind !== "executable" || !isMachOFormat(target.format)) return err(new AnalysisCapabilityUnavailableError("native-macos", operation, "Native UI observation requires an active Mach-O executable or app target"));
			const input = parsed.data;
			if (!input.screenshot && !input.accessibility) return err(new AnalysisInputError(operation, { cause: new Error("Enable screenshot or accessibility capture") }));
			const steps = input.steps;
			const signal = options.signal;
			const invoke = options.invoke;
			let launchTime;
			let outputBytes = 0;
			const take = async (action) => {
				if (signal.aborted) return err(new AnalysisCancelledError(operation, { cause: signal.reason }));
				try {
					const response = responseSchema.parse(await invoke({
						pid: input.pid,
						window_id: input.window_id,
						executable: target.path,
						sha256: target.sha256,
						...launchTime === undefined ? {} : { launch_time: launchTime },
						screenshot: input.screenshot,
						accessibility: input.accessibility,
						max_nodes: input.max_nodes,
						...action === undefined ? {} : { action }
					}, signal));
					if (!response.ok) return err(new AnalysisCapabilityUnavailableError("native-macos", operation, `${response.code}: ${response.message}`));
					if (response.result.window.pid !== input.pid || response.result.window.window_id !== input.window_id || response.result.window.executable !== target.path || launchTime !== undefined && response.result.window.launch_time !== launchTime) return err(new AnalysisCapabilityUnavailableError("native-macos", operation, "Native helper returned a different target process or window"));
					launchTime = response.result.window.launch_time;
					outputBytes += 2 * Buffer.byteLength(JSON.stringify(response.result));
					if (outputBytes > 67108864) return err(new AnalysisCapabilityUnavailableError("native-macos", operation, "Scenario captures exceeded the 64 MiB output budget"));
					return ok(response.result);
				} catch (cause) {
					if (cause instanceof AnalysisError) return err(cause);
					return err(cause instanceof ExecFileOutputCancelledError ? new AnalysisCancelledError(operation, { cause: cause.cause }) : new ProviderAdapterError("native-macos", operation, {
						cause,
						diagnostics: {
							helper_path: helper,
							reason: cause instanceof Error ? cause.message : String(cause),
							remediation: "Native helper failed, timed out, or returned malformed capture data; install compatible Xcode command-line tools and inspect local OS permissions"
						}
					}));
				}
			};
			const initial = await take();
			if (!initial.ok) return initial;
			const results = [];
			let before = initial.value;
			let terminalFailure;
			for (const [index, step] of steps.entries()) {
				if (signal.aborted) {
					terminalFailure = new AnalysisCancelledError(operation, { cause: signal.reason });
					results.push({
						index,
						kind: step.kind,
						before,
						after: null,
						outcome: "cancelled",
						reason: "Scenario cancelled before action"
					});
					break;
				}
				if (step.kind === "wait" && await waitForAbortableDelay(step.milliseconds, signal) === "aborted") {
					terminalFailure = new AnalysisCancelledError(operation, { cause: signal.reason });
					results.push({
						index,
						kind: step.kind,
						before,
						after: null,
						outcome: "cancelled",
						reason: "Scenario cancelled during wait"
					});
					break;
				}
				const after = await take(step.kind === "wait" ? undefined : step);
				if (!after.ok) {
					terminalFailure = after.error;
					results.push({
						index,
						kind: step.kind,
						before,
						after: null,
						outcome: after.error._tag === "AnalysisCancelledError" ? "cancelled" : "failed",
						reason: after.error.message
					});
					break;
				}
				results.push({
					index,
					kind: step.kind,
					before,
					after: after.value,
					outcome: "completed",
					reason: null
				});
				before = after.value;
			}
			const report = nativeUiResultSchema.parse({
				target_sha256: target.sha256,
				initial: initial.value,
				steps: results,
				restore: "leave-as-is",
				limitations: [
					"Only the explicitly selected already-running process/window is admitted. REA starts no target process and does not change permissions, foreground applications, or restore application data.",
					"Click uses AXPress; scroll uses AXIncrement/AXDecrement; key-entry sets the selected element's AXValue. Unsupported elements fail without global event fallback.",
					"Each completed action is followed immediately by capture; delayed UI changes require explicit wait steps. A failed after-capture can follow a completed action, so failure does not prove absence of application effects.",
					"Scenarios can change app data, cause app network activity and persist changes. The caller explicitly chooses leave-as-is; automatic restoration is unsupported.",
					"Window matching uses exact PID and window ID for screenshots and unique accessibility geometry. Accessibility paths can change as the UI changes; stale or ambiguous paths fail. Screenshots are scaled to at most 2048 pixels; scenario output is budgeted at 64 MiB and execution is cancelled after 180 seconds."
				]
			});
			return terminalFailure === undefined ? finishNativeUiObservation(ok(report), operation, signal) : err(terminalFailure.retainPartialObservation(report));
		};
		finishNativeUiObservation = (result, operation, signal) => result.ok && signal?.aborted ? err(new AnalysisCancelledError(operation, {
			cause: signal.reason,
			partialObservation: result.value
		})) : result;
	})))();
}

//#endregion
//#region dist/native/NativeCallTarget.js
var OPERATION$2, nativeCallTargetFailure, verifyNativeCallTarget;
function init_NativeCallTarget() {
	return (init_NativeCallTarget = __esmMin((() => {
		init_NativeMacOSProviderMetadata();
		init_analysisErrorCore();
		init_evidenceErrors();
		init_providerAdapterError();
		init_providerCleanupError();
		init_jsonValue();
		init_result();
		init_StableFileHash();
		init_RegularFile();
		init_OwnedRegularFile();
		init_AnalysisCleanupLease();
		init_ArtifactResourceScope();
		init_ArtifactFileOperation();
		OPERATION$2 = "observe_native_calls";
		nativeCallTargetFailure = (cause, path) => {
			if (cause instanceof ArtifactResourceRetryFailure && cause.cleanup !== undefined) {
				const failure = new ProviderCleanupError(NATIVE_MACOS_PROVIDER_IDENTITY.id, cause.cleanup.resources, {
					reason: cause.cleanup.reason,
					phase: "target-digest-retry"
				}, {
					operation: OPERATION$2,
					cause
				});
				bindArtifactFileCleanup(cause, failure);
				return failure;
			}
			if (cause instanceof RegularFileOperationCancelled || cause instanceof RegularFileCancelled) return new AnalysisCancelledError(OPERATION$2, {
				cause: cause.reason,
				...cause instanceof RegularFileCancelled ? { diagnostics: { completed_hash: jsonValueSchema.parse(cause.outcome.value) } } : {}
			});
			const physical = stableFileHashCause(cause);
			if (physical instanceof RegularFileChangedError) return new EvidenceIntegrityError("Native call observation target changed during digest verification", { cause: physical });
			return new ProviderAdapterError(NATIVE_MACOS_PROVIDER_IDENTITY.id, OPERATION$2, {
				cause: physical,
				diagnostics: {
					path,
					phase: "target-digest",
					reason: "Unable to verify the selected target digest",
					detail: physical instanceof Error ? physical.message : String(physical)
				}
			});
		};
		verifyNativeCallTarget = async (target, resources, signal) => {
			let cleanupLease;
			try {
				const digest = await hashStableFile(target.path, {
					...signal === undefined ? {} : { signal },
					retainFailedClose: (owner) => {
						cleanupLease = new AnalysisCleanupLease(() => owner.close(), [target.path]);
						resources.retain({
							kind: "lease",
							resource: target.path,
							lease: cleanupLease
						});
					}
				});
				return digest.sha256 === target.sha256 ? ok(undefined) : err(new EvidenceIntegrityError("Native call observation target digest changed after session binding"));
			} catch (cause) {
				if (cause instanceof RegularFileCleanupFailure && cleanupLease !== undefined) {
					const cancellation = regularFileCancellation(cause);
					const completed = cause.outcome.kind === "completed" ? { completed_hash: jsonValueSchema.parse(cause.outcome.value) } : undefined;
					const primary = cause.outcome.kind === "failed" ? nativeCallTargetFailure(cause.outcome.cause, target.path) : cancellation === undefined ? undefined : new AnalysisCancelledError(OPERATION$2, {
						cause: cancellation.reason,
						diagnostics: completed
					});
					const framed = new ArtifactFileCleanupFailure(cause, cleanupLease);
					const failure = new ProviderCleanupError(NATIVE_MACOS_PROVIDER_IDENTITY.id, [target.path], {
						phase: "target-digest-close",
						reason: cause.cleanupCause instanceof Error ? cause.cleanupCause.message : String(cause.cleanupCause),
						...completed
					}, {
						operation: OPERATION$2,
						cause: framed,
						cleanupPrimary: primary
					});
					bindArtifactFileCleanup(framed, failure);
					return err(failure);
				}
				return err(nativeCallTargetFailure(cause, target.path));
			}
		};
	})))();
}

//#endregion
//#region dist/domain/native/nativeCallPartialObservation.js
var completed, nativeCallPartialObservationSchema;
function init_nativeCallPartialObservation() {
	return (init_nativeCallPartialObservation = __esmMin((() => {
		init_nativeCallObservation();
		completed = nativeCallObservationResultSchema.shape;
		nativeCallPartialObservationSchema = z.strictObject({
			kind: z.literal("native-call-observation"),
			target: completed.target.omit({ launch_identity: true }).extend({ launch_identity: completed.target.shape.launch_identity.optional() }),
			process: completed.process.partial().extend({
				pid: z.number().int().positive().nullable(),
				stdout: nativeCapturedOutputSchema.nullable(),
				stderr: nativeCapturedOutputSchema.nullable(),
				other_stops: z.array(z.string())
			}),
			debugger: completed.debugger.partial().extend({ version: z.string().nullable() }),
			breakpoints: completed.breakpoints.optional(),
			events: z.array(nativeCallEventSchema),
			coverage: completed.coverage.omit({ status: true }).partial().extend({
				status: z.literal("partial"),
				reason: z.enum([
					"cancelled",
					"timeout",
					"tracer-failure",
					"capture-failure",
					"cleanup-failure"
				])
			}),
			limitations: z.array(z.string())
		});
	})))();
}

//#endregion
//#region dist/native/NativeCallObservation.js
var OPERATION$1, NATIVE_CALL_OBSERVATION_LIMITATIONS, observeNativeCalls, nativeCallFacts, projectNativeCalls, projectPartialNativeCalls;
function init_NativeCallObservation() {
	return (init_NativeCallObservation = __esmMin((() => {
		init_analysisErrorCore();
		init_binaryTargetTypes();
		init_providerAdapterError();
		init_nativeCallObservation();
		init_NativeCallTarget();
		init_result();
		init_nativeCallPartialObservation();
		OPERATION$1 = "observe_native_calls";
		NATIVE_CALL_OBSERVATION_LIMITATIONS = [
			"Only entries are observed; return values, floating-point and stack-passed arguments are not captured.",
			"Registers are the raw integer argument registers at entry. For Objective-C methods the first two hold the receiver and the selector.",
			"Receiver classes come from LLDB's Objective-C runtime reader without running target code; they are null for class methods and for receivers LLDB cannot classify.",
			"Calls that never reach a symbol's entry, such as inlined code or objc_direct methods called directly, are not observed.",
			"The target is launched directly under LLDB, not through LaunchServices; LLDB disables ASLR for it, so load addresses can equal file addresses.",
			"The observation window is checked about once a second, and recording pauses the process at every entry, which slows it."
		];
		observeNativeCalls = async (target, parameters, tracer, resources, signal) => {
			if (target.kind !== "executable" || !isMachOFormat(target.format)) return err(new AnalysisCapabilityUnavailableError("native-macos", OPERATION$1, "Native call observation launches a Mach-O executable; the active target is not one"));
			const parsed = nativeCallObservationInputSchema.safeParse(parameters);
			if (!parsed.success) return err(new AnalysisInputError(OPERATION$1, { cause: parsed.error }));
			try {
				return await resources.run(async () => {
					const selected = await verifyNativeCallTarget(target, resources, signal);
					if (!selected.ok) return selected;
					if (signal?.aborted) return err(new AnalysisCancelledError(OPERATION$1, { cause: signal.reason }));
					try {
						const traced = await tracer.trace({
							executable: target.path,
							architecture: target.architecture,
							expectedSha256: target.sha256,
							input: parsed.data
						}, signal);
						if (!traced.ok) return traced;
						return signal?.aborted ? err(new AnalysisCancelledError(OPERATION$1, {
							cause: signal.reason,
							partialObservation: projectPartialNativeCalls(target, parsed.data, traced.value, "cancelled")
						})) : ok(projectNativeCalls(target, parsed.data, traced.value));
					} catch (cause) {
						return err(new ProviderAdapterError("native-macos", OPERATION$1, {
							cause,
							diagnostics: { phase: "trace-result" }
						}));
					}
				});
			} catch (cause) {
				return err(nativeCallTargetFailure(cause, target.path));
			}
		};
		nativeCallFacts = (target, input, trace) => {
			const { run } = trace;
			const unresolved = run.breakpoints.filter(({ location_count: count }) => count === 0).map(({ index }) => index);
			const eventLimit = run.outcome === "event-limit";
			const resourceLimit = run.outcome === "resource-limit";
			const breakpointLocationLimit = run.breakpoint_locations_truncated === true;
			const partial = eventLimit || resourceLimit || breakpointLocationLimit || run.outcome === "duration-elapsed" || run.outcome === "stop-limit" || unresolved.length > 0;
			return {
				target: {
					path: target.path,
					sha256: target.sha256,
					architecture: target.architecture,
					arguments: input.arguments,
					environment: input.environment,
					working_directory: input.working_directory ?? null,
					launch_identity: {
						loaded_image_sha256: run.target_identity.loaded_image_sha256,
						file_device: run.target_identity.file_device,
						file_inode: run.target_identity.file_inode,
						selected_file_sha256: run.target_identity.selected_file_sha256,
						module_path: run.target_identity.module_path,
						module_uuid: run.target_identity.module_uuid,
						stable: run.target_identity.stable
					}
				},
				debugger: trace.debugger,
				process: {
					pid: run.pid,
					outcome: run.outcome,
					exit_status: run.exit_status,
					exit_description: run.exit_description,
					terminated: run.terminated && trace.terminated,
					elapsed_ms: run.elapsed_ms,
					stdout: trace.stdout,
					stderr: trace.stderr,
					other_stops: run.other_stops
				},
				breakpoints: input.breakpoints.map((request, index) => ({
					index,
					request: request.kind === "function" ? {
						...request,
						module: request.module ?? null
					} : {
						...request,
						class_name: request.class_name ?? null
					},
					location_count: run.breakpoints[index]?.location_count ?? 0,
					locations: run.breakpoints[index]?.locations ?? []
				})),
				events: run.events,
				coverage: {
					status: partial ? "partial" : "complete",
					event_limit_reached: eventLimit,
					resource_limit_reached: resourceLimit,
					...breakpointLocationLimit ? { breakpoint_locations_truncated: true } : {},
					unresolved_breakpoints: unresolved
				},
				limitations: [
					...NATIVE_CALL_OBSERVATION_LIMITATIONS,
					"The selected pathname digest and LLDB module identity are checked around launch. No immutable executable snapshot is used; concurrent in-place mutation or replacement and restoration cannot be ruled out, so the loaded-image digest remains unknown.",
					...eventLimit ? [`Observation stopped at max_events (${input.max_events}); later calls were not recorded and the process was killed.`] : [],
					...resourceLimit ? ["Observation stopped before retaining the next complete event because the estimated 8 MiB trace-payload or 65,536-frame aggregate budget was reached; the process was killed."] : [],
					...run.outcome === "duration-elapsed" ? [`The process was still running after duration_ms (${input.duration_ms}) and was killed.`] : [],
					...run.target_identity.stable ? [] : ["LLDB did not provide enough module identity evidence to confirm pathname and module continuity around launch."],
					...run.outcome === "stop-limit" ? ["Observation stopped after repeated signal or exception stops; the process was killed."] : [],
					...unresolved.length === 0 ? [] : [`Breakpoints ${unresolved.join(", ")} matched no code in any image loaded while observing; their calls could not be observed.`],
					...run.breakpoints.some(({ location_count: count, locations }) => locations.length < count) ? ["Breakpoints with many matching locations list only the first 64; location_count gives the total."] : [],
					...breakpointLocationLimit ? ["Resolved breakpoint locations exceeded the aggregate 8 MiB metadata budget; omitted locations are counted in location_count. This metadata limit does not change the process outcome."] : [],
					...trace.stdout === null || trace.stderr === null ? ["One or more target output captures were unavailable."] : [],
					...trace.stdout?.truncated === true || trace.stderr?.truncated === true ? ["Target output beyond 1 MiB per stream is counted but not kept."] : [],
					...trace.stdout?.complete === false || trace.stderr?.complete === false ? ["Target output draining did not complete; reported byte counts are observed lower bounds, not stream totals."] : [],
					...run.terminated && trace.terminated ? [] : [`REA could not confirm that process ${run.pid} exited; check for it before relying on host state.`]
				]
			};
		};
		projectNativeCalls = (target, input, trace) => nativeCallObservationResultSchema.parse(nativeCallFacts(target, input, trace));
		projectPartialNativeCalls = (target, input, trace, reason) => {
			const facts = nativeCallFacts(target, input, trace);
			return nativeCallPartialObservationSchema.parse({
				...facts,
				kind: "native-call-observation",
				coverage: {
					...facts.coverage,
					status: "partial",
					reason
				}
			});
		};
	})))();
}

//#endregion
//#region dist/native/LldbReadbackFiles.js
var LldbReadbackFiles;
function init_LldbReadbackFiles() {
	return (init_LldbReadbackFiles = __esmMin((() => {
		init_result();
		init_ArtifactResourceScope();
		init_ArtifactFileOperation();
		LldbReadbackFiles = class {
			#resources = new ArtifactResourceScope();
			#targetPids = new Map();
			#failed = new Map();
			get hasPending() {
				return this.#resources.hasPending;
			}
			get cleanupResources() {
				return [...new Set([...this.#failed].filter(([lease]) => !lease.released).map(([, failure]) => failure.path))];
			}
			get cleanupCause() {
				const failures = [...this.#failed].filter(([lease]) => !lease.released).map(([, failure]) => failure.cause);
				return failures.length === 0 ? undefined : new AggregateError(failures, "LLDB readback descriptors remain open or unconfirmed");
			}
			/** Preserve a completed value even if final close transfers its owner here. */
			async read(path, read) {
				const blocked = [...this.#failed].find(([lease, failure]) => !lease.released && failure.path === path);
				if (blocked !== undefined) return err(blocked[1].cause);
				let completed;
				try {
					return ok(await withArtifactRegularFile(path, this.#resources, undefined, async (handle) => {
						const value = await read(handle);
						completed = { value };
						return value;
					}));
				} catch (cause) {
					if (cause instanceof ArtifactFileCleanupFailure) this.#failed.set(cause.cleanupLease, {
						path,
						cause
					});
					return completed === undefined ? err(cause) : ok(completed.value);
				}
			}
			/** The producer publishes one target PID per runtime; retain its parsed fact. */
			async readTargetPid(path) {
				const known = this.#targetPids.get(path);
				if (known !== undefined) return known;
				const contents = await this.read(path, async (file) => (await file.readFile("utf8")).trim());
				if (!contents.ok || !/^[1-9]\d*$/u.test(contents.value)) return undefined;
				const pid = Number(contents.value);
				if (!Number.isSafeInteger(pid)) return undefined;
				this.#targetPids.set(path, pid);
				return pid;
			}
			async retryCleanup() {
				try {
					await this.#resources.retryCleanup();
				} finally {
					for (const lease of this.#failed.keys()) if (lease.released) this.#failed.delete(lease);
				}
			}
		};
	})))();
}

//#endregion
//#region dist/native/LldbRetainedObservations.js
var LLDB_OBSERVATION_JOURNAL_MAX_BYTES, MAX_CAPTURE_BYTES, projectLldbPartialObservation, parseLldbObservationJournal, readBoundedPrefix, readPrefix, readLldbObservationJournal, readPartialCapture;
function init_LldbRetainedObservations() {
	return (init_LldbRetainedObservations = __esmMin((() => {
		init_nativeCallObservation();
		LLDB_OBSERVATION_JOURNAL_MAX_BYTES = 8 * 1024 * 1024;
		MAX_CAPTURE_BYTES = 1024 * 1024;
		projectLldbPartialObservation = (input) => ({
			kind: "native-call-observation",
			target: input.target,
			process: {
				pid: input.pid ?? null,
				stdout: input.stdout,
				stderr: input.stderr,
				other_stops: input.journal.otherStops
			},
			debugger: { version: input.version },
			events: input.journal.events,
			coverage: {
				status: "partial",
				reason: input.reason
			},
			limitations: [
				"The LLDB run did not produce a complete native call observation result.",
				"The target SHA-256 identifies the selected artifact; LLDB did not verify the bytes loaded into the process.",
				"Captured output byte counts are observed lower bounds because LLDB did not report final stream counters.",
				...input.journal.limitations,
				...input.journalLimitations ?? [],
				...input.limitations ?? [],
				...input.pid === undefined ? ["The target PID was unavailable."] : [],
				...input.stdout === null ? ["The target stdout capture was unavailable."] : [],
				...input.stderr === null ? ["The target stderr capture was unavailable."] : []
			]
		});
		parseLldbObservationJournal = (bytes) => {
			const completeText = Buffer.from(bytes).toString("utf8");
			const newline = completeText.lastIndexOf("\n");
			const hasTornTail = newline !== completeText.length - 1;
			const events = [];
			const otherStops = [];
			const limitations = [];
			let malformedCount = 0;
			let firstMalformedRow;
			let start = 0;
			let rowNumber = 0;
			while (start <= newline && newline >= 0) {
				const end = completeText.indexOf("\n", start);
				if (end < 0 || end > newline) break;
				const line = completeText.slice(start, end);
				start = end + 1;
				if (line.length === 0) continue;
				rowNumber += 1;
				const markMalformed = () => {
					malformedCount += 1;
					firstMalformedRow ??= rowNumber;
				};
				let row;
				try {
					row = JSON.parse(line);
				} catch {
					markMalformed();
					continue;
				}
				if (typeof row !== "object" || row === null || !("kind" in row) || typeof row.kind !== "string") {
					markMalformed();
					continue;
				}
				if (row.kind === "event" && "event" in row) {
					const event = nativeCallEventSchema.safeParse(row.event);
					if (event.success) events.push(event.data);
					else markMalformed();
				} else if (row.kind === "other-stop" && "reason" in row && typeof row.reason === "string") {
					otherStops.push(row.reason);
				} else {
					markMalformed();
				}
			}
			if (malformedCount > 0) limitations.push(`${malformedCount} observation journal row(s) were malformed or invalid and ignored (first at row ${String(firstMalformedRow)}).`);
			if (hasTornTail) limitations.push("The final observation journal record was incomplete and was ignored.");
			return {
				events,
				otherStops,
				limitations
			};
		};
		readBoundedPrefix = async (requestedBytes, readChunk) => {
			const buffer = Buffer.alloc(requestedBytes);
			let bytesRead = 0;
			while (bytesRead < requestedBytes) {
				const count = await readChunk(buffer, bytesRead, requestedBytes - bytesRead, bytesRead);
				if (count === 0) break;
				if (count > requestedBytes - bytesRead) throw new Error("The bounded read returned more bytes than requested");
				bytesRead += count;
			}
			return {
				buffer,
				bytesRead
			};
		};
		readPrefix = (handle, requestedBytes) => readBoundedPrefix(requestedBytes, async (buffer, offset, length, position) => (await handle.read(buffer, offset, length, position)).bytesRead);
		readLldbObservationJournal = (path, files) => files.read(path, async (handle) => {
			const { size } = await handle.stat();
			const length = Math.min(size, LLDB_OBSERVATION_JOURNAL_MAX_BYTES);
			const { buffer, bytesRead } = await readPrefix(handle, length);
			return {
				parsed: parseLldbObservationJournal(buffer.subarray(0, bytesRead)),
				limitations: [...size > 8388608 ? ["The observation journal exceeded 8 MiB; only its bounded prefix was read."] : [], ...bytesRead < length ? ["The observation journal became shorter while being read; the available prefix was parsed."] : []]
			};
		});
		readPartialCapture = (path, files) => files.read(path, async (handle) => {
			const { size } = await handle.stat();
			const length = Math.min(size, MAX_CAPTURE_BYTES);
			const { buffer, bytesRead } = await readPrefix(handle, length);
			return {
				capture: {
					text: buffer.subarray(0, bytesRead).toString("utf8"),
					bytes: Math.max(size, bytesRead),
					truncated: true,
					complete: false
				},
				limitations: bytesRead < length ? ["A target output capture became shorter while being read; its retained prefix may be incomplete."] : []
			};
		});
	})))();
}

//#endregion
//#region dist/native/LldbCallTracer.js
var OPERATION, PROVIDER, LLDB_REQUIREMENT, MAX_OUTPUT_BYTES, DEADLINE_GRACE_MS, DIAGNOSTIC_BYTES, BRIDGE, tracedSchema, tracerOutputSchema, ATTACH_REMEDIATION, LldbCallTracer, quote, tracerFailure, partialNativeObservation, partialObservationFromTrace, lldbRuntimePaths, readTracerOutput, capturedOutput, errorReason, releaseLldbRuntime, bindLldbCleanup, lldbCleanupFailure, lldbCleanupResources, runLldb, ensureTerminated, targetTerminationReason, alive;
function init_LldbCallTracer() {
	return (init_LldbCallTracer = __esmMin((() => {
		init_snapshotEnvironment();
		init_analysisErrorCore();
		init_evidenceErrors();
		init_analysisErrorProjection();
		init_nativeCallObservation();
		init_providerAdapterError();
		init_providerCleanupError();
		init_result();
		init_safeJson();
		init_ProviderProcess();
		init_ProcessOwnership();
		init_ProcessOwnershipObservation();
		init_ProviderDeadline();
		init_PrivateRuntimeRoot();
		init_CommandRunner();
		init_NativeCallObservation();
		init_LldbReadbackFiles();
		init_AnalysisCleanupLease();
		init_analysisErrorCleanup();
		init_analysisErrorBase();
		init_LldbRetainedObservations();
		OPERATION = "observe_native_calls";
		PROVIDER = "native-macos";
		LLDB_REQUIREMENT = "LLDB from Xcode or the Command Line Tools is not available";
		MAX_OUTPUT_BYTES = 1024 * 1024;
		DEADLINE_GRACE_MS = 6e4;
		DIAGNOSTIC_BYTES = 16 * 1024;
		BRIDGE = fileURLToPath(new URL("../../bridge/native/rea_lldb_tracer.py", new URL("../native/LldbCallTracer.js", import.meta.url).href));
		tracedSchema = z.strictObject({
			status: z.literal("traced"),
			version: z.string(),
			pid: z.number().int().positive(),
			outcome: z.enum([
				"exited",
				"duration-elapsed",
				"event-limit",
				"stop-limit",
				"resource-limit"
			]),
			exit_status: z.number().int().nullable(),
			exit_description: z.string().nullable(),
			killed: z.boolean(),
			terminated: z.boolean(),
			target_identity: z.strictObject({
				loaded_image_sha256: z.null(),
				selected_file_sha256: z.string().regex(/^[0-9a-f]{64}$/u).nullable(),
				file_device: z.string().nullable(),
				file_inode: z.string().nullable(),
				module_path: z.string().nullable(),
				module_uuid: z.string().nullable(),
				stable: z.boolean()
			}),
			resource_limit_reached: z.boolean(),
			breakpoint_locations_truncated: z.boolean().optional(),
			target_output: z.strictObject({
				stdout_bytes: z.number().int().nonnegative(),
				stderr_bytes: z.number().int().nonnegative(),
				stdout_truncated: z.boolean(),
				stderr_truncated: z.boolean(),
				stdout_complete: z.boolean(),
				stderr_complete: z.boolean()
			}),
			elapsed_ms: z.number().nonnegative(),
			breakpoints: z.array(z.strictObject({
				index: z.number().int().nonnegative(),
				location_count: z.number().int().nonnegative(),
				locations: z.array(nativeCodeLocationSchema)
			})),
			events: z.array(nativeCallEventSchema),
			other_stops: z.array(z.string())
		});
		tracerOutputSchema = z.discriminatedUnion("status", [tracedSchema, z.strictObject({
			status: z.enum([
				"target-error",
				"target-integrity-error",
				"target-identity-unavailable",
				"launch-error",
				"tracer-error"
			]),
			error: z.string().nullable(),
			target_process_created: z.boolean().optional(),
			target_process_exit_observed: z.boolean().optional()
		})]);
		ATTACH_REMEDIATION = "Allow debugging for this user (Developer Tools access: `DevToolsSecurity -enable`, or membership in the _developer group). A hardened-runtime target is debuggable only with the com.apple.security.get-task-allow entitlement; inspect_signature reports hardened_runtime and entitlements.";
		LldbCallTracer = class {
			launch;
			resolveTool;
			environment;
			#tail = Promise.resolve();
			#pendingCleanup;
			constructor(environment, launch = runLldb, resolveTool = (tool, signal) => resolveXcrunTool(tool, this.environment, signal)) {
				this.launch = launch;
				this.resolveTool = resolveTool;
				this.environment = snapshotEnvironment(environment);
			}
			async trace(request, signal) {
				return this.#serialize(() => this.#trace(request, signal));
			}
			async #trace(request, signal) {
				const pendingCleanup = await this.#retryPendingCleanup();
				if (pendingCleanup !== undefined) return err(pendingCleanup);
				const lldb = await this.resolveTool("lldb", signal);
				if (!lldb.ok) return err(lldb.error.reason === "cancelled" ? new AnalysisCancelledError(OPERATION) : new AnalysisCapabilityUnavailableError(PROVIDER, OPERATION, LLDB_REQUIREMENT, { userMessage: LLDB_REQUIREMENT }));
				const root = await PrivateRuntimeRoot.create({ prefix: "rea-lldb-" });
				const paths = lldbRuntimePaths(root.path);
				const owner = {
					root,
					rootLease: new AnalysisCleanupLease(() => root.close(), [root.path]),
					files: new LldbReadbackFiles(),
					supervisor: undefined,
					pidPath: paths.pid,
					targetIdentity: undefined,
					targetPid: undefined,
					processStopped: true,
					targetStopped: true
				};
				let result;
				try {
					result = await this.#run(lldb.value, owner, request, signal);
				} catch (cause) {
					const partialObservation = await partialNativeObservation({
						request,
						files: owner.files,
						pidPath: paths.pid,
						stdoutPath: paths.stdoutCapture,
						stderrPath: paths.stderrCapture,
						observationPath: paths.observations,
						version: null,
						reason: "tracer-failure"
					});
					if (!owner.processStopped || !owner.targetStopped || owner.files.hasPending) this.#pendingCleanup = owner;
					result = err(new ProviderAdapterError(PROVIDER, OPERATION, {
						cause,
						diagnostics: { reason: errorReason(cause) },
						partialObservation,
						...this.#pendingCleanup === owner ? { cleanup: {
							reason: "LLDB trace failed while owned resources remain",
							resources: lldbCleanupResources(owner)
						} } : {}
					}));
				}
				if (result.ok && signal?.aborted) result = err(new AnalysisCancelledError(OPERATION, {
					cause: signal.reason,
					partialObservation: partialObservationFromTrace(request, result.value, "cancelled")
				}));
				if (owner.files.hasPending) this.#pendingCleanup = owner;
				if (this.#pendingCleanup === owner) {
					if (!result.ok && result.error.cleanupIncomplete) {
						if (owner.files.hasPending) {
							const files = lldbCleanupFailure(owner, "LLDB readback descriptor cleanup remains incomplete", owner.files.cleanupCause);
							result.error.retainSecondaryFailure(files, { readback_cleanup: projectAnalysisError(files) });
						}
						return err(bindLldbCleanup(result.error, owner));
					}
					const cleanup = lldbCleanupFailure(owner, "LLDB readback descriptor cleanup remains incomplete", owner.files.cleanupCause, result.ok ? partialObservationFromTrace(request, result.value) : undefined);
					return result.ok ? err(cleanup) : err(analysisErrorWithCleanupFailure(result.error, cleanup, OPERATION).bindCleanupDependencies([result.error, cleanup]));
				}
				let rootCleanup;
				try {
					await releaseLldbRuntime(owner);
					rootCleanup = ok(undefined);
				} catch (cause) {
					rootCleanup = err(cause);
					this.#pendingCleanup = owner;
				}
				if (result.ok && signal?.aborted) result = err(new AnalysisCancelledError(OPERATION, {
					cause: signal.reason,
					partialObservation: partialObservationFromTrace(request, result.value, "cancelled")
				}));
				if (!rootCleanup.ok) {
					const cleanup = lldbCleanupFailure(owner, errorReason(rootCleanup.error), rootCleanup.error, result.ok ? partialObservationFromTrace(request, result.value) : undefined);
					if (!result.ok && result.error.cleanupIncomplete) bindLldbCleanup(result.error, owner);
					return result.ok ? err(cleanup) : err(analysisErrorWithCleanupFailure(result.error, cleanup, OPERATION).bindCleanupDependencies([result.error, cleanup]));
				}
				return result.ok ? result : err(resolvedAnalysisError(bindLldbCleanup(result.error, owner)));
			}
			/** Retry retained LLDB cleanup without abandoning its process or runtime owner. */
			async close() {
				return this.#serialize(() => this.#close());
			}
			async #close() {
				const failure = await this.#retryPendingCleanup();
				return failure === undefined ? ok(null) : err(failure);
			}
			#serialize(operation) {
				const call = this.#tail.then(operation, operation);
				this.#tail = call.then(() => undefined, () => undefined);
				return call;
			}
			async #retryPendingCleanup() {
				const owner = this.#pendingCleanup;
				if (owner === undefined) return undefined;
				const failures = [];
				try {
					await owner.files.retryCleanup();
				} catch (cause) {
					failures.push(cause);
				}
				if (!owner.processStopped) {
					if (owner.supervisor === undefined) failures.push(new Error("LLDB process cleanup ownership was unavailable"));
					else {
						try {
							const stopped = await owner.supervisor.stop();
							if (stopped.status === "incomplete") failures.push(new Error(stopped.reason));
							else {
								owner.supervisor.dispose();
								owner.processStopped = true;
							}
						} catch (cause) {
							failures.push(cause);
						}
					}
				}
				if (owner.processStopped && !owner.targetStopped) {
					owner.targetPid = await owner.files.readTargetPid(owner.pidPath);
					try {
						const targetTermination = await ensureTerminated(owner.targetPid, owner.targetIdentity);
						if (targetTermination !== "terminated") failures.push(new Error(targetTerminationReason(targetTermination)));
						else owner.targetStopped = true;
					} catch (cause) {
						failures.push(cause);
					}
				}
				if (failures.length === 0) {
					try {
						await releaseLldbRuntime(owner);
						this.#pendingCleanup = undefined;
						return undefined;
					} catch (cause) {
						failures.push(cause);
					}
				}
				return lldbCleanupFailure(owner, failures.map(errorReason).join("; "), new AggregateError(failures, "LLDB cleanup remains incomplete"));
			}
			async #run(lldb, retained, request, signal) {
				const directory = retained.root.path;
				const paths = lldbRuntimePaths(directory);
				const { input } = request;
				await writeFile(paths.config, JSON.stringify({
					executable: request.executable,
					architecture: request.architecture,
					expected_sha256: request.expectedSha256,
					arguments: input.arguments,
					environment: input.environment,
					working_directory: input.working_directory ?? null,
					breakpoints: input.breakpoints.map((breakpoint) => breakpoint.kind === "function" ? {
						...breakpoint,
						module: breakpoint.module ?? null
					} : {
						...breakpoint,
						class_name: breakpoint.class_name ?? null
					}),
					duration_ms: input.duration_ms,
					max_events: input.max_events,
					argument_registers: input.argument_registers,
					backtrace_frames: input.backtrace_frames,
					max_output_bytes: MAX_OUTPUT_BYTES,
					stdout_path: paths.stdout,
					stderr_path: paths.stderr,
					stdout_capture_path: paths.stdoutCapture,
					stderr_capture_path: paths.stderrCapture,
					result_path: paths.result,
					pid_path: paths.pid,
					identity_ack_path: paths.identityAck,
					observation_path: paths.observations
				}), { mode: 384 });
				retained.processStopped = false;
				retained.targetStopped = false;
				this.#pendingCleanup = retained;
				const exited = await this.launch(lldb.path, [
					"--batch",
					"--no-lldbinit",
					"--no-use-colors",
					"-o",
					`command script import ${quote(BRIDGE)}`,
					"-o",
					`rea_trace ${paths.config}`
				], {
					deadlineMs: input.duration_ms + DEADLINE_GRACE_MS,
					pidPath: paths.pid,
					identityAckPath: paths.identityAck,
					environment: this.environment,
					files: retained.files,
					...signal === undefined ? {} : { signal }
				});
				retained.supervisor = exited.cleanupOwner;
				retained.targetIdentity = exited.targetIdentity;
				retained.processStopped = exited.cleanupOwner === undefined && exited.cleanupFailure === undefined;
				retained.targetStopped = !exited.targetLaunched;
				const output = exited.kind === "exited" ? await readTracerOutput(paths.result, retained.files) : undefined;
				const bridgeObservedExit = output !== undefined && output.status !== "traced" && output.target_process_exit_observed === true;
				retained.targetPid = await retained.files.readTargetPid(paths.pid);
				let targetTermination = exited.targetLaunched && !bridgeObservedExit ? await ensureTerminated(retained.targetPid, exited.targetIdentity) : "terminated";
				if (output !== undefined && output.status !== "traced" && output.target_process_created === false && retained.targetPid === undefined) targetTermination = "terminated";
				retained.targetStopped = targetTermination === "terminated";
				if (retained.processStopped && retained.targetStopped && !retained.files.hasPending) this.#pendingCleanup = undefined;
				const terminated = targetTermination === "terminated";
				const cleanupDetails = [exited.cleanupFailure, ...terminated ? [] : [targetTerminationReason(targetTermination)]].filter((detail) => detail !== undefined);
				const lifecycleCleanup = cleanupDetails.length === 0 ? undefined : {
					reason: cleanupDetails.join("; "),
					resources: lldbCleanupResources(retained)
				};
				const partialReason = exited.kind === "cancelled" ? "cancelled" : exited.kind === "timeout" ? "timeout" : exited.cleanupFailure !== undefined ? "cleanup-failure" : "tracer-failure";
				const getPartialObservation = (reason = partialReason) => partialNativeObservation({
					request,
					files: retained.files,
					pidPath: paths.pid,
					stdoutPath: paths.stdoutCapture,
					stderrPath: paths.stderrCapture,
					observationPath: paths.observations,
					version: output?.status === "traced" ? output.version : null,
					reason
				});
				if (exited.kind === "cancelled") return err(new AnalysisCancelledError(OPERATION, {
					cause: signal?.reason,
					...lifecycleCleanup === undefined ? {} : { cleanup: lifecycleCleanup },
					partialObservation: await getPartialObservation()
				}));
				if (exited.kind === "timeout") return err(new AnalysisTimeoutError(OPERATION, input.duration_ms + DEADLINE_GRACE_MS, {
					...lifecycleCleanup === undefined ? {} : { cleanup: lifecycleCleanup },
					partialObservation: await getPartialObservation()
				}));
				if (output !== undefined && output.status !== "traced") return err(tracerFailure(output, lifecycleCleanup, await getPartialObservation()));
				if (exited.cleanupFailure !== undefined) return err(new ProviderCleanupError(PROVIDER, lldbCleanupResources(retained), {
					reason: "LLDB process-group cleanup could not be verified",
					cleanup_failure: exited.cleanupFailure,
					...lifecycleCleanup === undefined ? {} : { target_cleanup: lifecycleCleanup }
				}, {
					operation: OPERATION,
					partialObservation: await getPartialObservation()
				}));
				if (!terminated) return err(new ProviderCleanupError(PROVIDER, lldbCleanupResources(retained), {
					reason: "LLDB target process termination could not be verified",
					...lifecycleCleanup === undefined ? {} : { target_cleanup: lifecycleCleanup }
				}, {
					operation: OPERATION,
					partialObservation: await getPartialObservation()
				}));
				if (output === undefined) return err(new ProviderAdapterError(PROVIDER, OPERATION, {
					diagnostics: {
						reason: "LLDB exited without a tracer result",
						exit_code: exited.exitCode,
						lldb_output: exited.output,
						...lifecycleCleanup === undefined ? {} : { target_cleanup: lifecycleCleanup }
					},
					partialObservation: await getPartialObservation(),
					...lifecycleCleanup === undefined ? {} : { cleanup: lifecycleCleanup }
				}));
				const stdout = await capturedOutput(paths.stdoutCapture, output.target_output.stdout_bytes, output.target_output.stdout_truncated, output.target_output.stdout_complete, retained.files);
				const stderr = await capturedOutput(paths.stderrCapture, output.target_output.stderr_bytes, output.target_output.stderr_truncated, output.target_output.stderr_complete, retained.files);
				if (!stdout.ok || !stderr.ok) {
					return err(new ProviderAdapterError(PROVIDER, OPERATION, {
						cause: new AggregateError([...stdout.ok ? [] : [stdout.error], ...stderr.ok ? [] : [stderr.error]], "LLDB capture readback failed"),
						partialObservation: projectPartialNativeCalls({
							path: request.executable,
							sha256: request.expectedSha256,
							architecture: request.architecture
						}, request.input, {
							debugger: {
								...lldb,
								version: output.version
							},
							run: output,
							stdout: stdout.ok ? stdout.value : null,
							stderr: stderr.ok ? stderr.value : null,
							terminated
						}, "capture-failure"),
						diagnostics: {
							reason: "LLDB target output capture could not be read",
							...stdout.ok ? {} : { stdout_capture_error: errorReason(stdout.error) },
							...stderr.ok ? {} : { stderr_capture_error: errorReason(stderr.error) },
							...lifecycleCleanup === undefined ? {} : { target_cleanup: lifecycleCleanup }
						},
						...lifecycleCleanup === undefined ? {} : { cleanup: lifecycleCleanup }
					}));
				}
				return ok({
					debugger: {
						...lldb,
						version: output.version
					},
					run: output,
					stdout: stdout.value,
					stderr: stderr.value,
					terminated
				});
			}
		};
		quote = (value) => `"${value.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"")}"`;
		tracerFailure = (output, cleanup, partialObservation) => {
			const options = {
				...cleanup === undefined ? {} : { cleanup },
				...partialObservation === undefined ? {} : { partialObservation }
			};
			const message = output.error ?? "no LLDB error text";
			if (output.status === "target-integrity-error") return new EvidenceIntegrityError(message || "The launched native target did not match its session digest", options);
			if (output.status === "target-identity-unavailable") return new ProviderAdapterError(PROVIDER, OPERATION, {
				...options,
				diagnostics: {
					reason: message,
					constraint: "target process start identity could not be verified"
				}
			});
			if (output.status === "tracer-error") return new ProviderAdapterError(PROVIDER, OPERATION, {
				...options,
				diagnostics: { reason: `LLDB bridge failed: ${message}` }
			});
			if (output.status === "target-error") return new AnalysisCapabilityUnavailableError(PROVIDER, OPERATION, `lldb-target-unloadable: ${message}`, options);
			return /attach|not allowed|permission|denied|debugserver/iu.test(message) ? new AnalysisCapabilityUnavailableError(PROVIDER, OPERATION, `debugger-attach-denied: ${message}`, {
				userMessage: ATTACH_REMEDIATION,
				...options
			}) : new AnalysisCapabilityUnavailableError(PROVIDER, OPERATION, `launch-failed: ${message}`, options);
		};
		partialNativeObservation = async (options) => {
			const [journal, pid, stdout, stderr] = await Promise.all([
				readLldbObservationJournal(options.observationPath, options.files),
				options.files.readTargetPid(options.pidPath),
				readPartialCapture(options.stdoutPath, options.files),
				readPartialCapture(options.stderrPath, options.files)
			]);
			return projectLldbPartialObservation({
				target: {
					path: options.request.executable,
					sha256: options.request.expectedSha256,
					architecture: options.request.architecture,
					arguments: options.request.input.arguments,
					environment: options.request.input.environment,
					working_directory: options.request.input.working_directory ?? null
				},
				pid,
				stdout: stdout.ok ? stdout.value.capture : null,
				stderr: stderr.ok ? stderr.value.capture : null,
				version: options.version,
				journal: journal.ok ? journal.value.parsed : {
					events: [],
					otherStops: [],
					limitations: []
				},
				journalLimitations: journal.ok ? journal.value.limitations : [`The observation journal could not be read: ${errorReason(journal.error)}`],
				limitations: [...stdout.ok ? stdout.value.limitations : [`The target stdout capture could not be read: ${errorReason(stdout.error)}`], ...stderr.ok ? stderr.value.limitations : [`The target stderr capture could not be read: ${errorReason(stderr.error)}`]],
				reason: options.reason
			});
		};
		partialObservationFromTrace = (request, trace, reason = "cleanup-failure") => {
			return projectPartialNativeCalls({
				path: request.executable,
				sha256: request.expectedSha256,
				architecture: request.architecture
			}, request.input, trace, reason);
		};
		lldbRuntimePaths = (directory) => ({
			config: join(directory, "config.json"),
			result: join(directory, "result.json"),
			pid: join(directory, "pid"),
			identityAck: join(directory, "identity.ack"),
			stdout: join(directory, "stdout"),
			stderr: join(directory, "stderr"),
			stdoutCapture: join(directory, "stdout.capture"),
			stderrCapture: join(directory, "stderr.capture"),
			observations: join(directory, "observations.jsonl")
		});
		readTracerOutput = async (path, files) => {
			const text = await files.read(path, (file) => file.readFile("utf8"));
			if (!text.ok) return undefined;
			const parsed = safeParseJson(text.value);
			if (!parsed.ok) return undefined;
			const output = tracerOutputSchema.safeParse(parsed.value);
			return output.success ? output.data : undefined;
		};
		capturedOutput = (path, observedBytes, truncated, complete, files) => files.read(path, async (handle) => {
			const { size } = await handle.stat();
			const { buffer, bytesRead } = await readBoundedPrefix(Math.min(size, MAX_OUTPUT_BYTES), async (target, offset, length, position) => (await handle.read(target, offset, length, position)).bytesRead);
			return {
				text: buffer.subarray(0, bytesRead).toString("utf8"),
				bytes: observedBytes,
				truncated: truncated || size > MAX_OUTPUT_BYTES,
				complete: complete && bytesRead >= Math.min(observedBytes, MAX_OUTPUT_BYTES)
			};
		});
		errorReason = (cause) => cause instanceof Error ? cause.message : String(cause);
		releaseLldbRuntime = async (owner) => {
			if (!owner.processStopped || !owner.targetStopped || owner.files.hasPending) throw new Error("LLDB runtime still owns unresolved child resources");
			await owner.rootLease.release();
		};
		bindLldbCleanup = (failure, owner) => {
			if (failure.cleanupIncomplete) {
				owner.rootLease.bindCleanupError(failure);
				failure.bindCleanupResourceOwner({ get cleanupResources() {
					return lldbCleanupResources(owner);
				} });
			}
			return failure;
		};
		lldbCleanupFailure = (owner, reason, cause, partialObservation) => bindLldbCleanup(new ProviderCleanupError(PROVIDER, lldbCleanupResources(owner), { reason }, {
			operation: OPERATION,
			cause,
			partialObservation
		}), owner);
		lldbCleanupResources = (owner) => [
			...owner.processStopped ? [] : ["lldb-process-group"],
			...owner.targetStopped ? [] : [`native-target:${String(owner.targetPid ?? "unknown")}`],
			...owner.files.cleanupResources,
			...owner.rootLease.released ? [] : [owner.root.path]
		];
		runLldb = async (executable, arguments_, options) => {
			if (options.signal?.aborted === true) return {
				kind: "cancelled",
				targetLaunched: false,
				targetIdentity: undefined,
				cleanupFailure: undefined
			};
			const deadline = new ProviderStartupDeadline(options.deadlineMs, options.signal);
			let targetIdentity;
			let supervisor;
			let retained = false;
			const finish = async (outcome) => {
				const stopped = await supervisor?.stop();
				retained = stopped?.status === "incomplete";
				return {
					...deadline.interruption === undefined ? outcome : { kind: deadline.interruption },
					targetLaunched: supervisor !== undefined,
					targetIdentity,
					cleanupFailure: stopped?.status === "incomplete" ? stopped.reason : undefined,
					...retained && supervisor !== undefined ? { cleanupOwner: supervisor } : {}
				};
			};
			try {
				const launched = await spawnOwnedProviderProcess({
					command: executable,
					arguments: arguments_,
					runId: randomUUID(),
					expectedCommand: executable,
					signal: deadline.signal,
					hostEnvironment: options.environment
				});
				supervisor = new ProviderProcessSupervisor({
					...launched,
					ownsProcessLifetime: true,
					cleanup: () => cleanupOwnedProcessGroup(launched.ownership)
				}, { maxDiagnosticBytes: DIAGNOSTIC_BYTES });
				let identityAckWritten = false;
				while (!await supervisor.waitForOutputClose(20)) {
					const pid = await options.files.readTargetPid(options.pidPath);
					if (pid !== undefined && !identityAckWritten) {
						let observation;
						try {
							observation = await observeProcessStartIdentity(pid);
						} catch {
							observation = undefined;
						}
						if (observation?.state === "readable") targetIdentity = observation.identity;
						await writeFile(options.identityAckPath, observation?.state === "readable" ? "readable" : "unavailable", { mode: 384 });
						identityAckWritten = true;
					}
					const interruption = deadline.interruption;
					if (interruption !== undefined) return await finish({ kind: interruption });
					await waitForAbortableDelay(20, deadline.signal);
				}
				const snapshot = supervisor.snapshot();
				const interruption = deadline.interruption;
				return await finish(interruption === undefined ? {
					kind: "exited",
					exitCode: snapshot.exitCode ?? null,
					output: `${snapshot.stdout.text}${snapshot.stderr.text}`.slice(-DIAGNOSTIC_BYTES)
				} : { kind: interruption });
			} catch (cause) {
				const interruption = deadline.interruption;
				return await finish(interruption === undefined ? {
					kind: "exited",
					exitCode: null,
					output: cause instanceof Error ? cause.message : String(cause)
				} : { kind: interruption });
			} finally {
				if (!retained) supervisor?.dispose();
				deadline.dispose();
			}
		};
		ensureTerminated = async (pid, identity) => {
			if (pid === undefined) return "identity-unavailable";
			let signalDisposition;
			for (let attempt = 0; attempt < 20; attempt++) {
				if (!alive(pid)) return "terminated";
				if (attempt === 10) {
					if (identity === undefined) signalDisposition = "identity-unavailable";
					else {
						const result = await signalProcessWithStartIdentity(pid, identity, "SIGKILL");
						if (result === "gone") return "terminated";
						if (result === "identity-changed") signalDisposition = "identity-changed";
						else if (result === "unverified") signalDisposition = "identity-unavailable";
						else if (result === "signaled") signalDisposition = "signal-did-not-stop";
					}
				}
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
			return !alive(pid) ? "terminated" : signalDisposition ?? "identity-unavailable";
		};
		targetTerminationReason = (termination) => {
			switch (termination) {
				case "terminated": return "target process terminated";
				case "identity-unavailable": return "target process start identity was unavailable; survivor was left untouched";
				case "identity-changed": return "target PID start identity changed; replacement process was left untouched";
				case "signal-did-not-stop": return "verified target did not exit after SIGKILL";
			}
		};
		alive = (pid) => {
			try {
				process.kill(pid, 0);
				return true;
			} catch (cause) {
				return !(cause instanceof Error && "code" in cause && cause.code === "ESRCH");
			}
		};
	})))();
}

//#endregion
//#region dist/native/SignatureTargetBinding.js
var identity, changedTarget, signatureReadFailure, withSignatureTarget, combineCleanupFailure, signatureCleanupFailure, snapshotFailure, snapshotIO, copySignatureBytes, bindSignatureTarget, verifySignatureTarget;
function init_SignatureTargetBinding() {
	return (init_SignatureTargetBinding = __esmMin((() => {
		init_RegularFile();
		init_analysisErrorBase();
		init_analysisErrorCore();
		init_providerAdapterError();
		init_providerCleanupError();
		init_analysisErrorCleanup();
		init_result();
		init_OwnedFileHandle();
		init_ArtifactResourceScope();
		init_PrivateRuntimeRoot();
		init_ArtifactReader();
		init_AnalysisCleanupLease();
		init_ArtifactFileOperation();
		init_NativeMacOSProviderMetadata();
		identity = (stat) => [
			stat.dev,
			stat.ino,
			stat.size,
			stat.mtimeNs,
			stat.ctimeNs
		].join(":");
		changedTarget = (target, reason) => err(new AnalysisArtifactChangedError("inspect_signature", target.path, reason));
		signatureReadFailure = (target, cause) => {
			if (cause instanceof RegularFileOperationCancelled) return new AnalysisCancelledError("inspect_signature", { cause: cause.reason });
			if (cause instanceof AnalysisError) return cause;
			const code = cause instanceof Error && "code" in cause ? cause.code : undefined;
			if (code === "EACCES" || code === "EPERM") return new AnalysisAccessDeniedError("inspect_signature", target.path, code, { cause });
			if (code === "ENOENT" || code === "ENOTDIR" || code === "ELOOP") return new AnalysisArtifactChangedError("inspect_signature", target.path, `Registered signature target is no longer readable (${code}): ${target.path}`, { cause });
			return new ProviderAdapterError(NATIVE_MACOS_PROVIDER_IDENTITY.id, "inspect_signature", {
				cause,
				diagnostics: {
					path: target.path,
					phase: "target-version-binding",
					system_code: typeof code === "string" ? code : null,
					reason: cause instanceof Error ? cause.message : String(cause)
				}
			});
		};
		withSignatureTarget = async (target, resources, inspect, signal, createRoot = () => PrivateRuntimeRoot.create({ prefix: "rea-signature-" })) => {
			try {
				return await resources.run(async () => {
					let root;
					try {
						assertRegularFileActive(signal);
						root = await createRoot();
					} catch (cause) {
						return err(cause instanceof RegularFileOperationCancelled ? signatureReadFailure(target, cause) : snapshotFailure(target, "create", cause));
					}
					const owner = {
						kind: "lease",
						lease: new AnalysisCleanupLease(() => root.close(), [root.path]),
						resource: root.path
					};
					let result;
					try {
						const binding = await bindSignatureTarget(target, join(root.path, basename(target.path)), resources, signal);
						if (!binding.ok) result = binding;
						else {
							try {
								result = await inspect(binding.value);
							} catch (cause) {
								result = err(new AnalysisOutputError("inspect_signature", "Native output parsing failed", { cause }));
							}
						}
					} catch (cause) {
						result = err(signatureReadFailure(target, cause));
					}
					const cleanup = await resources.release(owner);
					if (result.ok && signal?.aborted) result = err(new AnalysisCancelledError("inspect_signature", {
						cause: signal.reason,
						partialObservation: result.value
					}));
					if (cleanup.kind === "failed") {
						const failure = signatureCleanupFailure(target, [root.path], cleanup.cause, "cleanup");
						new AnalysisCleanupLeaseGroup(failure, [owner.lease]);
						return combineCleanupFailure(result, failure);
					}
					return result;
				});
			} catch (cause) {
				const retained = cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined ? cause.cleanup : undefined;
				if (retained !== undefined) return combineCleanupFailure(err(signatureReadFailure(target, cause)), signatureCleanupFailure(target, retained.resources, cause, "retry"));
				return err(signatureReadFailure(target, cause));
			}
		};
		combineCleanupFailure = (primary, cleanup) => primary.ok ? err(cleanup) : err(analysisErrorWithCleanupFailure(primary.error, cleanup, "inspect_signature").bindCleanupDependencies([primary.error, cleanup]));
		signatureCleanupFailure = (target, resources, cause, phase) => {
			const failure = new ProviderCleanupError(NATIVE_MACOS_PROVIDER_IDENTITY.id, resources, {
				reason: cause instanceof Error ? cause.message : String(cause),
				phase: `signature-snapshot-${phase}`,
				path: target.path
			}, {
				operation: "inspect_signature",
				cause
			});
			bindArtifactFileCleanup(cause, failure);
			return failure;
		};
		snapshotFailure = (target, phase, cause) => new ProviderAdapterError(NATIVE_MACOS_PROVIDER_IDENTITY.id, "inspect_signature", {
			cause,
			diagnostics: {
				path: target.path,
				phase: `signature-snapshot-${phase}`,
				reason: cause instanceof Error ? cause.message : String(cause)
			}
		});
		snapshotIO = async (target, phase, operation) => {
			try {
				return await operation();
			} catch (cause) {
				throw snapshotFailure(target, phase, cause);
			}
		};
		copySignatureBytes = async (target, source, snapshot, signal) => {
			const size = Number(source.stat.size);
			if (!Number.isSafeInteger(size)) throw new AnalysisResourceConstraintError("inspect_signature", "file-size", `Signature target size is not exactly representable: ${target.path}`, null);
			const hash = createHash("sha256");
			const chunk = Buffer.alloc(64 * 1024);
			let position = 0;
			while (position < size) {
				assertRegularFileActive(signal);
				const { bytesRead } = await source.file.read(chunk, 0, Math.min(chunk.length, size - position), position);
				assertRegularFileActive(signal);
				if (bytesRead === 0) throw new AnalysisArtifactChangedError("inspect_signature", target.path, `Signature target was truncated while hashing: ${target.path}`);
				const bytes = chunk.subarray(0, bytesRead);
				hash.update(bytes);
				await snapshotIO(target, "write", () => snapshot.writeFile(bytes));
				position += bytesRead;
			}
			return hash.digest("hex");
		};
		bindSignatureTarget = async (target, snapshotPath, resources, signal) => {
			let sourceOwner;
			let snapshotOwner;
			const perform = async () => {
				try {
					assertRegularFileActive(signal);
					const before = await lstat(target.path, { bigint: true });
					assertRegularFileActive(signal);
					if (!before.isFile() || before.isSymbolicLink()) return changedTarget(target, `Signature target is no longer a regular file: ${target.path}`);
					const file = await open(target.path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
					const sourceHandle = new OwnedFileHandle(file);
					sourceOwner = {
						kind: "lease",
						resource: target.path,
						lease: new AnalysisCleanupLease(() => sourceHandle.close(), [target.path])
					};
					const opened = await file.stat({ bigint: true });
					assertRegularFileActive(signal);
					if (identity(opened) !== identity(before)) return changedTarget(target, `Signature target changed before open: ${target.path}`);
					const snapshot = await snapshotIO(target, "create-file", () => open(snapshotPath, "wx", 384));
					const snapshotHandle = new OwnedFileHandle(snapshot);
					snapshotOwner = {
						kind: "lease",
						resource: snapshotPath,
						lease: new AnalysisCleanupLease(() => snapshotHandle.close(), [snapshotPath])
					};
					const observed = await copySignatureBytes(target, {
						file,
						stat: opened
					}, snapshot, signal);
					if (observed !== target.sha256) return changedTarget(target, `Signature target digest changed: ${target.path}; expected ${target.sha256}, observed ${observed}`);
					const after = await file.stat({ bigint: true });
					const current = await lstat(target.path, { bigint: true });
					assertRegularFileActive(signal);
					if (identity(after) !== identity(opened) || identity(current) !== identity(opened)) return changedTarget(target, `Signature target changed while establishing its version: ${target.path}`);
					await snapshotIO(target, "seal", () => snapshot.chmod(256));
					return ok({
						identity: identity(opened),
						snapshotPath
					});
				} catch (cause) {
					return err(signatureReadFailure(target, cause));
				}
			};
			let result = await perform();
			const cleanupFailures = [];
			for (const owner of [snapshotOwner, sourceOwner]) {
				if (owner === undefined) continue;
				const cleanup = await resources.release(owner);
				if (cleanup.kind === "failed") cleanupFailures.push({
					owner,
					cause: cleanup.cause
				});
			}
			if (result.ok && signal?.aborted) result = err(new AnalysisCancelledError("inspect_signature", {
				cause: signal.reason,
				diagnostics: { snapshot_binding: {
					identity: result.value.identity,
					snapshot_path: result.value.snapshotPath
				} }
			}));
			if (cleanupFailures.length > 0) {
				const cause = new AggregateError(cleanupFailures.map(({ cause: failure }) => failure), "Signature snapshot file handles could not be closed");
				const cleanup = signatureCleanupFailure(target, cleanupFailures.map(({ owner }) => owner.resource), cause, "close");
				new AnalysisCleanupLeaseGroup(cleanup, cleanupFailures.map(({ owner }) => owner.lease));
				result = combineCleanupFailure(result, cleanup);
			}
			return result;
		};
		verifySignatureTarget = async (target, binding, signal) => {
			try {
				assertRegularFileActive(signal);
				const current = await lstat(target.path, { bigint: true });
				assertRegularFileActive(signal);
				return current.isFile() && identity(current) === binding.identity ? ok(undefined) : changedTarget(target, `Signature target changed during inspection: ${target.path}`);
			} catch (cause) {
				return err(signatureReadFailure(target, cause));
			}
		};
	})))();
}

//#endregion
//#region dist/native/parsers/codesign.js
var parseCodeSignature, splitEchoedValues, nullableCodeSignValue, splitAlgorithms, parseRuntime;
function init_codesign() {
	return (init_codesign = __esmMin((() => {
		init_nativeInspection();
		parseCodeSignature = (output, unsigned, executablePaths = []) => {
			const { identifier, fields } = splitEchoedValues(output, executablePaths);
			const values = new Map();
			const authorities = [];
			const cdhashes = [];
			for (const line of fields.split(/\r?\n/u)) {
				if (line.startsWith("CodeDirectory ")) {
					values.set("CodeDirectory", line.slice("CodeDirectory ".length));
					continue;
				}
				const separator = line.indexOf("=");
				if (separator < 1) continue;
				const key = line.slice(0, separator).trim();
				const value = line.slice(separator + 1).trim();
				if (key === "Authority") authorities.push(value);
				else if (key === "CDHash") cdhashes.push(value);
				else values.set(key, value);
			}
			const parsed = inspectSignatureSchema.omit({ provenance: true }).parse({
				signed: !unsigned,
				identifier: identifier ?? null,
				team_identifier: nullableCodeSignValue(values.get("TeamIdentifier")),
				format: values.get("Format") ?? null,
				cdhashes,
				hash_algorithms: splitAlgorithms(values.get("Hash choices")),
				authorities,
				designated_requirement: values.get("designated") ?? null,
				entitlements: null,
				timestamp: values.get("Timestamp") ?? null,
				hardened_runtime: parseRuntime(values.get("CodeDirectory")),
				limitations: unsigned ? ["Artifact is not signed."] : ["Entitlements and designated requirements require separate bounded commands."]
			});
			return parsed;
		};
		splitEchoedValues = (text, executablePaths) => {
			let rest = text;
			let newline;
			for (const path of executablePaths) {
				const prefix = `Executable=${path}`;
				if (!text.startsWith(prefix)) continue;
				const separator = /^\r?\n/u.exec(text.slice(prefix.length))?.[0];
				if (separator === undefined) continue;
				newline = separator;
				rest = text.slice(prefix.length + separator.length);
				break;
			}
			if (rest === text && text.startsWith("Executable=")) {
				const identifierLine = text.indexOf("\nIdentifier=");
				rest = identifierLine < 0 ? text : text.slice(identifierLine + 1);
			}
			if (!rest.startsWith("Identifier=")) return {
				identifier: undefined,
				fields: rest
			};
			const format = rest.lastIndexOf("\nFormat=");
			if (newline === undefined && format >= 0) newline = /\r?\n/u.exec(rest.slice(format + 1))?.[0];
			const boundary = format >= 0 ? format : rest.indexOf("\n");
			const crlf = newline === undefined || newline === "\r\n";
			const end = boundary < 0 ? rest.length : boundary - (crlf && rest[boundary - 1] === "\r" ? 1 : 0);
			return {
				identifier: rest.slice("Identifier=".length, end),
				fields: rest.slice(end)
			};
		};
		nullableCodeSignValue = (value) => value === undefined || value === "not set" ? null : value;
		splitAlgorithms = (value) => value === undefined ? [] : value.split(/[,+\s]+/u).map((part) => part.trim()).filter((part) => part.length > 0);
		parseRuntime = (value) => {
			if (value === undefined) return null;
			const flags = /(?:^|\s)flags=[^(]*\(([^)]*)\)/u.exec(value)?.[1];
			if (flags === undefined) return null;
			return flags.split(",").some((flag) => flag.trim() === "runtime");
		};
	})))();
}

//#endregion
//#region dist/native/parsers/demangle.js
var linkageName, undecodedSpelling, parseDemangledSymbols;
function init_demangle() {
	return (init_demangle = __esmMin((() => {
		init_swiftSymbolClassification();
		linkageName = (input) => input.startsWith("__") ? input.slice(1) : input;
		undecodedSpelling = (input) => /^[Sse]/u.test(input) ? `$${input}` : linkageName(input);
		parseDemangledSymbols = (inputs, output) => {
			if (inputs.length === 0) {
				if (output === "" || output === "\n") return [];
				throw new TypeError("swift-demangle emitted output for an empty input");
			}
			const lines = output.replace(/\n$/u, "").split("\n");
			if (lines.length !== inputs.length) throw new TypeError("swift-demangle output count does not match input");
			return inputs.map((input, index) => {
				const value = lines[index];
				if (value === undefined) throw new TypeError("swift-demangle omitted an output line");
				const decoded = value !== input && value !== undecodedSpelling(input);
				return {
					input,
					output: value,
					status: decoded ? "demangled" : isSwiftMangledSymbolName(linkageName(input)) ? "invalid" : "unchanged"
				};
			});
		};
	})))();
}

//#endregion
//#region dist/native/parsers/plist.js
var plistObject, INTEGRAL_LITERAL, decodePlistJson, plistJsonNeedsNumberTypes, parsePlistJson, parsePlistXml, prototypeKeyLimitations, negativeZeroLimitations, numberLimitations, mapJsonNumbers, projectPlistBundle;
function init_plist() {
	return (init_plist = __esmMin((() => {
		init_analysisErrorCore();
		init_plistValue();
		init_propertyListKeys();
		init_result();
		init_plistNumbers();
		plistObject = z.record(z.string(), z.unknown());
		INTEGRAL_LITERAL = /^-?\d+$/u;
		decodePlistJson = (output, unsafe, negativeZero = (item) => item) => {
			const text = output.replace(/^\uFEFF/u, "");
			return JSON.parse(text, (_key, item, context) => {
				if (typeof item === "number" && Object.is(item, -0)) return negativeZero(item);
				const source = context?.source;
				return typeof item !== "number" || Number.isSafeInteger(item) || source === undefined || !INTEGRAL_LITERAL.test(source) ? item : unsafe(item, source);
			});
		};
		plistJsonNeedsNumberTypes = (output) => {
			let found = false;
			try {
				decodePlistJson(output, (item) => {
					found = true;
					return item;
				});
			} catch {}
			return found;
		};
		parsePlistJson = (output, xmlConversion) => {
			let literals;
			let exactIntegerCount = 0;
			let ambiguousNumberCount = 0;
			let negativeZeroRealCount = 0;
			const signedZero = () => {
				negativeZeroRealCount += 1;
				return negativeZeroReal();
			};
			const classify = (item, digits) => {
				const exact = BigInt(digits).toString();
				const integer = literals?.incomplete === false && literals.integers.get(item)?.has(exact) === true;
				const real = literals?.incomplete === false && literals.reals.has(item);
				if (integer && !real) {
					exactIntegerCount += 1;
					return {
						$plist_type: "integer",
						decimal: digits
					};
				}
				if (real && !integer) return item;
				ambiguousNumberCount += 1;
				return item;
			};
			let decoded;
			try {
				literals = xmlConversion === undefined ? undefined : parseXmlPropertyList(xmlConversion).numberLiterals;
				decoded = omitPrototypeKeys(decodePlistJson(output, classify, signedZero));
			} catch (cause) {
				return err(new AnalysisOutputError("inspect_plist", cause instanceof Error ? cause.message : String(cause), { cause }));
			}
			const { value } = decoded;
			return ok({
				value,
				bundle: projectPlistBundle(value),
				limitations: [
					...negativeZeroLimitations(negativeZeroRealCount),
					...literals?.incomplete === true ? [incompletePlistNumberLimitation] : [],
					...numberLimitations(exactIntegerCount, ambiguousNumberCount),
					...prototypeKeyLimitations(decoded.omittedPrototypeKeys)
				]
			});
		};
		parsePlistXml = (output) => {
			let projected;
			let omittedPrototypeKeys;
			let literals;
			try {
				const decoded = parseXmlPropertyList(output);
				omittedPrototypeKeys = decoded.omittedPrototypeKeys;
				literals = decoded.numberLiterals;
				projected = projectPlistValue(decoded.value);
			} catch (cause) {
				return err(new AnalysisOutputError("inspect_plist", "plutil XML conversion was not a readable plist", { cause }));
			}
			let exactIntegerCount = 0;
			let ambiguousNumberCount = 0;
			const value = mapJsonNumbers(projected.value, (item) => {
				const decimals = literals.integers.get(item);
				if (decimals === undefined) return item;
				const [decimal] = decimals;
				if (literals.incomplete || decimals.size !== 1 || decimal === undefined || literals.reals.has(item)) {
					ambiguousNumberCount += 1;
					return item;
				}
				exactIntegerCount += 1;
				return {
					$plist_type: "integer",
					decimal
				};
			});
			return ok({
				value,
				bundle: projectPlistBundle(value),
				limitations: [
					"plutil cannot express this plist as JSON, so it was decoded from plutil's XML conversion; data and date values are typed objects such as { \"$plist_type\": \"data\", \"base64\": ... }.",
					...projected.nonFiniteRealCount === 0 ? [] : [nonFiniteRealLimitation(projected.nonFiniteRealCount)],
					...projected.unknownRealCount === 0 ? [] : [unknownRealLimitation(projected.unknownRealCount)],
					...negativeZeroLimitations(projected.negativeZeroRealCount),
					...projected.unknownDateCount === 0 ? [] : [unknownDateLimitation(projected.unknownDateCount)],
					...literals.incomplete ? [incompletePlistNumberLimitation] : [],
					...numberLimitations(exactIntegerCount, ambiguousNumberCount),
					...prototypeKeyLimitations(omittedPrototypeKeys)
				]
			});
		};
		prototypeKeyLimitations = (count) => count === 0 ? [] : [omittedPrototypeKeysLimitation(count)];
		negativeZeroLimitations = (count) => count === 0 ? [] : [negativeZeroRealLimitation(count)];
		numberLimitations = (exactIntegerCount, ambiguousNumberCount) => [...exactIntegerCount === 0 ? [] : [`${String(exactIntegerCount)} integer value(s) exceed the exact range of a JSON number and are reported as { "$plist_type": "integer", "decimal": "<exact digits>" }.`], ...ambiguousNumberCount === 0 ? [] : [`${String(ambiguousNumberCount)} number(s) beyond the exact range of a JSON number are reported as decoded because the XML literal they came from, a rounded <integer> or a <real>, cannot be identified.`]];
		mapJsonNumbers = (value, map) => {
			if (typeof value === "number") return map(value);
			if (Array.isArray(value)) return value.map((item) => mapJsonNumbers(item, map));
			if (value !== null && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, mapJsonNumbers(item, map)]));
			return value;
		};
		projectPlistBundle = (value) => {
			const object = plistObject.safeParse(value);
			const field = (name) => {
				if (!object.success) return null;
				const candidate = object.data[name];
				return typeof candidate === "string" ? candidate : null;
			};
			return {
				identifier: field("CFBundleIdentifier"),
				executable: field("CFBundleExecutable"),
				name: field("CFBundleName"),
				version: field("CFBundleVersion"),
				short_version: field("CFBundleShortVersionString")
			};
		};
	})))();
}

//#endregion
//#region dist/native/parsers/dyldInfo.js
var parseDyldSymbols, canonicalHex, parseReexportRow, reexportSuffix;
function init_dyldInfo() {
	return (init_dyldInfo = __esmMin((() => {
		parseDyldSymbols = (output, mode, imageBase = null, knownExportNames = new Set()) => {
			const offsets = /^\s*offset\s+symbol\s*$/mu.test(output);
			return output.split(/\r?\n/u).flatMap((rawLine) => {
				const line = rawLine.trim();
				if (mode === "imports") {
					const imported = /^(?:0x[\da-f]+\s+)?(.+?)(?:\s+\[([^\]]+)\])?\s+\(from (.+)\)$/iu.exec(line);
					if (imported?.[1] !== undefined) return [{
						name: imported[1],
						address: null,
						weak: /\bweak-import\b/u.test(imported[2] ?? "") ? true : null,
						reexport: null,
						source: imported[3] ?? null
					}];
					return [];
				}
				const reexport = parseReexportRow(line, knownExportNames);
				if (reexport !== null) return [{
					name: reexport.name,
					address: null,
					weak: null,
					reexport: true,
					source: reexport.source,
					...reexport.sourceSymbol === undefined ? {} : { sourceSymbol: reexport.sourceSymbol }
				}];
				const exported = /^(0x[\da-f]+)\s+(.+?)(?:\s+\[([^\]]+)\])?$/iu.exec(line);
				if (exported?.[1] === undefined || exported[2] === undefined) return [];
				const rawName = /^0x[\da-f]+\s+(.+)$/iu.exec(line)?.[1];
				const literalName = rawName !== undefined && knownExportNames.has(rawName);
				if (literalName && exported[3] !== undefined && knownExportNames.has(exported[2])) return [];
				const annotation = literalName ? undefined : exported[3];
				const absolute = /\babsolute\b/u.test(annotation ?? "");
				const address = offsets && !absolute ? imageBase === null ? null : `0x${(BigInt(imageBase) + BigInt(exported[1])).toString(16)}` : canonicalHex(exported[1]);
				return [{
					name: literalName ? rawName : exported[2],
					address,
					weak: /\bweak-def\b/u.test(annotation ?? "") ? true : null,
					reexport: false,
					source: null
				}];
			});
		};
		canonicalHex = (value) => value === undefined ? null : `0x${BigInt(value).toString(16)}`;
		parseReexportRow = (line, knownNames) => {
			const prefix = /^\[re-export\]\s+/u.exec(line);
			if (prefix === null) return null;
			const rest = line.slice(prefix[0].length);
			if (rest.length === 0) return null;
			if (!rest.endsWith(")")) return {
				name: rest,
				source: null
			};
			const candidates = [];
			for (const match of rest.matchAll(/\s+\(/gu)) {
				const name = rest.slice(0, match.index);
				if (!knownNames.has(name)) continue;
				const parsed = reexportSuffix(name, rest.slice(match.index + match[0].length, -1));
				if (parsed !== null) candidates.push(parsed);
			}
			if (candidates.length > 0) return candidates.length === 1 ? candidates[0] : null;
			if (knownNames.has(rest)) return {
				name: rest,
				source: null
			};
			let depth = 0;
			for (let index = rest.length - 1; index >= 0; index--) {
				if (rest[index] === ")") depth++;
				else if (rest[index] === "(" && --depth === 0) {
					if (index === 0 || !/\s/u.test(rest[index - 1])) break;
					const name = rest.slice(0, index).trimEnd();
					return reexportSuffix(name, rest.slice(index + 1, -1)) ?? {
						name: rest,
						source: null
					};
				}
			}
			return {
				name: rest,
				source: null
			};
		};
		reexportSuffix = (name, inner) => {
			if (name.length === 0) return null;
			if (inner.startsWith("from ") && inner.length > 5) return {
				name,
				source: inner.slice(5)
			};
			const separator = /\s+from /u.exec(inner);
			if (separator === null) return null;
			const sourceSymbol = inner.slice(0, separator.index);
			const source = inner.slice(separator.index + separator[0].length);
			return sourceSymbol.length > 0 && source.length > 0 ? {
				name,
				source,
				sourceSymbol
			} : null;
		};
	})))();
}

//#endregion
//#region dist/native/parsers/echoedPath.js
var withoutEchoedPathHeader;
function init_echoedPath() {
	return (init_echoedPath = __esmMin((() => {
		withoutEchoedPathHeader = (output, path) => {
			if (path === undefined || !output.startsWith(path)) return output;
			const header = /^(?: \(architecture [^)\n]*\)| \[[^\]\n]*\])?:\r?\n/u.exec(output.slice(path.length));
			return header === null ? output : output.slice(path.length + header[0].length);
		};
	})))();
}

//#endregion
//#region dist/native/parsers/otool.js
var DYLIB_COMMANDS, DYLIB_FIELDS, DYLIB_ENCODING_FIELDS, EMPTY_VALUE_FIELDS, BUILD_PLATFORM_NAMES, BUILD_TOOL_NAMES, buildCodeName, normalizeLineEndings, parseOtoolLoadCommands, WORD_SIZES, cpuEndian, parseHeader, headerValue, validateLoadCommandFraming, createLoadCommandState, parseLoadCommand, validateDylibCommandLines, validateLinkerOptionLines, scalarFields, collectUuid, collectEntrypoint, collectBuild, collectDependency, collectSegment, parseFields, TEXT_FIELDS, parseField, requireUniqueField, parseSegment, parseSections, parseBuildTools, permissions, NUMERIC_PATTERN, numeric, machoName, stringField, numberField, hexField, stripOffsetSuffix, sectionAlignment;
function init_otool() {
	return (init_otool = __esmMin((() => {
		DYLIB_COMMANDS = new Set([
			"LC_ID_DYLIB",
			"LC_LOAD_DYLIB",
			"LC_LOAD_WEAK_DYLIB",
			"LC_REEXPORT_DYLIB",
			"LC_LAZY_LOAD_DYLIB",
			"LC_LOAD_UPWARD_DYLIB"
		]);
		DYLIB_FIELDS = [
			"cmd",
			"cmdsize",
			"name",
			"current version",
			"compatibility version"
		];
		DYLIB_ENCODING_FIELDS = ["time stamp", "options"];
		EMPTY_VALUE_FIELDS = new Set([
			"options",
			"segname",
			"sectname"
		]);
		BUILD_PLATFORM_NAMES = new Map([
			["1", "MACOS"],
			["2", "IOS"],
			["3", "TVOS"],
			["4", "WATCHOS"],
			["5", "BRIDGEOS"],
			["6", "MACCATALYST"],
			["7", "IOSSIMULATOR"],
			["8", "TVOSSIMULATOR"],
			["9", "WATCHOSSIMULATOR"],
			["10", "DRIVERKIT"],
			["11", "VISIONOS"],
			["12", "VISIONOSSIMULATOR"],
			["13", "FIRMWARE"],
			["14", "SEPOS"],
			["15", "MACOS_EXCLAVECORE"],
			["16", "MACOS_EXCLAVEKIT"],
			["17", "IOS_EXCLAVECORE"],
			["18", "IOS_EXCLAVEKIT"],
			["19", "TVOS_EXCLAVECORE"],
			["20", "TVOS_EXCLAVEKIT"],
			["21", "WATCHOS_EXCLAVECORE"],
			["22", "WATCHOS_EXCLAVEKIT"],
			["23", "VISIONOS_EXCLAVECORE"],
			["24", "VISIONOS_EXCLAVEKIT"]
		]);
		BUILD_TOOL_NAMES = new Map([
			["1", "CLANG"],
			["2", "SWIFT"],
			["3", "LD"],
			["4", "LLD"],
			["1024", "METAL"],
			["1025", "AIRLLD"],
			["1026", "AIRNT"],
			["1027", "AIRNT_PLUGIN"],
			["1028", "AIRPACK"],
			["1031", "GPUARCHIVER"],
			["1032", "METAL_FRAMEWORK"]
		]);
		buildCodeName = (names, value) => value === null ? null : names.get(value) ?? value;
		normalizeLineEndings = (output) => output.replaceAll("\r\n", "\n");
		parseOtoolLoadCommands = (raw) => {
			const output = normalizeLineEndings(raw);
			const header = parseHeader(output);
			if (header === undefined) throw new TypeError("otool output is missing the Mach header");
			const state = createLoadCommandState(header.flags);
			for (const block of output.split(/(?=^Load command \d+$)/mu)) parseLoadCommand(block, state);
			validateLoadCommandFraming(header, state.commands);
			return {
				wordSize: WORD_SIZES.get(header.magic ?? "") ?? null,
				endian: header.cpuType === null ? null : cpuEndian(header.cpuType),
				fileType: header.fileType,
				flags: [...state.flags].sort(),
				uuid: state.uuid,
				commands: state.commands,
				segments: state.segments,
				dependencies: state.dependencies,
				entrypoints: state.entrypoints,
				builds: state.builds
			};
		};
		WORD_SIZES = new Map([
			["0xfeedface", 32],
			["0xfeedfacf", 64],
			["MH_MAGIC", 32],
			["MH_MAGIC_64", 64]
		]);
		cpuEndian = (cpuType) => {
			const family = cpuType & 16777215;
			if (family === 7 || family === 12) return "little";
			return family === 18 ? "big" : null;
		};
		parseHeader = (output) => {
			const lines = output.split(/\r?\n/u).map((line) => line.trim());
			const columnsLine = lines.findIndex((line) => /(?:^|\s)magic\s/u.test(line));
			if (columnsLine < 0) return undefined;
			const columns = lines[columnsLine]?.split(/\s+/u);
			const dataLine = lines.slice(columnsLine + 1).find((line) => line.length > 0);
			const values = dataLine?.split(/\s+/u);
			if (columns === undefined || values === undefined) return undefined;
			const commandCount = headerValue(columns, values, "ncmds");
			const commandBytes = headerValue(columns, values, "sizeofcmds");
			if (commandCount === null || commandBytes === null) throw new TypeError("otool Mach header is missing valid command framing");
			const fileTypeIndex = columns.indexOf("filetype");
			const flagsIndex = columns.indexOf("flags");
			const complete = values.length >= columns.length;
			const fileTypeValueIndex = flagsIndex >= 0 && fileTypeIndex > flagsIndex ? values.length - (columns.length - fileTypeIndex) : fileTypeIndex;
			const flagsEnd = flagsIndex >= 0 ? values.length - (columns.length - flagsIndex - 1) : 0;
			const magicIndex = columns.indexOf("magic");
			return {
				magic: magicIndex < 0 ? null : values[magicIndex] ?? null,
				cpuType: headerValue(columns, values, "cputype"),
				commandCount,
				commandBytes,
				fileType: complete && fileTypeValueIndex >= 0 && fileTypeValueIndex < values.length ? values[fileTypeValueIndex] ?? null : null,
				flags: !complete || flagsIndex < 0 || flagsIndex >= flagsEnd ? [] : values.slice(flagsIndex, flagsEnd).filter((value) => value.length > 0)
			};
		};
		headerValue = (columns, values, name) => {
			const index = columns.indexOf(name);
			if (index < 0) return null;
			const flagsIndex = columns.indexOf("flags");
			const valueIndex = flagsIndex >= 0 && index > flagsIndex ? values.length - (columns.length - index) : index;
			const value = values[valueIndex];
			return value === undefined ? null : numeric(value);
		};
		validateLoadCommandFraming = (header, commands) => {
			if (commands.length !== header.commandCount) throw new TypeError("otool load-command count does not match the Mach header");
			let totalBytes = 0;
			for (const [expectedIndex, command] of commands.entries()) {
				const size = numberField(command.fields, "cmdsize");
				if (command.index !== expectedIndex || size === null || size < 8) throw new TypeError("otool load-command sequence or size is invalid");
				totalBytes += size;
				if (!Number.isSafeInteger(totalBytes)) throw new TypeError("otool load-command byte count is unsafe");
			}
			if (totalBytes !== header.commandBytes) throw new TypeError("otool load-command sizes do not match the Mach header");
		};
		createLoadCommandState = (headerFlags) => ({
			commands: [],
			segments: [],
			dependencies: [],
			entrypoints: [],
			builds: [],
			uuid: null,
			flags: new Set(headerFlags ?? [])
		});
		parseLoadCommand = (block, state) => {
			const indexText = /^Load command (\d+)/u.exec(block)?.[1];
			if (indexText === undefined) return;
			const index = Number(indexText);
			if (!Number.isSafeInteger(index)) throw new TypeError("otool load-command index is unsafe");
			const header = block.split(/\n\s*Section\n/u)[0] ?? block;
			const parsed = parseFields(header);
			const fields = parsed.values;
			const kind = stringField(fields, "cmd");
			if (kind === null) throw new TypeError("otool load command is missing cmd");
			for (const key of scalarFields(kind)) requireUniqueField(parsed, key);
			if (DYLIB_COMMANDS.has(kind)) validateDylibCommandLines(parsed);
			if (kind === "LC_LINKER_OPTION") validateLinkerOptionLines(parsed);
			state.commands.push({
				index,
				kind,
				fields
			});
			collectUuid(kind, fields, state);
			collectEntrypoint(kind, fields, state);
			collectBuild(kind, block, fields, state);
			collectDependency(kind, fields, state);
			collectSegment(kind, block, fields, state);
		};
		validateDylibCommandLines = (parsed) => {
			const encodingFields = DYLIB_ENCODING_FIELDS.filter((key) => parsed.rows.some((field) => field?.[0] === key));
			if (encodingFields.length !== 1) throw new TypeError("otool dylib command must contain timestamp or options");
			for (const key of encodingFields) requireUniqueField(parsed, key);
			const allowed = new Set([...DYLIB_FIELDS, ...DYLIB_ENCODING_FIELDS]);
			for (const field of parsed.rows) {
				const key = field?.[0];
				if (key === undefined || !allowed.has(key)) throw new TypeError("otool dylib command contains ambiguous multiline text");
			}
		};
		validateLinkerOptionLines = (parsed) => {
			const count = numberField(parsed.values, "count");
			const labels = parsed.rows.map((field) => field?.[0]).filter((key) => key !== "cmd" && key !== "cmdsize" && key !== "count");
			if (count === null || labels.length !== count || labels.some((key, index) => key !== `string #${String(index + 1)}`)) throw new TypeError("otool linker-option strings do not match count");
		};
		scalarFields = (kind) => {
			const common = ["cmd", "cmdsize"];
			if (DYLIB_COMMANDS.has(kind)) return DYLIB_FIELDS;
			if (kind === "LC_LINKER_OPTION") return [...common, "count"];
			if (kind === "LC_LOAD_DYLINKER" || kind === "LC_ID_DYLINKER") return [...common, "name"];
			if (kind === "LC_UUID") return [...common, "uuid"];
			if (kind === "LC_MAIN") return [...common, "entryoff"];
			if (kind === "LC_BUILD_VERSION") return [
				...common,
				"platform",
				"minos",
				"sdk",
				"ntools"
			];
			if (kind.startsWith("LC_VERSION_MIN_")) return [
				...common,
				"version",
				"sdk"
			];
			if (kind === "LC_SEGMENT" || kind === "LC_SEGMENT_64") return [
				...common,
				"segname",
				"vmaddr",
				"vmsize",
				"fileoff",
				"filesize",
				"maxprot",
				"initprot",
				"nsects",
				"flags"
			];
			return common;
		};
		collectUuid = (kind, fields, state) => {
			if (kind === "LC_UUID") state.uuid = stringField(fields, "uuid") ?? state.uuid;
		};
		collectEntrypoint = (kind, fields, state) => {
			if (kind !== "LC_MAIN") return;
			const entry = numberField(fields, "entryoff");
			if (entry !== null) state.entrypoints.push({ file_offset: entry });
		};
		collectBuild = (kind, block, fields, state) => {
			if (kind === "LC_BUILD_VERSION") {
				const tools = parseBuildTools(block);
				if (numberField(fields, "ntools") !== tools.length) throw new TypeError("otool build-tool count does not match ntools");
				state.builds.push({
					platform: buildCodeName(BUILD_PLATFORM_NAMES, stringField(fields, "platform")),
					minimum_os: stringField(fields, "minos"),
					sdk: stringField(fields, "sdk"),
					tools
				});
				return;
			}
			if (kind.startsWith("LC_VERSION_MIN_")) state.builds.push({
				platform: kind.slice("LC_VERSION_MIN_".length) || null,
				minimum_os: stringField(fields, "version"),
				sdk: stringField(fields, "sdk"),
				tools: []
			});
		};
		collectDependency = (kind, fields, state) => {
			if (!DYLIB_COMMANDS.has(kind) || kind === "LC_ID_DYLIB") return;
			state.dependencies.push({
				path: stripOffsetSuffix(stringField(fields, "name")),
				kind,
				current_version: stringField(fields, "current version"),
				compatibility_version: stringField(fields, "compatibility version")
			});
		};
		collectSegment = (kind, block, fields, state) => {
			if (kind !== "LC_SEGMENT" && kind !== "LC_SEGMENT_64") return;
			const segment = parseSegment(block, fields);
			if (numberField(fields, "nsects") !== segment.sections.length) throw new TypeError("otool segment section count does not match its sections");
			state.segments.push(segment);
		};
		parseFields = (block) => {
			const rows = [];
			for (const rawLine of block.split(/\r?\n/u).slice(1)) if (rawLine.trim().length > 0) rows.push(parseField(rawLine));
			const occurrences = new Map();
			for (const field of rows) if (field !== undefined) occurrences.set(field[0], (occurrences.get(field[0]) ?? 0) + 1);
			const fields = {};
			const ordinals = new Map();
			for (const field of rows) {
				if (field === undefined) continue;
				const [key, value] = field;
				const ordinal = (ordinals.get(key) ?? 0) + 1;
				ordinals.set(key, ordinal);
				const label = (occurrences.get(key) ?? 0) > 1 ? `${key} #${String(ordinal)}` : key;
				fields[label] = TEXT_FIELDS.test(key) ? value : numeric(value) ?? value;
			}
			return {
				values: fields,
				rows
			};
		};
		TEXT_FIELDS = /^(?:segname|sectname|string #\d+)$/u;
		parseField = (rawLine) => {
			const option = /^\s*(string #[1-9]\d*)(?: (.*))?$/u.exec(rawLine);
			if (option?.[1] !== undefined) return [option[1], option[2] ?? ""];
			const line = rawLine.trim();
			const match = /^((?:time stamp)|\S+(?:\s+version)?)(?:\s+(.+))?$/u.exec(line);
			return match?.[1] === undefined ? undefined : [match[1], match[2]?.trim() ?? ""];
		};
		requireUniqueField = (parsed, key) => {
			const matches = parsed.rows.filter((field) => field?.[0] === key);
			const field = matches[0];
			if (matches.length !== 1 || field === undefined) throw new TypeError(`otool field ${key} is missing or repeated`);
			if (field[1] === "" && !EMPTY_VALUE_FIELDS.has(key)) throw new TypeError(`otool field ${key} has no value`);
		};
		parseSegment = (block, fields) => ({
			name: machoName(fields, "segname"),
			vm_address: hexField(fields, "vmaddr"),
			vm_size: numberField(fields, "vmsize"),
			file_offset: numberField(fields, "fileoff"),
			file_size: numberField(fields, "filesize"),
			maximum_permissions: permissions(stringField(fields, "maxprot")),
			initial_permissions: permissions(stringField(fields, "initprot")),
			sections: parseSections(block)
		});
		parseSections = (block) => block.split(/(?=\n\s*Section\n)/u).slice(1).map((sectionBlock) => {
			const parsed = parseFields(`Section${sectionBlock}`);
			const fields = parsed.values;
			for (const key of [
				"sectname",
				"segname",
				"addr",
				"size",
				"offset",
				"align",
				"flags"
			]) requireUniqueField(parsed, key);
			return {
				segment: machoName(fields, "segname"),
				name: machoName(fields, "sectname"),
				address: hexField(fields, "addr"),
				size: numberField(fields, "size"),
				file_offset: numberField(fields, "offset"),
				alignment: sectionAlignment(stringField(fields, "align")),
				flags: (stringField(fields, "flags") ?? "").split(/\s+/u).filter((flag) => flag.length > 0)
			};
		});
		parseBuildTools = (block) => {
			const tools = [];
			const lines = block.split(/\r?\n/u).map((line) => line.trim());
			for (let index = 0; index < lines.length - 1; index += 1) {
				const tool = /^tool\s+(.+)$/u.exec(lines[index] ?? "")?.[1];
				const version = /^version\s+(.+)$/u.exec(lines[index + 1] ?? "")?.[1];
				if (tool !== undefined && version !== undefined) tools.push({
					name: BUILD_TOOL_NAMES.get(tool) ?? tool,
					version
				});
			}
			return tools;
		};
		permissions = (raw) => {
			if (raw === null) return {
				read: null,
				write: null,
				execute: null,
				raw: null
			};
			const numericValue = numeric(raw);
			if (numericValue !== null) return {
				read: (numericValue & 1) !== 0,
				write: (numericValue & 2) !== 0,
				execute: (numericValue & 4) !== 0,
				raw
			};
			if (/^[r-][w-][x-]$/u.test(raw)) return {
				read: raw[0] === "r",
				write: raw[1] === "w",
				execute: raw[2] === "x",
				raw
			};
			return {
				read: null,
				write: null,
				execute: null,
				raw
			};
		};
		NUMERIC_PATTERN = /^(?:0x[a-fA-F0-9]+|\d+)$/u;
		numeric = (value) => {
			if (!NUMERIC_PATTERN.test(value)) return null;
			const parsed = Number.parseInt(value, value.startsWith("0x") ? 16 : 10);
			return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
		};
		machoName = (fields, key) => {
			const name = stringField(fields, key);
			if (name === null) throw new TypeError(`otool field ${key} is missing`);
			return name;
		};
		stringField = (fields, name) => {
			const value = fields[name];
			return typeof value === "string" ? value : value === undefined || value === null ? null : String(value);
		};
		numberField = (fields, name) => {
			const value = fields[name];
			return typeof value === "number" ? value : typeof value === "string" ? numeric(value) : null;
		};
		hexField = (fields, name) => {
			const value = stringField(fields, name);
			if (value === null || !NUMERIC_PATTERN.test(value)) return null;
			return `0x${BigInt(value).toString(16)}`;
		};
		stripOffsetSuffix = (value) => value?.replace(/\s+\(offset\s+\d+\)$/u, "") ?? "unknown";
		sectionAlignment = (raw) => {
			if (raw === null) return null;
			const exponent = numeric(/^2\^(\d+)(?:\s+\(\d+\))?$/u.exec(raw)?.[1] ?? raw);
			return exponent === null || exponent > 52 ? null : 2 ** exponent;
		};
	})))();
}

//#endregion
//#region dist/native/parsers/machoUuid.js
var MACHO_UUID, reconcileMachoUuid, parseDwarfdumpUuid, parseDwarfdumpRows, selectDwarfdumpRow, loadCommandUuid, reconcileObservations;
function init_machoUuid() {
	return (init_machoUuid = __esmMin((() => {
		MACHO_UUID = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/iu;
		reconcileMachoUuid = (commands, dwarfdumpOutput, artifactPath, selectedArchitecture) => reconcileObservations(loadCommandUuid(commands), parseDwarfdumpUuid(dwarfdumpOutput, artifactPath, selectedArchitecture));
		parseDwarfdumpUuid = (output, artifactPath, selectedArchitecture) => {
			const parsed = parseDwarfdumpRows(output, artifactPath);
			return parsed.kind === "invalid" ? parsed : selectDwarfdumpRow(parsed.rows, selectedArchitecture);
		};
		parseDwarfdumpRows = (output, artifactPath) => {
			if (output.trim().length === 0) return {
				kind: "rows",
				rows: []
			};
			const header = /UUID:[ \t]*([^\s]+)[ \t]+\(([^)\r\n]+)\) /uy;
			const rows = [];
			let offset = 0;
			while (offset < output.length) {
				if (output.startsWith("\r\n", offset)) {
					offset += 2;
					continue;
				}
				if (output[offset] === "\n") {
					offset += 1;
					continue;
				}
				header.lastIndex = offset;
				const match = header.exec(output);
				if (match === null) return {
					kind: "invalid",
					reason: "dwarfdump --uuid output contains an unrecognized row"
				};
				const value = match[1] ?? "";
				const architecture = match[2] ?? "";
				offset = header.lastIndex;
				if (!output.startsWith(artifactPath, offset)) return {
					kind: "invalid",
					reason: `dwarfdump --uuid row does not match the selected artifact path (UUID ${JSON.stringify(value)})`
				};
				offset += artifactPath.length;
				if (offset < output.length && output.startsWith("\r\n", offset)) offset += 2;
				else if (output[offset] === "\n") offset += 1;
				else if (offset !== output.length) return {
					kind: "invalid",
					reason: `dwarfdump --uuid returned malformed UUID row ${JSON.stringify(value)}`
				};
				rows.push({
					value,
					architecture
				});
			}
			return {
				kind: "rows",
				rows
			};
		};
		selectDwarfdumpRow = (rows, selectedArchitecture) => {
			if (rows.length === 0) return { kind: "absent" };
			const selectedRows = selectedArchitecture === null ? rows : rows.filter(({ architecture }) => architecture === selectedArchitecture.dwarfdumpName);
			const validRows = selectedRows.filter(({ value }) => MACHO_UUID.test(value));
			const distinctValid = new Set(validRows.map(({ value }) => value.toLowerCase()));
			if (distinctValid.size > 1) return {
				kind: "conflict",
				reason: `dwarfdump --uuid returned conflicting UUIDs for selected architecture ${selectedArchitecture?.name ?? "unknown"}`
			};
			if (selectedRows.length !== 1) return {
				kind: "invalid",
				reason: selectedRows.length > 1 ? `dwarfdump --uuid returned multiple rows for selected architecture ${selectedArchitecture?.name ?? "unknown"}` : `dwarfdump --uuid returned no row for selected architecture ${selectedArchitecture?.name ?? "unknown"}`
			};
			const [row] = selectedRows;
			if (row === undefined) return { kind: "absent" };
			if (!MACHO_UUID.test(row.value)) return {
				kind: "invalid",
				reason: `dwarfdump --uuid returned malformed UUID ${JSON.stringify(row.value)}`
			};
			return {
				kind: "valid",
				value: row.value
			};
		};
		loadCommandUuid = (commands) => {
			const loadCommands = commands.filter(({ kind }) => kind === "LC_UUID");
			if (loadCommands.length === 0) return { kind: "absent" };
			if (loadCommands.length > 1) {
				const observed = loadCommands.map(({ fields }) => fields.uuid).filter((value) => typeof value === "string" && MACHO_UUID.test(value));
				const distinct = new Set(observed.map((value) => value.toLowerCase()));
				return {
					kind: distinct.size > 1 ? "conflict" : "invalid",
					reason: distinct.size > 1 ? `otool returned conflicting LC_UUID values ${observed.map((value) => JSON.stringify(value)).join(" and ")}` : `otool returned ${String(loadCommands.length)} LC_UUID commands`
				};
			}
			const value = loadCommands[0]?.fields.uuid;
			return typeof value === "string" && MACHO_UUID.test(value) ? {
				kind: "valid",
				value
			} : {
				kind: "invalid",
				reason: `otool LC_UUID contains malformed UUID ${JSON.stringify(value ?? null)}`
			};
		};
		reconcileObservations = (loadUuid, dwarfdump) => {
			if (dwarfdump.kind === "valid" && loadUuid.kind === "valid") {
				if (dwarfdump.value.toLowerCase() === loadUuid.value.toLowerCase()) return {
					value: dwarfdump.value,
					limitations: []
				};
				return {
					value: null,
					limitations: [`dwarfdump --uuid (${dwarfdump.value}) conflicts with otool LC_UUID (${loadUuid.value}); the image UUID is unknown.`]
				};
			}
			if (dwarfdump.kind === "valid" && loadUuid.kind === "conflict") return {
				value: null,
				limitations: [loadUuid.reason]
			};
			if (loadUuid.kind === "valid" && dwarfdump.kind === "conflict") return {
				value: null,
				limitations: [dwarfdump.reason]
			};
			if (dwarfdump.kind === "valid") return {
				value: dwarfdump.value,
				limitations: loadUuid.kind === "invalid" ? [`${loadUuid.reason}; using the unambiguous dwarfdump UUID.`] : []
			};
			if (loadUuid.kind === "valid") return {
				value: loadUuid.value,
				limitations: dwarfdump.kind === "invalid" ? [`${dwarfdump.reason}; using the unambiguous otool LC_UUID.`] : []
			};
			return {
				value: null,
				limitations: [...dwarfdump.kind === "invalid" || dwarfdump.kind === "conflict" ? [dwarfdump.reason] : [], ...loadUuid.kind === "invalid" || loadUuid.kind === "conflict" ? [loadUuid.reason] : []]
			};
		};
	})))();
}

//#endregion
//#region dist/native/NativeMachoInspection.js
var DISCOVERY_COMMANDS, SYMBOL_TABLE_EXPORTS, DYLD_INFO_EXPORTS, REQUIRED_SLICE_COMMANDS, OPTIONAL_VTOOL_COMMAND, VTOOL_UNAVAILABLE_LIMITATION, inspectNativeMacho, normalizeMacho, sliceOutput, captureLookup, namesEveryExport, parseNmExports, covered, uniqueSymbols, fileOffsetLocations, architectureLocations, toolArchitectureName, selectedArchitectureArguments, selectArchitecture;
function init_NativeMachoInspection() {
	return (init_NativeMachoInspection = __esmMin((() => {
		init_analysisErrorCore();
		init_nativeInspection();
		init_jsonValue();
		init_result();
		init_MachoArchitectureSelection();
		init_dyldInfo();
		init_lipo();
		init_echoedPath();
		init_otool();
		init_machoUuid();
		init_unicodeCodePointOrder();
		DISCOVERY_COMMANDS = [["lipo", ["-detailed_info"]]];
		SYMBOL_TABLE_EXPORTS = ["nm", ["-gjU", "--no-dyldinfo"]];
		DYLD_INFO_EXPORTS = ["nm", ["-gjU"]];
		REQUIRED_SLICE_COMMANDS = [
			["otool", ["-h", "-l"]],
			SYMBOL_TABLE_EXPORTS,
			["dyld_info", ["-imports"]],
			["dyld_info", ["-exports"]],
			["dwarfdump", ["--uuid"]]
		];
		OPTIONAL_VTOOL_COMMAND = ["vtool", ["-show-build"]];
		VTOOL_UNAVAILABLE_LIMITATION = "vtool is unavailable; build metadata is normalized from otool only.";
		inspectNativeMacho = async (context) => {
			const captures = [];
			for (const [tool, prefix] of DISCOVERY_COMMANDS) {
				const captured = await context.run(tool, [...prefix, context.target.path], context.signal);
				if (!captured.ok) return err(captured.error);
				captures.push(captured.value);
			}
			const lipo = captures.find(({ tool }) => tool === "lipo");
			if (lipo === undefined) throw new TypeError("Missing lipo capture");
			const { format, architectures } = parseLipoOutput(lipo.stdout, context.target.path);
			const selection = selectArchitecture(context.target, architectures);
			if (selection.status === "absent") return err(new AnalysisOutputError("inspect_macho", `lipo did not list ${selection.architecture}; refusing to read another slice`));
			const selectedArchitecture = selection.status === "selected" ? selection.architecture : null;
			const runSliceCommand = ([tool, prefix]) => context.run(tool, [
				...prefix,
				...selectedArchitectureArguments(tool, selectedArchitecture),
				context.target.path
			], context.signal);
			const vtoolSelectsSlice = selectedArchitecture === null || !toolArchitectureName("vtool", selectedArchitecture).includes(".");
			const [required, optional] = await Promise.all([Promise.all(REQUIRED_SLICE_COMMANDS.map(runSliceCommand)), vtoolSelectsSlice ? runSliceCommand(OPTIONAL_VTOOL_COMMAND) : null]);
			for (const captured of required) {
				if (!captured.ok) return err(captured.error);
				captures.push(captured.value);
			}
			const limitations = [];
			if (optional === null) limitations.push(`vtool cannot select the ${selectedArchitecture} slice; build metadata is normalized from otool only.`);
			else if (optional.ok) captures.push(optional.value);
			else if (optional.error._tag === "AnalysisCapabilityUnavailableError") limitations.push(VTOOL_UNAVAILABLE_LIMITATION);
			else return err(optional.error);
			const nmIndex = captures.findIndex(({ tool }) => tool === "nm");
			const dyldExports = captures.filter(({ tool }) => tool === "dyld_info")[1];
			if (nmIndex < 0 || dyldExports === undefined) throw new TypeError("Missing nm or dyld_info export capture");
			if (!namesEveryExport(captures[nmIndex].stdout, dyldExports)) {
				const withDyldInfo = await runSliceCommand(DYLD_INFO_EXPORTS);
				if (!withDyldInfo.ok) return err(withDyldInfo.error);
				captures[nmIndex] = withDyldInfo.value;
			}
			const otool = captures.find(({ tool }) => tool === "otool");
			if (otool === undefined) throw new TypeError("Missing otool capture");
			let load;
			try {
				load = parseOtoolLoadCommands(sliceOutput(otool));
			} catch (cause) {
				return err(new AnalysisOutputError("inspect_macho", "Malformed otool load-command output", {
					cause,
					capturedOutput: {
						stdout: otool.stdout,
						stderr: otool.stderr,
						truncated: false,
						stdout_bytes: otool.stdoutBytes,
						stderr_bytes: otool.stderrBytes,
						exit_code: otool.exitCode,
						signal: otool.signal
					}
				}));
			}
			const selectedArchitectureName = selectedArchitecture ?? (architectures.length === 1 ? architectures[0]?.name ?? null : null);
			const containerOffset = selectedArchitectureName === null ? undefined : format === "thin" ? 0 : architectures.find(({ name }) => name === selectedArchitectureName)?.file_offset ?? undefined;
			const normalized = normalizeMacho(captures, context.invocation, limitations, load, architectures, context.target.path, {
				name: selectedArchitectureName,
				container_file_offset: containerOffset ?? null
			});
			const result = containerOffset === undefined ? inspectMachoSchema.parse({
				...normalized,
				limitations: [...normalized.limitations, selectedArchitectureName === null ? "The selected Mach-O slice is unknown; slice-based evidence locations are unavailable." : "The selected Mach-O slice's container file offset was not observed; slice-based evidence locations are unavailable."]
			}) : normalized;
			return ok({
				result: jsonValueSchema.parse(result),
				limitations: result.limitations,
				locations: fileOffsetLocations(result, containerOffset)
			});
		};
		normalizeMacho = (captures, toInvocation, additionalLimitations, load, architectures, artifactPath, selectedArchitecture) => {
			const byTool = captureLookup(captures);
			const imports = parseDyldSymbols(sliceOutput(byTool("dyld_info", 0)), "imports");
			const imageBase = load.segments.find((segment) => segment.file_offset === 0 && (segment.file_size ?? 0) > 0)?.vm_address ?? null;
			const nmExports = parseNmExports(byTool("nm").stdout);
			const dyldExports = parseDyldSymbols(sliceOutput(byTool("dyld_info", 1)), "exports", imageBase, new Set(nmExports.map(({ name }) => name)));
			const exports = uniqueSymbols([...dyldExports, ...nmExports]);
			const dwarfdump = byTool("dwarfdump");
			const uuid = reconcileMachoUuid(load.commands, dwarfdump.stdout, artifactPath, selectedArchitecture.name === null ? null : {
				name: selectedArchitecture.name,
				dwarfdumpName: toolArchitectureName("dwarfdump", selectedArchitecture.name)
			});
			const provenance = captures.map(toInvocation);
			const threadEntrypoint = load.entrypoints.length === 0 && load.commands.some((command) => command.kind === "LC_UNIXTHREAD" || command.kind === "LC_THREAD");
			const threadEntrypointLimitation = "Thread-state entrypoints (LC_UNIXTHREAD/LC_THREAD) are retained as raw load commands; file offsets are not derived.";
			const limitations = [
				"Imports and exports combine dyld_info and nm; stripped or toolchain-hidden symbols may be absent.",
				...captures.some(({ tool }) => tool === "vtool") ? ["vtool output is retained as provenance but only otool build metadata is normalized."] : [],
				...additionalLimitations,
				...uuid.limitations,
				...threadEntrypoint ? [threadEntrypointLimitation] : [],
				...imageBase === null && /^\s*offset\s+symbol\s*$/mu.test(sliceOutput(byTool("dyld_info", 1))) ? ["Export virtual addresses are unavailable because no file-backed image base was observed."] : []
			];
			return inspectMachoSchema.parse({
				format: "mach-o",
				selected_architecture: selectedArchitecture,
				endian: load.endian,
				word_size: load.wordSize,
				file_type: load.fileType,
				flags: load.flags,
				uuid: uuid.value,
				entrypoints: covered(load.entrypoints, !threadEntrypoint, threadEntrypoint ? [threadEntrypointLimitation] : []),
				architectures: covered(architectures, true),
				build_metadata: covered(load.builds, true),
				load_commands: covered(load.commands, true),
				dependencies: covered(load.dependencies, true),
				imports: covered(imports, false, ["dyld_info textual imports may omit chained or toolchain-unsupported metadata."]),
				exports: covered(exports, false, ["Merged nm/dyld_info results may be incomplete for stripped binaries.", ...dyldExports.some(({ sourceSymbol }) => sourceSymbol !== undefined) ? ["Renamed re-exports are listed under their exported name; the source library's symbol name is not reported."] : []]),
				segments: covered(load.segments.map((segment) => ({
					...segment,
					sections: covered(segment.sections, true)
				})), true),
				provenance,
				limitations
			});
		};
		sliceOutput = (capture) => withoutEchoedPathHeader(capture.stdout, capture.arguments.at(-1));
		captureLookup = (captures) => (tool, occurrence = 0) => {
			const capture = captures.filter((item) => item.tool === tool)[occurrence];
			if (capture === undefined) throw new TypeError(`Missing ${tool} capture`);
			return capture;
		};
		namesEveryExport = (nmOutput, dyldExports) => {
			const names = new Set(parseNmExports(nmOutput).map(({ name }) => name));
			return sliceOutput(dyldExports).split(/\r?\n/u).every((rawLine, index) => {
				const line = rawLine.trim();
				if (line.length === 0 || index === 0 && line.endsWith(":") || /^-?exports:$/u.test(line) || /^offset\s+symbol$/u.test(line)) return true;
				const rows = parseDyldSymbols(line, "exports", null, names);
				if (rows.length === 0) return names.has(/^0x[\da-f]+\s+(.+)$/iu.exec(line)?.[1] ?? "");
				return rows.length === 1 && names.has(rows[0].name);
			});
		};
		parseNmExports = (output) => output.split(/\r?\n/u).filter((name) => name.length > 0).map((name) => ({
			name,
			address: null,
			weak: null,
			reexport: null,
			source: "nm"
		}));
		covered = (items, exhaustive, limitations = []) => ({
			items: [...items],
			total: exhaustive ? items.length : null,
			exhaustive,
			limitations: [...limitations]
		});
		uniqueSymbols = (items) => {
			const unique = new Map();
			for (const item of items) if (!unique.has(item.name)) unique.set(item.name, item);
			return [...unique.values()].sort((left, right) => compareUnicodeCodePoints(left.name, right.name));
		};
		fileOffsetLocations = (macho, containerOffset) => {
			const locations = architectureLocations(macho.architectures.items);
			if (containerOffset === undefined) return locations;
			for (const entrypoint of macho.entrypoints.items) locations.push({
				kind: "file-offset",
				offset: containerOffset + entrypoint.file_offset
			});
			for (const segment of macho.segments.items) {
				if (segment.file_offset === null || segment.file_size === null || segment.file_size === 0) continue;
				locations.push({
					kind: "file-offset-range",
					start: containerOffset + segment.file_offset,
					end: containerOffset + segment.file_offset + segment.file_size
				});
			}
			return locations;
		};
		architectureLocations = (architectures) => {
			const locations = [];
			for (const { file_offset: offset, size } of architectures) {
				if (offset === null) continue;
				locations.push(size === null ? {
					kind: "file-offset",
					offset
				} : {
					kind: "file-offset-range",
					start: offset,
					end: offset + size
				});
			}
			return locations;
		};
		toolArchitectureName = (tool, architecture) => tool === "dyld_info" ? architecture : architecture.replace(/\.v\d+$/u, "");
		selectedArchitectureArguments = (tool, architecture) => {
			if (architecture === null) return [];
			const toolArchitecture = toolArchitectureName(tool, architecture);
			return tool === "dwarfdump" ? [`--arch=${toolArchitecture}`] : ["-arch", toolArchitecture];
		};
		selectArchitecture = (target, available) => {
			if (target.kind !== "executable" || target.availableArchitectures.length < 2 && available.length < 2) return { status: "unfiltered" };
			const normalized = target.architecture === "x86" ? "i386" : target.architecture;
			const policy = MACHO_ARCHITECTURE_POLICIES[target.architecture];
			const selected = policy === undefined ? available.find(({ name }) => name === normalized)?.name : selectMachoArchitectureName(policy, available);
			if (selected !== undefined) return {
				status: "selected",
				architecture: selected
			};
			return {
				status: "absent",
				architecture: normalized
			};
		};
	})))();
}

//#endregion
//#region dist/native/NativeMacOSProvider.js
var NativeMacOSProvider, NativeMacOSClient, nativeCommandCleanupFailure, closeNativeFileScope, nativeOutputFailure, isNativeOperation, translateCommandFailure, translateCodeSignExitFailure, commandOutput, isNonzeroUnsignedObservation, canonicalPath, codeSignCaptureFailure, codeSignArchitectures, invocation, parseEntitlements, plutilDiagnostic;
function init_NativeMacOSProvider() {
	return (init_NativeMacOSProvider = __esmMin((() => {
		init_NativePlistSource();
		init_ArtifactFileOperation();
		init_snapshotEnvironment();
		init_NativeMacOSProviderMetadata();
		init_AppleDispatchMetadata();
		init_NativeUiObservation();
		init_NativeUiCleanupError();
		init_LldbCallTracer();
		init_NativeCallObservation();
		init_AnalysisProvider();
		init_nativeToolContracts();
		init_binaryTargetTypes();
		init_objcSwiftMetadata();
		init_toolContracts();
		init_inputIssueProjection();
		init_analysisErrorCore();
		init_providerAdapterError();
		init_providerCleanupError();
		init_analysisErrorBase();
		init_jsonValue();
		init_plistValue();
		init_plistNumbers();
		init_propertyListKeys();
		init_nativeInspection();
		init_result();
		init_CommandRunner();
		init_SignatureTargetBinding();
		init_codesign();
		init_demangle();
		init_lipo();
		init_plist();
		init_NativeMachoInspection();
		init_analysisErrorCleanup();
		init_ArtifactResourceScope();
		init_ArtifactReader();
		init_NativeUiHelperRuntime();
		NativeMacOSProvider = class {
			runner;
			#capabilities;
			#environment;
			#tracerFactory;
			#privateRuntimeRootFactory;
			constructor(environment, runner = new XcrunCommandRunner(environment), platform = process.platform, tracerFactory, privateRuntimeRootFactory) {
				this.runner = runner;
				this.#environment = snapshotEnvironment(environment, platform);
				this.#tracerFactory = tracerFactory ?? (() => new LldbCallTracer(this.#environment));
				this.#privateRuntimeRootFactory = privateRuntimeRootFactory;
				this.#capabilities = nativeMacOSCapabilities(platform);
			}
			identity() {
				return NATIVE_MACOS_PROVIDER_IDENTITY;
			}
			capabilities() {
				return this.#capabilities;
			}
			createClient(target) {
				return new NativeMacOSClient(target, this.runner, this.#tracerFactory(), this.#environment, this.#privateRuntimeRootFactory);
			}
		};
		NativeMacOSClient = class {
			target;
			runner;
			tracer;
			environment;
			privateRuntimeRootFactory;
			#pendingNativeUiRuntimes = new Set();
			#pendingCommands = new Set();
			#signatureResources = new ArtifactResourceScope();
			#plistResources = new ArtifactResourceScope();
			#callResources = new ArtifactResourceScope();
			#dispatchResources = new ArtifactResourceScope();
			#nativeUiTail = Promise.resolve();
			#closed = false;
			constructor(target, runner, tracer, environment, privateRuntimeRootFactory) {
				this.target = target;
				this.runner = runner;
				this.tracer = tracer;
				this.environment = environment;
				this.privateRuntimeRootFactory = privateRuntimeRootFactory;
			}
			async execute(operation, parameters, options) {
				if (this.#closed) return err(new AnalysisCapabilityUnavailableError(NATIVE_MACOS_PROVIDER_IDENTITY.id, operation, "Native provider client is closed"));
				if (options?.signal?.aborted === true) return err(new AnalysisCancelledError(operation, { cause: options.signal.reason }));
				if (operation === "health") return ok(createAnalysisExecution(null, NATIVE_MACOS_PROVIDER_IDENTITY));
				if (operation === "inspect_native_dispatch_metadata") {
					const input = toolContract(operation).inputSchema.safeParse(parameters);
					if (!input.success) return err(analysisInputErrorFromIssues(operation, input.error.issues, parameters, { cause: input.error }));
					if (!isAppleDispatchMetadataTarget(this.target)) return err(new AnalysisCapabilityUnavailableError(NATIVE_MACOS_PROVIDER_IDENTITY.id, operation, "Binary Apple metadata requires Mach-O; other providers can report symbol-only metadata"));
					try {
						const result = await this.#dispatchResources.run(() => inspectAppleDispatchMetadata(this.target, input.data.max_records, this.#dispatchResources, options?.signal));
						return ok(createAnalysisExecution(result, result.provider, {
							locations: [{
								kind: "artifact-path",
								path: this.target.path
							}],
							limitations: result.result.coverage.flatMap(({ reason }) => reason === null ? [] : [reason])
						}));
					} catch (cause) {
						return err(appleDispatchMetadataFailure(cause, this.target.path));
					}
				}
				if (!isNativeOperation(operation)) return err(new AnalysisCapabilityUnavailableError(NATIVE_MACOS_PROVIDER_IDENTITY.id, operation, "Operation is not implemented by native macOS tools."));
				if (operation === "observe_native_calls") {
					const result = await observeNativeCalls(this.target, parameters, this.tracer, this.#callResources, options?.signal);
					return result.ok ? ok(createAnalysisExecution(result.value, NATIVE_MACOS_PROVIDER_IDENTITY, {
						limitations: result.value.limitations,
						locations: [{
							kind: "artifact-path",
							path: this.target.path
						}]
					})) : result;
				}
				if (operation === "observe_native_ui" || operation === "capture_native_ui_scenario") {
					return this.#observeNativeUi(operation, parameters, options?.signal);
				}
				try {
					const observation = await this.#dispatch(operation, parameters, options?.signal);
					return observation.ok ? ok(createAnalysisExecution(observation.value.result, NATIVE_MACOS_PROVIDER_IDENTITY, {
						limitations: observation.value.limitations,
						locations: observation.value.locations
					})) : err(resolvedAnalysisError(observation.error));
				} catch (cause) {
					return err(nativeOutputFailure(operation, cause));
				}
			}
			async close() {
				this.#closed = true;
				await Promise.allSettled(this.#pendingCommands);
				const uiCleanupFailures = await this.#serializeNativeUi(() => this.#retryNativeUiCleanup());
				const signatureCleanup = await closeNativeFileScope(this.#signatureResources, "signature-snapshot");
				const plistCleanup = await closeNativeFileScope(this.#plistResources, "plist-file");
				const callCleanup = await closeNativeFileScope(this.#callResources, "native-call-target");
				const dispatchCleanup = await closeNativeFileScope(this.#dispatchResources, "native-dispatch-metadata-target");
				const commandCleanup = await this.#retryNativeCommandCleanup();
				let result = await this.tracer.close();
				const cleanupErrors = [
					...uiCleanupFailures.length === 0 ? [] : [this.#nativeUiCleanupFailure(uiCleanupFailures, "close_binary")],
					...commandCleanup === undefined ? [] : [commandCleanup],
					...signatureCleanup === undefined ? [] : [signatureCleanup],
					...plistCleanup === undefined ? [] : [plistCleanup],
					...callCleanup === undefined ? [] : [callCleanup],
					...dispatchCleanup === undefined ? [] : [dispatchCleanup]
				];
				for (const cleanupError of cleanupErrors) result = result.ok ? err(cleanupError) : err(analysisErrorWithCleanupFailure(result.error, cleanupError).bindCleanupDependencies([result.error, cleanupError]));
				return result;
			}
			#observeNativeUi(operation, parameters, signal) {
				return this.#serializeNativeUi(async () => {
					if (this.#closed) return err(new AnalysisCapabilityUnavailableError(NATIVE_MACOS_PROVIDER_IDENTITY.id, operation, "Native provider client is closed"));
					const earlierCleanupFailures = await this.#retryNativeUiCleanup();
					if (earlierCleanupFailures.length > 0) return err(this.#nativeUiCleanupFailure(earlierCleanupFailures, operation));
					const runtime = createNativeUiHelperRuntime(this.environment);
					const observationSignal = signal === undefined ? runtime.signal : AbortSignal.any([signal, runtime.signal]);
					this.#pendingNativeUiRuntimes.add(runtime);
					let result;
					try {
						result = await observeNativeUi(this.target, operation, parameters, {
							environment: this.environment,
							signal: observationSignal,
							runtime
						});
					} catch (cause) {
						result = err(cause instanceof AnalysisError ? cause : new ProviderAdapterError(NATIVE_MACOS_PROVIDER_IDENTITY.id, operation, { cause }));
					}
					try {
						await runtime.close();
						this.#pendingNativeUiRuntimes.delete(runtime);
					} catch (cause) {
						result = finishNativeUiObservation(result, operation, observationSignal);
						const cleanup = this.#nativeUiCleanupFailure([{
							runtime,
							cause
						}], operation, result.ok ? result.value : undefined);
						return err(result.ok ? cleanup : analysisErrorWithCleanupFailure(result.error, cleanup, operation).bindCleanupDependencies([result.error, cleanup]));
					}
					result = finishNativeUiObservation(result, operation, observationSignal);
					return result.ok ? ok(createAnalysisExecution(result.value, NATIVE_MACOS_PROVIDER_IDENTITY, { limitations: result.value.limitations })) : result;
				});
			}
			#serializeNativeUi(operation) {
				const call = this.#nativeUiTail.then(operation, operation);
				this.#nativeUiTail = call.then(() => undefined, () => undefined);
				return call;
			}
			async #retryNativeUiCleanup() {
				const failures = [];
				for (const runtime of this.#pendingNativeUiRuntimes) {
					try {
						await runtime.close();
						this.#pendingNativeUiRuntimes.delete(runtime);
					} catch (cause) {
						failures.push({
							runtime,
							cause
						});
					}
				}
				return failures;
			}
			async #retryNativeCommandCleanup() {
				if (this.runner.retryCleanup === undefined) return undefined;
				try {
					const failures = await this.runner.retryCleanup();
					return failures.length === 0 ? undefined : nativeCommandCleanupFailure(failures);
				} catch (cause) {
					return new ProviderCleanupError(NATIVE_MACOS_PROVIDER_IDENTITY.id, ["native-command-process-cleanup"], { reason: cause instanceof Error ? cause.message || cause.name : String(cause) || "native command cleanup failed unexpectedly" }, { cause });
				}
			}
			#nativeUiCleanupFailure(failures, operation, partialObservation) {
				return new NativeUiCleanupError(failures, operation, partialObservation);
			}
			#dispatch(operation, parameters, signal) {
				switch (operation) {
					case "observe_native_ui":
					case "capture_native_ui_scenario":
					case "observe_native_calls": return Promise.resolve(err(new AnalysisCapabilityUnavailableError(NATIVE_MACOS_PROVIDER_IDENTITY.id, operation, "UI observation uses its explicit authority boundary")));
					case "inspect_macho": return this.#inspectMacho(signal);
					case "inspect_signature": return this.#inspectSignature(signal);
					case "inspect_plist": return this.#inspectPlist(parameters, signal);
					case "list_architectures": return this.#listArchitectures(signal);
					case "demangle_swift": return this.#demangle(parameters, signal);
				}
			}
			async #listArchitectures(signal) {
				if (!isMachOFormat(this.target.format)) return err(new AnalysisCapabilityUnavailableError(NATIVE_MACOS_PROVIDER_IDENTITY.id, "list_architectures", "Active artifact is not Mach-O."));
				const capture = await this.#run("list_architectures", "lipo", ["-detailed_info", this.target.path], { signal });
				if (!capture.ok) return capture;
				const provenance = [invocation(capture.value, this.target.path)];
				const { architectures } = parseLipoOutput(capture.value.stdout, this.target.path);
				const result = listArchitecturesSchema.parse({
					architectures: {
						items: architectures,
						total: architectures.length,
						exhaustive: true,
						limitations: []
					},
					provenance,
					limitations: []
				});
				return ok({
					result: jsonValueSchema.parse(result),
					limitations: [],
					locations: architectureLocations(result.architectures.items)
				});
			}
			async #demangle(parameters, signal) {
				const symbols = z.array(z.string()).safeParse(parameters.symbols);
				if (!symbols.success) return err(new AnalysisOutputError("demangle_swift", "symbols were not parsed strings"));
				const capture = await this.#run("demangle_swift", "swift-demangle", [
					"--compact",
					"--",
					...symbols.data
				], { signal });
				if (!capture.ok) return capture;
				const provenance = [invocation(capture.value, this.target.path)];
				const result = demangleSwiftSchema.parse({
					symbols: parseDemangledSymbols(symbols.data, capture.value.stdout),
					provenance,
					limitations: []
				});
				return ok({
					result: jsonValueSchema.parse(result),
					limitations: [],
					locations: []
				});
			}
			async #inspectSignature(signal) {
				if (this.target.kind !== "executable" || !isMachOFormat(this.target.format)) return err(new AnalysisCapabilityUnavailableError(NATIVE_MACOS_PROVIDER_IDENTITY.id, "inspect_signature", "Active artifact is not Mach-O; its container-level signature layer is not evaluated by codesign."));
				const inspected = await withSignatureTarget(this.target, this.#signatureResources, (binding) => this.#inspectBoundSignature(binding, signal), signal, this.privateRuntimeRootFactory);
				return inspected.ok ? ok({
					result: inspected.value,
					limitations: inspected.value.limitations,
					locations: []
				}) : inspected;
			}
			async #inspectBoundSignature(binding, signal) {
				const display = await this.#captureSignature(binding, ["-d", "--verbose=4"], signal);
				if (!display.ok) return display;
				const unsigned = isNonzeroUnsignedObservation(display.value);
				const displayFailure = codeSignCaptureFailure(display.value);
				if (displayFailure !== null) return err(displayFailure);
				const requirements = await this.#captureSignature(binding, ["-d", "-r-"], signal);
				if (!requirements.ok) return requirements;
				const requirementsFailure = codeSignCaptureFailure(requirements.value);
				if (requirementsFailure !== null) return err(requirementsFailure);
				const entitlements = await this.#captureSignature(binding, [
					"-d",
					"--entitlements",
					":-"
				], signal);
				if (!entitlements.ok) return entitlements;
				const entitlementsFailure = codeSignCaptureFailure(entitlements.value);
				if (entitlementsFailure !== null) return err(entitlementsFailure);
				const parsed = parseCodeSignature(display.value.stderr, unsigned, [binding.snapshotPath, ...await canonicalPath(binding.snapshotPath)]);
				const requirementText = /designated\s*=>\s*(.+)$/mu.exec(requirements.value.stdout)?.[1] ?? null;
				const entitlementValue = parseEntitlements(entitlements.value.stdout);
				const captures = [
					display.value,
					requirements.value,
					entitlements.value
				];
				const limitations = [
					...parsed.limitations,
					...entitlementValue.limitations.map((note) => `Entitlements: ${note}`),
					"Inspected a digest-verified Mach-O byte snapshot; filesystem-bound signing context and trust validation are not examined.",
					...entitlementValue.omittedPrototypeKeys === 0 ? [] : [`Entitlements: ${omittedPrototypeKeysLimitation(entitlementValue.omittedPrototypeKeys)}`]
				];
				const mixedSigning = !unsigned && (isNonzeroUnsignedObservation(requirements.value) || isNonzeroUnsignedObservation(entitlements.value));
				if (mixedSigning) {
					const slices = await this.#inspectMixedSignatureSlices(binding, parsed.format, {
						requirements: requirements.value.exitCode,
						entitlements: entitlements.value.exitCode
					}, signal);
					if (!slices.ok) return slices;
					captures.push(...slices.value.captures);
					limitations.push(...slices.value.limitations);
				}
				const provenance = captures.map((capture) => invocation(capture, binding.snapshotPath));
				const version = await verifySignatureTarget(this.target, binding, signal);
				if (!version.ok) return version;
				const result = inspectSignatureSchema.parse({
					...parsed,
					designated_requirement: requirementText,
					entitlements: entitlementValue.value,
					provenance,
					limitations
				});
				return ok(result);
			}
			async #inspectMixedSignatureSlices(binding, format, aggregateExits, signal) {
				const captures = [];
				const unsigned = [];
				const unclassified = [];
				for (const architecture of codeSignArchitectures(format, this.target)) {
					const slice = await this.#captureSignature(binding, [
						"-d",
						"-a",
						architecture,
						"--verbose=4"
					], signal);
					if (!slice.ok) return slice;
					captures.push(slice.value);
					if (slice.value.exitCode === 0) continue;
					if (isNonzeroUnsignedObservation(slice.value)) unsigned.push(architecture);
					else unclassified.push(architecture);
				}
				const limitations = [unsigned.length > 0 ? `Unsigned Mach-O slices: ${unsigned.join(", ")}.` : "One or more Mach-O slices are unsigned, but their architectures could not be classified."];
				if (unclassified.length > 0) limitations.push(`Signature state could not be classified for Mach-O slices: ${unclassified.join(", ")}.`);
				if (aggregateExits.requirements !== 0) limitations.push("The aggregate designated requirement is unavailable because Mach-O slices have mixed signing states.");
				if (aggregateExits.entitlements !== 0) limitations.push("The aggregate entitlements are unavailable because Mach-O slices have mixed signing states.");
				return ok({
					captures,
					limitations
				});
			}
			async #captureSignature(binding, args, signal) {
				const before = await verifySignatureTarget(this.target, binding, signal);
				if (!before.ok) return before;
				let capture;
				try {
					capture = await this.#run("inspect_signature", "codesign", [...args, binding.snapshotPath], {
						signal,
						acceptNonZero: true
					});
				} catch (cause) {
					capture = err(new ProviderAdapterError(NATIVE_MACOS_PROVIDER_IDENTITY.id, "inspect_signature", {
						cause,
						diagnostics: {
							phase: "codesign-capture",
							path: this.target.path,
							reason: cause instanceof Error ? cause.message : String(cause)
						}
					}));
				}
				const after = await verifySignatureTarget(this.target, binding, signal);
				return after.ok ? capture : after;
			}
			async #inspectPlist(parameters, signal) {
				const requested = parameters.path;
				if (requested !== undefined && typeof requested !== "string") return err(new AnalysisOutputError("inspect_plist", "path was not a string"));
				try {
					return await this.#plistResources.run(async () => {
						try {
							const plist = await resolveNativePlistSelection(this.target, requested);
							if (!plist.ok) return plist;
							const fileInput = {
								selection: plist.value,
								resources: this.#plistResources,
								signal
							};
							const selected = await requireRegularPlist(fileInput);
							if (!selected.ok) return selected;
							const classified = await this.#run("inspect_plist", "file", ["-b", plist.value.path], { signal });
							if (!classified.ok) return classified;
							const json = await this.#run("inspect_plist", "plutil", [
								"-convert",
								"json",
								"-o",
								"-",
								"--",
								plist.value.path
							], {
								signal,
								acceptNonZero: true
							});
							if (!json.ok) return json;
							const jsonDecoded = json.value.exitCode === 0;
							const xml = jsonDecoded && !plistJsonNeedsNumberTypes(json.value.stdout) ? undefined : await this.#run("inspect_plist", "plutil", [
								"-convert",
								"xml1",
								"-o",
								"-",
								"--",
								plist.value.path
							], {
								signal,
								acceptNonZero: !jsonDecoded
							});
							if (xml !== undefined && !xml.ok) return xml;
							if (xml !== undefined && xml.value.exitCode !== 0) {
								const capture = failureCapture(xml.value, false);
								return err(unreadablePlist(plist.value, `plutil could not decode it as a property list (${plutilDiagnostic(capture, plist.value.path)})`, { capturedOutput: {
									stdout: capture.stdout,
									stderr: capture.stderr,
									truncated: capture.truncated,
									stdout_bytes: capture.stdoutBytes,
									stderr_bytes: capture.stderrBytes,
									exit_code: capture.exitCode,
									signal: capture.signal
								} }));
							}
							const parsed = xml === undefined ? parsePlistJson(json.value.stdout) : jsonDecoded ? parsePlistJson(json.value.stdout, xml.value.stdout) : parsePlistXml(xml.value.stdout);
							if (!parsed.ok) return parsed;
							const provenance = [
								classified.value,
								json.value,
								...xml === undefined ? [] : [xml.value]
							].map((item) => invocation(item, plist.value.path, "$PLIST"));
							const converted = xml?.value ?? json.value;
							const format = await plistSourceFormat(classified.value.stdout, {
								...fileInput,
								capturedOutput: {
									stdout: converted.stdout,
									stderr: converted.stderr,
									truncated: false,
									stdout_bytes: converted.stdoutBytes,
									stderr_bytes: converted.stderrBytes,
									exit_code: converted.exitCode,
									signal: converted.signal
								}
							});
							if (!format.ok) return format;
							const result = inspectPlistSchema.parse({
								format: format.value,
								value: parsed.value.value,
								bundle: parsed.value.bundle,
								source_path: plist.value.path,
								provenance,
								limitations: parsed.value.limitations
							});
							return ok({
								result: jsonValueSchema.parse(result),
								limitations: parsed.value.limitations,
								locations: [{
									kind: "artifact-path",
									path: plist.value.path
								}]
							});
						} catch (cause) {
							return err(nativeOutputFailure("inspect_plist", cause));
						}
					});
				} catch (cause) {
					return err(nativePlistFailure(cause, undefined));
				}
			}
			async #inspectMacho(signal) {
				if (!isMachOFormat(this.target.format)) return err(new AnalysisCapabilityUnavailableError(NATIVE_MACOS_PROVIDER_IDENTITY.id, "inspect_macho", "Active artifact is not Mach-O."));
				return inspectNativeMacho({
					target: this.target,
					...signal === undefined ? {} : { signal },
					run: (tool, arguments_, commandSignal) => this.#run("inspect_macho", tool, arguments_, { signal: commandSignal }),
					invocation: (capture) => invocation(capture, this.target.path)
				});
			}
			async #run(operation, tool, arguments_, options = {}) {
				if (this.#closed) return err(new AnalysisCapabilityUnavailableError(NATIVE_MACOS_PROVIDER_IDENTITY.id, operation, "Native provider client is closed"));
				const command = this.runner.run(tool, arguments_, {
					...options.signal === undefined ? {} : { signal: options.signal },
					acceptNonZero: options.acceptNonZero ?? false
				});
				this.#pendingCommands.add(command);
				let captured;
				try {
					captured = await command;
				} finally {
					this.#pendingCommands.delete(command);
				}
				if (captured.ok) return captured;
				return err(translateCommandFailure(operation, captured.error));
			}
		};
		nativeCommandCleanupFailure = (failures) => new ProviderCleanupError(NATIVE_MACOS_PROVIDER_IDENTITY.id, [...new Set(failures.flatMap(({ resources }) => resources))], {
			reason: "Native command process cleanup remains incomplete",
			failures: failures.map(({ reason, resources }) => ({
				reason,
				resources: [...resources]
			}))
		});
		closeNativeFileScope = async (scope, resource) => {
			try {
				await scope.close();
				return undefined;
			} catch (cause) {
				const observation = ArtifactReaderFailure.cleanupObservation(cause, resource);
				const failure = new ProviderCleanupError(NATIVE_MACOS_PROVIDER_IDENTITY.id, observation.resources, { reason: observation.reason }, {
					operation: "close_binary",
					cause
				});
				bindArtifactFileCleanup(cause, failure);
				return failure;
			}
		};
		nativeOutputFailure = (operation, cause) => new AnalysisOutputError(operation, "Native output parsing failed", { cause });
		isNativeOperation = (operation) => NATIVE_TOOL_CONTRACTS.some(({ name }) => name === operation);
		translateCommandFailure = (operation, failure) => {
			const preparation = failure.preparationFailure;
			if (preparation !== undefined) {
				const marker = preparation.cleanupFailure;
				const compiler = preparation.compilerOutcome;
				const options = {
					cause: failure,
					...preparation.capturedOutput === undefined ? {} : { capturedOutput: preparation.capturedOutput },
					...marker === undefined ? {} : { cleanup: {
						reason: marker.message,
						resources: marker.cleanupResources
					} },
					diagnostics: {
						phase: "process-preparation",
						tool: failure.tool,
						reason: failure.reason,
						detail: preparation.message,
						...compiler === undefined ? {} : { compiler_outcome: {
							outcome: compiler.outcome,
							code: compiler.code,
							signal: compiler.signal,
							...compiler.timeoutMs === undefined ? {} : { timeout_ms: compiler.timeoutMs }
						} }
					}
				};
				const error = preparation.cancellation === undefined ? new ProviderAdapterError(NATIVE_MACOS_PROVIDER_IDENTITY.id, operation, options) : failure.reason === "timeout" ? new AnalysisTimeoutError(operation, NATIVE_COMMAND_TIMEOUT_MS, {
					...options,
					cause: preparation.cancellation.reason
				}) : new AnalysisCancelledError(operation, {
					...options,
					cause: preparation.cancellation.reason
				});
				return marker === undefined ? error : error.bindCleanupDependencies([marker]);
			}
			const capturedOutput = failure.capture === null ? undefined : {
				stdout: failure.capture.stdout,
				stderr: failure.capture.stderr,
				truncated: failure.capture.truncated,
				stdout_bytes: failure.capture.stdoutBytes,
				stderr_bytes: failure.capture.stderrBytes,
				exit_code: failure.capture.exitCode,
				signal: failure.capture.signal
			};
			const cleanup = failure.cleanupFailure === null ? undefined : {
				reason: failure.cleanupFailure,
				resources: [...failure.cleanupResources]
			};
			const errorOptions = {
				...capturedOutput === undefined ? {} : { capturedOutput },
				...cleanup === undefined ? {} : { cleanup }
			};
			if (failure.reason === "unavailable") {
				const reason = `${failure.tool} is unavailable through xcrun.`;
				return new AnalysisCapabilityUnavailableError(NATIVE_MACOS_PROVIDER_IDENTITY.id, operation, reason, {
					...errorOptions,
					userMessage: reason
				});
			}
			if (failure.reason === "cancelled") return new AnalysisCancelledError(operation, errorOptions);
			if (failure.reason === "timeout") return new AnalysisTimeoutError(operation, NATIVE_COMMAND_TIMEOUT_MS, errorOptions);
			if (failure.reason === "output-limit") return new AnalysisResourceConstraintError(operation, "memory", `Native command output exceeded ${String(NATIVE_COMMAND_OUTPUT_BUDGET_BYTES)} bytes; complete output is required for analysis.`, { max_output_bytes: NATIVE_COMMAND_OUTPUT_BUDGET_BYTES }, errorOptions);
			return new ProviderAdapterError(NATIVE_MACOS_PROVIDER_IDENTITY.id, operation, {
				cause: failure,
				...errorOptions,
				diagnostics: {
					tool: failure.tool,
					reason: failure.reason,
					exit_code: failure.capture?.exitCode ?? failure.exitCode,
					signal: failure.capture?.signal ?? null,
					stdout_bytes: failure.capture?.stdoutBytes ?? 0,
					stderr_bytes: failure.capture?.stderrBytes ?? 0,
					...failure.detail === null ? {} : { detail: failure.detail }
				}
			});
		};
		translateCodeSignExitFailure = (capture) => translateCommandFailure("inspect_signature", new NativeCommandFailure("codesign", "nonzero-exit", capture.exitCode, undefined, failureCapture(capture, false)));
		commandOutput = (capture) => `${capture.stdout}\n${capture.stderr}`;
		isNonzeroUnsignedObservation = (capture) => capture.exitCode !== null && capture.exitCode !== 0 && /not signed at all|code object is not signed/iu.test(commandOutput(capture));
		canonicalPath = async (path) => {
			try {
				return [await realpath(path)];
			} catch {
				return [];
			}
		};
		codeSignCaptureFailure = (capture) => capture.exitCode === 0 || isNonzeroUnsignedObservation(capture) ? null : translateCodeSignExitFailure(capture);
		codeSignArchitectures = (format, target) => {
			const universal = /^Mach-O universal \(([^)\r\n]+)\)$/u.exec(format ?? "")?.[1];
			if (universal !== undefined) {
				const architectures = universal.split(/\s+/u).filter((architecture) => /^(?:i386|x86_64|armv7|arm64|arm64e)$/u.test(architecture));
				if (architectures.length > 0) return [...new Set(architectures)];
			}
			if (target.kind !== "executable" || !isMachOFormat(target.format)) return [];
			return target.availableArchitectures.map((architecture) => architecture === "x86" ? "i386" : architecture);
		};
		invocation = (capture, artifactPath, alias = "$ARTIFACT") => ({
			tool: capture.tool,
			command: [capture.executable, ...capture.arguments.map((argument) => argument === artifactPath ? alias : argument)],
			tool_version: capture.toolVersion,
			version_reason: capture.versionReason,
			executable_sha256: capture.executableSha256,
			exit: {
				code: capture.exitCode,
				signal: capture.signal
			},
			stdout_bytes: capture.stdoutBytes,
			stderr_bytes: capture.stderrBytes
		});
		parseEntitlements = (output) => {
			const start = output.indexOf("<?xml");
			const end = output.lastIndexOf("</plist>");
			if (start < 0 || end < start) return {
				value: null,
				omittedPrototypeKeys: 0,
				limitations: []
			};
			const decoded = parseXmlPropertyList(output.slice(start, end + "</plist>".length));
			const projected = projectPlistValue(decoded.value);
			const numbers = createPlistNumberProjection(decoded.numberLiterals);
			const value = numbers.project(projected.value);
			return {
				value,
				omittedPrototypeKeys: decoded.omittedPrototypeKeys,
				limitations: [
					...numbers.limitations(),
					...projected.nonFiniteRealCount === 0 ? [] : [nonFiniteRealLimitation(projected.nonFiniteRealCount)],
					...projected.unknownRealCount === 0 ? [] : [unknownRealLimitation(projected.unknownRealCount)],
					...projected.negativeZeroRealCount === 0 ? [] : [negativeZeroRealLimitation(projected.negativeZeroRealCount)],
					...projected.unknownDateCount === 0 ? [] : [unknownDateLimitation(projected.unknownDateCount)]
				]
			};
		};
		plutilDiagnostic = (capture, path) => {
			const diagnostics = [capture.stderr, capture.stdout].map((stream) => {
				const text = stream.trim();
				return text.startsWith(`${path}: `) ? text.slice(path.length + 2) : text;
			}).filter((text) => text.length > 0);
			return diagnostics.length === 0 ? "plutil printed no diagnostic" : diagnostics.join("\n");
		};
	})))();
}

//#endregion
init_NativeMacOSProvider();
export { NativeMacOSProvider };