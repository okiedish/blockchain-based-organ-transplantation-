import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, UserPlus, Building2, ArrowRight } from 'lucide-react';

const options = [
  {
    icon: Heart,
    title: 'Register as Donor',
    description: 'Register as a blood donor and respond to compatible requests near you.',
    href: '/register?type=donor',
    color: 'from-healthcare-red to-healthcare-orange',
    buttonVariant: 'hero' as const,
  },
  {
    icon: UserPlus,
    title: 'Register as Recipient',
    description: 'Register to raise blood requests and track donor responses.',
    href: '/register?type=recipient',
    color: 'from-healthcare-teal to-healthcare-green',
    buttonVariant: 'healthcare' as const,
  },
  {
    icon: Building2,
    title: 'Hospital Login',
    description: 'Hospital dashboard for confirming donations and viewing requests.',
    href: '/login?type=hospital',
    color: 'from-primary to-healthcare-purple',
    buttonVariant: 'default' as const,
  },
];

const RegistrationOptions = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Get Started Today
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose how you want to take part.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {options.map((option, index) => (
            <div
              key={option.title}
              className="group relative overflow-hidden rounded-2xl bg-card border border-border p-8 hover:shadow-2xl transition-all duration-500 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              
              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${option.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                <option.icon className="w-8 h-8 text-primary-foreground" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold mb-3">{option.title}</h3>
              <p className="text-muted-foreground text-sm mb-6">{option.description}</p>

              {/* Button */}
              <Button variant={option.buttonVariant} className="w-full group/btn" asChild>
                <Link to={option.href}>
                  Get Started
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RegistrationOptions;
