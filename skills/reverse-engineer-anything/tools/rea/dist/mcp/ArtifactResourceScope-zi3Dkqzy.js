import { t as __esmMin } from "./rolldown-runtime-BjeaiXFo.js";
import { i as init_ArtifactReader, n as artifactPrimaryCleanupLeases, t as ArtifactReaderFailure } from "./ArtifactReader-BrnwNaKY.js";
import { a as init_AnalysisCleanupLease, r as AnalysisCleanupLease } from "./providerCleanupError-DIRHxzWo.js";

//#region dist/artifacts/ArtifactResourceScope.js
var ArtifactResourceRetryFailure, ArtifactResourceScope, cleanup;
function init_ArtifactResourceScope() {
	return (init_ArtifactResourceScope = __esmMin((() => {
		init_ArtifactReader();
		init_AnalysisCleanupLease();
		ArtifactResourceRetryFailure = class extends ArtifactReaderFailure {
			failedOwners;
			cleanupLeases;
			constructor(failures, message, options) {
				super("unavailable", message, options);
				this.failedOwners = failures.map(({ owner }) => owner);
				this.cleanupLeases = [...new Set(failures.map(({ lease }) => lease))];
			}
		};
		ArtifactResourceScope = class {
			#pending = new Set();
			#leases = new WeakMap();
			#active = new Set();
			#draining;
			#closed = false;
			get hasPending() {
				return this.#pending.size > 0;
			}
			/** Labels come from the exact retained owners, never from diagnostic text. */
			get cleanupResources() {
				return [...new Set([...this.#pending].flatMap((owner) => {
					const lease = this.#lease(owner);
					return lease.released ? [] : lease.cleanupResources ?? [owner.resource];
				}))];
			}
			/** Admit a resource operation while the scope remains open. */
			async run(operation) {
				while (true) {
					if (this.#closed) throw new ArtifactReaderFailure("unavailable", "Artifact resource scope is closed");
					if (this.#draining !== undefined) await this.#draining;
					if (this.#closed) throw new ArtifactReaderFailure("unavailable", "Artifact resource scope is closed");
					if (this.#pending.size > 0) {
						await this.retryCleanup();
						continue;
					}
					const running = Promise.resolve().then(operation);
					this.#active.add(running);
					try {
						return await running;
					} finally {
						this.#active.delete(running);
					}
				}
			}
			/** Attempt cleanup now and retain the same owner if it fails. */
			async release(owner) {
				try {
					await this.#lease(owner).release();
					this.#pending.delete(owner);
					return { kind: "released" };
				} catch (cause) {
					this.#pending.add(owner);
					this.#observeCleanupFailure(owner, cause);
					return {
						kind: "failed",
						cause,
						owner,
						lease: this.#lease(owner)
					};
				}
			}
			/** Compose initial cleanup authority without confusing it with an independent primary. */
			cleanupFailure(outcome, failures, partialObservation) {
				const observations = failures.map(({ cause, owner }) => ArtifactReaderFailure.cleanupObservation(cause, owner.resource));
				const primary = outcome.kind === "failed" ? outcome.cause : failures[0].cause;
				const inherited = outcome.kind === "failed" ? artifactPrimaryCleanupLeases(primary) : [];
				return ArtifactReaderFailure.withCleanup(primary, {
					reason: observations.map(({ reason }) => reason).join("; "),
					resources: [...new Set(observations.flatMap(({ resources }) => resources))]
				}, partialObservation, inherited === undefined ? undefined : [...new Set([...inherited, ...failures.map(({ lease }) => lease)])]);
			}
			/** Adopt an owner after another boundary's cleanup attempt failed. */
			retain(owner) {
				this.#pending.add(owner);
			}
			/** Retry retained owners without closing resource admission. */
			retryCleanup() {
				if (this.#draining !== undefined) return this.#draining;
				this.#draining = this.#drainAndRetry().finally(() => {
					this.#draining = undefined;
				});
				return this.#draining;
			}
			/** Stop admission, wait for active operations, and retry every retained owner. */
			close() {
				this.#closed = true;
				return this.retryCleanup();
			}
			async #drainAndRetry() {
				while (this.#active.size > 0) await Promise.allSettled(this.#active);
				const failures = [];
				for (const owner of this.#pending) {
					try {
						await this.#lease(owner).release();
						this.#pending.delete(owner);
					} catch (cause) {
						this.#observeCleanupFailure(owner, cause);
						failures.push({
							owner,
							cause
						});
					}
				}
				if (failures.length === 0) return;
				const observations = failures.map(({ owner, cause }) => ArtifactReaderFailure.cleanupObservation(cause, owner.kind === "lease" && owner.lease instanceof AnalysisCleanupLease ? owner.lease.cleanupResources ?? owner.resource : owner.resource));
				const resources = [...new Set(observations.flatMap(({ resources }) => resources))];
				throw new ArtifactResourceRetryFailure(failures.map(({ owner }) => ({
					owner,
					lease: this.#lease(owner)
				})), `Artifact cleanup remains incomplete: ${resources.join(", ")}`, {
					cause: new AggregateError(failures.map(({ cause }) => cause), "One or more artifact resources remain owned"),
					cleanup: {
						reason: observations.map(({ reason }) => reason).join("; "),
						resources
					}
				});
			}
			/** This boundary owns the latest parsed child cleanup facts for a composite owner. */
			#observeCleanupFailure(owner, cause) {
				const retained = this.#leases.get(owner);
				if (retained !== undefined) retained.resources = [...ArtifactReaderFailure.cleanupObservation(cause, owner.resource).resources];
			}
			#lease(owner) {
				if (owner.kind === "lease" && owner.lease instanceof AnalysisCleanupLease) return owner.lease;
				const previous = this.#leases.get(owner);
				if (previous !== undefined) return previous.lease;
				const retained = {
					resources: [owner.resource],
					lease: new AnalysisCleanupLease(() => cleanup(owner), { get cleanupResources() {
						return retained.resources;
					} })
				};
				this.#leases.set(owner, retained);
				return retained.lease;
			}
		};
		cleanup = async (owner) => {
			switch (owner.kind) {
				case "lease":
					await owner.lease.release();
					return;
				case "javascript-source-analysis":
					await owner.analysis.close();
					return;
				case "reader":
					await owner.reader.close();
					return;
				case "file-handle":
				case "directory-handle":
					await owner.handle.close();
					return;
				case "output-tree":
					await owner.tree.rollback();
					return;
				case "staged-output":
					await owner.output.close();
					return;
				case "private-runtime-root": await owner.root.close();
			}
		};
	})))();
}

//#endregion
export { ArtifactResourceScope as n, init_ArtifactResourceScope as r, ArtifactResourceRetryFailure as t };