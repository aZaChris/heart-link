import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { ActivityIndicator, View } from 'react-native';

// Screens
import LoginScreen from './screens/LoginScreen';
import LinkPartnerScreen from './screens/LinkPartnerScreen';
import HomeScreen from './screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  if (loading) {
     return (
       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#e91e63" />
       </View>
     );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session && session.user ? (
          <>
            {/* User is signed in */}
            {/* Ideally we check here if they have a partner_id in the DB. If not, go to Link, else go to Home */}
            <Stack.Screen name="LinkPartner" component={LinkPartnerScreen} initialParams={{ user: session.user }} />
            <Stack.Screen name="Home" component={HomeScreen} initialParams={{ user: session.user }} />
          </>
        ) : (
          /* User is not signed in */
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
