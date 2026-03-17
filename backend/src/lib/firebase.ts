import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Firebase Admin initialization error', error);
    }
  } else {
    console.warn('Firebase Admin credentials missing. Push notifications will not work.');
  }
}

// Safe getters to avoid crashing during build if not initialized
export const getMessaging = () => {
  if (!admin.apps.length) return null;
  return admin.messaging();
};

export const getAuth = () => {
  if (!admin.apps.length) return null;
  return admin.auth();
};
