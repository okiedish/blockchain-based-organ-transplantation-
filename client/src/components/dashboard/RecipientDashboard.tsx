import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Shield, Activity, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { bloodGroups, indianStates, urgencyLabels } from '@/lib/referenceData';
import { BloodRequest, DonationView, MatchView, User } from '@/types';
import { VerificationPanel } from '@/components/verification/VerificationPanel';
import { ChainRecordsTable } from '@/components/blockchain/ChainRecordsTable';

const reqStyle: Record<string, string> = {
  OPEN: 'bg-healthcare-orange/10 text-healthcare-orange border-healthcare-orange/20',
  MATCHED: 'bg-primary/10 text-primary border-primary/20',
  FULFILLED: 'bg-healthcare-green/10 text-healthcare-green border-healthcare-green/20',
  CANCELLED: 'bg-muted text-muted-foreground',
};

const RecipientDashboard = ({ user }: { user: User }) => {
  const qc = useQueryClient();
  const verified = user.verification?.status === 'VERIFIED';
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ bloodGroup: user.bloodGroup ?? '', units: '1', urgency: '3', hospital: user.location?.hospital ?? '', state: user.location?.state ?? '', city: user.location?.city ?? '' });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const requests = useQuery({ queryKey: ['requests'], queryFn: () => api<{ requests: BloodRequest[] }>('/requests'), enabled: verified });
  const matches = useQuery({ queryKey: ['matches'], queryFn: () => api<{ matches: MatchView[] }>('/matches'), enabled: verified });
  const donations = useQuery({ queryKey: ['donations'], queryFn: () => api<{ donations: DonationView[] }>('/donations'), enabled: verified });

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bloodGroup || !form.hospital || !form.state || !form.city) return toast.error('Please fill blood group, hospital, state and city');
    setBusy(true);
    const t = toast.loading('Finding compatible donors...');
    try {
      const r = await api<{ candidatesFound: number }>('/requests', {
        method: 'POST',
        body: { bloodGroup: form.bloodGroup, units: Number(form.units), urgency: Number(form.urgency), hospital: form.hospital, location: { state: form.state, city: form.city } },
      });
      toast.success(`Request created. ${r.candidatesFound} compatible donor(s) found.`, { id: t });
      qc.invalidateQueries({ queryKey: ['requests'] });
    } catch (err: any) {
      toast.error(err.message, { id: t });
    } finally {
      setBusy(false);
    }
  };

  const action = async (id: string, what: 'cancel' | 'rematch') => {
    try {
      await api(`/requests/${id}/${what}`, { method: 'POST' });
      toast.success(what === 'cancel' ? 'Request cancelled.' : 'Search repeated.');
      qc.invalidateQueries({ queryKey: ['requests'] });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const accepted = (matches.data?.matches ?? []).filter((m) => m.status === 'ACCEPTED' || m.status === 'COMPLETED');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome, {user.name}</h1>
          <p className="text-muted-foreground">Raise blood requests and track donor responses</p>
        </div>
        <Badge variant="outline" className="gap-1 px-3 py-1 w-fit">
          <Shield className="w-3 h-3" />
          {verified ? 'Identity verified' : user.verification?.status === 'REQUIRES_REVIEW' ? 'Verification under review' : 'Not verified'}
        </Badge>
      </div>

      <VerificationPanel />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card><CardHeader className="pb-2"><CardDescription>Blood Group</CardDescription></CardHeader><CardContent><span className="text-3xl font-bold text-healthcare-red">{user.bloodGroup}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Open Requests</CardDescription></CardHeader><CardContent><span className="text-3xl font-bold">{(requests.data?.requests ?? []).filter((r) => ['OPEN', 'MATCHED'].includes(r.status)).length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Donations Received</CardDescription></CardHeader><CardContent><span className="text-3xl font-bold">{donations.data?.donations.length ?? 0}</span></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5" />New Blood Request</CardTitle>
            <CardDescription>{verified ? 'Compatible, verified, available donors are matched automatically' : 'Available after identity verification'}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={create} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Blood group</Label>
                  <Select value={form.bloodGroup} onValueChange={(v) => set('bloodGroup', v)} disabled={!verified}>
                    <SelectTrigger><SelectValue placeholder="Group" /></SelectTrigger>
                    <SelectContent>{bloodGroups.map((g) => (<SelectItem key={g} value={g}>{g}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Units</Label><Input type="number" min={1} max={10} value={form.units} onChange={(e) => set('units', e.target.value)} disabled={!verified} /></div>
                <div className="space-y-1">
                  <Label>Urgency</Label>
                  <Select value={form.urgency} onValueChange={(v) => set('urgency', v)} disabled={!verified}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{[1, 2, 3, 4, 5].map((n) => (<SelectItem key={n} value={String(n)}>{urgencyLabels[n]}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1"><Label>Hospital</Label><Input value={form.hospital} onChange={(e) => set('hospital', e.target.value)} disabled={!verified} placeholder="Hospital name" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>State</Label>
                  <Select value={form.state} onValueChange={(v) => set('state', v)} disabled={!verified}>
                    <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                    <SelectContent>{indianStates.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>City</Label><Input value={form.city} onChange={(e) => set('city', e.target.value)} disabled={!verified} /></div>
              </div>
              <Button type="submit" variant="hero" disabled={!verified || busy}>{busy && <Loader2 className="w-4 h-4 animate-spin" />}Create request</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />My Requests</CardTitle>
            <CardDescription>Status and donor responses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests.isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
            {requests.data && requests.data.requests.length === 0 && <p className="text-sm text-muted-foreground">No requests yet.</p>}
            {requests.data?.requests.map((r) => (
              <div key={r._id} className="p-4 rounded-lg border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-healthcare-red">{r.bloodGroup} · {r.unitsFulfilled}/{r.units} unit(s)</span>
                  <Badge variant="outline" className={reqStyle[r.status]}>{r.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{r.hospital}, {r.location.city} · {urgencyLabels[r.urgency]} · {r.candidateCount} compatible donor(s) notified</p>
                {['OPEN', 'MATCHED'].includes(r.status) && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => action(r._id, 'rematch')}>Search again</Button>
                    <Button size="sm" variant="ghost" onClick={() => action(r._id, 'cancel')}>Cancel</Button>
                  </div>
                )}
              </div>
            ))}
            {accepted.length > 0 && <p className="text-sm font-medium pt-2">Donors who accepted</p>}
            {accepted.map((m) => (
              <div key={m.id} className="p-3 rounded-lg bg-muted text-sm">
                {m.donor?.name} ({m.donor?.bloodGroup}){m.donor?.city ? `, ${m.donor.city}` : ''} · {m.status === 'COMPLETED' ? 'donated' : 'accepted'}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <ChainRecordsTable title="Blockchain Records For My Requests" />
    </div>
  );
};

export default RecipientDashboard;
