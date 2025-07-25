import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Shield, Server, Loader2, AlertCircle } from 'lucide-react';

export function DiscordCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const guildId = state && state !== 'default' ? state : null;

  useEffect(() => {
    const handleDiscordCallback = async () => {
      if (!code) {
        setError('No authorization code received from Discord');
        setIsVerifying(false);
        return;
      }

      try {
        // Call our backend function to handle Discord OAuth securely
        const response = await fetch(`https://45xm2cgm--discord-oauth.functions.blink.new`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: code,
            redirectUri: `${window.location.origin}/callback`,
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
          avatar: result.user.avatar ? `https://cdn.discordapp.com/avatars/${result.user.id}/${result.user.avatar}.png` : null,
          email: result.user.email
        });
        setIsVerified(true);

      } catch (err: any) {
        setError(err.message || 'Failed to verify with Discord. Please try again.');
        console.error('Verification error:', err);
      } finally {
        setIsVerifying(false);
      }
    };

    handleDiscordCallback();
  }, [code, guildId]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            </div>
            <CardTitle className="text-2xl">Verifying...</CardTitle>
            <CardDescription>
              Processing your Discord authentication
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Verification Failed</CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <button 
              onClick={() => navigate('/')}
              className="text-primary hover:underline"
            >
              Try again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                <AvatarFallback>{userInfo.username[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{userInfo.username}</p>
                <p className="text-sm text-muted-foreground">#{userInfo.discriminator}</p>
                <p className="text-xs text-muted-foreground">ID: {userInfo.id}</p>
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

            <div className="text-center pt-4">
              <button 
                onClick={() => navigate('/')}
                className="text-primary hover:underline text-sm"
              >
                Return to verification page
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

export default DiscordCallback;