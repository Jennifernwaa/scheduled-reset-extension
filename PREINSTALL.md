# Scheduled Firestore Reset - Pre-installation Information

This extension automatically resets Firestore collections or documents to a default state at scheduled intervals using Cloud Scheduler.

## Features

* **Scheduled Data Resets**: Configure automatic resets of your Firestore data on a customizable schedule using cron expressions
* **Flexible Reset Options**: Reset either individual documents or entire collections 
* **Default Value Templates**: Use JSON templates or files stored in Cloud Storage to define reset states
* **Manual Trigger Option**: Includes a callable function to manually trigger resets when needed
* **Admin Protection**: Manual triggers are protected by admin authentication

## Required API Enabling

This extension requires the following APIs to be enabled:

* **Cloud Scheduler API** (`cloudscheduler.googleapis.com`): For scheduling automatic reset operations

## Required Permissions

This extension will operate with the following permissions:

* **`datastore.user`**: Allows the extension to read from and write to your Firestore database
* **`cloudscheduler.jobRunner`**: Allows the extension to create and run scheduled jobs 
* **`storage.objectViewer`**: Allows the extension to read files from Cloud Storage (only if you use GCS URLs for default values)

## Use Cases

* Reset daily challenges in a game
* Restore default settings periodically
* Clean up temporary data on a schedule
* Refresh demo environments
* Manage time-based content that needs regular resets

## Best Practices

* Structure your default values carefully
* Use GCS URLs for larger default value files
* Test reset operations thoroughly before scheduling production resets
* Use reasonable schedule intervals to avoid overloading your Firestore database