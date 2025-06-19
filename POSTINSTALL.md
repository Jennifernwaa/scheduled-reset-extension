# Scheduled Firestore Reset - Installation Complete!

Thank you for installing the Scheduled Firestore Reset extension. Your extension is now deployed and will begin resetting your specified Firestore data according to the schedule you configured.

## Verifying Your Installation

To verify that your extension is set up correctly, follow these steps:

### 1. Check Configuration

1. Navigate to the **Extensions** section of your Firebase console
2. Find "Scheduled Firestore Reset" in your list of installed extensions
3. Verify that your configuration parameters match what you intended:
   - Firestore path to reset
   - Reset type (document or collection)
   - Default values
   - Schedule

### 2. Verify Cloud Scheduler Setup

1. Go to the [Cloud Scheduler page](https://console.cloud.google.com/cloudscheduler) in the Google Cloud Console
2. You should see a new job with a name that includes "firestore-scheduled-reset"
3. Confirm that the schedule matches your specified cron expression

### 3. Test a Manual Reset (Optional)

To manually trigger a reset operation and verify everything works:

**Using the Firebase Admin SDK:**

```js
const admin = require('firebase-admin');
admin.initializeApp();

const resetFunction = admin.functions().httpsCallable('ext-firestore-scheduled-reset-manualReset');
resetFunction()
  .then((result) => {
    console.log('Reset successful:', result.data);
    // Check your Firestore data to confirm reset
  })
  .catch((error) => {
    console.error('Reset failed:', error);
  });
```

**Using the Firebase Web SDK:**

```js
const resetFunction = firebase.functions().httpsCallable('ext-firestore-scheduled-reset-manualReset');
resetFunction()
  .then((result) => {
    console.log('Reset successful:', result.data);
    // Check your Firestore data to confirm reset
  })
  .catch((error) => {
    console.error('Reset failed:', error);
  });
```

> **Note:** The manual reset function requires admin authentication. Make sure you're calling it with appropriate credentials.

## Next Steps

1. **Monitor Logs**: Check the [Firebase Functions logs](https://console.firebase.google.com/project/_/functions/logs) after the first scheduled execution to ensure everything is working as expected.

2. **Update Default Values**: If you need to modify the default values, you can update the extension's configuration at any time.

3. **Multiple Resets**: If you need to reset multiple collections or documents on different schedules, you can install multiple instances of this extension with different configurations.

## Support

If you have any issues or feature requests, please file an issue on our [GitHub repository](https://github.com/firebase/extensions/issues).
