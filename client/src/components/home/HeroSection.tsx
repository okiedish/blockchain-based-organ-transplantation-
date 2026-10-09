import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, Shield, ArrowRight, Activity, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Statistics } from '@/types';

const HeroSection = () => {
  const { data } = useQuery({ queryKey: ['stats'], queryFn: () => api<Statistics>('/statistics') });
  const t = data?.totals;
  const fmt = (n?: number) => (n === undefined ? '—' : n.toLocaleString());
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 gradient-hero" />
      
      {/* Floating Elements */}
      <div className="absolute top-1/4 right-1/4 animate-float">
        <div className="w-16 h-16 rounded-2xl gradient-primary shadow-glow flex items-center justify-center">
          <Heart className="w-8 h-8 text-primary-foreground" />
        </div>
      </div>
      <div className="absolute bottom-1/3 left-1/4 animate-float" style={{ animationDelay: '2s' }}>
        <div className="w-12 h-12 rounded-xl bg-healthcare-teal shadow-teal-glow flex items-center justify-center">
          <Shield className="w-6 h-6 text-secondary-foreground" />
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-fade-in">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Blockchain-Anchored Records • Academic Prototype</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-up">
            <span className="text-foreground">Give the Gift of</span>
            <br />
            <span className="text-gradient">Life with JeevanBindu</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            A blood donation platform that matches compatible donors with recipients and anchors donation records on a blockchain. 
            Only hashes go on-chain; personal data stays in the database.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Button variant="hero" size="xl" asChild>
              <Link to="/register?type=donor">
                <Heart className="w-5 h-5" />
                Register as Donor
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="heroOutline" size="xl" asChild>
              <Link to="/register?type=recipient">
                <Users className="w-5 h-5" />
                Register as Recipient
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            {[
              { value: fmt(t?.totalDonors), label: 'Registered Donors', icon: Heart },
              { value: fmt(t?.totalRecipients), label: 'Registered Recipients', icon: Users },
              { value: fmt(t?.successfulMatches), label: 'Donor Matches', icon: Activity },
              { value: fmt(t?.completedDonations), label: 'Completed Donations', icon: Shield },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className="p-4 rounded-xl bg-card border border-border hover:shadow-lg transition-shadow"
              >
                <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
