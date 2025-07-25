import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Server } from 'lucide-react';

export function VerificationPage() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');

  const guildId = searchParams.get('guildid') || searchParams.get('guild') || searchParams.get('server');

  const initiateDiscordAuth = () => {
    // Your actual Discord client ID
    const clientId = '1397971356490006558';
    
    const redirectUri = encodeURIComponent(`${window.location.origin}/callback`);
    const scope = 'guilds.join identify';
    const state = guildId || 'default';
    
    // Redirect to Discord OAuth - redirect back to callback page with code
    const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}`;
    window.location.href = discordAuthUrl;
  };

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
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white"
            size="lg"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Verify with Discord
          </Button>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              By verifying, you agree to allow this bot to store your Discord user information and access token for server management purposes.
            </p>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              Need to access bot commands or admin panel?
            </p>
            <div className="flex gap-2 justify-center">
              <a href="/bot" className="text-primary hover:underline text-sm">
                Bot Interface
              </a>
              <span className="text-muted-foreground">•</span>
              <a href="/admin" className="text-primary hover:underline text-sm">
                Admin Panel
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}