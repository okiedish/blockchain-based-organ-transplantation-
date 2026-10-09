import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Fingerprint, Building2, Shield, Loader2, Eye, EyeOff, Lock } from 'lucide-react';

const Login = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [activeTab, setActiveTab] = useState(searchParams.get('type') === 'hospital' ? 'hospital' : 'individual');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setIsLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}`);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const form = (
    <form onSubmit={handleLogin} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10"
          />
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <Button type="submit" className="w-full" variant="hero" size="lg" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Logging in...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Login
          </>
        )}
      </Button>
    </form>
  );

  return (
    <>
      <Helmet>
        <title>Login | JeevanBindu - Blood Donation Platform</title>
        <meta name="description" content="Login to JeevanBindu, a blockchain-backed blood donor and recipient management platform (academic prototype)." />
      </Helmet>

      <Layout>
        <div className="min-h-screen py-12 px-4 flex items-center">
          <div className="container max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Secure Login</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
              <p className="text-muted-foreground">Access your JeevanBindu dashboard</p>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 shadow-lg animate-scale-in">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="individual" className="gap-2">
                    <Fingerprint className="w-4 h-4" />
                    Donor / Recipient
                  </TabsTrigger>
                  <TabsTrigger value="hospital" className="gap-2">
                    <Building2 className="w-4 h-4" />
                    Hospital/Admin
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="individual">
                  {form}
                  <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Not registered yet?{' '}
                      <button onClick={() => navigate('/register')} className="text-primary hover:underline font-medium">
                        Register Now
                      </button>
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="hospital">
                  {form}
                  <div className="mt-6 p-4 rounded-lg bg-muted text-sm text-muted-foreground">
                    Hospital and admin accounts are created by the system administrator (<code>npm run seed</code> in the server).
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default Login;
