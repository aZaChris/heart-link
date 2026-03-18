import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator, Alert, TextInput, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';

export default function LinkPartnerScreen({ route, navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [partnerCode, setPartnerCode] = useState('');
  const [myCode, setMyCode] = useState('...');
  const user = route.params?.user; // Passed from navigation

  useEffect(() => {
    fetchMyCode();
  }, []);

  const fetchMyCode = async () => {
    if (!user) return;
    
    console.log('Fetching code for user ID:', user.id);
    const { data, error } = await supabase
      .from('users')
      .select('code, partner_id')
      .eq('id', user.id)
      .single();
      
    if (error) {
      console.error('Supabase error fetching code:', error);
    }

    if (data) {
      console.log('User data found:', data);
      setMyCode(data.code);
      if (data.partner_id) {
         navigation.replace('Home');
      }
    } else {
      console.log('No user data found in public.users for ID:', user.id);
    }
  };

  const linkPartner = async () => {
    if (!partnerCode) return;
    setLoading(true);

    try {
       const BACKEND_URL = 'https://heart-link-nine.vercel.app/api/link';
       const response = await fetch(BACKEND_URL, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ user_id: user.id, partner_code: partnerCode })
       });
       const result = await response.json();
       
       if (result.success) {
         Alert.alert("Success!", `Linked with ${result.partner_name || 'partner'}!`);
         navigation.replace('Home');
       } else {
         Alert.alert("Error", result.error || "Could not link partner.");
       }
    } catch (e) {
      Alert.alert("Request Error", "Failed to contact backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Link Your Partner</Text>
      
      <TouchableOpacity 
        onLongPress={() => Alert.alert("Debug Info", `User ID: ${user?.id}`)} 
        style={styles.card}
      >
         <Text style={styles.label}>Your Code:</Text>
         <Text style={styles.code}>{myCode}</Text>
      </TouchableOpacity>

      <Text style={styles.or}>OR</Text>

      <View style={styles.card}>
         <Text style={styles.label}>Enter Partner's Code:</Text>
         <TextInput
            style={styles.input}
            placeholder="e.g. A1B2C3"
            value={partnerCode}
            onChangeText={setPartnerCode}
            autoCapitalize="characters"
         />
         {loading ? (
            <ActivityIndicator size="small" color="#e91e63" />
         ) : (
            <Button title="Connect" color="#e91e63" onPress={linkPartner} />
         )}
      </View>

      <View style={{ marginTop: 20 }}>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#c2185b',
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    color: '#880e4f',
    marginBottom: 10,
  },
  code: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: '#000',
  },
  or: {
    marginVertical: 20,
    color: '#880e4f',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#f06292',
    borderRadius: 8,
    width: '100%',
    padding: 10,
    marginBottom: 15,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 2,
  }
});
