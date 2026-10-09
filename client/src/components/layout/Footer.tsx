import { Link } from 'react-router-dom';
import { Heart, Shield, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Heart className="w-8 h-8 text-healthcare-red fill-healthcare-red" />
                <Shield className="w-4 h-4 text-primary absolute -bottom-1 -right-1" />
              </div>
              <span className="text-xl font-bold">JeevanBindu</span>
            </div>
            <p className="text-primary-foreground/70 text-sm">
              Blood donor and recipient platform with blockchain-anchored records for 
              transparent, auditable donation records. Academic prototype.
            </p>
            <div className="flex items-center gap-2 text-xs text-primary-foreground/50">
              <Shield className="w-4 h-4" />
              <span>Blockchain-Anchored | Academic Prototype</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { href: '/', label: 'Home' },
                { href: '/register', label: 'Register' },
                { href: '/login', label: 'Login' },
                { href: '/transparency', label: 'Transparency Dashboard' },
                { href: '/about', label: 'About Us' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-primary-foreground/70">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Ministry of Health & Family Welfare, Nirman Bhawan, New Delhi - 110011</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>1800-XXX-XXXX (Toll Free)</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>support@jeevanbindu.gov.in</span>
              </li>
            </ul>
          </div>

          {/* Credits */}
          <div>
            <h4 className="font-semibold mb-4">Credits</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>Built with React, Express, MongoDB and Hardhat</li>
              <li>Smart contracts in Solidity (OpenZeppelin AccessControl)</li>
              <li>Not affiliated with any government body</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-primary-foreground/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-primary-foreground/50">
              © 2024 JeevanBindu. All rights reserved. A Government of India Initiative.
            </p>
            <div className="flex items-center gap-4 text-xs text-primary-foreground/50">
              <Link to="/privacy" className="hover:text-primary-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-primary-foreground transition-colors">
                Terms of Service
              </Link>
              <Link to="/accessibility" className="hover:text-primary-foreground transition-colors">
                Accessibility
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
