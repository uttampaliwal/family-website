import React, { useEffect, useState } from 'react';
import AuthButtons from '../components/AuthButtons';

interface BackendData {
  message: string;
  // Add other fields as per your backend API response
}

const HomePage: React.FC = () => {
  const [data, setData] = useState<BackendData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        // Simulate fetching data from your backend API
        // Replace with your actual backend endpoint
        const response = await new Promise<BackendData>((resolve) => {
          setTimeout(() => {
            resolve({ message: 'Welcome to our Family Portal!' });
          }, 1000);
        });
        setData(response);
      } catch (error: unknown) {
        setError(`Failed to fetch data from backend: ${(error as Error).message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchBackendData();
  }, []);

  if (loading) {
    return <div className="text-center mt-[50px]">Loading...</div>;
  }

  if (error) {
    return <div className="text-center mt-[50px] text-red-500">Error: {error}</div>;
  }

  return (
    <div className="text-center mt-[50px]">
      <h1 className="text-4xl font-extrabold mb-4 text-gray-100">{data?.message}</h1>
      <p>This is our personalized family portal. More content coming soon!</p>
      <AuthButtons />
    </div>
  );
};

export default HomePage;