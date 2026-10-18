/** Snapshot selected variables while preserving platform and caller precedence. */
export const snapshotEnvironment = (environment, platform = process.platform) => {
    if (platform !== "win32")
        return Object.freeze({ ...environment });
    const selected = new Map();
    // Fold aliases in caller order so an explicit later override wins before
    // this canonical environment crosses a Windows process boundary.
    for (const [key, value] of Object.entries(environment))
        selected.set(key.toUpperCase(), value);
    const snapshot = {};
    for (const key of [...selected.keys()].sort())
        snapshot[key] = selected.get(key);
    return Object.freeze(snapshot);
};
