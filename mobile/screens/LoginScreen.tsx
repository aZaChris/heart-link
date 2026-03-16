import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  // Setup Google Sign-in config when the component loads
  React.useEffect(() => {
    GoogleSignin.configure({
      scopes: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
      webClientId: '995970422928-3693cpoksobtohqjm7ckirjhal41kkqs.apps.googleusercontent.com',
    });
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      if (userInfo.data?.idToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: userInfo.data.idToken,
        });
        
        if (error) throw error;

        // Note: The listener in App.tsx will handle the navigation after auth
      } else {
        throw new Error('No ID token present!');
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled login');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Login already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Play services not available or outdated');
      } else {
        Alert.alert('Error during login', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to HeartLink ❤️</Text>
      <Text style={styles.subtitle}>Connect with your partner using NFC.</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#e91e63" />
      ) : (
        <Button
          title="Sign in with Google"
          color="#e91e63"
          onPress={signInWithGoogle}
        />
      )}
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
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#880e4f',
    marginBottom: 40,
    textAlign: 'center',
  },
});
