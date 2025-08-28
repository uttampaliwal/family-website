import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

interface SearchResult {
  id: string;
  title: string;
  type: "document" | "page" | "user" | "family";
  url: string;
  description?: string;
  icon: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Sample search results - in a real app, this would be an API call
const mockResults: SearchResult[] = [
  {
    id: "1",
    title: "Family Photos 2024",
    type: "document",
    url: "/documents/1",
    description: "Recent family vacation photos",
    icon: "📸",
  },
  {
    id: "2",
    title: "John Smith",
    type: "user",
    url: "/profile/johnsmith",
    description: "Family member",
    icon: "👤",
  },
  {
    id: "3",
    title: "Family Tree",
    type: "page",
    url: "/family-tree",
    description: "View and edit family connections",
    icon: "🌳",
  },
  {
    id: "4",
    title: "Wedding Certificate",
    type: "document",
    url: "/documents/4",
    description: "Important family document",
    icon: "📄",
  },
];

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim()) {
      setIsLoading(true);
      // Simulate API call delay
      const timer = setTimeout(() => {
        const filtered = mockResults.filter(
          (result) =>
            result.title.toLowerCase().includes(query.toLowerCase()) ||
            result.description?.toLowerCase().includes(query.toLowerCase()),
        );
        setResults(filtered);
        setIsLoading(false);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const getTypeColor = (type: SearchResult["type"]) => {
    switch (type) {
      case "document":
        return "bg-blue-500/20 text-blue-300 border-blue-400/30";
      case "user":
        return "bg-green-500/20 text-green-300 border-green-400/30";
      case "page":
        return "bg-purple-500/20 text-purple-300 border-purple-400/30";
      case "family":
        return "bg-orange-500/20 text-orange-300 border-orange-400/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-400/30";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 w-full max-w-2xl mx-4 z-50"
          >
            <div className="bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
              {/* Search Input */}
              <div className="p-4 border-b border-white/10">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search documents, family members, pages..."
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                    >
                      <svg
                        className="w-5 h-5"
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
                  )}
                </div>
              </div>

              {/* Search Results */}
              <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-secondary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-white/60">Searching...</p>
                  </div>
                ) : query && results.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-4xl mb-4">🔍</div>
                    <p className="text-white/60">
                      No results found for "{query}"
                    </p>
                    <p className="text-white/40 text-sm mt-2">
                      Try searching for documents, family members, or pages
                    </p>
                  </div>
                ) : results.length > 0 ? (
                  <div className="p-2">
                    {results.map((result) => (
                      <Link
                        key={result.id}
                        to={result.url}
                        onClick={onClose}
                        className="flex items-center p-3 rounded-xl hover:bg-white/10 transition-colors duration-200 group"
                      >
                        <div className="text-2xl mr-4">{result.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-white group-hover:text-secondary transition-colors duration-200 truncate">
                              {result.title}
                            </h3>
                            <span
                              className={`px-2 py-1 text-xs rounded-full border ${getTypeColor(result.type)}`}
                            >
                              {result.type}
                            </span>
                          </div>
                          {result.description && (
                            <p className="text-sm text-white/60 truncate">
                              {result.description}
                            </p>
                          )}
                        </div>
                        <svg
                          className="w-5 h-5 text-white/40 group-hover:text-white/60 transition-colors duration-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="text-4xl mb-4">💡</div>
                    <p className="text-white/60 mb-2">Quick Search</p>
                    <p className="text-white/40 text-sm">
                      Find documents, family members, and pages instantly
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/60">
                        Documents
                      </span>
                      <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/60">
                        Family Members
                      </span>
                      <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/60">
                        Pages
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-white/10 bg-white/5">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <div className="flex items-center space-x-4">
                    <span>
                      Press{" "}
                      <kbd className="px-2 py-1 bg-white/10 rounded">↵</kbd> to
                      select
                    </span>
                    <span>
                      Press{" "}
                      <kbd className="px-2 py-1 bg-white/10 rounded">Esc</kbd>{" "}
                      to close
                    </span>
                  </div>
                  <span>Powered by Family Search</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;
