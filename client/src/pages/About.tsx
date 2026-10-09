import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Heart, 
  Shield, 
  Link as LinkIcon, 
  Fingerprint,
  Building2,
  Users,
  Target,
  Award,
  Lightbulb
} from 'lucide-react';

const features = [
  {
    icon: Fingerprint,
    title: 'Identity Review (Prototype)',
    description: 'Prototype identity review (upload, format check, admin approval). It is not UIDAI authentication.',
  },
  {
    icon: LinkIcon,
    title: 'Blockchain Powered',
    description: 'Ethereum blockchain records every transaction, ensuring immutability and transparency.',
  },
  {
    icon: Building2,
    title: 'Hospital Network',
    description: 'Hospital accounts confirm completed donations, which are then anchored on-chain.',
  },
  {
    icon: Shield,
    title: 'Data Security',
    description: 'End-to-end encryption, SSL certificates, and HIPAA-compliant data handling.',
  },
];

const About = () => {
  return (
    <>
      <Helmet>
        <title>About JeevanBindu | Blood Donation Prototype</title>
        <meta name="description" content="About JeevanBindu, an academic prototype of a blockchain-backed blood donation platform." />
      </Helmet>

      <Layout>
        <div className="min-h-screen py-12">
          {/* Hero Section */}
          <section className="container mx-auto px-4 mb-20">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Heart className="w-4 h-4 text-healthcare-red" />
                <span className="text-sm font-medium text-primary">About Us</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Saving Lives Through <span className="text-gradient">Technology</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                JeevanBindu is an academic prototype of a blockchain-backed blood donation platform, 
                built to show transparent, auditable donor-recipient record keeping.
              </p>
            </div>
          </section>

          {/* Mission Section */}
          <section className="bg-muted/50 py-20 mb-20">
            <div className="container mx-auto px-4">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-6 h-6 text-primary" />
                    <h2 className="text-3xl font-bold">Our Mission</h2>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    To demonstrate a transparent, auditable blood donation 
                    ecosystem in India by leveraging blockchain technology and government 
                    identity infrastructure.
                  </p>
                  <div className="space-y-4">
                    {[
                      'Make donation records tamper-evident',
                      'Provide real-time tracking for donors and recipients',
                      'Check identities through a reviewed, prototype workflow',
                      'Create an immutable audit trail for accountability',
                    ].map((point, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-healthcare-green/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-healthcare-green text-sm">✓</span>
                        </div>
                        <p className="text-foreground">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <div className="aspect-square max-w-md mx-auto bg-gradient-to-br from-primary/20 to-healthcare-teal/20 rounded-3xl flex items-center justify-center">
                    <div className="w-32 h-32 rounded-2xl gradient-primary shadow-glow flex items-center justify-center">
                      <Heart className="w-16 h-16 text-primary-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Architecture Section */}
          <section className="container mx-auto px-4 mb-20">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Lightbulb className="w-6 h-6 text-primary" />
                <h2 className="text-3xl font-bold">System Architecture</h2>
              </div>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Built with modern technologies for security, scalability, and transparency
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card key={feature.title} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tech Stack */}
            <div className="mt-12 p-8 rounded-2xl bg-card border border-border">
              <h3 className="text-xl font-semibold mb-6 text-center">Technology Stack</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Frontend', tech: 'React.js + Tailwind CSS' },
                  { label: 'Backend', tech: 'Node.js + Express.js' },
                  { label: 'Blockchain', tech: 'Solidity + Hardhat + ethers' },
                  { label: 'Database', tech: 'MongoDB' },
                  { label: 'Authentication', tech: 'JWT + prototype ID review' },
                  { label: 'Security', tech: 'SSL + Password Hashing' },
                  { label: 'Hosting', tech: 'Any Node host' },
                  { label: 'Cloud DB', tech: 'Docker / local' },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
                    <p className="font-medium">{item.tech}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Team Section */}
          
          {/* Benefits Section */}
          <section className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">
                Benefits of Blockchain-Anchored Records
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    title: 'Tamper-Proof Records',
                    description: 'Once data is recorded on the blockchain, it cannot be altered or deleted, ensuring complete integrity.',
                  },
                  {
                    title: 'Instant Verification',
                    description: 'Identity review (prototype) reduces duplicate and fake registrations.',
                  },
                  {
                    title: 'Smart Contract Automation',
                    description: 'Compatible donors are found by the matching engine; smart contracts anchor the resulting records.',
                  },
                  {
                    title: 'Complete Transparency',
                    description: 'Every stakeholder can verify transactions, building trust in the system.',
                  },
                  {
                    title: 'Decentralized Security',
                    description: 'No single point of failure - data is distributed across the blockchain network.',
                  },
                  {
                    title: 'Audit Compliance',
                    description: 'Complete audit trail for regulatory compliance and accountability.',
                  },
                ].map((benefit) => (
                  <Card key={benefit.title}>
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-2">{benefit.title}</h4>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        </div>
      </Layout>
    </>
  );
};

export default About;
