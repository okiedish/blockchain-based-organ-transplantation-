import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Building2, Heart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { urgencyLabels } from '@/lib/referenceData';
import { BloodRequest, DonationView, MatchView, User } from '@/types';
import { ChainRecordsTable } from '@/components/blockchain/ChainRecordsTable';

const HospitalDashboard = ({ user }: { user: User }) => {
  const qc = useQueryClient();
  const [completing, setCompleting] = useState<string | null>(null);
  const requests = useQuery({ queryKey: ['requests'], queryFn: () => api<{ requests: BloodRequest[] }>('/requests') });
  const accepted = useQuery({ queryKey: ['matches', 'ACCEPTED'], queryFn: () => api<{ matches: MatchView[] }>('/matches?status=ACCEPTED') });
  const donors = useQuery({ queryKey: ['donors'], queryFn: () => api<{ donors: any[] }>('/donors') });
  const donations = useQuery({ queryKey: ['donations'], queryFn: () => api<{ donations: DonationView[] }>('/donations') });

  const complete = async (matchId: string) => {
    setCompleting(matchId);
    const t = toast.loading('Recording donation and submitting blockchain transaction...');
    try {
      const r = await api<{ blockchain?: any }>(`/donations/${matchId}/complete`, { method: 'POST' });
      const s = r.blockchain?.status;
      if (s === 'CONFIRMED') toast.success('Donation recorded. Blockchain record confirmed.', { id: t });
      else if (s === 'PENDING') toast.warning('Donation recorded. Waiting for blockchain confirmation; check the records table later.', { id: t });
      else toast.warning(`Donation recorded. Blockchain transaction could not be confirmed (${r.blockchain?.errorMessage ?? 'unknown reason'}). It can be retried by an admin.`, { id: t });
    } catch (e: any) {
      toast.error(e.message, { id: t });
    } finally {
      setCompleting(null);
      qc.invalidateQueries();
    }
  };

  const open = (requests.data?.requests ?? []).filter((r) => ['OPEN', 'MATCHED'].includes(r.status));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2"><Building2 className="w-6 h-6 text-primary" /><h1 className="text-3xl font-bold">{user.name}</h1></div>
        <p className="text-muted-foreground">Confirm donations from accepted donors and monitor open requests</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card><CardHeader className="pb-2"><CardDescription>Open Requests</CardDescription></CardHeader><CardContent><span className="text-2xl font-bold">{open.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Awaiting Donation</CardDescription></CardHeader><CardContent><span className="text-2xl font-bold">{accepted.data?.matches.length ?? 0}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Completed Donations</CardDescription></CardHeader><CardContent><span className="text-2xl font-bold">{donations.data?.donations.length ?? 0}</span></CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Heart className="w-5 h-5" />Accepted Donors Awaiting Donation</CardTitle>
          <CardDescription>Mark a donation as completed once the donor has donated</CardDescription>
        </CardHeader>
        <CardContent>
          {accepted.isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {accepted.data && accepted.data.matches.length === 0 && <p className="text-sm text-muted-foreground">No accepted donors waiting.</p>}
          {accepted.data && accepted.data.matches.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Donor</TableHead><TableHead>Group</TableHead><TableHead>For</TableHead><TableHead>Request</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                  {accepted.data.matches.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.donor?.name}</TableCell>
                      <TableCell>{m.donor?.bloodGroup}</TableCell>
                      <TableCell>{m.recipient?.name}</TableCell>
                      <TableCell>{m.request?.bloodGroup} · {m.request?.hospital} · {urgencyLabels[m.request?.urgency ?? 3]}</TableCell>
                      <TableCell className="text-right"><Button size="sm" variant="hero" disabled={completing === m.id} onClick={() => complete(m.id)}>Mark completed</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />Donor Directory</CardTitle>
          <CardDescription>Contact details are not shown here</CardDescription>
        </CardHeader>
        <CardContent>
          {donors.data && donors.data.donors.length === 0 && <p className="text-sm text-muted-foreground">No donors registered yet.</p>}
          {donors.data && donors.data.donors.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Group</TableHead><TableHead>City</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {donors.data.donors.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.name}</TableCell>
                      <TableCell>{d.bloodGroup}</TableCell>
                      <TableCell>{d.location?.city}</TableCell>
                      <TableCell className="space-x-1">
                        <Badge variant="outline">{d.verificationStatus}</Badge>
                        <Badge variant="outline">{d.available && d.eligible ? 'Available' : 'Unavailable'}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ChainRecordsTable title="Blockchain Records" />
    </div>
  );
};

export default HospitalDashboard;
