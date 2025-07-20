import React from 'react';
import { motion } from 'framer-motion';

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  action: () => void;
  color: string;
}

const QuickTools: React.FC = () => {
  const quickActions: QuickAction[] = [
    {
      id: 'add-event',
      title: 'Add Event',
      icon: '📅',
      action: () => console.log('Add event clicked'),
      color: 'bg-blue-500'
    },
    {
      id: 'share-photo',
      title: 'Share Photo',
      icon: '📸',
      action: () => console.log('Share photo clicked'),
      color: 'bg-green-500'
    },
    {
      id: 'add-task',
      title: 'Add Task',
      icon: '✅',
      action: () => console.log('Add task clicked'),
      color: 'bg-yellow-500'
    },
    {
      id: 'emergency',
      title: 'Emergency',
      icon: '🚨',
      action: () => console.log('Emergency clicked'),
      color: 'bg-red-500'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <motion.button
            key={action.id}
            onClick={action.action}
            className={`${action.color} bg-opacity-10 dark:bg-opacity-20 hover:bg-opacity-20 
                       dark:hover:bg-opacity-30 rounded-lg p-4 transition-all duration-200
                       flex flex-col items-center justify-center min-h-[120px]`}
            whileHover={{ scale: 1.05 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <span className="text-3xl mb-2" role="img" aria-label={action.title}>
              {action.icon}
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white">
              {action.title}
            </span>
          </motion.button>
        ))}
      </div>
      
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h3>
          <button className="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm">
            View All
          </button>
        </div>
        
        <div className="space-y-3">
          {[1, 2, 3].map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-200">
                  {['📝', '📸', '✅'][index]}
                </span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {['Added new event', 'Shared family photo', 'Completed task'][index]}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {`${index + 1} hour${index === 0 ? '' : 's'} ago`}
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