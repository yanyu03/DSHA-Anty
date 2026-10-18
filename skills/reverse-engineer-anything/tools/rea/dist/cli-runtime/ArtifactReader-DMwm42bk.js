import { __esmMin } from "./rolldown-runtime-DXoylpqc.js";
import { AnalysisError, init_analysisErrorBase } from "./errorSchemas-Ixz_q7qt.js";

//#region dist/artifacts/ArtifactReader.js
var sameArtifactSourceIdentity, copyArtifactEntry, sameArtifactEntry, ArtifactReaderFailure, combineCleanup, errorMessage, artifactPrimaryCleanupLeases;
function init_ArtifactReader() {
	return (init_ArtifactReader = __esmMin((() => {
		init_analysisErrorBase();
		sameArtifactSourceIdentity = (expected, observed) => expected !== undefined && observed.dev === expected.device && observed.ino === expected.inode && observed.size === expected.size && observed.mode === expected.mode && observed.mtimeNs === expected.mtimeNs && observed.ctimeNs === expected.ctimeNs;
		copyArtifactEntry = (entry) => ({
			...entry,
			limitations: [...entry.limitations],
			...entry.sourceIdentity === undefined ? {} : { sourceIdentity: { ...entry.sourceIdentity } }
		});
		sameArtifactEntry = (entry, produced) => entry.path === produced.path && entry.kind === produced.kind && entry.declaredSize === produced.declaredSize && entry.compressedSize === produced.compressedSize && entry.executable === produced.executable && entry.encrypted === produced.encrypted && entry.byteOffset === produced.byteOffset && entry.declaredSha256 === produced.declaredSha256 && entry.unpacked === produced.unpacked && entry.adapterKey === produced.adapterKey && entry.limitations.length === produced.limitations.length && entry.limitations.every((limitation, index) => limitation === produced.limitations[index]) && entry.sourceIdentity?.device === produced.sourceIdentity?.device && entry.sourceIdentity?.inode === produced.sourceIdentity?.inode && entry.sourceIdentity?.size === produced.sourceIdentity?.size && entry.sourceIdentity?.mode === produced.sourceIdentity?.mode && entry.sourceIdentity?.mtimeNs === produced.sourceIdentity?.mtimeNs && entry.sourceIdentity?.ctimeNs === produced.sourceIdentity?.ctimeNs;
		ArtifactReaderFailure = class ArtifactReaderFailure extends Error {
			reason;
			details;
			cancellation;
			cleanup;
			cleanupLeases;
			partialObservation;
			/** The constrained bound for a `limit` reason, when the reader knows it. */
			boundary;
			constructor(reason, message, options, details) {
				super(message, options);
				this.reason = reason;
				this.details = details;
				this.name = "ArtifactReaderFailure";
				this.cancellation = reason === "cancelled" ? options?.cancellation ?? { reason: options?.cause } : undefined;
				this.cleanup = options?.cleanup;
				this.cleanupLeases = options?.cleanupLeases ?? (this.cleanup === undefined ? [] : undefined);
				this.partialObservation = options?.partialObservation;
				this.boundary = options?.boundary;
			}
			/** Preserve the primary failure and observation. Supplied leases must cover all merged cleanup. */
			static withCleanup(cause, cleanup, partialObservation, cleanupLeases) {
				const primary = cause instanceof ArtifactReaderFailure ? cause : new ArtifactReaderFailure("io", errorMessage(cause), {
					cause,
					...cause instanceof AnalysisError ? {
						partialObservation: cause.partialObservation,
						...cause.cleanupIncomplete ? { cleanup: ArtifactReaderFailure.cleanupObservation(cause, []) } : {}
					} : {}
				});
				const mergedObservation = partialObservation ?? primary.partialObservation;
				return new ArtifactReaderFailure(primary.reason, primary.message, {
					cause: primary,
					cancellation: primary.cancellation,
					cleanup: combineCleanup(primary.cleanup, cleanup),
					cleanupLeases: cleanupLeases ?? (cleanup === primary.cleanup ? primary.cleanupLeases : undefined),
					...primary.boundary === undefined ? {} : { boundary: primary.boundary },
					...mergedObservation === undefined ? {} : { partialObservation: mergedObservation }
				}, primary.details);
			}
			/** Give otherwise opaque cleanup failures a concrete owned resource. */
			static cleanupObservation(cause, resource) {
				if (cause instanceof ArtifactReaderFailure && cause.cleanup !== undefined) return cause.cleanup;
				if (cause instanceof AnalysisError && cause.cleanupIncomplete) return {
					reason: cause.cleanup?.reason ?? cause.message,
					resources: [...cause.cleanupResources]
				};
				return {
					reason: errorMessage(cause),
					resources: typeof resource === "string" ? [resource] : [...resource]
				};
			}
		};
		combineCleanup = (primary, cleanup) => primary === undefined || primary === cleanup ? cleanup : {
			reason: `${primary.reason}; ${cleanup.reason}`,
			resources: [...new Set([...primary.resources, ...cleanup.resources])]
		};
		errorMessage = (cause) => cause instanceof Error ? cause.message : String(cause);
		artifactPrimaryCleanupLeases = (cause) => cause instanceof ArtifactReaderFailure ? cause.cleanupLeases : cause instanceof AnalysisError && cause.cleanupIncomplete ? undefined : [];
	})))();
}

//#endregion
export { ArtifactReaderFailure, artifactPrimaryCleanupLeases, copyArtifactEntry, init_ArtifactReader, sameArtifactEntry, sameArtifactSourceIdentity };