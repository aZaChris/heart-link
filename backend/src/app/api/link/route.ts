import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { user_id, partner_code } = body;

        if (!user_id || !partner_code) {
            return NextResponse.json({ error: 'Missing user_id or partner_code' }, { status: 400 });
        }

        // Lookup partner by code
        const { data: partner, error: findError } = await supabase
            .from('users')
            .select('id, name')
            .eq('code', partner_code)
            .single();

        if (findError || !partner) {
            return NextResponse.json({ error: 'Invalid partner code' }, { status: 404 });
        }

        if (partner.id === user_id) {
            return NextResponse.json({ error: 'Cannot link with yourself' }, { status: 400 });
        }

        // Link the current user to the partner
        const { error: linkUserError } = await supabase
            .from('users')
            .update({ partner_id: partner.id })
            .eq('id', user_id);

        // Link the partner to the current user
        const { error: linkPartnerError } = await supabase
            .from('users')
            .update({ partner_id: user_id })
            .eq('id', partner.id);

        if (linkUserError || linkPartnerError) {
            console.error('Error linking users:', linkUserError || linkPartnerError);
            return NextResponse.json({ error: 'Failed to link accounts' }, { status: 500 });
        }

        // Successfully linked
        return NextResponse.json({ success: true, message: 'Accounts linked successfully', partner_name: partner.name });

    } catch (error) {
        console.error('Unexpected error in /api/link:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
