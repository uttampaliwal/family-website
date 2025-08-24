import React, { useCallback } from "react";
import { motion } from "framer-motion";

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  link: string;
}

const tools: Tool[] = [
  {
    id: "documents",
    name: "Family Documents",
    description: "Securely store and manage important family documents",
    icon: "📄",
    link: "/documents",
  },
  {
    id: "expenses",
    name: "Expense Tracker",
    description: "Track and manage family expenses",
    icon: "💰",
    link: "/expenses",
  },
  {
    id: "tasks",
    name: "Task Manager",
    description: "Organize and assign family tasks",
    icon: "✅",
    link: "/tasks",
  },
  {
    id: "photos",
    name: "Photo Gallery",
    description: "Share and preserve family memories",
    icon: "📸",
    link: "/photos",
  },
  {
    id: "shopping",
    name: "Shopping List",
    description: "Collaborative family shopping list",
    icon: "🛒",
    link: "/shopping",
  },
  {
    id: "emergency",
    name: "Emergency Info",
    description: "Quick access to emergency contacts and procedures",
    icon: "🚨",
    link: "/emergency",
  },
];

// Constants for better maintainability
const ANIMATION_CONFIG = {
  duration: 0.3,
  delayMultiplier: 0.1,
  hoverScale: 1.03,
} as const;

const FamilyTools: React.FC = () => {
  const handleToolClick = useCallback((link: string) => {
    if (!link || typeof link !== "string") {
      // Invalid link provided - handle error silently
      return;
    }

    try {
      window.location.href = link;
    } catch {
      // Error navigating to tool - handle error silently
      // Fallback: try using window.open as alternative
      window.open(link, "_self");
    }
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tools.map((tool, index) => (
        <motion.div
          key={tool.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: ANIMATION_CONFIG.duration,
            delay: index * ANIMATION_CONFIG.delayMultiplier,
          }}
          whileHover={{ scale: ANIMATION_CONFIG.hoverScale }}
          className="card cursor-pointer"
          onClick={() => handleToolClick(tool.link)}
        >
          <div className="flex items-center mb-4">
            <span className="text-4xl mr-4" role="img" aria-label={tool.name}>
              {tool.icon}
            </span>
            <h3 className="text-xl font-semibold text-base">{tool.name}</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300">{tool.description}</p>
          <div className="mt-4 flex justify-end">
            <button
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 
                         inline-flex items-center transition-colors duration-200"
            >
              Open
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default FamilyTools;
