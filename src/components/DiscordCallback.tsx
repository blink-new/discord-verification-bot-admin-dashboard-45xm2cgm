import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { blink } from '../blink/client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export function DiscordCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing Discord authentication...');
  const [userInfo, setUserInfo] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          setStatus('error');
          setMessage(`Discord authentication failed: ${error}`);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('No authorization code received from Discord');
          return;
        }

        setMessage('Exchanging authorization code for access token...');

        // Call our Discord OAuth function
        const response = await fetch('https://discord-verification-bot-admin-dashboard-45xm2cgm.functions.blink.new/discord-oauth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            redirectUri: window.location.origin + '/auth/discord/callback',
            serverId: state
          })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setUserInfo(result.user);
          setStatus('success');
          setMessage(`Successfully verified as ${result.user.username}!`);
          
          // Redirect to verification page with success
          setTimeout(() => {
            window.location.href = `/verify/${state || 'default'}?success=true&user=${result.user.username}`;
          }, 2000);
        } else {
          throw new Error(result.error || 'Verification failed');
        }
      } catch (err: any) {
        console.error('Discord callback error:', err);
        setStatus('error');
        setMessage(err.message || 'An unexpected error occurred');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
            Discord Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">{message}</p>
          
          {status === 'success' && userInfo && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Welcome, <span className="font-medium">{userInfo.username}</span>!
              </div>
              <div className="text-sm text-muted-foreground">
                Redirecting to verification page...
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/80 transition-colors"
            >
              Return to Home
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DiscordCallback;