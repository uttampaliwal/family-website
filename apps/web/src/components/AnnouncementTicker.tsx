import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

interface Announcement {
  id: string;
  type: "info" | "celebration" | "reminder" | "update";
  message: string;
  icon: string;
  priority: "low" | "medium" | "high";
  timestamp: Date;
}

const AnnouncementTicker: React.FC = () => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Sample announcements - in a real app, this would come from an API
  const announcements: Announcement[] = [
    {
      id: "1",
      type: "celebration",
      message:
        "🎉 Happy Birthday to Priya! Join us for the virtual celebration at 7 PM today!",
      icon: "🎂",
      priority: "high",
      timestamp: new Date(),
    },
    {
      id: "2",
      type: "reminder",
      message:
        "📅 Family video call scheduled for this Sunday at 6 PM. Don't forget to join!",
      icon: "📞",
      priority: "medium",
      timestamp: new Date(),
    },
    {
      id: "3",
      type: "update",
      message:
        "📸 New family photos have been uploaded to the gallery. Check them out!",
      icon: "🖼️",
      priority: "medium",
      timestamp: new Date(),
    },
    {
      id: "4",
      type: "info",
      message:
        "🌟 Welcome to our new family portal! Explore all the amazing features we've built together.",
      icon: "✨",
      priority: "low",
      timestamp: new Date(),
    },
    {
      id: "5",
      type: "celebration",
      message:
        "💑 Congratulations to Raj and Meera on their 5th anniversary! Wishing you many more years of happiness!",
      icon: "💕",
      priority: "high",
      timestamp: new Date(),
    },
  ];

  // Auto-advance ticker
  useEffect(() => {
    if (!isPlaying || announcements.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [isPlaying, announcements.length]);

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "celebration":
        return "from-pink-500/20 to-purple-500/20 border-pink-300/30";
      case "reminder":
        return "from-blue-500/20 to-cyan-500/20 border-blue-300/30";
      case "update":
        return "from-green-500/20 to-emerald-500/20 border-green-300/30";
      default:
        return "from-primary/20 to-secondary/20 border-primary/30";
    }
  };

  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case "high":
        return "🔴";
      case "medium":
        return "🟡";
      default:
        return "🟢";
    }
  };

  if (announcements.length === 0) return null;

  const currentAnnouncement = announcements[currentIndex];

  return (
    <div className="relative overflow-hidden">
      {/* Ticker Container */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative bg-gradient-to-r ${getTypeStyles(currentAnnouncement.type)} backdrop-blur-sm rounded-xl border p-4 shadow-lg`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{currentAnnouncement.icon}</span>
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">
              {t("announcements.label")}
            </span>
            <span className="text-xs">
              {getPriorityIndicator(currentAnnouncement.priority)}
            </span>
          </div>

          {/* ... (Controls) */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-6 h-6 rounded-full bg-surface/50 backdrop-blur-sm border border-primary/20 flex items-center justify-center hover:bg-primary/10 transition-all duration-200"
              title={isPlaying ? "Pause" : "Play"}
            >
              <span className="text-xs">{isPlaying ? "⏸️" : "▶️"}</span>
            </button>

            {/* Progress indicators */}
            <div className="flex space-x-1">
              {announcements.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "bg-primary scale-125"
                      : "bg-primary/30 hover:bg-primary/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Announcement Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentAnnouncement.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex items-center space-x-3"
          >
            {/* Large Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-surface/50 backdrop-blur-sm border border-primary/20 flex items-center justify-center">
                <span className="text-2xl">{currentAnnouncement.icon}</span>
              </div>
            </div>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <p className="text-sm md:text-base font-medium text-on-surface leading-relaxed">
                {currentAnnouncement.message}
              </p>
              <p className="text-xs text-muted mt-1">
                {currentAnnouncement.timestamp.toLocaleDateString()} •
                <span className="ml-1 capitalize">
                  {currentAnnouncement.type}
                </span>
              </p>
            </div>

            {/* Action Button */}
            <div className="flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-1 text-xs font-medium bg-primary/20 hover:bg-primary/30 text-primary rounded-full border border-primary/30 transition-all duration-200"
              >
                {t("home.viewAll")}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Animated background elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden rounded-xl">
          <motion.div
            animate={{
              x: [0, 100, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-2xl"
          />
        </div>
      </motion.div>

      {/* Scrolling text effect for mobile */}
      <div className="md:hidden mt-2">
        <div className="overflow-hidden">
          <motion.div
            animate={{ x: [300, -300] }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear",
            }}
            className="whitespace-nowrap text-xs text-muted"
          >
            Stay connected with your family • Share memories • Celebrate
            together • Yuva Kulya Family Portal
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementTicker;
