import React from 'react';
import { motion } from 'framer-motion';
import { 
    GithubLogo, 
    TwitterLogo, 
    LinkedinLogo,
    Envelope,
    Heart,
    Shield,
    Lock
} from '@phosphor-icons/react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const links = {
        product: [
            { name: 'Features', href: '#features' },
            { name: 'Privacy', href: '#privacy' },
            { name: 'Security', href: '#security' },
        ],
        company: [
            { name: 'About', href: '#' },
            { name: 'Blog', href: '#' },
            { name: 'Contact', href: '#' },
        ],
        legal: [
            { name: 'Terms', href: '#' },
            { name: 'Privacy', href: '#' },
            { name: 'Cookies', href: '#' },
        ]
    };

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
                    {/* Brand section */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500 blur-lg opacity-50" />
                                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                                    <span className="text-xl font-bold text-white">E</span>
                                </div>
                            </div>
                            <span className="text-2xl font-bold text-white">EchoRoom</span>
                        </div>
                        <p className="text-white/50 mb-6 max-w-sm">
                            Secure, private video chat. Connect with anyone, anywhere, without compromising your privacy.
                        </p>
                        <div className="flex items-center gap-4">
                            {socialLinks.map((social) => (
                                <motion.a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{ scale: 1.1, y: -2 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-3 rounded-xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                                    aria-label={social.label}
                                >
                                    <social.icon weight="fill" className="w-5 h-5" />
                                </motion.a>
                            ))}
                        </div>
                    </div>

                    {/* Links sections */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Product</h4>
                        <ul className="space-y-3">
                            {links.product.map((link) => (
                                <li key={link.name}>
                                    <a 
                                        href={link.href}
                                        className="text-white/50 hover:text-white transition-colors"
                                    >
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Company</h4>
                        <ul className="space-y-3">
                            {links.company.map((link) => (
                                <li key={link.name}>
                                    <a 
                                        href={link.href}
                                        className="text-white/50 hover:text-white transition-colors"
                                    >
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Legal</h4>
                        <ul className="space-y-3">
                            {links.legal.map((link) => (
                                <li key={link.name}>
                                    <a 
                                        href={link.href}
                                        className="text-white/50 hover:text-white transition-colors"
                                    >
                                        {link.name}
                                    </a>
                                </li>
                            ))}
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
                    <p>© {currentYear} EchoRoom. All rights reserved.</p>
                    <p className="flex items-center gap-1">
                        Made with <Heart weight="fill" className="w-4 h-4 text-red-400" /> for everyone
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
