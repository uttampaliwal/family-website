import React, { useEffect, useState } from 'react';



interface FeedItem {
  id: string;
  type: string;
  title: string;
  description: string;
  imageUrl?: string;
  link?: string;
  timestamp: string;
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
    <div className="text-center mt-[50px] flex flex-col justify-center items-center bg-background-light dark:bg-background-dark">
      
      <h1 className="text-5xl font-extrabold mb-6 text-gray-800 dark:text-white drop-shadow-lg">Welcome to Our Family Portal!</h1>
      <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">Your personalized family updates:</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl px-4">
        {feed.map((item) => (
          <div key={item.id} className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 flex flex-col">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4 flex-grow">{item.description}</p>
            {item.imageUrl && (
              <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover rounded-md mb-4" />
            )}
            {item.link && (
              <a href={item.link} className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 mt-auto">
                Learn More
              </a>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{new Date(item.timestamp).toLocaleDateString()}</p>
          </div>
        ))}
      </div>

      
    </div>
  );
};

export default HomePage;