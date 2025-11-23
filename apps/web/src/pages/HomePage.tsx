import React, { Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import ComponentSkeleton from "../components/ComponentSkeleton";
import AnnouncementTicker from "../components/AnnouncementTicker";
import WelcomeMessage from "../components/WelcomeMessage";

// Lazy loaded components for better performance
const Calendar = lazy(() =>
  import("../components/calendar").then((module) => ({
    default: module.Calendar,
  })),
);
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

const HomePage: React.FC = () => {
  const { t, i18n } = useTranslation(["home", "common"]);
  const { isLoggedIn } = useAuth();

  // Static data - in a real app, this would come from an API
  const recentActivity: ActivityItem[] = [
    {
      id: "1",
      type: "event",
      title: t("home:activity.addedEvent"),
      time: t("home:activity.hourAgo"),
      icon: "📅",
    },
    {
      id: "2",
      type: "photo",
      title: t("home:activity.sharedPhoto"),
      time: t("home:activity.hoursAgo"),
      icon: "📸",
    },
    {
      id: "3",
      type: "task",
      title: t("home:activity.completedTask"),
      time: t("home:activity.hoursAgo3"),
      icon: "✅",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Hero section with dynamic background */}
      <div className="relative h-80 overflow-hidden bg-surface">
        {/* ... (backgrounds) */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-surface to-secondary/5"></div>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-extrabold text-text-base mb-2 tracking-tight leading-tight">
              {t("home:welcome")}
            </h1>
            <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto font-medium leading-relaxed">
              {t("home:tagline")}
            </p>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        {/* Weather Widget */}
        <div className="flex justify-center mb-8">
          <div className="w-full max-w-sm">
            <div className="card">
              <h2 className="text-2xl font-bold mb-6 text-base text-center">
                {t("home:localWeather")}
              </h2>
              <Suspense fallback={<ComponentSkeleton rows={1} height="h-64" />}>
                <WeatherWidget />
              </Suspense>
            </div>
          </div>
        </div>

        <WelcomeMessage />

        {/* Announcement Ticker */}
        {isLoggedIn && (
          <section className="mb-8">
            <AnnouncementTicker key={i18n.language} />
          </section>
        )}

        {/* Enhanced Quick Actions */}
        {isLoggedIn && (
          <section className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-primary mb-2">
                {t("home:quickActions")}
              </h2>
              <p className="text-text-muted">{t("home:tagline")}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                {
                  icon: "🌳",
                  label: t("common:actions.familyTree"),
                  desc: t("common:nav.tree"),
                  to: "/family-tree",
                  color: "from-amber-500/20 to-orange-500/20",
                  border: "border-amber-300/30",
                  text: "text-amber-700 dark:text-amber-300",
                },
                {
                  icon: "💬",
                  label: t("common:actions.familyChat"),
                  desc: t("common:nav.chat"),
                  to: "/chat",
                  color: "from-blue-500/20 to-indigo-500/20",
                  border: "border-blue-300/30",
                  text: "text-blue-700 dark:text-blue-300",
                },
                {
                  icon: "📸",
                  label: t("common:actions.photoGallery"),
                  desc: t("common:nav.gallery"),
                  to: "/social-ultimate",
                  color: "from-pink-500/20 to-rose-500/20",
                  border: "border-pink-300/30",
                  text: "text-pink-700 dark:text-pink-300",
                },
                {
                  icon: "📄",
                  label: t("common:actions.documents"),
                  desc: t("common:nav.documents"),
                  to: "/documents",
                  color: "from-emerald-500/20 to-teal-500/20",
                  border: "border-emerald-300/30",
                  text: "text-emerald-700 dark:text-emerald-300",
                },
              ].map((action, index) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -8 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative bg-gradient-to-br ${action.color} backdrop-blur-sm rounded-2xl border ${action.border} p-6 cursor-pointer group transition-all duration-300 hover:shadow-xl`}
                >
                  <Link to={action.to} className="block text-center">
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300 filter drop-shadow-sm">
                      {action.icon}
                    </div>
                    <h3 className={`font-bold text-lg mb-1 ${action.text}`}>
                      {action.label}
                    </h3>
                    <p className="text-sm text-text-muted font-medium">
                      {action.desc}
                    </p>
                  </Link>

                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Activity */}
        {isLoggedIn && (
          <section className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="headline text-on-surface">
                {t("home:recentActivity")}
              </h2>
              <button className="btn btn-ghost font-medium">
                {t("home:viewAll")}
              </button>
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
                    <span className="text-xl text-primary">
                      {activity.icon}
                    </span>
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
        )}

        {/* Family Tools Grid */}
        {isLoggedIn && (
          <section className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="headline text-on-surface">
                {t("home:familyTools")}
              </h2>
              <button className="btn btn-secondary">
                {t("home:customizeTools")}
              </button>
            </div>
            <Suspense fallback={<ComponentSkeleton rows={2} height="h-48" />}>
              <FamilyTools key={i18n.language} />
            </Suspense>
          </section>
        )}

        {/* Important Notifications */}
        {isLoggedIn && (
          <section className="mb-12">
            <div className="card">
              <h2 className="headline mb-6 text-on-surface">
                {t("home:importantUpdates")}
              </h2>
              <Suspense fallback={<ComponentSkeleton rows={3} height="h-24" />}>
                <ImportantNotifications key={i18n.language} />
              </Suspense>
            </div>
          </section>
        )}

        {/* Family Calendar */}
        {isLoggedIn && (
          <section className="mb-12">
            <h2 className="headline mb-6 text-on-surface">
              {t("home:familyCalendar")}
            </h2>
            <div className="card">
              <Suspense fallback={<ComponentSkeleton rows={1} height="h-96" />}>
                <Calendar />
              </Suspense>
            </div>
          </section>
        )}
      </motion.div>
    </div>
  );
};

export default HomePage;
