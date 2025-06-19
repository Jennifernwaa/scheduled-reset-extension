# Scheduled Firestore Reset

**Author**: Firebase (**[https://firebase.google.com](https://firebase.google.com)**)

**Description**: Automatically reset Firestore collections or documents to a default state at scheduled intervals using Cloud Scheduler.

## Overview

This extension allows you to schedule automatic resets of Firestore documents or collections to a predetermined state at regular intervals. This is useful for:

- Resetting daily/weekly/monthly challenges or contests
- Refreshing demo or example data
- Clearing temporary data on a schedule
- Restoring default settings periodically
- Managing game state resets (e.g., daily quests)

By configuring a simple schedule (using cron syntax) and providing default values, you can ensure your Firestore data returns to a known state automatically without manual intervention.

## Installation

### Console

[![Install this extension in your Firebase project](https://firebase.google.com/docs/extensions/badges/install-extension.svg)](https://console.firebase.google.com/project/_/extensions/install?ref=firebase/firestore-scheduled-reset)

### Firebase CLI

```bash
firebase ext:install firebase/firestore-scheduled-reset --project=your-project-id
```

> Learn more about installing extensions in the Firebase Extensions documentation:
> [https://firebase.google.com/docs/extensions/install-extensions](https://firebase.google.com/docs/extensions/install-extensions)

## Configuration Parameters

### Cloud Functions location

Which Google Cloud region should the extension use for its deployed functions? For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

### Firestore Path to Reset

Specify the Firestore path to a document or collection that will be reset (e.g., 'forms/current' for a document or 'leaderboards' for a collection).

### Reset Type

Specify whether the target is a document or collection.

### Default Values

Specify the default values as a JSON string or a GCS URL (gs://bucket/path/to/file.json). For documents, provide an object. For collections, provide either an array of objects or an object where keys are document IDs and values are document data.

**Examples:**

For a document:
```json
{"status": "available", "message": "Form reset!", "timestamp": 0}
```

For a collection (array style):
```json
[{"name": "Player 1", "score": 0}, {"name": "Player 2", "score": 0}]
```

For a collection (object style with document IDs):
```json
{"player1": {"name": "Player 1", "score": 0}, "player2": {"name": "Player 2", "score": 0}}
```

### Reset Schedule

Specify when the reset should occur using a cron schedule expression. The default is daily at midnight (UTC): `0 0 * * *`

Common examples:
- Every day at midnight UTC: `0 0 * * *`
- Every Sunday at midnight UTC: `0 0 * * 0` 
- Every first day of the month: `0 0 1 * *`
- Every hour: `0 * * * *`

See [Cloud Scheduler documentation](https://cloud.google.com/scheduler/docs/configuring/cron-job-schedules) for more information on cron schedule expressions.

### Pub/Sub Topic Name

Specify a name for the Pub/Sub topic that Cloud Scheduler will use to trigger the reset function. The default is `firestore-scheduled-reset`.

## How does it work?

This extension uses Cloud Scheduler to trigger a Cloud Function at specified intervals. When triggered, the function:

1. Reads the default values from the specified JSON string or GCS URL
2. Depending on the reset type:
   - For a document: Overwrites or merges the document with default values
   - For a collection: Deletes all existing documents and creates new ones with default values

### Manual Triggering

The extension also provides a callable function named `manualReset` that allows you to trigger a reset operation on demand. This can be useful for testing or handling special cases.

You can call this function from your client applications as follows:

```javascript
const resetFunction = firebase.functions().httpsCallable('ext-firestore-scheduled-reset-manualReset');
try {
  const result = await resetFunction();
  console.log('Reset successful:', result.data);
} catch (error) {
  console.error('Reset failed:', error);
}
```

> Note: The manual reset function is protected and can only be called by users with admin privileges.

## Monitoring & Troubleshooting

You can monitor the extension's activity through the Firebase console:

- Cloud Functions logs will show the execution of reset operations
- Cloud Scheduler will show the schedule and execution history

Common issues:
- If resets aren't occurring, check the Cloud Scheduler execution history
- If data isn't being reset correctly, verify your default values JSON format
- For permission errors, ensure the extension has the required IAM roles

## Use Cases

### Daily Game Resets

Reset daily challenges, rewards, or game states for players every day at midnight.

### Demo Environment Refresh

Automatically refresh demo data on a regular schedule to ensure consistent experiences for new users.

### Temporary Data Cleanup

Regularly clean up temporary data collections that accumulate over time but shouldn't persist indefinitely.

## Limitations

- Maximum document size limits still apply (1MB per document)
- For very large collections, the reset operation may take longer than the default timeout
- Complex nested collections may require additional custom logic
- Default values specified as a JSON string have a size limit; for larger data sets, use a GCS URL