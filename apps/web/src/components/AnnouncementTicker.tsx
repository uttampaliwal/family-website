import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface Announcement {
  id: string;
  message: string;
  type: "info" | "warning" | "success" | "promotion";
  link?: string;
}

const AnnouncementTicker: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Sample announcements - in a real app, these would come from an API
  const announcements: Announcement[] = [
    {
      id: "1",
      message:
        "🎉 Welcome to your Family Portal! Upload and share memories with your loved ones.",
      type: "success",
    },
    {
      id: "2",
      message:
        "📸 New feature: Create beautiful family photo albums with our enhanced gallery tools.",
      type: "info",
    },
    {
      id: "3",
      message:
        "🔒 Your privacy matters - All family data is encrypted and secure.",
      type: "info",
    },
    {
      id: "4",
      message:
        "💡 Tip: Use the family tree feature to connect with relatives and build your heritage.",
      type: "promotion",
    },
  ];

  useEffect(() => {
    if (announcements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000); // Change announcement every 5 seconds

    return () => clearInterval(interval);
  }, [announcements.length]);

  const getTypeStyles = (type: Announcement["type"]) => {
    switch (type) {
      case "warning":
        return "bg-amber-500/20 border-amber-400/30 text-amber-100";
      case "success":
        return "bg-emerald-500/20 border-emerald-400/30 text-emerald-100";
      case "promotion":
        return "bg-purple-500/20 border-purple-400/30 text-purple-100";
      default:
        return "bg-blue-500/20 border-blue-400/30 text-blue-100";
    }
  };

  if (!isVisible || announcements.length === 0) return null;

  const currentAnnouncement = announcements[currentIndex];

  return (
    <div className="w-full bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-sm border-b border-white/10 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12"></div>
      </div>

      <div className="container mx-auto px-4 py-3 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {/* Announcement indicator */}
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Announcement
              </span>
            </div>

            {/* Scrolling announcement */}
            <div className="flex-1 overflow-hidden">
              <motion.div
                key={currentAnnouncement.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className={`inline-flex items-center px-4 py-2 rounded-full border ${getTypeStyles(currentAnnouncement.type)} backdrop-blur-sm`}
              >
                <span className="text-sm font-medium whitespace-nowrap">
                  {currentAnnouncement.message}
                </span>
                {currentAnnouncement.link && (
                  <a
                    href={currentAnnouncement.link}
                    className="ml-3 text-xs font-semibold underline hover:no-underline transition-all duration-200"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Learn More →
                  </a>
                )}
              </motion.div>
            </div>

            {/* Progress indicators */}
            {announcements.length > 1 && (
              <div className="hidden sm:flex items-center space-x-1">
                {announcements.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? "bg-secondary scale-125"
                        : "bg-white/30 hover:bg-white/50"
                    }`}
                    aria-label={`Go to announcement ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={() => setIsVisible(false)}
            className="ml-4 p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
            aria-label="Close announcements"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementTicker;
