import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

export async function registerForPushNotificationsAsync(userId: string) {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('heartlink-notifs', {
      name: 'HeartLink Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    // Get the FCM token
    try {
        token = (await Notifications.getDevicePushTokenAsync()).data;
        console.log('Mobile Push Token:', token);

        // Update the user's FCM token in Supabase
        const { error } = await supabase
          .from('users')
          .update({ fcm_token: token })
          .eq('id', userId);

        if (error) {
          console.error('Error updating FCM token in Supabase:', error);
        }
    } catch (e) {
        console.error('Error getting push token', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
