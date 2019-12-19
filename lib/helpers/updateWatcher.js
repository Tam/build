/**
 * Update the entries watcher, notifying it of any added or remove files
 *
 * @param {Object} oldWatcher
 * @param {Object} entry
 * @param {Array} imports
 */
module.exports = function updateWatcher (oldWatcher, entry, imports) {
	if (!oldWatcher)
		return;

	const { watcher, imports: oldImports } = oldWatcher;

	const added   = imports.filter(p => !oldImports.includes(p));
	const removed = oldImports.filter(p => !imports.includes(p));

	if (added.length > 0) watcher.add(added);
	if (removed.length > 0) watcher.unwatch(removed);
};
