import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getMessaging } from '@/lib/firebase';

// Real function to send push notification via FCM
async function sendPushNotification(partnerToken: string, title: string, body: string, senderName: string) {
    try {
        const message = {
            notification: {
                title: title,
                body: body,
            },
            data: {
                type: 'heart_scan',
                sender_name: senderName,
            },
            token: partnerToken,
            android: {
                priority: 'high' as const,
                notification: {
                    sound: 'default',
                    channelId: 'heartlink-notifs',
                }
            }
        };

        const messaging = getMessaging();
        if (!messaging) {
            console.warn('FCM messaging not initialized, skipping notification');
            return false;
        }

        const response = await messaging.send(message);
        console.log(`FCM Notification sent! Message ID: ${response}`);
        return true;
    } catch (error) {
        console.error('Error sending FCM notification:', error);
        return false;
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { tag_uid, user_id } = body;

        if (!tag_uid || !user_id) {
            return NextResponse.json({ error: 'Missing tag_uid or user_id' }, { status: 400 });
        }

        // 1. Log the scan event
        const { error: insertError } = await supabase
            .from('scans')
            .insert({ tag_uid, user_id });

        if (insertError) {
            console.error('Error inserting scan:', insertError);
            return NextResponse.json({ error: 'Failed to record scan', details: insertError }, { status: 500 });
        }

        // 2. Find the user's partner
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('partner_id, name')
            .eq('id', user_id)
            .single();

        if (userError || !user) {
            console.error('User not found or query error:', userError);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!user.partner_id) {
            return NextResponse.json({ message: 'Scan recorded, but no partner linked yet.' }, { status: 200 });
        }

        // 3. Update the counter (streak/total logic handled database-side or here based on complexity)
        // For now, let's increment total_scans on the user's profile
        // In a real scenario, this might trigger a DB RPC or edge function for atomicity
        await supabase.rpc('increment_scans', { p_user_id: user_id });

        // 4. Send push notification to partner
        // First, fetch partner's push token
        const { data: partner, error: partnerError } = await supabase
            .from('users')
            .select('fcm_token, name')
            .eq('id', user.partner_id)
            .single();

        if (!partnerError && partner && partner.fcm_token) {
            await sendPushNotification(
                partner.fcm_token,
                'HeartLink',
                `${user.name || 'Your partner'} is thinking of you! ❤️`,
                user.name || 'Your partner'
            );
        }

        return NextResponse.json({ success: true, message: 'Scan processed successfully' });
    } catch (error) {
        console.error('Unexpected error in /api/scan:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
