import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  User, 
  CheckCircle, 
  ArrowRight, 
  Shield,
  Heart,
  Loader2
} from 'lucide-react';
import { indianStates, bloodGroups } from '@/lib/referenceData';
import { useAuth } from '@/contexts/AuthContext';
import { ChainBadge } from '@/components/blockchain/ChainBadge';

type RegistrationType = 'donor' | 'recipient';

const Register = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { register } = useAuth();
  const [type, setType] = useState<RegistrationType>((searchParams.get('type') as RegistrationType) || 'donor');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [chain, setChain] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', password: '', dateOfBirth: '', gender: '', bloodGroup: '',
    state: '', city: '', hospital: '', consent: false,
  });

  useEffect(() => {
    const typeParam = searchParams.get('type') as RegistrationType;
    if (typeParam === 'donor' || typeParam === 'recipient') setType(typeParam);
  }, [searchParams]);

  const set = (k: keyof typeof formData, v: string | boolean) => setFormData((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.consent) return toast.error('Please accept the consent checkbox to proceed');
    if (!formData.name || !formData.email || !formData.bloodGroup || !formData.state || !formData.city || !formData.dateOfBirth)
      return toast.error('Please fill all required fields');

    setIsLoading(true);
    const t = toast.loading('Creating account and submitting blockchain transaction...');
    try {
      const r = await register({
        role: type,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        gender: formData.gender || undefined,
        dateOfBirth: formData.dateOfBirth,
        bloodGroup: formData.bloodGroup,
        location: { state: formData.state, city: formData.city, hospital: formData.hospital || undefined },
        consent: true,
      });
      setChain(r.blockchain);
      toast.success('Account created.', { id: t });
      setShowSuccess(true);
    } catch (err: any) {
      toast.error(err.message, { id: t });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Register | JeevanBindu - Blood Donation Platform</title>
        <meta name="description" content={`Register as a blood ${type} on JeevanBindu (academic prototype).`} />
      </Helmet>

      <Layout>
        <div className="min-h-screen py-12 px-4">
          <div className="container max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Identity checked after sign-up (prototype)</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Register as Blood {type === 'donor' ? 'Donor' : 'Recipient'}</h1>
              <p className="text-muted-foreground">Create your account, then complete identity verification from your dashboard</p>
            </div>

            <div className="flex gap-4 mb-8">
              <Button variant={type === 'donor' ? 'hero' : 'outline'} className="flex-1" onClick={() => setType('donor')}>
                <Heart className="w-4 h-4" />
                Register as Donor
              </Button>
              <Button variant={type === 'recipient' ? 'healthcare' : 'outline'} className="flex-1" onClick={() => setType('recipient')}>
                <User className="w-4 h-4" />
                Register as Recipient
              </Button>
            </div>

            <div className="bg-card rounded-2xl border border-border p-8 shadow-lg animate-scale-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-healthcare-teal/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-healthcare-teal" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{type === 'donor' ? 'Donor' : 'Recipient'} Details</h2>
                  <p className="text-sm text-muted-foreground">Account and basic profile</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" placeholder="As on your ID" value={formData.name} onChange={(e) => set('name', e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (10 digits)</Label>
                    <Input id="phone" type="tel" inputMode="numeric" placeholder="XXXXXXXXXX" value={formData.phone} onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" autoComplete="email" placeholder="your@email.com" value={formData.email} onChange={(e) => set('email', e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input id="password" type="password" autoComplete="new-password" placeholder="8+ characters, letters and digits" value={formData.password} onChange={(e) => set('password', e.target.value)} required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth *</Label>
                    <Input id="dob" type="date" value={formData.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={formData.gender} onValueChange={(v) => set('gender', v)}>
                      <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Blood Group *</Label>
                    <Select value={formData.bloodGroup} onValueChange={(v) => set('bloodGroup', v)}>
                      <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
                      <SelectContent>
                        {bloodGroups.map((bg) => (<SelectItem key={bg} value={bg}>{bg}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>State *</Label>
                    <Select value={formData.state} onValueChange={(v) => set('state', v)}>
                      <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                      <SelectContent>
                        {indianStates.map((st) => (<SelectItem key={st} value={st}>{st}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input id="city" placeholder="Your city" value={formData.city} onChange={(e) => set('city', e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hospital">Preferred Hospital</Label>
                    <Input id="hospital" placeholder="Hospital name" value={formData.hospital} onChange={(e) => set('hospital', e.target.value)} />
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
                  <Checkbox id="consent" checked={formData.consent} onCheckedChange={(c) => set('consent', c as boolean)} />
                  <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
                    I consent to my details being stored for donor-recipient matching. Only record hashes (no personal
                    data) are written to the blockchain. I confirm the information provided is accurate.
                  </Label>
                </div>

                <Button type="submit" variant="hero" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>

        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="mx-auto w-16 h-16 rounded-full bg-healthcare-green/20 flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-healthcare-green" />
              </div>
              <DialogTitle className="text-center text-2xl">Account Created</DialogTitle>
              <DialogDescription className="text-center">
                Next step: complete identity verification on your dashboard. An administrator reviews it before you can use matching.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <p className="text-xs text-muted-foreground">Blockchain registration record</p>
                {chain ? (
                  <>
                    <ChainBadge status={chain.status} />
                    {chain.transactionHash && <p className="text-xs font-mono break-all">{chain.transactionHash}</p>}
                    {chain.status !== 'CONFIRMED' && (
                      <p className="text-xs text-muted-foreground">
                        Your account is saved. Blockchain anchoring is {chain.status === 'PENDING' ? 'still pending' : 'not complete'}{chain.errorMessage ? `: ${chain.errorMessage}` : ''}. An admin can retry it.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Not recorded (blockchain unavailable).</p>
                )}
              </div>
              <Button className="w-full" variant="hero" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Layout>
    </>
  );
};

export default Register;
