import React, { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import ComponentSkeleton from '../components/ComponentSkeleton';

// Lazy loaded components for better performance
const FamilyCalendar = lazy(() => import('../components/FamilyCalendar'));
const WeatherWidget = lazy(() => import('../components/WeatherWidget'));
const FamilyTools = lazy(() => import('../components/FamilyTools'));

interface ActivityItem {
  id: string;
  type: 'event' | 'photo' | 'task';
  title: string;
  time: string;
  icon: string;
}

import WelcomeMessage from '../components/WelcomeMessage';

// Static data moved outside component to prevent recreation
const recentActivity: ActivityItem[] = [
  { id: '1', type: 'event', title: 'Added new event', time: '1 hour ago', icon: '📅' },
  { id: '2', type: 'photo', title: 'Shared family photo', time: '2 hours ago', icon: '📸' },
  { id: '3', type: 'task', title: 'Completed task', time: '3 hours ago', icon: '✅' },
];

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        <WelcomeMessage />

        {/* Quick Actions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className="bg-blue-500 text-white rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer shadow-lg"
            >
              <span className="text-4xl mb-2">📅</span>
              <span className="font-medium">Add Event</span>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className="bg-green-500 text-white rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer shadow-lg"
            >
              <span className="text-4xl mb-2">📸</span>
              <span className="font-medium">Share Photo</span>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className="bg-yellow-500 text-white rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer shadow-lg"
            >
              <span className="text-4xl mb-2">✅</span>
              <span className="font-medium">Add Task</span>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className="bg-red-500 text-white rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer shadow-lg"
            >
              <span className="text-4xl mb-2">🚨</span>
              <span className="font-medium">Emergency</span>
            </motion.div>
          </div>
        </section>
        
        {/* Recent Activity */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Recent Activity</h2>
            <button className="text-blue-600 dark:text-blue-400 font-medium hover:underline">View All</button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            {recentActivity.map((activity) => (
              <motion.div 
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center p-3 border-b last:border-b-0 border-gray-100 dark:border-gray-700"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-4">
                  <span className="text-xl">{activity.icon}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{activity.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Family Tools Grid */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Family Tools</h2>
            <button className="px-4 py-2 gradient-bg text-white rounded-lg hover:opacity-90 transition-opacity duration-200 shadow-md">
              Customize Tools
            </button>
          </div>
          <Suspense fallback={<ComponentSkeleton rows={2} height="h-48" />}>
            <FamilyTools />
          </Suspense>
        </section>

        {/* Important Notifications & Weather */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 card-hover">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Important Updates</h2>
              <Suspense fallback={<ComponentSkeleton rows={3} height="h-24" />}>
                
              </Suspense>
            </div>
          </div>
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 card-hover">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Local Weather</h2>
              <Suspense fallback={<ComponentSkeleton rows={1} height="h-64" />}>
                <WeatherWidget />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Family Calendar */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Family Calendar</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 card-hover">
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
