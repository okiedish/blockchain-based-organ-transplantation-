import { 
  Shield, 
  Fingerprint, 
  Activity, 
  Lock, 
  Globe, 
  Zap 
} from 'lucide-react';

const features = [
  {
    icon: Fingerprint,
    title: 'Aadhar Verification',
    description: 'Prototype identity check (document upload, format check and admin review). Not UIDAI authentication.',
    color: 'text-healthcare-blue',
    bgColor: 'bg-healthcare-blue/10',
  },
  {
    icon: Shield,
    title: 'Blockchain Transparency',
    description: 'Every registration and match is recorded on Ethereum blockchain for immutable audit trails.',
    color: 'text-healthcare-purple',
    bgColor: 'bg-healthcare-purple/10',
  },
  {
    icon: Activity,
    title: 'Real-time Dashboard',
    description: 'Hospitals see accepted donors and confirm completed donations.',
    color: 'text-healthcare-teal',
    bgColor: 'bg-healthcare-teal/10',
  },
  {
    icon: Lock,
    title: 'Data Security',
    description: 'End-to-end encryption with SSL certificates protects all sensitive medical data.',
    color: 'text-healthcare-red',
    bgColor: 'bg-healthcare-red/10',
  },
  {
    icon: Globe,
    title: 'Nationwide Network',
    description: 'Hospital accounts confirm donations, which are then anchored on-chain.',
    color: 'text-healthcare-green',
    bgColor: 'bg-healthcare-green/10',
  },
  {
    icon: Zap,
    title: 'Smart Matching',
    description: 'AI-powered matching algorithm considers blood type, location, and urgency for optimal allocation.',
    color: 'text-healthcare-orange',
    bgColor: 'bg-healthcare-orange/10',
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose <span className="text-gradient">JeevanBindu</span>?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Built with cutting-edge technology to ensure transparency, security, 
            and efficiency in blood donor-recipient matching.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl bg-card border border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-14 h-14 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
