import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Shield, CheckCircle, Clock, Heart, Check, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { urgencyLabels } from '@/lib/referenceData';
import { DonationView, MatchView, User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { VerificationPanel } from '@/components/verification/VerificationPanel';
import { ChainRecordsTable } from '@/components/blockchain/ChainRecordsTable';
import { ChainBadge } from '@/components/blockchain/ChainBadge';

const statusStyle: Record<string, string> = {
  VERIFIED: 'bg-healthcare-green/10 text-healthcare-green border-healthcare-green/20',
  REQUIRES_REVIEW: 'bg-healthcare-orange/10 text-healthcare-orange border-healthcare-orange/20',
  REJECTED: 'bg-destructive/10 text-destructive border-destructive/20',
  UNVERIFIED: 'bg-muted text-muted-foreground',
};
const statusLabel: Record<string, string> = { VERIFIED: 'Identity verified', REQUIRES_REVIEW: 'Verification under review', REJECTED: 'Verification rejected', UNVERIFIED: 'Not verified' };

const DonorDashboard = ({ user }: { user: User }) => {
  const qc = useQueryClient();
  const { refresh } = useAuth();
  const vstatus = user.verification?.status ?? 'UNVERIFIED';

  const profile = useQuery({ queryKey: ['donor-me'], queryFn: () => api<{ available: boolean; eligibility: { eligible: boolean; reasons: string[] } }>('/donors/me') });
  const matches = useQuery({ queryKey: ['matches'], queryFn: () => api<{ matches: MatchView[] }>('/matches'), enabled: vstatus === 'VERIFIED' });
  const donations = useQuery({ queryKey: ['donations'], queryFn: () => api<{ donations: DonationView[] }>('/donations') });

  const toggleAvailability = async () => {
    try {
      await api('/donors/me/availability', { method: 'PATCH', body: { available: !profile.data?.available } });
      toast.success(profile.data?.available ? 'You are now unavailable.' : 'You are now available for requests.');
      qc.invalidateQueries({ queryKey: ['donor-me'] });
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const respond = async (id: string, action: 'accept' | 'decline') => {
    const t = toast.loading(action === 'accept' ? 'Accepting request and submitting blockchain transaction...' : 'Declining...');
    try {
      const r = await api<{ blockchain?: any }>(`/matches/${id}/${action}`, { method: 'POST' });
      if (action === 'decline') toast.success('Offer declined.', { id: t });
      else if (r.blockchain?.status === 'CONFIRMED') toast.success('Accepted. Blockchain record confirmed.', { id: t });
      else toast.warning('Accepted. Your match is saved, but blockchain anchoring is not confirmed yet and may need a retry.', { id: t });
    } catch (e: any) {
      toast.error(e.message, { id: t });
    }
    qc.invalidateQueries({ queryKey: ['matches'] });
    qc.invalidateQueries({ queryKey: ['chain-records'] });
  };

  const offers = (matches.data?.matches ?? []).filter((m) => m.status === 'OFFERED');
  const accepted = (matches.data?.matches ?? []).filter((m) => m.status === 'ACCEPTED');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome, {user.name}</h1>
          <p className="text-muted-foreground">Manage your availability, respond to blood requests and view your records</p>
        </div>
        <Badge variant="outline" className={`gap-1 px-3 py-1 ${statusStyle[vstatus]}`}>
          <Shield className="w-3 h-3" />
          {statusLabel[vstatus]}
        </Badge>
      </div>

      <VerificationPanel />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2"><CardDescription>Availability</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <Badge className={`text-base px-4 py-1 ${profile.data?.available ? statusStyle.VERIFIED : statusStyle.UNVERIFIED}`}>
              {profile.data?.available ? <CheckCircle className="w-4 h-4 mr-1" /> : <Clock className="w-4 h-4 mr-1" />}
              {profile.isLoading ? 'Loading...' : profile.data?.available ? 'Available' : 'Unavailable'}
            </Badge>
            <div><Button size="sm" variant="outline" onClick={toggleAvailability} disabled={!profile.data}>Change availability</Button></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Blood Group</CardDescription></CardHeader>
          <CardContent><span className="text-3xl font-bold text-healthcare-red">{user.bloodGroup}</span></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Donation Eligibility</CardDescription></CardHeader>
          <CardContent>
            {profile.data?.eligibility.eligible ? (
              <span className="text-sm text-healthcare-green font-medium">Eligible to donate</span>
            ) : (
              <ul className="text-sm text-muted-foreground list-disc pl-4">{(profile.data?.eligibility.reasons ?? ['Loading...']).map((r) => (<li key={r}>{r}</li>))}</ul>
            )}
            <p className="text-xs text-muted-foreground mt-2">Basic platform rules only, not a medical screening.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Heart className="w-5 h-5" />Compatible Requests</CardTitle>
            <CardDescription>Requests matched to your blood group, verified status and location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {vstatus !== 'VERIFIED' && <p className="text-sm text-muted-foreground">Requests appear here after your identity is verified.</p>}
            {matches.isLoading && vstatus === 'VERIFIED' && <p className="text-sm text-muted-foreground">Finding compatible requests...</p>}
            {vstatus === 'VERIFIED' && matches.data && offers.length === 0 && <p className="text-sm text-muted-foreground">No open requests for you right now.</p>}
            {offers.map((m) => (
              <div key={m.id} className="p-4 rounded-lg border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-healthcare-red">{m.request?.bloodGroup} · {m.request?.units} unit(s)</span>
                  <Badge variant="outline">{urgencyLabels[m.request?.urgency ?? 3]}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{m.request?.hospital}, {m.request?.location.city}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="hero" onClick={() => respond(m.id, 'accept')}><Check className="w-4 h-4" />Accept</Button>
                  <Button size="sm" variant="outline" onClick={() => respond(m.id, 'decline')}><X className="w-4 h-4" />Decline</Button>
                </div>
              </div>
            ))}
            {accepted.map((m) => (
              <div key={m.id} className="p-4 rounded-lg bg-muted text-sm">
                Accepted: {m.request?.bloodGroup} at {m.request?.hospital}. Please visit the hospital; they will record your donation.
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />Donation History</CardTitle>
            <CardDescription>Completed donations recorded by hospitals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {donations.isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
            {donations.data && donations.data.donations.length === 0 && <p className="text-sm text-muted-foreground">No donations yet.</p>}
            {donations.data?.donations.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-border text-sm">
                <span>{d.units} unit(s) {d.bloodGroup} · {d.hospital}</span>
                <span className="text-muted-foreground">{new Date(d.completedAt).toLocaleDateString('en-IN')}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <ChainRecordsTable title="My Blockchain Records" />
    </div>
  );
};

export default DonorDashboard;
