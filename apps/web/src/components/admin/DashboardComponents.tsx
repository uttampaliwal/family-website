import React from "react";
import { FaListAlt, FaUserCog } from "react-icons/fa";
import { format } from "date-fns";

interface Activity {
  _id: string;
  adminUsername: string;
  event: string;
  details: string;
  timestamp: string;
}

export const StatCard = ({
  icon,
  title,
  value,
  change,
}: {
  icon: React.ReactElement;
  title: string;
  value: string | number;
  change?: string;
}) => (
  <div className="card">
    <div className="flex items-center">
      <div className="p-3 rounded-full bg-primary/10 text-primary mr-4">
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted font-medium">{title}</p>
        <p className="text-2xl font-bold text-text-base">{value}</p>
      </div>
    </div>
    {change && <p className="text-xs text-muted mt-2">{change}</p>}
  </div>
);

export const ActivityLog = ({ activities }: { activities: Activity[] }) => (
  <div className="card">
    <h3 className="text-lg font-bold text-primary mb-4 flex items-center">
      <FaListAlt className="mr-2" /> Recent Activity
    </h3>
    <ul className="space-y-3">
      {activities.map((activity) => (
        <li key={activity._id} className="flex items-center text-sm">
          <FaUserCog className="mr-3 text-secondary" />
          <div>
            <span className="font-bold text-text-base">
              {activity.adminUsername}
            </span>
            <span className="text-muted">
              {" "}
              {activity.event} on{" "}
              {typeof activity.details === "object"
                ? JSON.stringify(activity.details)
                : activity.details}
            </span>
          </div>
          <span className="text-xs text-muted ml-auto">
            {activity.timestamp
              ? format(new Date(activity.timestamp), "p")
              : "N/A"}
          </span>
        </li>
      ))}
    </ul>
  </div>
);
