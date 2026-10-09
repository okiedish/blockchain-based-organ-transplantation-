import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Shield, Users, Heart, Activity, FileText, UserCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { BloodRequest, Statistics, User } from '@/types';
import { ChainRecordsTable } from '@/components/blockchain/ChainRecordsTable';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
const toPie = (o: Record<string, number>) => Object.entries(o).map(([name, value]) => ({ name, value }));

export const BlockchainStatusCard = () => {
  const { data, isLoading } = useQuery({ queryKey: ['chain-status'], queryFn: () => api<any>('/blockchain/status') });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" />Blockchain Connection</CardTitle>
        <CardDescription>Live status of the configured network and contract</CardDescription>
      </CardHeader>
      <CardContent className="text-sm space-y-1">
        {isLoading && <p className="text-muted-foreground">Checking...</p>}
        {data && (
          <>
            <p><Badge variant="outline" className={data.connected && data.contractDeployed ? 'text-healthcare-green' : 'text-destructive'}>{data.connected && data.contractDeployed ? 'Connected' : 'Not ready'}</Badge> <span className="text-muted-foreground">{data.message}</span></p>
            {data.network && <p>Network: {data.network} (chain {data.chainId}) · block {data.blockNumber}</p>}
            {data.contractAddress && <p className="font-mono text-xs break-all">Contract: {data.contractAddress}</p>}
            {data.totalRecords != null && <p>Records on-chain: {data.totalRecords}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
};

const AdminDashboard = ({ user: _user }: { user: User }) => {
  const qc = useQueryClient();
  const stats = useQuery({ queryKey: ['stats'], queryFn: () => api<Statistics>('/statistics') });
  const pending = useQuery({ queryKey: ['pending-verifications'], queryFn: () => api<{ users: (User & { checks: { nameMatchesProfile: boolean; dobMatchesProfile: boolean } })[] }>('/verification/pending') });
  const requests = useQuery({ queryKey: ['requests'], queryFn: () => api<{ requests: BloodRequest[] }>('/requests') });
  const audit = useQuery({ queryKey: ['audit'], queryFn: () => api<{ records: any[] }>('/audit?limit=25') });

  const review = async (id: string, decision: 'APPROVE' | 'REJECT') => {
    const t = toast.loading(decision === 'APPROVE' ? 'Approving and submitting blockchain transaction...' : 'Rejecting...');
    try {
      const r = await api<{ blockchain?: any }>(`/verification/${id}/review`, { method: 'POST', body: { decision, note: decision === 'REJECT' ? 'Details could not be matched' : undefined } });
      if (decision === 'REJECT') toast.success('Verification rejected.', { id: t });
      else if (r.blockchain?.status === 'CONFIRMED') toast.success('Identity verified. Blockchain record confirmed.', { id: t });
      else toast.warning('Identity verified. Blockchain anchoring is not confirmed; retry it from the records table.', { id: t });
    } catch (e: any) {
      toast.error(e.message, { id: t });
    }
    qc.invalidateQueries();
  };

  const s = stats.data;
  const cards = s && [
    { label: 'Total Donors', value: s.totals.totalDonors, icon: Heart },
    { label: 'Total Recipients', value: s.totals.totalRecipients, icon: Users },
    { label: 'Verified Users', value: s.totals.verifiedUsers, icon: UserCheck },
    { label: 'Open Requests', value: s.totals.openRequests, icon: Activity },
    { label: 'Successful Matches', value: s.totals.successfulMatches, icon: Shield },
    { label: 'Completed Donations', value: s.totals.completedDonations, icon: FileText },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2"><Shield className="w-6 h-6 text-primary" /><h1 className="text-3xl font-bold">Admin Dashboard</h1></div>
          <p className="text-muted-foreground">Platform overview, identity review, and blockchain audit</p>
        </div>
        <Badge variant="outline" className="gap-1 px-3 py-1 w-fit"><Shield className="w-3 h-3 text-healthcare-purple" />Admin Access</Badge>
      </div>

      {stats.isLoading && <p className="text-muted-foreground mb-6">Loading statistics...</p>}
      {stats.error && <p className="text-destructive mb-6">{(stats.error as Error).message}</p>}
      {cards && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          {cards.map((c) => (
            <Card key={c.label}><CardContent className="pt-6"><c.icon className="w-4 h-4 text-primary mb-2" /><p className="text-2xl font-bold">{c.value}</p><p className="text-xs text-muted-foreground">{c.label}</p></CardContent></Card>
          ))}
        </div>
      )}

      {s && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader><CardTitle>Donors by Blood Group</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%"><BarChart data={s.bloodGroupDistribution}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="bloodGroup" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="donors" fill="#EF4444" /></BarChart></ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Donations (last 6 months)</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%"><BarChart data={s.donationTrend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="donations" fill="#3B82F6" /></BarChart></ResponsiveContainer>
            </CardContent>
          </Card>
          {[{ t: 'Request Fulfilment', d: s.requestFulfillment }, { t: 'Verification Status', d: s.verificationStatus }].map(({ t, d }) => (
            <Card key={t}>
              <CardHeader><CardTitle>{t}</CardTitle></CardHeader>
              <CardContent className="h-56">
                {toPie(d).every((x) => x.value === 0) ? <p className="text-sm text-muted-foreground">No data yet.</p> : (
                  <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={toPie(d).filter((x) => x.value > 0)} dataKey="value" nameKey="name" outerRadius={70} label>{toPie(d).filter((x) => x.value > 0).map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="mb-6">
        <CardHeader><CardTitle className="flex items-center gap-2"><UserCheck className="w-5 h-5" />Pending Identity Verifications</CardTitle><CardDescription>Prototype review: compare the submitted details with the profile</CardDescription></CardHeader>
        <CardContent>
          {pending.data && pending.data.users.length === 0 && <p className="text-sm text-muted-foreground">Nothing waiting for review.</p>}
          {pending.data && pending.data.users.length > 0 && (
            <div className="overflow-x-auto"><Table>
              <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Aadhaar</TableHead><TableHead>Checks</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {pending.data.users.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell>{u.name}<p className="text-xs text-muted-foreground">{u.email}</p></TableCell>
                    <TableCell className="capitalize">{u.role}</TableCell>
                    <TableCell className="font-mono text-xs">{u.verification?.aadhaarMasked}</TableCell>
                    <TableCell className="text-xs">Name {u.checks.nameMatchesProfile ? '✓' : '✗'} · DOB {u.checks.dobMatchesProfile ? '✓' : '✗'}</TableCell>
                    <TableCell className="text-right space-x-2 whitespace-nowrap">
                      <Button size="sm" variant="hero" onClick={() => review(u._id, 'APPROVE')}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => review(u._id, 'REJECT')}>Reject</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <BlockchainStatusCard />
        <Card>
          <CardHeader><CardTitle>Recent Requests</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {requests.data && requests.data.requests.length === 0 && <p className="text-muted-foreground">No requests yet.</p>}
            {requests.data?.requests.slice(0, 6).map((r) => (
              <div key={r._id} className="flex justify-between"><span>{r.bloodGroup} · {r.units} unit(s) · {r.hospital}</span><Badge variant="outline">{r.status}</Badge></div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mb-6"><ChainRecordsTable title="Blockchain Audit" admin /></div>

      <Card>
        <CardHeader><CardTitle>Audit Log</CardTitle><CardDescription>Latest 25 actions</CardDescription></CardHeader>
        <CardContent>
          {audit.data && audit.data.records.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
          {audit.data && audit.data.records.length > 0 && (
            <div className="overflow-x-auto"><Table>
              <TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Actor</TableHead><TableHead>Action</TableHead><TableHead>Resource</TableHead></TableRow></TableHeader>
              <TableBody>
                {audit.data.records.map((a) => (
                  <TableRow key={a._id}>
                    <TableCell className="text-xs">{new Date(a.createdAt).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-sm">{a.actorId?.name ?? a.role}</TableCell>
                    <TableCell className="font-mono text-xs">{a.action}</TableCell>
                    <TableCell className="text-xs">{a.entityType}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
