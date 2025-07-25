import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@blinkdotnew/sdk";

const blink = createClient({
  projectId: Deno.env.get('BLINK_PROJECT_ID') || '',
  authRequired: false
});

serve(async (req) => {
  // Handle CORS for frontend calls
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    if (req.method === 'POST') {
      const { code, redirectUri, serverId } = await req.json();
      
      if (!code) {
        return new Response(JSON.stringify({ error: 'Discord authorization code is required' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const clientId = Deno.env.get('DISCORD_CLIENT_ID');
      const clientSecret = Deno.env.get('DISCORD_CLIENT_SECRET');

      if (!clientId || !clientSecret) {
        return new Response(JSON.stringify({ error: 'Discord credentials not configured' }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Exchange Discord authorization code for access token
      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('Discord token exchange failed:', errorData);
        return new Response(JSON.stringify({ error: 'Failed to exchange Discord authorization code for token' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const tokenData = await tokenResponse.json();

      // Get Discord user information
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.text();
        console.error('Discord user fetch failed:', errorData);
        return new Response(JSON.stringify({ error: 'Failed to fetch Discord user information' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const userData = await userResponse.json();

      // Create avatar URL
      const avatarUrl = userData.avatar 
        ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/${parseInt(userData.discriminator || '0') % 5}.png`;

      // Store verification data in database
      const verificationRecord = {
        id: `discord_${userData.id}_${Date.now()}`,
        discordId: userData.id,
        username: userData.username,
        discriminator: userData.discriminator || '0',
        avatarUrl: avatarUrl,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        tokenType: tokenData.token_type || 'Bearer',
        scope: tokenData.scope || 'identify guilds.join',
        serverId: serverId || 'web_verification',
        verifiedAt: new Date().toISOString(),
        userId: userData.id, // Required for Blink DB
        expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null
      };

      // Store in verified users table
      await blink.db.verifiedUsers.create(verificationRecord);

      console.log(`Discord user verified: ${userData.username}#${userData.discriminator} (${userData.id})`);

      return new Response(JSON.stringify({ 
        success: true, 
        user: {
          id: userData.id,
          username: userData.username,
          discriminator: userData.discriminator || '0',
          avatar: avatarUrl,
          email: userData.email
        },
        serverId: serverId
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Discord OAuth error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});