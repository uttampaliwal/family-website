import React from "react";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm text-muted mb-6">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <FaChevronRight className="w-3 h-3" />}
          {item.to ? (
            <Link to={item.to} className="hover:text-primary transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-on-surface font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
