import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Link as LinkIcon, 
  CheckCircle, 
  Eye, 
  Lock,
  ArrowRight
} from 'lucide-react';

const blockchainBenefits = [
  {
    icon: CheckCircle,
    title: 'Immutable Records',
    description: 'Once recorded, data cannot be altered or deleted',
  },
  {
    icon: Eye,
    title: 'Full Transparency',
    description: 'All stakeholders can verify transactions',
  },
  {
    icon: Lock,
    title: 'Decentralized Security',
    description: 'No single point of failure or manipulation',
  },
];

const BlockchainSection = () => {
  return (
    <section className="py-20 bg-foreground text-primary-foreground overflow-hidden relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-6">
              <LinkIcon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Powered by Ethereum</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Blockchain Transparency for Trust
            </h2>

            <p className="text-primary-foreground/70 mb-8">
              JeevanBindu leverages Ethereum blockchain technology to create an 
              tamper-evident hash of every registration, verification, match and donation, 
              match, and transfer. This ensures accountability and eliminates 
              tampering with the audit trail.
            </p>

            <div className="space-y-4 mb-8">
              {blockchainBenefits.map((benefit) => (
                <div key={benefit.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{benefit.title}</h4>
                    <p className="text-sm text-primary-foreground/60">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="hero" size="lg" asChild>
              <Link to="/transparency">
                View Public Ledger
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="aspect-square max-w-md mx-auto">
              {/* Blockchain Nodes */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-2xl gradient-primary shadow-glow animate-pulse-slow flex items-center justify-center">
                  <LinkIcon className="w-16 h-16 text-primary-foreground" />
                </div>
              </div>
              
              {/* Connecting Lines */}
              {[0, 60, 120, 180, 240, 300].map((angle) => (
                <div
                  key={angle}
                  className="absolute top-1/2 left-1/2 w-24 h-0.5 bg-gradient-to-r from-primary to-transparent origin-left"
                  style={{ transform: `rotate(${angle}deg)` }}
                />
              ))}

              {/* Orbiting Nodes */}
              {[0, 60, 120, 180, 240, 300].map((angle, index) => (
                <div
                  key={angle}
                  className="absolute w-12 h-12 rounded-xl bg-primary/30 border border-primary/50 flex items-center justify-center"
                  style={{
                    top: `${50 + 40 * Math.sin((angle * Math.PI) / 180)}%`,
                    left: `${50 + 40 * Math.cos((angle * Math.PI) / 180)}%`,
                    transform: 'translate(-50%, -50%)',
                    animationDelay: `${index * 0.2}s`,
                  }}
                >
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BlockchainSection;
