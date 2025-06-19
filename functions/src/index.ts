import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { https } from "firebase-functions";

// Initialize Firebase Admin SDK
admin.initializeApp();

interface DefaultValue {
  [key: string]: any;
}

/**
 * Helper function to parse default values from a string or URL
 * @param defaultValuesStr - JSON string or GCS URL
 * @returns Parsed default values object
 */
async function getDefaultValues(defaultValuesStr: string): Promise<DefaultValue> {
  // Check if the string is a GCS URL
  if (defaultValuesStr.startsWith("gs://")) {
    try {
      // Extract bucket name and file path from the GCS URL
      const gcsPath = defaultValuesStr.replace("gs://", "");
      const [bucketName, ...fileParts] = gcsPath.split("/");
      const filePath = fileParts.join("/");
      
      const bucket = admin.storage().bucket(bucketName);
      const file = bucket.file(filePath);
      
      // Download and parse the JSON file
      const [fileContent] = await file.download();
      return JSON.parse(fileContent.toString());
    } catch (error) {
      console.error(`Error loading default values from GCS: ${error}`);
      throw new https.HttpsError(
        "internal",
        `Failed to load default values from GCS URL: ${error}`
      );
    }
  } 
  // Otherwise, try to parse as JSON string
  else {
    try {
      return JSON.parse(defaultValuesStr);
    } catch (error) {
      console.error(`Error parsing default values JSON: ${error}`);
      throw new https.HttpsError(
        "invalid-argument",
        "DEFAULT_VALUES parameter must be a valid JSON string"
      );
    }
  }
}

/**
 * Reset a single document with the provided default values
 * @param db - Firestore instance
 * @param path - Document path
 * @param defaultValues - Default values to write
 * @param options - Options for the write operation
 * @returns Promise resolving when the document is updated
 */
async function resetDocument(
  db: FirebaseFirestore.Firestore,
  path: string,
  defaultValues: DefaultValue,
  options: {
    merge?: boolean;
  } = { merge: true }
): Promise<void> {
  const docRef = db.doc(path);
  
  console.log(`Resetting document at path: ${path}`);
  return docRef.set(defaultValues, options);
}

/**
 * Reset all documents in a collection with the provided default values
 * @param db - Firestore instance
 * @param collectionPath - Collection path
 * @param defaultValues - Default values to write
 * @returns Promise resolving when all documents are deleted and new ones created
 */
async function resetCollection(
  db: FirebaseFirestore.Firestore,
  collectionPath: string,
  defaultValues: DefaultValue | DefaultValue[]
): Promise<void> {
  console.log(`Resetting collection at path: ${collectionPath}`);
  
  // Get all documents in the collection
  const snapshot = await db.collection(collectionPath).get();
  
  // Delete all existing documents in a batch
  if (!snapshot.empty) {
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`Deleted ${snapshot.size} documents from collection ${collectionPath}`);
  }

  // Add new documents with default values
  const batch = db.batch();
  
  if (Array.isArray(defaultValues)) {
    // If defaultValues is an array, create multiple documents
    defaultValues.forEach((value) => {
      const docId = value.id || db.collection(collectionPath).doc().id;
      const docRef = db.collection(collectionPath).doc(docId);
      
      // Remove id field if it was used for the document ID
      if (value.id) {
        const { id, ...valueWithoutId } = value;
        batch.set(docRef, valueWithoutId);
      } else {
        batch.set(docRef, value);
      }
    });
  } else {
    // If defaultValues is an object with nested collections
    for (const [key, value] of Object.entries(defaultValues)) {
      const docRef = db.collection(collectionPath).doc(key);
      batch.set(docRef, value);
    }
  }
  
  await batch.commit();
  console.log(`Reset collection ${collectionPath} with default values`);
}

/**
 * Main Cloud Function that resets the specified Firestore path with default values
 */
export const scheduledReset = functions.handler.pubsub.schedule.onSchedule(
  (context) => {
    const config = functions.config().scheduled_reset;
    
    const resetTarget = process.env.RESET_TARGET;
    const resetType = process.env.RESET_TYPE;
    const defaultValuesStr = process.env.DEFAULT_VALUES;
    
    if (!resetTarget) {
      throw new Error("Missing required parameter: RESET_TARGET");
    }
    
    if (!resetType || (resetType !== "document" && resetType !== "collection")) {
      throw new Error("RESET_TYPE must be either 'document' or 'collection'");
    }
    
    if (!defaultValuesStr) {
      throw new Error("Missing required parameter: DEFAULT_VALUES");
    }
    
    const db = admin.firestore();
    
    return getDefaultValues(defaultValuesStr)
      .then((defaultValues) => {
        if (resetType === "document") {
          return resetDocument(db, resetTarget, defaultValues);
        } else {
          return resetCollection(db, resetTarget, defaultValues);
        }
      })
      .then(() => {
        console.log(`Successfully reset ${resetType} at path ${resetTarget}`);
      })
      .catch((error) => {
        console.error(`Error during scheduled reset: ${error}`);
        throw error;
      });
  }
);

/**
 * HTTP function to manually trigger a reset (useful for testing)
 */
export const manualReset = functions.https.onCall(async (data, context) => {
  // Check for admin authentication
  if (!context.auth?.token.admin) {
    throw new https.HttpsError(
      "permission-denied",
      "Only admins can manually trigger resets"
    );
  }

  const resetTarget = process.env.RESET_TARGET;
  const resetType = process.env.RESET_TYPE;
  const defaultValuesStr = process.env.DEFAULT_VALUES;

  if (!resetTarget || !resetType || !defaultValuesStr) {
    throw new https.HttpsError(
      "failed-precondition",
      "Missing required configuration parameters"
    );
  }

  const db = admin.firestore();
  
  try {
    const defaultValues = await getDefaultValues(defaultValuesStr);
    
    if (resetType === "document") {
      await resetDocument(db, resetTarget, defaultValues);
    } else if (resetType === "collection") {
      await resetCollection(db, resetTarget, defaultValues);
    } else {
      throw new https.HttpsError(
        "invalid-argument",
        "RESET_TYPE must be either 'document' or 'collection'"
      );
    }
    
    return { success: true, message: `Successfully reset ${resetType} at path ${resetTarget}` };
  } catch (error) {
    console.error(`Error during manual reset: ${error}`);
    throw new https.HttpsError("internal", `Reset operation failed: ${error}`);
  }
});