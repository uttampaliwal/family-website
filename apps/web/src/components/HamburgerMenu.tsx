import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface HamburgerMenuProps {
  isLoggedIn: boolean;
  username: string | null;
}

function HamburgerMenu({ isLoggedIn, username }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors duration-200 focus:outline-none"
        aria-label="Menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
        </svg>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-16 right-0 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 overflow-hidden"
          >
            <div className="h-1 w-full gradient-bg"></div>
            <div className="py-2">
              <Link 
                to="/" 
                className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              
              {isLoggedIn ? (
                <Link 
                  to={`/profile/${username}`} 
                  className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  {username}
                </Link>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="block px-4 py-2 text-blue-700 dark:text-blue-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="block px-4 py-2 text-purple-600 dark:text-purple-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default HamburgerMenu;
