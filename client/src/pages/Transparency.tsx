import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Heart, Users, Activity, Shield, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '@/lib/api';
import { Statistics } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { ChainRecordsTable } from '@/components/blockchain/ChainRecordsTable';
import { BlockchainStatusCard } from '@/components/dashboard/AdminDashboard';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
const toPie = (o: Record<string, number>) => Object.entries(o).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));

const Transparency = () => {
  const { isAuthenticated } = useAuth();
  const { data: s, isLoading, error } = useQuery({ queryKey: ['stats'], queryFn: () => api<Statistics>('/statistics') });

  const cards = s && [
    { label: 'Total Donors', value: s.totals.totalDonors, icon: Heart, color: 'text-healthcare-red' },
    { label: 'Recipients', value: s.totals.totalRecipients, icon: Users, color: 'text-primary' },
    { label: 'Verified Users', value: s.totals.verifiedUsers, icon: CheckCircle, color: 'text-healthcare-green' },
    { label: 'Open Requests', value: s.totals.openRequests, icon: Activity, color: 'text-healthcare-orange' },
    { label: 'Completed Donations', value: s.totals.completedDonations, icon: Shield, color: 'text-healthcare-purple' },
  ];

  return (
    <>
      <Helmet>
        <title>Transparency Dashboard | JeevanBindu</title>
        <meta name="description" content="Anonymised platform statistics for JeevanBindu, a blockchain-backed blood donation prototype." />
      </Helmet>

      <Layout>
        <div className="min-h-screen py-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Eye className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Public Dashboard</span>
              </div>
              <h1 className="text-4xl font-bold mb-4">Transparency Dashboard</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Anonymised counts computed live from the platform database. Donation, match and verification
                records are anchored on-chain as hashes so they can be checked for tampering.
              </p>
            </div>

            {isLoading && <p className="text-center text-muted-foreground">Loading statistics...</p>}
            {error && <p className="text-center text-destructive">{(error as Error).message}</p>}

            {cards && s && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
                  {cards.map((c) => (
                    <Card key={c.label} className="animate-slide-up">
                      <CardContent className="pt-6 text-center">
                        <c.icon className={`w-8 h-8 ${c.color} mx-auto mb-2`} />
                        <p className="text-3xl font-bold">{c.value.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{c.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
                  <Card>
                    <CardHeader><CardTitle>Donors by Blood Group</CardTitle><CardDescription>Registered donors</CardDescription></CardHeader>
                    <CardContent className="h-72">
                      <ResponsiveContainer width="100%" height="100%"><BarChart data={s.bloodGroupDistribution}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="bloodGroup" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="donors" fill="#EF4444" /></BarChart></ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle>Donation Trend</CardTitle><CardDescription>Completed donations, last 6 months</CardDescription></CardHeader>
                    <CardContent className="h-72">
                      <ResponsiveContainer width="100%" height="100%"><BarChart data={s.donationTrend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="donations" fill="#3B82F6" /></BarChart></ResponsiveContainer>
                    </CardContent>
                  </Card>
                  {[{ t: 'Request Fulfilment', d: s.requestFulfillment }, { t: 'Blockchain Anchoring', d: s.blockchain }].map(({ t, d }) => (
                    <Card key={t}>
                      <CardHeader><CardTitle>{t}</CardTitle></CardHeader>
                      <CardContent className="h-64">
                        {toPie(d).length === 0 ? <p className="text-sm text-muted-foreground">No data yet.</p> : (
                          <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={toPie(d)} dataKey="value" nameKey="name" outerRadius={80} label>{toPie(d).map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}

            <div className="grid grid-cols-1 gap-6">
              <BlockchainStatusCard />
              {isAuthenticated ? <ChainRecordsTable title="Blockchain Records You Can Access" /> : <p className="text-center text-sm text-muted-foreground">Log in to see the blockchain records linked to your account.</p>}
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default Transparency;
