import React, { useEffect, useState, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import ComponentSkeleton from '../components/ComponentSkeleton';

// Lazy loaded components for better performance
const FamilyCalendar = lazy(() => import('../components/FamilyCalendar'));
const QuickTools = lazy(() => import('../components/QuickTools'));
const WeatherWidget = lazy(() => import('../components/WeatherWidget'));
const ImportantNotifications = lazy(() => import('../components/ImportantNotifications'));
const FamilyTools = lazy(() => import('../components/FamilyTools'));

interface FeedItem {
  id: string;
  type: string;
  title: string;
  description: string;
  imageUrl?: string;
  link?: string;
  timestamp: string;
  priority?: 'high' | 'medium' | 'low';
  category?: string;
}



const HomePage: React.FC = () => {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/feed/dynamic-feed`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: FeedItem[] = await response.json();
        setFeed(data);
      } catch (error: unknown) {
        console.error('Error fetching feed data:', error);
        if (error instanceof Error) {
          setError(`Failed to fetch feed data: ${error.message}`);
        } else {
          setError('Failed to fetch feed data: Unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFeedData();
  }, []);

  if (loading) {
    return <div className="text-center mt-[50px]">Loading...</div>;
  }

  if (error) {
    return <div className="text-center mt-[50px] text-red-500">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-5xl font-extrabold mb-6 text-gray-800 dark:text-white drop-shadow-lg bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-secondary-500">
            Welcome to Our Family Portal
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300">Your central hub for family coordination and memories</p>
        </section>

        {/* Quick Access Tools */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Quick Actions</h2>
          <Suspense fallback={<ComponentSkeleton rows={1} height="h-32" />}>
            <QuickTools />
          </Suspense>
        </section>

        {/* Family Tools Grid */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Family Tools</h2>
            <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200">
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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Important Updates</h2>
              <Suspense fallback={<ComponentSkeleton rows={3} height="h-24" />}>
                <ImportantNotifications />
              </Suspense>
            </div>
          </div>
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
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
          <Suspense fallback={<ComponentSkeleton rows={1} height="h-96" />}>
            <FamilyCalendar />
          </Suspense>
        </section>

        {/* Family Feed */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Family Updates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {feed.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 flex flex-col transform transition-all duration-300 hover:scale-[1.02] ${
                  item.priority === 'high' ? 'border-l-4 border-red-500' :
                  item.priority === 'medium' ? 'border-l-4 border-yellow-500' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                  {item.category && (
                    <span className="px-2 py-1 text-sm rounded-full bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-100">
                      {item.category}
                    </span>
                  )}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4 flex-grow">{item.description}</p>
                {item.imageUrl && (
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full h-48 object-cover rounded-md mb-4"
                    loading="lazy"
                  />
                )}
                {item.link && (
                  <a 
                    href={item.link}
                    className="inline-flex items-center text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 mt-auto"
                  >
                    Learn More
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                )}
                <time className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {new Date(item.timestamp).toLocaleDateString()}
                </time>
              </motion.div>
            ))}
          </div>
        </section>
      </motion.div>
    </div>
  );
};

export default HomePage;