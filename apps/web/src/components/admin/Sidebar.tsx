import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUsers,
  FaFileAlt,
  FaChartBar,
  FaCog,
  FaChevronDown,
  FaChevronUp,
  FaDesktop,
} from "react-icons/fa";

interface NavItemProps {
  to: string;
  icon: React.ReactElement;
  label: string;
  subItems?: NavItemProps[];
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, subItems }) => {
  const location = useLocation();
  const isActive =
    location.pathname === to ||
    (subItems &&
      subItems.some((item) => location.pathname.startsWith(item.to)));
  const [isOpen, setIsOpen] = useState(isActive);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <li>
      {subItems ? (
        <>
          <button
            onClick={handleToggle}
            className={`w-full flex items-center justify-between p-2 rounded-md ${isActive ? "bg-primary text-white" : "hover:bg-surface"}`}
          >
            <div className="flex items-center">
              {icon}
              <span className="ml-3">{label}</span>
            </div>
            {isOpen ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {isOpen && (
            <ul className="pl-8 mt-2 space-y-2">
              {subItems.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </ul>
          )}
        </>
      ) : (
        <Link
          to={to}
          className={`flex items-center p-2 rounded-md ${isActive ? "bg-primary text-white" : "hover:bg-surface"}`}
        >
          {icon}
          <span className="ml-3">{label}</span>
        </Link>
      )}
    </li>
  );
};

const Sidebar: React.FC = () => {
  const navItems: NavItemProps[] = [
    { to: "/admin", icon: <FaTachometerAlt />, label: "Dashboard" },
    {
      to: "/admin/user-management",
      icon: <FaUsers />,
      label: "User Management",
    },
    {
      to: "/admin/content-management",
      icon: <FaFileAlt />,
      label: "Content Management",
    },
    {
      to: "/admin/analytics",
      icon: <FaChartBar />,
      label: "Analytics",
    },
    {
      to: "/admin/system-settings",
      icon: <FaCog />,
      label: "System Settings",
    },
    {
      to: "/admin/monitoring",
      icon: <FaDesktop />,
      label: "System Monitoring",
    },
  ];

  return (
    <div className="w-64 h-screen bg-background-alt p-4">
      <div className="text-2xl font-bold text-primary mb-8">Admin Panel</div>
      <nav>
        <ul className="space-y-2">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
