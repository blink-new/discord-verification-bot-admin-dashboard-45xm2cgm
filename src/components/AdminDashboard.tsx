import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Shield, Download, Eye, EyeOff, Copy, CheckCircle, Lock, Users, Database } from 'lucide-react';
import { blink } from '@/blink/client';
import type { VerifiedUser } from '@/types/discord';

const OWNER_KEY = 'Owner-A2fC-20AS-FAX2-MEL2-234';
const ADMIN_KEY = 'Admin-B3gD-30BS-GBY3-NEL3-345'; // Generated admin key

export function AdminDashboard() {
  const [accessKey, setAccessKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [verifiedUsers, setVerifiedUsers] = useState<VerifiedUser[]>([]);
  const [showTokens, setShowTokens] = useState(false);
  const [copied, setCopied] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    recentVerifications: 0,
    uniqueServers: 0
  });

  const loadVerifiedUsers = async () => {
    try {
      const users = await blink.db.verifiedUsers.list({
        orderBy: { verifiedAt: 'desc' }
      });
      setVerifiedUsers(users);
    } catch (error) {
      console.error('Failed to load verified users:', error);
    }
  };

  const loadStats = async () => {
    try {
      const users = await blink.db.verifiedUsers.list();
      const totalUsers = users.length;
      const recentVerifications = users.filter(
        user => new Date(user.verifiedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length;
      const uniqueServers = new Set(users.map(user => user.serverId).filter(Boolean)).size;

      setStats({
        totalUsers,
        recentVerifications,
        uniqueServers
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadVerifiedUsers();
      loadStats();
    }
  }, [isAuthenticated]);

  const handleAuthentication = async () => {
    if (accessKey === OWNER_KEY) {
      setIsAuthenticated(true);
      setIsOwner(true);
      
      // Store session
      await blink.db.adminSessions.create({
        id: `session_${Date.now()}`,
        sessionKey: accessKey,
        isOwner: true,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      });
    } else if (accessKey === ADMIN_KEY) {
      setIsAuthenticated(true);
      setIsOwner(false);
      
      // Store session
      await blink.db.adminSessions.create({
        id: `session_${Date.now()}`,
        sessionKey: accessKey,
        isOwner: false,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      });
    } else {
      alert('Invalid access key');
    }
  };

  const exportUserData = () => {
    const dataToExport = verifiedUsers.map(user => ({
      userId: user.userId,
      username: user.username,
      avatarUrl: user.avatarUrl,
      accessToken: isOwner ? user.accessToken : '[REDACTED]',
      verifiedAt: user.verifiedAt,
      serverId: user.serverId
    }));

    const jsonData = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verified_users_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsOwner(false);
    setAccessKey('');
    setVerifiedUsers([]);
    setShowTokens(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
            <CardDescription>
              Enter your access key to view verified user data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Access Key</label>
              <Input
                type="password"
                placeholder="Enter owner or admin key"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAuthentication()}
              />
            </div>

            <Button onClick={handleAuthentication} className="w-full" disabled={!accessKey}>
              <Lock className="h-4 w-4 mr-2" />
              Authenticate
            </Button>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Owner key provides full access including tokens.<br />
                Admin key provides limited access without tokens.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage Discord verification data
              <Badge variant={isOwner ? 'default' : 'secondary'} className="ml-2">
                {isOwner ? 'Owner' : 'Admin'}
              </Badge>
            </p>
          </div>
          <Button onClick={logout} variant="outline">
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Verified Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent (24h)</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.recentVerifications}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Servers</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueServers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Export and manage verified user data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button onClick={exportUserData} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export User Data
              </Button>
              {isOwner && (
                <Button
                  onClick={() => setShowTokens(!showTokens)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {showTokens ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showTokens ? 'Hide' : 'Show'} Access Tokens
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Verified Users</CardTitle>
            <CardDescription>
              All users who have completed Discord verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Server ID</TableHead>
                    <TableHead>Verified At</TableHead>
                    {isOwner && showTokens && <TableHead>Access Token</TableHead>}
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verifiedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatarUrl || undefined} alt={user.username} />
                            <AvatarFallback>{user.username[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.username}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{user.userId}</TableCell>
                      <TableCell className="font-mono text-sm">{user.serverId || 'N/A'}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(user.verifiedAt).toLocaleString()}
                      </TableCell>
                      {isOwner && showTokens && (
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {user.accessToken.substring(0, 20)}...
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(user.accessToken, user.id)}
                            >
                              {copied === user.id ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(user.userId, `user_${user.id}`)}
                        >
                          {copied === `user_${user.id}` ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {verifiedUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No verified users found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}