import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaInstagram, FaTwitter, FaFacebook, FaLinkedin } from "react-icons/fa";

const ModernFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Quick Links",
      links: [
        { to: "/privacy-policy", label: "Privacy Policy", icon: "🔒" },
        { to: "/terms-of-service", label: "Terms of Service", icon: "📋" },
        { to: "/sitemap", label: "Sitemap", icon: "🗺️" },
        { to: "/health", label: "System Health", icon: "💚" },
      ],
    },
  ];

  const socialLinks = [
    {
      href: "https://instagram.com",
      label: "Instagram",
      icon: <FaInstagram />,
      color: "text-pink-500",
    },
    {
      href: "https://twitter.com",
      label: "X (Twitter)",
      icon: <FaTwitter />,
      color: "text-sky-500",
    },
    {
      href: "https://facebook.com",
      label: "Facebook",
      icon: <FaFacebook />,
      color: "text-blue-600",
    },
    {
      href: "https://linkedin.com",
      label: "LinkedIn",
      icon: <FaLinkedin />,
      color: "text-blue-700",
    },
  ];

  return (
    <footer className="bg-gradient-to-br from-surface via-background to-surface border-t border-primary/20 mt-16">
      <div className="h-1 bg-gradient-to-r from-primary via-secondary to-accent"></div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Family Brand Section */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <h3
                className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2"
                style={{ fontFamily: "'Dancing Script', cursive" }}
              >
                युवा कुल्या
              </h3>
              <h4 className="text-xl font-semibold text-primary mb-3 font-playfair-display text-lg">
                Yuva Kulya
              </h4>
              <p className="text-muted text-sm leading-relaxed">
                A digital sanctuary where our family bonds flourish, memories
                are preserved, and love transcends distance.
              </p>
            </motion.div>
          </div>

          {/* Quick Links */}
          {footerSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: sectionIndex * 0.1 }}
            >
              <h5 className="text-lg font-semibold text-primary mb-4 flex items-center">
                <span className="w-2 h-2 bg-secondary rounded-full mr-2"></span>
                {section.title}
              </h5>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <motion.li
                    key={link.to}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: sectionIndex * 0.1 + linkIndex * 0.05,
                    }}
                  >
                    <Link
                      to={link.to}
                      className="text-muted hover:text-primary transition-colors duration-200 flex items-center group"
                    >
                      <span className="mr-2 group-hover:scale-110 transition-transform duration-200">
                        {link.icon}
                      </span>
                      <span className="group-hover:translate-x-1 transition-transform duration-200">
                        {link.label}
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h5 className="text-lg font-semibold text-primary mb-4 flex items-center">
              <span className="w-2 h-2 bg-secondary rounded-full mr-2"></span>
              Contact Us
            </h5>
            <div className="text-muted space-y-2 text-sm">
              <p>123 Family Grove</p>
              <p>Ourtown, World 45678</p>
              <p>Email: contact@yuvakulya.com</p>
              <p>Phone: (123) 456-7890</p>
            </div>
          </motion.div>

          {/* Newsletter Subscription */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h5 className="text-lg font-semibold text-primary mb-4 flex items-center">
              <span className="w-2 h-2 bg-secondary rounded-full mr-2"></span>
              Stay Connected
            </h5>
            <p className="text-muted text-sm mb-3">
              Subscribe to our newsletter for family updates.
            </p>
            <form className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="bg-surface/50 border border-primary/20 rounded-l-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 rounded-r-md font-semibold text-sm transition-colors"
              >
                Subscribe
              </button>
            </form>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="border-t border-primary/20 pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="text-center md:text-left">
              <p className="text-muted text-sm">
                © {currentYear}{" "}
                <span className="font-semibold text-primary">Yuva Kulya</span>.
                Made with <span className="text-red-500 animate-pulse">❤️</span>{" "}
                for our family.
              </p>
            </div>

            <div className="flex items-center gap-6">
              {/* Family Stats */}
              <div className="flex items-center text-sm text-muted">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                <span>Family Portal Active</span>
              </div>

              {/* Social Media Links */}
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1, y: -2 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`w-10 h-10 rounded-full bg-surface/50 backdrop-blur-sm border border-primary/20 flex items-center justify-center hover:bg-primary/10 transition-all duration-300 ${social.color}`}
                    title={social.label}
                  >
                    <span className="text-xl">{social.icon}</span>
                  </motion.a>
                ))}
              </div>

              {/* Language Selector Placeholder */}
              <div>
                <select className="bg-surface/50 border border-primary/20 rounded-md px-3 py-2 text-sm text-muted focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>English</option>
                  <option>हिन्दी</option>
                  <option>Español</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default ModernFooter;
