import { useEffect } from "react";

const HealthCheck = () => {
  useEffect(() => {
    // This is just a placeholder component for the health check route
    document.title = "Health Check";
  }, []);

  return (
    <div className="text-center p-4">
      <h1>Health Check</h1>
      <p>Status: OK</p>
    </div>
  );
};

export default HealthCheck;
