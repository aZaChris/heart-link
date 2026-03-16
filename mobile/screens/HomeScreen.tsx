import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, Alert, ActivityIndicator, Vibration } from 'react-native';
import * as Linking from 'expo-linking';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import { supabase } from '../lib/supabase';

// Initialize NFC
try {
  NfcManager.start();
} catch (e) {
  console.log('NFC Manager already started or error', e);
}

export default function HomeScreen({ route, navigation }: any) {
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);
  const user = route.params?.user;

  // 1. Handle Deep Links (App is opened via NFC URL)
  useEffect(() => {
    const getInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        handleUrl(url);
      }
    };
    getInitialURL();

    const subscription = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleUrl = (url: string, isSimulated = false) => {
    const parsedUrl = Linking.parse(url);
    if (parsedUrl.path === 'scan') {
      if (isSimulated) {
        Vibration.vibrate([0, 100, 100, 100, 100, 800]); 
        setData(`Scanned Tag UID: SIMULATED-TAG-123`);
        sendTagToBackend('SIMULATED-TAG-123');
      } else {
        readNfcTagForDeepLink();
      }
    }
  };

  const readNfcTagForDeepLink = async () => {
    try {
      setLoading(true);
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();
      
      if (tag) {
         Vibration.vibrate([0, 100, 100, 100, 100, 800]); 
         setData(`Scanned Tag UID: ${tag.id}`);
         const uid = tag.id ? tag.id : 'unknown';
         await sendTagToBackend(uid as string);
      }
    } catch (ex) {
      console.warn('Error reading NFC', ex);
    } finally {
      NfcManager.cancelTechnologyRequest();
      setLoading(false);
    }
  };

  const sendTagToBackend = async (uid: string) => {
    if (!user) {
      Alert.alert("Not Logged In", "Please login first!");
      return;
    }

    const BACKEND_URL = 'https://heart-link-nine.vercel.app/api/scan';
    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag_uid: uid, user_id: user.id })
      });
      const result = await response.json();
      if (result.success) {
         setSyncedCount(prev => prev + 1);
         Alert.alert("Heart Sent! ❤️", "Your partner has been notified.");
      } else {
         Alert.alert("Notice", result.message || result.error || "Action processed."); // Allow graceful handling of no-partner
      }
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
        onPress={() => handleUrl('https://heartlink.app/scan', true)} 
      />

      <View style={{ marginTop: 40 }}>
        <Button title="Sign Out" color="gray" onPress={() => supabase.auth.signOut()} />
      </View>
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
