import React, { useEffect, useState } from 'react';

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
            resolve({ message: 'Welcome to your Family Website!' });
          }, 1000);
        });
        setData(response);
      } catch (err) {
        setError('Failed to fetch data from backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchBackendData();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>{data?.message}</h1>
      <p>This is your personalized family website. More content coming soon!</p>
      {/* You can add more dynamic content here based on backend data */}
    </div>
  );
};

export default HomePage;