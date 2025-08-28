import React, { Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import ComponentSkeleton from "../components/ComponentSkeleton";

// Lazy loaded components for better performance
const FamilyCalendar = lazy(() => import("../components/FamilyCalendar"));
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
      {/* Hero section with content behind navbar to show translucent effect */}
      <div className="relative h-40 gradient-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="display-2 gradient-text mb-2">
            Welcome to Your Family Portal
          </h1>
          <p className="body-lg text-on-surface/80">
            This content shows through the translucent navbar above!
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        <WelcomeMessage />

        {/* Quick Actions */}
        <section className="mb-12">
          <h2 className="headline mb-6 text-on-surface">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className="tool-item"
            >
              <span className="tool-icon text-4xl mb-2">📅</span>
              <span className="font-medium">Add Event</span>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className="tool-item"
            >
              <span className="tool-icon text-4xl mb-2">📸</span>
              <span className="font-medium">Share Photo</span>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className="tool-item"
            >
              <span className="tool-icon text-4xl mb-2">✅</span>
              <span className="font-medium">Add Task</span>
            </motion.div>

            <Link to="/family-tree">
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="tool-item cursor-pointer"
              >
                <span className="tool-icon text-4xl mb-2">🌳</span>
                <span className="font-medium">Family Tree</span>
              </motion.div>
            </Link>
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
              <FamilyCalendar />
            </Suspense>
          </div>
        </section>
      </motion.div>
    </div>
  );
};

export default HomePage;
