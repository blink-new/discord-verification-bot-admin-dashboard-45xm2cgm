import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Shield, ExternalLink, Server } from 'lucide-react';

export function VerificationPage() {
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);

  const guildId = searchParams.get('guildid') || searchParams.get('guild') || searchParams.get('server');
  const code = searchParams.get('code');

  const handleDiscordCallback = useCallback(async (authCode: string) => {
    setIsVerifying(true);
    setError('');

    try {
      // Call our backend function to handle Discord OAuth securely
      const response = await fetch(`https://45xm2cgm--discord-oauth.functions.blink.new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: authCode,
          redirectUri: window.location.origin + '/',
          serverId: guildId
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to verify with Discord');
      }

      setUserInfo({
        id: result.user.id,
        username: result.user.username,
        discriminator: result.user.discriminator || '0000',
        avatar: result.user.avatar,
        email: result.user.email
      });
      setIsVerified(true);

      // Clean up URL by removing the code parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('code');
      newUrl.searchParams.delete('state');
      window.history.replaceState({}, '', newUrl.toString());

    } catch (err) {
      setError('Failed to verify with Discord. Please try again.');
      console.error('Verification error:', err);
    } finally {
      setIsVerifying(false);
    }
  }, [guildId]);

  useEffect(() => {
    // Handle Discord OAuth callback
    if (code && !isVerified && !isVerifying) {
      handleDiscordCallback(code);
    }
  }, [code, isVerified, isVerifying, handleDiscordCallback]);

  const initiateDiscordAuth = () => {
    // Get Discord client ID from environment
    const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
    if (!clientId) {
      setError('Discord client ID not configured. Please add VITE_DISCORD_CLIENT_ID to your environment.');
      return;
    }
    
    const redirectUri = encodeURIComponent(`${window.location.origin}/`);
    const scope = 'identify guilds.join';
    const state = guildId || 'default';
    
    // Redirect to Discord OAuth - redirect back to main page with code
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}`;
    window.location.href = discordAuthUrl;
  };

  if (isVerified && userInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-accent" />
            </div>
            <CardTitle className="text-2xl">Verification Complete!</CardTitle>
            <CardDescription>
              You have successfully verified with Discord
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
              <Avatar>
                <AvatarImage src={userInfo.avatar} alt={userInfo.username} />
                <AvatarFallback>{userInfo.username[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{userInfo.username}</p>
                <p className="text-sm text-muted-foreground">#{userInfo.discriminator}</p>
              </div>
            </div>
            
            {guildId && (
              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="h-4 w-4" />
                  <p className="text-sm font-medium">Guild ID:</p>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{guildId}</p>
              </div>
            )}

            <div className="text-center">
              <Badge variant="secondary" className="mb-2">
                <Shield className="h-3 w-3 mr-1" />
                Verified User
              </Badge>
              <p className="text-xs text-muted-foreground">
                Your information has been securely stored and you can now be added to Discord servers using the !pull command.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Discord Verification</CardTitle>
          <CardDescription>
            Verify your Discord account to join the server
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {guildId && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Server className="h-4 w-4" />
                <p className="text-sm font-medium">Target Guild:</p>
              </div>
              <p className="text-xs text-muted-foreground font-mono">{guildId}</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            onClick={initiateDiscordAuth}
            disabled={isVerifying}
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white"
            size="lg"
          >
            {isVerifying ? (
              'Verifying...'
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Verify with Discord
              </>
            )}
          </Button>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              By verifying, you agree to allow this bot to store your Discord user information and access token for server management purposes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}