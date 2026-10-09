import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import DonorDashboard from '@/components/dashboard/DonorDashboard';
import RecipientDashboard from '@/components/dashboard/RecipientDashboard';
import HospitalDashboard from '@/components/dashboard/HospitalDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';

const titles = { donor: 'Donor Dashboard', recipient: 'Recipient Dashboard', hospital: 'Hospital Dashboard', admin: 'Admin Dashboard' } as const;

const Dashboard = () => {
  const { isAuthenticated, loading, role, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate('/login');
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <Layout hideFooter>
        <div className="min-h-screen flex items-center justify-center text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading your dashboard...
        </div>
      </Layout>
    );
  }
  if (!isAuthenticated || !role || !user) return null;

  return (
    <>
      <Helmet>
        <title>{titles[role]} | JeevanBindu</title>
        <meta name="description" content={`Your ${role} dashboard on JeevanBindu.`} />
      </Helmet>
      <Layout hideFooter>
        <div className="min-h-screen bg-muted/30">
          {role === 'donor' && <DonorDashboard user={user} />}
          {role === 'recipient' && <RecipientDashboard user={user} />}
          {role === 'hospital' && <HospitalDashboard user={user} />}
          {role === 'admin' && <AdminDashboard user={user} />}
        </div>
      </Layout>
    </>
  );
};

export default Dashboard;
