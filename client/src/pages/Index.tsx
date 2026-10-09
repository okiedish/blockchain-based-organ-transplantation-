import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import HeroSection from '@/components/home/HeroSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import RegistrationOptions from '@/components/home/RegistrationOptions';
import BlockchainSection from '@/components/home/BlockchainSection';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>JeevanBindu - Blockchain-Enabled Blood Donation Platform</title>
        <meta name="description" content="JeevanBindu is an academic prototype that matches blood donors with recipients and anchors donation records on a blockchain for tamper evidence." />
        <meta name="keywords" content="blood donation, donor matching, blockchain, Solidity, MERN, academic prototype" />
      </Helmet>
      
      <Layout>
        <HeroSection />
        <FeaturesSection />
        <RegistrationOptions />
        <BlockchainSection />
      </Layout>
    </>
  );
};

export default Index;
