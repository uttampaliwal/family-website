import React, { Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import ComponentSkeleton from "../components/ComponentSkeleton";
import AnnouncementTicker from "../components/AnnouncementTicker";

// Lazy loaded components for better performance
const Calendar = lazy(() =>
  import("../components/calendar").then((module) => ({
    default: module.Calendar,
  })),
);
const WeatherWidget = lazy(() => import("../components/WeatherWidget"));
const FamilyTools = lazy(() => import("../components/FamilyTools"));
const ImportantNotifications = lazy(
  () => import("../components/ImportantNotifications"),
);

interface ActivityItem {
  id: string;
  type: "event" | "photo" | "task";
  title: string;
  time: string;
  icon: string;
}

import WelcomeMessage from "../components/WelcomeMessage";

// Static data moved outside component to prevent recreation
const recentActivity: ActivityItem[] = [
  {
    id: "1",
    type: "event",
    title: "Added new event",
    time: "1 hour ago",
    icon: "📅",
  },
  {
    id: "2",
    type: "photo",
    title: "Shared family photo",
    time: "2 hours ago",
    icon: "📸",
  },
  {
    id: "3",
    type: "task",
    title: "Completed task",
    time: "3 hours ago",
    icon: "✅",
  },
];

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Hero section with dynamic background */}
      <div className="relative h-48 overflow-hidden">
        {/* Animated background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/20"></div>
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-10 -right-10 w-64 h-64 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            rotate: [0, -3, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-10 -left-10 w-48 h-48 bg-gradient-to-br from-accent/10 to-primary/10 rounded-full blur-2xl"
        />

        {/* Hero content */}
        <div className="relative z-10 h-full flex items-center justify-center text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-3">
              Welcome to Yuva Kulya
            </h1>
            <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto">
              Welcome to the family hub.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-center mb-8 text-on-background">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <Link
              to="/documents/new"
              className="group bg-surface rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 hover:scale-105 border border-gray-200 dark:border-gray-700"
            >
              <div className="text-4xl mb-3">📄</div>
              <div className="font-semibold text-on-surface mb-1">
                New Document
              </div>
              <div className="text-sm text-muted">Create & share</div>
            </Link>

            <Link
              to="/chat"
              className="group bg-surface rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 hover:scale-105 border border-gray-200 dark:border-gray-700"
            >
              <div className="text-4xl mb-3">💬</div>
              <div className="font-semibold text-on-surface mb-1">
                Family Chat
              </div>
              <div className="text-sm text-muted">Stay connected</div>
            </Link>

            <Link
              to="/social-enhanced"
              className="group bg-surface rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 hover:scale-105 border border-gray-200 dark:border-gray-700"
            >
              <div className="text-4xl mb-3">📸</div>
              <div className="font-semibold text-on-surface mb-1">
                Share Photo
              </div>
              <div className="text-sm text-muted">Capture moments</div>
            </Link>

            <Link
              to="/family-tree"
              className="group bg-surface rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 hover:scale-105 border border-gray-200 dark:border-gray-700"
            >
              <div className="text-4xl mb-3">🌳</div>
              <div className="font-semibold text-on-surface mb-1">
                Family Tree
              </div>
              <div className="text-sm text-muted">Explore heritage</div>
            </Link>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        <WelcomeMessage />

        {/* Announcement Ticker */}
        <section className="mb-8">
          <AnnouncementTicker />
        </section>

        {/* Enhanced Quick Actions */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-primary mb-2">Family Hub</h2>
            <p className="text-muted">
              Everything you need to stay connected and organized
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                icon: "📅",
                label: "Add Event",
                color: "from-blue-500/20 to-purple-500/20",
                border: "border-blue-300/30",
              },
              {
                icon: "📸",
                label: "Share Photo",
                color: "from-pink-500/20 to-rose-500/20",
                border: "border-pink-300/30",
              },
              {
                icon: "✅",
                label: "Add Task",
                color: "from-green-500/20 to-emerald-500/20",
                border: "border-green-300/30",
              },
              {
                icon: "🌳",
                label: "Family Tree",
                color: "from-amber-500/20 to-orange-500/20",
                border: "border-amber-300/30",
                to: "/family-tree",
              },
            ].map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -8 }}
                whileTap={{ scale: 0.95 }}
                className={`relative bg-gradient-to-br ${action.color} backdrop-blur-sm rounded-2xl border ${action.border} p-6 cursor-pointer group transition-all duration-300 hover:shadow-xl`}
              >
                {action.to ? (
                  <Link to={action.to} className="block text-center">
                    <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">
                      {action.icon}
                    </div>
                    <span className="font-semibold text-on-surface group-hover:text-primary transition-colors duration-300">
                      {action.label}
                    </span>
                  </Link>
                ) : (
                  <div className="text-center">
                    <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">
                      {action.icon}
                    </div>
                    <span className="font-semibold text-on-surface group-hover:text-primary transition-colors duration-300">
                      {action.label}
                    </span>
                  </div>
                )}

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="headline text-on-surface">Recent Activity</h2>
            <button className="btn btn-ghost font-medium">View All</button>
          </div>

          <div className="bg-surface/50 backdrop-blur-sm rounded-xl shadow-lg p-6 card-float">
            {recentActivity.map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: 5 }}
                className="flex items-center p-3 border-b last:border-b-0 border-primary/10 rounded-lg hover:bg-background/30 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mr-4">
                  <span className="text-xl text-primary">{activity.icon}</span>
                </div>
                <div>
                  <p className="font-medium text-on-surface">
                    {activity.title}
                  </p>
                  <p className="text-sm text-muted">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Family Tools Grid */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="headline text-on-surface">Family Tools</h2>
            <button className="btn btn-secondary">Customize Tools</button>
          </div>
          <Suspense fallback={<ComponentSkeleton rows={2} height="h-48" />}>
            <FamilyTools />
          </Suspense>
        </section>

        {/* Important Notifications & Weather */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="headline mb-6 text-on-surface">
                Important Updates
              </h2>
              <Suspense fallback={<ComponentSkeleton rows={3} height="h-24" />}>
                <ImportantNotifications />
              </Suspense>
            </div>
          </div>
          <div>
            <div className="card">
              <h2 className="text-2xl font-bold mb-6 text-base">
                Local Weather
              </h2>
              <Suspense fallback={<ComponentSkeleton rows={1} height="h-64" />}>
                <WeatherWidget />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Family Calendar */}
        <section className="mb-12">
          <h2 className="headline mb-6 text-on-surface">Family Calendar</h2>
          <div className="card">
            <Suspense fallback={<ComponentSkeleton rows={1} height="h-96" />}>
              <Calendar />
            </Suspense>
          </div>
        </section>
      </motion.div>
    </div>
  );
};

export default HomePage;
