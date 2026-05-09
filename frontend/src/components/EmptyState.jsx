import { motion } from 'framer-motion';
import { Package, Search, Inbox, ArrowLeft } from 'lucide-react';

// Reusable Empty State Component
const EmptyState = ({ 
  type = 'default', 
  title, 
  description, 
  actionLabel, 
  onAction,
  className = '' 
}) => {
  const variants = {
    default: {
      icon: Inbox,
      title: title || 'No Data Found',
      description: description || 'There is nothing to display at the moment.',
      color: 'text-slate-400'
    },
    search: {
      icon: Search,
      title: title || 'No Results Found',
      description: description || 'Try adjusting your search or filters to find what you\'re looking for.',
      color: 'text-slate-400'
    },
    kits: {
      icon: Package,
      title: title || 'No Kits Available',
      description: description || 'There are no kits in this category or matching your criteria.',
      color: 'text-slate-400'
    }
  };

  const variant = variants[type] || variants.default;
  const Icon = variant.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
        <Icon className={`w-10 h-10 ${variant.color}`} />
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-2">
        {variant.title}
      </h3>
      
      <p className="text-slate-400 max-w-md mb-6">
        {variant.description}
      </p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors font-medium"
        >
          {type === 'search' && <ArrowLeft className="w-4 h-4" />}
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
};

export default EmptyState;
