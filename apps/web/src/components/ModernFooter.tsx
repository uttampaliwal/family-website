import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const ModernFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Family Portal",
      links: [
        { to: "/", label: "Home", icon: "🏠" },
        { to: "/family-tree", label: "Family Tree", icon: "🌳" },
        { to: "/documents", label: "Documents", icon: "📄" },
        { to: "/profile", label: "Profile", icon: "👤" },
      ],
    },
    {
      title: "Account",
      links: [
        { to: "/login", label: "Login", icon: "🔐" },
        { to: "/register", label: "Register", icon: "📝" },
        { to: "/forgot-password", label: "Reset Password", icon: "🔑" },
        { to: "/change-password", label: "Change Password", icon: "🛡️" },
      ],
    },
    {
      title: "Information",
      links: [
        { to: "/contact", label: "Contact Us", icon: "📞" },
        { to: "/privacy-policy", label: "Privacy Policy", icon: "🔒" },
        { to: "/terms-of-service", label: "Terms of Service", icon: "📋" },
        { to: "/health", label: "System Health", icon: "💚" },
      ],
    },
  ];

  const socialLinks = [
    {
      href: "#",
      label: "Family WhatsApp",
      icon: "💬",
      color: "text-green-500",
    },
    { href: "#", label: "Family Photos", icon: "📸", color: "text-blue-500" },
    {
      href: "#",
      label: "Family Calendar",
      icon: "📅",
      color: "text-purple-500",
    },
    {
      href: "#",
      label: "Family Newsletter",
      icon: "📰",
      color: "text-orange-500",
    },
  ];

  return (
    <footer className="bg-gradient-to-br from-surface via-background to-surface border-t border-primary/20 mt-16">
      {/* Decorative top border */}
      <div className="h-1 bg-gradient-to-r from-primary via-secondary to-accent"></div>

      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
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
              <h4
                className="text-xl font-semibold text-primary mb-3"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Yuva Kulya
              </h4>
              <p className="text-muted text-sm leading-relaxed">
                A digital sanctuary where our family bonds flourish, memories
                are preserved, and love transcends distance. Together we grow,
                together we thrive.
              </p>
            </motion.div>

            {/* Social/Family Links */}
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`w-10 h-10 rounded-full bg-surface/50 backdrop-blur-sm border border-primary/20 flex items-center justify-center hover:bg-primary/10 transition-all duration-300 ${social.color}`}
                  title={social.label}
                >
                  <span className="text-lg">{social.icon}</span>
                </motion.a>
              ))}
            </div>
          </div>

          {/* Navigation Sections */}
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
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="border-t border-primary/20 pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-center md:text-left">
              <p className="text-muted text-sm">
                © {currentYear}{" "}
                <span className="font-semibold text-primary">Yuva Kulya</span>.
                Made with <span className="text-red-500 animate-pulse">❤️</span>{" "}
                for our family.
              </p>
            </div>

            {/* Family Stats */}
            <div className="flex items-center space-x-6 text-sm text-muted">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                <span>Family Portal Active</span>
              </div>
              <div className="flex items-center">
                <span className="mr-1">🌟</span>
                <span>Connecting Hearts Since 2024</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Decorative bottom elements */}
      <div className="relative h-2 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent opacity-50 blur-sm"></div>
      </div>
    </footer>
  );
};

export default ModernFooter;
