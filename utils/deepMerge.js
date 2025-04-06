const deepMerge = (existing, updates) => {
    if (Array.isArray(existing) && Array.isArray(updates)) {
        // Handle merging for arrays based on `objectId`
        const existingMap = new Map(existing.map(obj => [obj.objectId, obj]));

        for (const update of updates) {
            if (update.objectId && existingMap.has(update.objectId)) {
                // Merge updates into existing object
                existingMap.set(update.objectId, deepMerge(existingMap.get(update.objectId), update));
            } else {
                // Append new object
                existingMap.set(update.objectId || `new-${Date.now()}`, update);
            }
        }

        return Array.from(existingMap.values());
    } else if (typeof existing === 'object' && typeof updates === 'object') {
        // Handle merging for objects
        const merged = { ...existing };
        for (const key in updates) {
            if (updates[key] !== null && typeof updates[key] === 'object') {
                merged[key] = deepMerge(existing[key] || {}, updates[key]);
            } else {
                merged[key] = updates[key];
            }
        }
        return merged;
    } else {
        // Primitive values: replace directly
        return updates;
    }
}

module.exports = deepMerge;