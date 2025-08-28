import React from "react";
import { Link } from "react-router-dom";

const ModernFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: "X (Twitter)",
      url: "https://twitter.com/familyportal",
      icon: (
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      color: "hover:text-gray-400",
    },
    {
      name: "Instagram",
      url: "https://instagram.com/familyportal",
      icon: (
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M12.017 0C8.396 0 7.929.013 6.71.072 5.493.131 4.73.333 4.058.63a5.888 5.888 0 00-2.126 1.384 5.888 5.888 0 00-1.384 2.126C.333 4.73.131 5.493.072 6.711.013 7.929 0 8.396 0 12.017s.013 4.088.072 5.306c.059 1.218.261 1.981.558 2.654a5.888 5.888 0 001.384 2.126 5.888 5.888 0 002.126 1.384c.673.297 1.436.499 2.654.558 1.218.059 1.685.072 5.306.072s4.088-.013 5.306-.072c1.218-.059 1.981-.261 2.654-.558a5.888 5.888 0 002.126-1.384 5.888 5.888 0 001.384-2.126c.297-.673.499-1.436.558-2.654.059-1.218.072-1.685.072-5.306s-.013-4.088-.072-5.306c-.059-1.218-.261-1.981-.558-2.654a5.888 5.888 0 00-1.384-2.126A5.888 5.888 0 0019.672.63C18.999.333 18.236.131 17.018.072 15.8.013 15.333 0 11.712 0h.305zm-.305 1.802c3.499 0 3.99.013 5.4.072 1.3.059 2.006.249 2.477.415.622.24 1.066.528 1.532.994.466.466.754.91.994 1.532.166.471.356 1.177.415 2.477.059 1.41.072 1.901.072 5.4s-.013 3.99-.072 5.4c-.059 1.3-.249 2.006-.415 2.477a4.118 4.118 0 01-.994 1.532 4.118 4.118 0 01-1.532.994c-.471.166-1.177.356-2.477.415-1.41.059-1.901.072-5.4.072s-3.99-.013-5.4-.072c-1.3-.059-2.006-.249-2.477-.415a4.118 4.118 0 01-1.532-.994 4.118 4.118 0 01-.994-1.532c-.166-.471-.356-1.177-.415-2.477-.059-1.41-.072-1.901-.072-5.4s.013-3.99.072-5.4c.059-1.3.249-2.006.415-2.477.24-.622.528-1.066.994-1.532.466-.466.91-.754 1.532-.994.471-.166 1.177-.356 2.477-.415 1.41-.059 1.901-.072 5.4-.072z"
            clipRule="evenodd"
          />
          <path
            fillRule="evenodd"
            d="M12.017 5.838a6.179 6.179 0 100 12.358 6.179 6.179 0 000-12.358zM12.017 15.991a3.813 3.813 0 110-7.626 3.813 3.813 0 010 7.626z"
            clipRule="evenodd"
          />
          <circle cx="18.406" cy="5.594" r="1.44" />
        </svg>
      ),
      color: "hover:text-pink-400",
    },
    {
      name: "YouTube",
      url: "https://youtube.com/@familyportal",
      icon: (
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z"
            clipRule="evenodd"
          />
        </svg>
      ),
      color: "hover:text-red-400",
    },
  ];

  const footerLinks = [
    {
      title: "Family",
      links: [
        { name: "Family Tree", href: "/family-tree" },
        { name: "Photo Albums", href: "/albums" },
        { name: "Family Events", href: "/events" },
        { name: "Memories", href: "/memories" },
      ],
    },
    {
      title: "Documents",
      links: [
        { name: "Upload Files", href: "/documents" },
        { name: "Shared Documents", href: "/documents/shared" },
        { name: "Archive", href: "/documents/archive" },
        { name: "Storage", href: "/storage" },
      ],
    },
    {
      title: "Account",
      links: [
        { name: "Profile", href: "/profile" },
        { name: "Settings", href: "/settings" },
        { name: "Privacy", href: "/privacy" },
        { name: "Security", href: "/security" },
      ],
    },
    {
      title: "Support",
      links: [
        { name: "Help Center", href: "/help" },
        { name: "Contact Us", href: "/contact" },
        { name: "Privacy Policy", href: "/privacy-policy" },
        { name: "Terms of Service", href: "/terms" },
      ],
    },
  ];

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-y-1"></div>
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-8">
          {/* Brand section */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <img
                src="/family-logo.svg"
                className="h-12 w-12 object-contain mr-3"
                alt="Family Portal Logo"
              />
              <div>
                <h3 className="text-2xl font-bold text-white">
                  Family <span className="text-secondary">Portal</span>
                </h3>
                <p className="text-sm text-white/70">Your Digital Family Hub</p>
              </div>
            </div>
            <p className="text-white/80 mb-6 leading-relaxed">
              Connect, share, and preserve your family's precious memories in
              one secure, beautiful digital space. Built with love for families
              everywhere.
            </p>

            {/* Social media links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-3 bg-white/10 rounded-full text-white/70 transition-all duration-300 hover:bg-white/20 hover:scale-110 ${social.color} backdrop-blur-sm border border-white/20`}
                  aria-label={`Follow us on ${social.name}`}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Footer links */}
          {footerLinks.map((section) => (
            <div key={section.title} className="lg:col-span-1">
              <h4 className="text-lg font-semibold text-white mb-4 border-b border-white/20 pb-2">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-white/70 hover:text-white hover:text-secondary transition-colors duration-200 text-sm flex items-center group"
                    >
                      <span className="group-hover:translate-x-1 transition-transform duration-200">
                        {link.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter signup */}
        <div className="border-t border-white/20 pt-8 mb-8">
          <div className="max-w-md mx-auto text-center">
            <h4 className="text-lg font-semibold text-white mb-2">
              Stay Connected
            </h4>
            <p className="text-white/70 text-sm mb-4">
              Get updates about new features and family sharing tips.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-l-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent backdrop-blur-sm"
              />
              <button className="px-6 py-2 bg-secondary hover:bg-secondary/80 text-white font-medium rounded-r-lg transition-colors duration-200">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom footer */}
        <div className="border-t border-white/20 pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-white/60">
          <div className="mb-4 md:mb-0">
            <p>&copy; {currentYear} Family Portal. All rights reserved.</p>
          </div>
          <div className="flex space-x-6">
            <Link
              to="/privacy-policy"
              className="hover:text-white transition-colors duration-200"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="hover:text-white transition-colors duration-200"
            >
              Terms of Service
            </Link>
            <Link
              to="/cookies"
              className="hover:text-white transition-colors duration-200"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default ModernFooter;
