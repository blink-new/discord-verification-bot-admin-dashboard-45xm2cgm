import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bot, Shield, Users, Link, Copy, CheckCircle } from 'lucide-react';
import { blink } from '@/blink/client';
import type { BotCommand, VerificationStats } from '@/types/discord';

export function BotInterface() {
  const [serverId, setServerId] = useState('');
  const [adminUserId, setAdminUserId] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [commands, setCommands] = useState<BotCommand[]>([]);
  const [copied, setCopied] = useState(false);

  const loadCommands = async () => {
    try {
      const result = await blink.db.botCommands.list({
        orderBy: { createdAt: 'desc' },
        limit: 10
      });
      setCommands(result);
    } catch (error) {
      console.error('Failed to load commands:', error);
    }
  };

  const loadStats = async () => {
    try {
      const verifiedUsers = await blink.db.verifiedUsers.list();
      const totalVerified = verifiedUsers.length;
      const recentVerifications = verifiedUsers.filter(
        user => new Date(user.verifiedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length;

      const serverBreakdown = verifiedUsers.reduce((acc, user) => {
        if (user.serverId) {
          const existing = acc.find(s => s.serverId === user.serverId);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ serverId: user.serverId, count: 1 });
          }
        }
        return acc;
      }, [] as { serverId: string; count: number }[]);

      setStats({
        totalVerified,
        recentVerifications,
        serverBreakdown
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  useEffect(() => {
    loadCommands();
    loadStats();
  }, []);

  const handleSetupVerify = async () => {
    if (!serverId || !adminUserId) return;

    try {
      const commandId = `cmd_${Date.now()}`;
      const verifyUrl = `${window.location.origin}/?guildid=${serverId}&cmd=${commandId}`;
      
      await blink.db.botCommands.create({
        id: commandId,
        commandType: 'setup_verify',
        serverId,
        adminUserId,
        verificationUrl: verifyUrl,
        createdAt: new Date().toISOString()
      });

      setVerificationUrl(verifyUrl);
      loadCommands();
    } catch (error) {
      console.error('Failed to setup verification:', error);
    }
  };

  const handlePullUsers = async () => {
    if (!serverId || !adminUserId) return;

    try {
      const commandId = `cmd_${Date.now()}`;
      await blink.db.botCommands.create({
        id: commandId,
        commandType: 'pull',
        serverId,
        adminUserId,
        createdAt: new Date().toISOString()
      });

      // In a real implementation, this would trigger the bot to add verified users to the server
      alert(`Pull command executed! Verified users will be added to server ${serverId}`);
      loadCommands();
    } catch (error) {
      console.error('Failed to execute pull command:', error);
    }
  };

  const handleStats = async () => {
    if (!serverId || !adminUserId) return;

    try {
      const commandId = `cmd_${Date.now()}`;
      await blink.db.botCommands.create({
        id: commandId,
        commandType: 'stats',
        serverId,
        adminUserId,
        createdAt: new Date().toISOString()
      });

      loadStats();
      loadCommands();
    } catch (error) {
      console.error('Failed to execute stats command:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Discord Bot Commands
          </CardTitle>
          <CardDescription>
            Simulate Discord bot commands for verification management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Server ID</label>
              <Input
                placeholder="Enter Discord server ID"
                value={serverId}
                onChange={(e) => setServerId(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Admin User ID</label>
              <Input
                placeholder="Enter admin user ID"
                value={adminUserId}
                onChange={(e) => setAdminUserId(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={handleSetupVerify}
              disabled={!serverId || !adminUserId}
              className="flex items-center gap-2"
            >
              <Link className="h-4 w-4" />
              !setup_verify
            </Button>
            <Button 
              onClick={handlePullUsers}
              disabled={!serverId || !adminUserId}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              !pull
            </Button>
            <Button 
              onClick={handleStats}
              disabled={!serverId || !adminUserId}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              !stats
            </Button>
          </div>

          {verificationUrl && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Verification URL Generated:</p>
                  <p className="text-xs text-muted-foreground break-all">{verificationUrl}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(verificationUrl)}
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Verification Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.totalVerified}</div>
                <div className="text-sm text-muted-foreground">Total Verified</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">{stats.recentVerifications}</div>
                <div className="text-sm text-muted-foreground">Last 24 Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.serverBreakdown.length}</div>
                <div className="text-sm text-muted-foreground">Active Servers</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Commands</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {commands.map((command) => (
              <div key={command.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">!{command.commandType}</Badge>
                  <span className="text-sm">Server: {command.serverId}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(command.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
            {commands.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No commands executed yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}