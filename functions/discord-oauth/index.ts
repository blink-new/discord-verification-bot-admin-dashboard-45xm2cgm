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
        return new Response(JSON.stringify({ error: 'Authorization code is required' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Exchange code for access token
      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: Deno.env.get('DISCORD_CLIENT_ID') || '',
          client_secret: Deno.env.get('DISCORD_CLIENT_SECRET') || '',
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('Token exchange failed:', errorData);
        return new Response(JSON.stringify({ error: 'Failed to exchange code for token' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const tokenData = await tokenResponse.json();

      // Get user info
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userResponse.ok) {
        return new Response(JSON.stringify({ error: 'Failed to fetch user information' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const userData = await userResponse.json();

      // Store verification data
      const verificationRecord = {
        id: `discord_${userData.id}`,
        discordId: userData.id,
        username: userData.username,
        discriminator: userData.discriminator || '0',
        avatarUrl: userData.avatar 
          ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
          : `https://cdn.discordapp.com/embed/avatars/${parseInt(userData.discriminator || '0') % 5}.png`,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        serverId: serverId || 'web_verification',
        verifiedAt: new Date().toISOString(),
        userId: userData.id
      };

      await blink.db.verifiedUsers.create(verificationRecord);

      return new Response(JSON.stringify({ 
        success: true, 
        user: {
          id: userData.id,
          username: userData.username,
          discriminator: userData.discriminator,
          avatar: verificationRecord.avatarUrl
        }
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
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});