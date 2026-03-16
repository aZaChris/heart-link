import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, Alert, ActivityIndicator, Vibration } from 'react-native';
import * as Linking from 'expo-linking';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';

// Initialize NFC
NfcManager.start();

const prefix = Linking.createURL('/');

export default function App() {
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);

  // 1. Handle Deep Links (App is opened via NFC URL)
  useEffect(() => {
    // Handle case where app is opened from the URL
    const getInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        handleUrl(url);
      }
    };
    getInitialURL();

    // Handle case where app is already open and URL is triggered
    const subscription = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleUrl = (url: string) => {
    const parsedUrl = Linking.parse(url);
    if (parsedUrl.path === 'scan') {
      // Deep link intercepted! Now we must quickly read the NFC tag UID.
      readNfcTagForDeepLink();
    }
  };

  const readNfcTagForDeepLink = async () => {
    try {
      setLoading(true);
      // Wait for the tag that just triggered the NDEF intent
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();

      if (tag) {
        // MAGIC HAPPENS HERE: Immediate tactile feedback via Vibration
        // Zelda chest pattern: short, short, loooong
        Vibration.vibrate([0, 100, 100, 100, 100, 800]);

        setData(`Scanned Tag UID: ${tag.id}`);
        // TODO: POST tag.id to our Next.js backend
        const uid = typeof tag.id === 'string' ? tag.id : (tag.id ? tag.id.join('') : 'unknown');
        await sendTagToBackend(uid);
      }
    } catch (ex) {
      console.warn('Error reading NFC', ex);
    } finally {
      NfcManager.cancelTechnologyRequest();
      setLoading(false);
    }
  };

  const sendTagToBackend = async (uid: string) => {
    // NOTE: Replace with actual deployed backend URL or local IP
    const BACKEND_URL = 'http://192.168.1.X:3000/api/scan';
    try {
      /*
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag_uid: uid, user_id: 'sample-user-uuid' })
      });
      const result = await response.json();
      if (result.success) {
         setSyncedCount(prev => prev + 1);
      }
      */
      // Mock success for now
      setSyncedCount(prev => prev + 1);
      Alert.alert("Heart Sent! ❤️", "Your partner has been notified.");
    } catch (e) {
      Alert.alert("Error", "Could not sync with server.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HeartLink</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#e91e63" />
      ) : (
        <View style={styles.card}>
          <Text style={styles.status}>Waiting for Heart NFC... 💕</Text>
          <Text style={styles.counter}>Today's Hearts: {syncedCount}</Text>
          {data && <Text style={styles.debug}>{data}</Text>}
        </View>
      )}

      {/* Manual testing button if NFC isn't handy */}
      <Button
        title="Simulate NFC Scan"
        color="#e91e63"
        onPress={() => handleUrl('https://heartlink.app/scan')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffebee',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#c2185b',
    marginBottom: 40,
  },
  card: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 40,
  },
  status: {
    fontSize: 18,
    color: '#880e4f',
    marginBottom: 20,
  },
  counter: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e91e63',
  },
  debug: {
    marginTop: 20,
    fontSize: 12,
    color: 'gray',
  }
});
