# Changelog

## Version 0.1.0 (Initial Release)

Released: 2023-11-15

### Features
- Initial release of the Scheduled Firestore Reset Extension
- Support for resetting documents or collections to a default state
- Configurable schedule using cron expressions
- Accept default values as JSON string or from GCS URL
- Manual reset function for on-demand operations

### Technical Details
- Firebase Cloud Functions using Node.js 16 runtime
- Cloud Scheduler integration for automated triggering
- Support for document merge or replace operations
- Support for collection batch operations