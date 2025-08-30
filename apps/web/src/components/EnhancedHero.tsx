import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  HeartIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  CalendarIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../hooks/useAuth";

const EnhancedHero: React.FC = () => {
  const { isLoggedIn, user } = useAuth();

  const features = [
    {
      icon: UserGroupIcon,
      title: "Family Connections",
      description:
        "Stay connected with your loved ones through our social platform",
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: "Real-time Chat",
      description: "Instant messaging with family members and groups",
    },
    {
      icon: DocumentTextIcon,
      title: "Document Sharing",
      description: "Securely store and share important family documents",
    },
    {
      icon: CalendarIcon,
      title: "Family Calendar",
      description: "Keep track of important family events and milestones",
    },
    {
      icon: PhotoIcon,
      title: "Memory Sharing",
      description: "Share and preserve precious family memories",
    },
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-hero-pattern"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Main Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            <div className="flex justify-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-lg"
              >
                <HeartIcon className="w-10 h-10 text-white" />
              </motion.div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Family
              </span>
              <br />
              <span className="text-text-base">Connection Hub</span>
            </h1>

            <p className="text-xl md:text-2xl text-text-muted mb-8 max-w-3xl mx-auto leading-relaxed">
              Bring your family closer together with our comprehensive platform
              for communication, sharing, and staying connected across
              distances.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {!isLoggedIn ? (
                <>
                  <Link to="/register">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Get Started Free
                    </motion.button>
                  </Link>
                  <Link to="/login">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 border-2 border-primary text-primary rounded-lg font-semibold text-lg hover:bg-primary hover:text-white transition-all duration-300"
                    >
                      Sign In
                    </motion.button>
                  </Link>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <h2 className="text-2xl font-semibold text-text-base mb-4">
                    Welcome back, {user?.username}!
                  </h2>
                  <Link to="/profile">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Go to Dashboard
                    </motion.button>
                  </Link>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-surface/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-text-base mb-2">
                  {feature.title}
                </h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            {[
              { number: "10K+", label: "Families Connected" },
              { number: "50K+", label: "Messages Shared" },
              { number: "99.9%", label: "Uptime Reliability" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.2 + index * 0.1, type: "spring" }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.number}
                </div>
                <div className="text-text-muted">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedHero;
