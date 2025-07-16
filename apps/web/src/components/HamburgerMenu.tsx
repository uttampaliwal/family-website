import { useState } from 'react';
import { Link } from 'react-router-dom';

interface HamburgerMenuProps {
  isLoggedIn: boolean;
  username: string | null;
}

function HamburgerMenu({ isLoggedIn, username }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button onClick={() => setIsOpen(!isOpen)} className="text-white focus:outline-none">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
        </svg>
      </button>
      {isOpen && (
        <div className="absolute top-16 left-0 w-full bg-gray-800 text-white flex flex-col items-center space-y-4 py-4">
          <Link to="/" className="text-white hover:text-gray-200 text-lg font-semibold transition-colors duration-200">Home</Link>
          {isLoggedIn ? (
            <Link to={`/profile/${username}`} className="text-white hover:text-gray-200 text-lg font-semibold transition-colors duration-200">{username}</Link>
          ) : (
            <>
              <Link to="/login" className="text-white hover:text-gray-200 text-lg font-semibold transition-colors duration-200">Login</Link>
              <Link to="/register" className="text-white hover:text-gray-200 text-lg font-semibold transition-colors duration-200">Register</Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default HamburgerMenu;
