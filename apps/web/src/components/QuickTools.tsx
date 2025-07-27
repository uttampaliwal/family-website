import React from 'react';
import { motion } from 'framer-motion';

/* Commented out unused interface
interface QuickAction {
  id: string;
  title: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
}
*/

interface ActivityItem {
  id: string;
  title: string;
  time: string;
  icon: React.ReactNode;
}

const QuickTools: React.FC = () => {
  /* Quick actions definition removed to fix build error
  const quickActions: QuickAction[] = [
    {
      id: 'add-event',
      title: 'Add Event',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 2V5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 2V5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3.5 9.09H20.5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15.6947 13.7H15.7037" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15.6947 16.7H15.7037" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M11.9955 13.7H12.0045" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M11.9955 16.7H12.0045" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8.29431 13.7H8.30329" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8.29431 16.7H8.30329" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      action: () => console.log('Add event clicked'),
      color: 'bg-blue-500'
    },
    {
      id: 'share-photo',
      title: 'Share Photo',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 10C10.1046 10 11 9.10457 11 8C11 6.89543 10.1046 6 9 6C7.89543 6 7 6.89543 7 8C7 9.10457 7.89543 10 9 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2.67004 18.9501L7.60004 15.6401C8.39004 15.1101 9.53004 15.1701 10.24 15.7801L10.57 16.0701C11.35 16.7401 12.61 16.7401 13.39 16.0701L17.55 12.5001C18.33 11.8301 19.59 11.8301 20.37 12.5001L22 13.9001" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      action: () => console.log('Share photo clicked'),
      color: 'bg-green-500'
    },
    {
      id: 'add-task',
      title: 'Add Task',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.37 8.88H17.62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6.38 8.88L7.13 9.63L9.38 7.38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12.37 15.88H17.62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6.38 15.88L7.13 16.63L9.38 14.38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      action: () => console.log('Add task clicked'),
      color: 'bg-yellow-500'
    },
    {
      id: 'emergency',
      title: 'Emergency',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 6V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12.01 16H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      action: () => console.log('Emergency clicked'),
      color: 'bg-red-500'
    }
  ];
  */

  const recentActivity: ActivityItem[] = [
    {
      id: '1',
      title: 'Added new event',
      time: '1 hour ago',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 2V5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 2V5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3.5 9.09H20.5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      id: '2',
      title: 'Shared family photo',
      time: '2 hours ago',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 10C10.1046 10 11 9.10457 11 8C11 6.89543 10.1046 6 9 6C7.89543 6 7 6.89543 7 8C7 9.10457 7.89543 10 9 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2.67004 18.9501L7.60004 15.6401C8.39004 15.1101 9.53004 15.1701 10.24 15.7801L10.57 16.0701C11.35 16.7401 12.61 16.7401 13.39 16.0701L17.55 12.5001C18.33 11.8301 19.59 11.8301 20.37 12.5001L22 13.9001" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      id: '3',
      title: 'Completed task',
      time: '3 hours ago',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.37 8.88H17.62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6.38 8.88L7.13 9.63L9.38 7.38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12.37 15.88H17.62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6.38 15.88L7.13 16.63L9.38 14.38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    }
  ];

  // Constants for better maintainability
  const QUICK_ACTIONS = [
    {
      id: 'add-event',
      label: 'Add Event',
      color: '#2196F3',
      onClick: () => {
        try {
          console.log('Add event clicked');
        } catch (error) {
          console.error('Error handling add event action:', error);
        }
      },
      delay: 0
    },
    {
      id: 'share-photo',
      label: 'Share Photo',
      color: '#00C853',
      onClick: () => {
        try {
          console.log('Share photo clicked');
        } catch (error) {
          console.error('Error handling share photo action:', error);
        }
      },
      delay: 0.1
    },
    {
      id: 'add-task',
      label: 'Add Task',
      color: '#FFC107',
      onClick: () => {
        try {
          console.log('Add task clicked');
        } catch (error) {
          console.error('Error handling add task action:', error);
        }
      },
      delay: 0.2
    },
    {
      id: 'emergency',
      label: 'Emergency',
      color: '#F44336',
      onClick: () => {
        try {
          console.log('Emergency clicked');
        } catch (error) {
          console.error('Error handling emergency action:', error);
        }
      },
      delay: 0.3
    }
  ];

  const QuickActionButton = ({ action }: { action: typeof QUICK_ACTIONS[0] }) => (
    <motion.button
      onClick={action.onClick}
      className="text-white p-6 flex flex-col items-center justify-center h-[120px] rounded-lg border-none outline-none"
      style={{ backgroundColor: action.color }}
      whileHover={{ scale: 1.03 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: action.delay }}
    >
      <span className="text-sm font-medium">{action.label}</span>
    </motion.button>
  );

  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {QUICK_ACTIONS.map((action) => (
          <QuickActionButton key={action.id} action={action} />
        ))}
      </div>

      
      {/* Recent Activity */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h3>
          <button 
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-medium"
            onClick={() => {
              try {
                console.log('View All clicked');
              } catch (error) {
                console.error('Error handling view all action:', error);
              }
            }}
          >
            View All
          </button>
        </div>
        
        <div className="space-y-4">
          {recentActivity.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-300">
                {item.icon}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.time}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickTools;