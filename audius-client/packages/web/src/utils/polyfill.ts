import entries from 'object.entries'

// Shim Object.entries if it is unavailable or noncompliant.
if (!Object.entries) entries.shim()
