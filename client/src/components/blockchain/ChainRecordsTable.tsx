import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, ExternalLink, RefreshCw, RotateCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { ChainRecord } from '@/types';
import { ChainBadge } from './ChainBadge';

const short = (h?: string) => (h ? `${h.slice(0, 8)}…${h.slice(-6)}` : '—');

/** Lists the caller's blockchain records (the server scopes by role). Admins also get retry/refresh. */
export const ChainRecordsTable = ({ title = 'Blockchain Records', admin = false }: { title?: string; admin?: boolean }) => {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ['chain-records'], queryFn: () => api<{ records: ChainRecord[] }>('/blockchain/records') });

  const copy = (h: string) => navigator.clipboard.writeText(h).then(() => toast.success('Transaction hash copied'));

  const act = async (id: string, action: 'retry' | 'refresh') => {
    const t = toast.loading(action === 'retry' ? 'Submitting blockchain transaction...' : 'Checking transaction...');
    try {
      const { record } = await api<{ record: ChainRecord }>(`/blockchain/records/${id}/${action}`, { method: 'POST' });
      if (record.status === 'CONFIRMED') toast.success('Blockchain record confirmed.', { id: t });
      else toast.error(record.errorMessage || 'Blockchain transaction not confirmed.', { id: t });
    } catch (e: any) {
      toast.error(e.message, { id: t });
    }
    qc.invalidateQueries({ queryKey: ['chain-records'] });
  };

  const verify = async (id: string) => {
    try {
      const { verification: v } = await api<{ verification: any }>(`/blockchain/records/${id}/verify`);
      if (v.verified) toast.success('Database record matches the on-chain hash.');
      else toast.error(v.chainError || (v.databaseMatchesAnchor === false ? 'Database record no longer matches the anchored hash.' : 'On-chain hash does not match.'));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription>Only hashes are written to the chain; personal data stays in the database.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Loading blockchain records...</p>}
        {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
        {data && data.records.length === 0 && <p className="text-sm text-muted-foreground">No blockchain records yet. They appear after registration, verification, a match or a donation.</p>}
        {data && data.records.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Network / Block</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.records.map((r) => (
                  <TableRow key={r._id}>
                    <TableCell className="font-medium">{r.recordType}</TableCell>
                    <TableCell>
                      <ChainBadge status={r.status} />
                      {r.status !== 'CONFIRMED' && r.errorMessage && <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">{r.errorMessage}</p>}
                    </TableCell>
                    <TableCell>
                      {r.transactionHash ? (
                        <span className="inline-flex items-center gap-1 font-mono text-xs">
                          {short(r.transactionHash)}
                          <button aria-label="Copy transaction hash" onClick={() => copy(r.transactionHash!)}><Copy className="w-3 h-3" /></button>
                          {r.explorerUrl && (
                            <a href={r.explorerUrl} target="_blank" rel="noreferrer" aria-label="View on block explorer"><ExternalLink className="w-3 h-3" /></a>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.network || '—'}
                      {r.blockNumber != null && <span className="text-muted-foreground"> · #{r.blockNumber}</span>}
                    </TableCell>
                    <TableCell className="text-sm">{new Date(r.confirmedAt || r.createdAt).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      {r.status === 'CONFIRMED' && <Button size="sm" variant="ghost" onClick={() => verify(r._id)}>Verify</Button>}
                      {admin && r.status === 'FAILED' && <Button size="sm" variant="outline" onClick={() => act(r._id, 'retry')}><RotateCw className="w-3 h-3" />Retry</Button>}
                      {admin && r.status === 'PENDING' && r.transactionHash && <Button size="sm" variant="outline" onClick={() => act(r._id, 'refresh')}><RefreshCw className="w-3 h-3" />Refresh</Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
