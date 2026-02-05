import React from 'react';
import {
    GithubLogo, 
    TwitterLogo, 
    LinkedinLogo,
    Envelope,
    Heart,
    Shield,
    Lock,
    FileText
} from '@phosphor-icons/react';

const Footer = ({ onOpenModal }) => {
    const currentYear = new Date().getFullYear();

    const socialLinks = [
        { icon: GithubLogo, href: 'https://github.com', label: 'GitHub' },
        { icon: TwitterLogo, href: 'https://twitter.com', label: 'Twitter' },
        { icon: LinkedinLogo, href: 'https://linkedin.com', label: 'LinkedIn' },
    ];

    return (
        <footer className="relative bg-slate-950 border-t border-white/5 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0">
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[128px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-[128px]" />
            </div>

            <div className="relative max-w-7xl mx-auto px-6 py-16">
                {/* Main footer content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand section */}
                    <div className="lg:col-span-1">
                        {/* Logo: echo in white, room in blue gradient */}
                        <div className="flex items-center mb-4">
                            <span className="text-2xl font-bold tracking-tight text-white">echo</span>
                            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">room</span>
                        </div>
                        <p className="text-white/50 mb-6 text-sm">
                            Secure, private video chat. Connect with anyone, anywhere, without compromising your privacy.
                        </p>
                        <div className="flex items-center gap-3">
                            {socialLinks.map((social) => (
                                <motion.a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{ scale: 1.1, y: -2 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-2.5 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                                    aria-label={social.label}
                                >
                                    <social.icon weight="fill" className="w-5 h-5" />
                                </motion.a>
                            ))}
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h4 className="text-white font-semibold mb-4 text-sm">Product</h4>
                        <ul className="space-y-3">
                            <li>
                                <a href="#features" className="text-white/50 hover:text-white transition-colors text-sm">
                                    Features
                                </a>
                            </li>
                            <li>
                                <a href="#how-it-works" className="text-white/50 hover:text-white transition-colors text-sm">
                                    How it Works
                                </a>
                            </li>
                            <li>
                                <a href="#security" className="text-white/50 hover:text-white transition-colors text-sm">
                                    Security
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h4 className="text-white font-semibold mb-4 text-sm">Legal</h4>
                        <ul className="space-y-3">
                            <li>
                                <button 
                                    onClick={() => onOpenModal?.('privacy')}
                                    className="text-white/50 hover:text-white transition-colors text-sm"
                                >
                                    Privacy Policy
                                </button>
                            </li>
                            <li>
                                <button 
                                    onClick={() => onOpenModal?.('terms')}
                                    className="text-white/50 hover:text-white transition-colors text-sm"
                                >
                                    Terms of Service
                                </button>
                            </li>
                            <li>
                                <button 
                                    onClick={() => onOpenModal?.('contact')}
                                    className="text-white/50 hover:text-white transition-colors text-sm"
                                >
                                    Contact Us
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-white font-semibold mb-4 text-sm">Company</h4>
                        <ul className="space-y-3">
                            <li>
                                <a href="#" className="text-white/50 hover:text-white transition-colors text-sm">
                                    About
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-white/50 hover:text-white transition-colors text-sm">
                                    Blog
                                </a>
                            </li>
                            <li>
                                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors text-sm">
                                    Open Source
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Trust badges */}
                <div className="flex flex-wrap items-center justify-center gap-6 py-8 border-y border-white/5 mb-8">
                    <div className="flex items-center gap-2 text-white/40">
                        <Shield weight="fill" className="w-5 h-5" />
                        <span className="text-sm">End-to-End Encryption</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/40">
                        <Lock weight="fill" className="w-5 h-5" />
                        <span className="text-sm">No Data Storage</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/40">
                        <Heart weight="fill" className="w-5 h-5" />
                        <span className="text-sm">Open Source</span>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/40">
                    <p>© {currentYear} echo. All rights reserved.</p>
                    <p className="flex items-center gap-1">
                        Made with <Heart weight="fill" className="w-4 h-4 text-red-400" /> for everyone
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
