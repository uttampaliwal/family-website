import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import InfoPageLayout from "../components/InfoPageLayout";
import { FaSitemap, FaUser, FaCog, FaInfoCircle } from "react-icons/fa";

const sitemapSections = [
  {
    title: "Main Navigation",
    icon: <FaSitemap className="mr-3 text-secondary" />,
    links: [
      { path: "/", name: "Home" },
      { path: "/family-tree", name: "Family Tree" },
      { path: "/documents", name: "Documents" },
      { path: "/contact", name: "Contact Us" },
    ],
  },
  {
    title: "User Account",
    icon: <FaUser className="mr-3 text-secondary" />,
    links: [
      { path: "/profile", name: "My Profile" },
      { path: "/login", name: "Login" },
      { path: "/register", name: "Register" },
      { path: "/forgot-password", name: "Forgot Password" },
      { path: "/change-password", name: "Change Password" },
    ],
  },
  {
    title: "Administration",
    icon: <FaCog className="mr-3 text-secondary" />,
    links: [{ path: "/admin", name: "Admin Dashboard" }],
  },
  {
    title: "Legal & Information",
    icon: <FaInfoCircle className="mr-3 text-secondary" />,
    links: [
      { path: "/privacy-policy", name: "Privacy Policy" },
      { path: "/terms-of-service", name: "Terms of Service" },
      { path: "/health", name: "System Health" },
    ],
  },
];

const SitemapPage: React.FC = () => {
  return (
    <InfoPageLayout title="Sitemap" backTo="/">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sitemapSections.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-surface p-6 rounded-lg shadow-md border border-primary/10"
          >
            <h2 className="text-xl font-bold text-primary mb-4 flex items-center">
              {section.icon}
              {section.title}
            </h2>
            <ul className="space-y-3">
              {section.links.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-muted hover:text-primary hover:underline transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </InfoPageLayout>
  );
};

export default SitemapPage;
