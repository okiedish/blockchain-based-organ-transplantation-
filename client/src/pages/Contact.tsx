import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send,
  Loader2,
  MessageSquare,
  Clock,
  ExternalLink
} from 'lucide-react';

const Contact = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill all fields');
      return;
    }

    // No mail backend in this prototype: hand the message to the user's mail client.
    const to = import.meta.env.VITE_CONTACT_EMAIL || 'team@example.com';
    const body = encodeURIComponent(`${formData.message}\n\n- ${formData.name} (${formData.email})`);
    window.location.href = `mailto:${to}?subject=${encodeURIComponent('JeevanBindu enquiry')}&body=${body}`;
    toast.info('Opening your email app to send the message.');
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Address',
      content: 'Academic project: add your institution address here',
    },
    {
      icon: Phone,
      title: 'Phone',
      content: 'Not a helpline: no phone support',
    },
    {
      icon: Mail,
      title: 'Email',
      content: import.meta.env.VITE_CONTACT_EMAIL || 'team@example.com',
    },
    {
      icon: Clock,
      title: 'Working Hours',
      content: 'Mon - Sat: 9:00 AM - 6:00 PM',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Contact Us | JeevanBindu</title>
        <meta name="description" content="Contact the JeevanBindu project team." />
      </Helmet>

      <Layout>
        <div className="min-h-screen py-12">
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Get in Touch</span>
              </div>
              <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Questions about this prototype? 
                We're here to help.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* Contact Form */}
              <Card>
                <CardContent className="pt-8">
                  <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="How can we help you?"
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="hero"
                      size="lg"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Contact Information</h2>
                <p className="text-muted-foreground">
                  You can also reach us through the following channels:
                </p>

                <div className="space-y-4">
                  {contactInfo.map((info) => (
                    <div
                      key={info.title}
                      className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border"
                    >
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <info.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{info.title}</h3>
                        <p className="text-muted-foreground text-sm">{info.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Links */}
                <div className="p-6 rounded-xl bg-muted">
                  <h3 className="font-semibold mb-4">Useful Links</h3>
                  <div className="space-y-3">
                    {[
                      
                      { label: 'Ministry of Health', url: 'https://mohfw.gov.in' },
                      { label: 'FAQs', url: '/faq' },
                      { label: 'Privacy Policy', url: '/privacy' },
                    ].map((link) => (
                      <a
                        key={link.label}
                        href={link.url}
                        target={link.url.startsWith('http') ? '_blank' : undefined}
                        rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>

                {/* Emergency */}
                <div className="p-6 rounded-xl bg-healthcare-red/10 border border-healthcare-red/20">
                  <h3 className="font-semibold mb-2 text-healthcare-red">Emergency Helpline</h3>
                  <p className="text-2xl font-bold mb-2">1800-XXX-XXXX</p>
                  <p className="text-sm text-muted-foreground">
                    Academic prototype: not a medical or emergency service
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default Contact;
