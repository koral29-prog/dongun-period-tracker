const { withAppDelegate } = require('@expo/config-plugins');

const call = 'excludeLocalHealthDataFromBackup()';
const helper = `
  private func excludeLocalHealthDataFromBackup() {
    let fileManager = FileManager.default
    guard let library = fileManager.urls(for: .libraryDirectory, in: .userDomainMask).first else { return }
    var sqliteDirectory = library.appendingPathComponent("SQLite", isDirectory: true)
    try? fileManager.createDirectory(at: sqliteDirectory, withIntermediateDirectories: true)
    var resourceValues = URLResourceValues()
    resourceValues.isExcludedFromBackup = true
    try? sqliteDirectory.setResourceValues(resourceValues)
  }
`;

module.exports = function withLocalDataHardening(config) {
  return withAppDelegate(config, (next) => {
    if (next.modResults.language !== 'swift') throw new Error('with-local-data-hardening requires a Swift AppDelegate');
    let source = next.modResults.contents;
    if (!source.includes(call)) {
      source = source.replace(/(return super\.application\([\s\S]*?\n\s*\))/m, `${call}\n\n    $1`);
    }
    if (!source.includes('private func excludeLocalHealthDataFromBackup')) {
      const delegateEnd = source.indexOf('\n}\n\nclass ReactNativeDelegate');
      if (delegateEnd === -1) throw new Error('Unable to find the AppDelegate class boundary');
      source = `${source.slice(0, delegateEnd)}${helper}${source.slice(delegateEnd)}`;
    }
    next.modResults.contents = source;
    return next;
  });
};
