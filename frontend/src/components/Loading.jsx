import { motion } from 'framer-motion';

// Reusable Loading Components

// Full Page Loader
export const PageLoader = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-[#020617]">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="w-16 h-16 border-4 border-slate-700 border-t-emerald-500 rounded-full"
    />
    <p className="mt-4 text-slate-400 animate-pulse">{message}</p>
  </div>
);

// Section Loader
export const SectionLoader = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="w-10 h-10 border-3 border-slate-700 border-t-emerald-500 rounded-full"
    />
    <p className="mt-3 text-slate-400 text-sm">{message}</p>
  </div>
);

// Card Skeleton Loader
export const CardSkeleton = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: i * 0.1 }}
        className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 animate-pulse"
      >
        <div className="h-32 bg-slate-700/50 rounded-lg mb-4" />
        <div className="h-4 bg-slate-700/50 rounded w-1/3 mb-2" />
        <div className="h-6 bg-slate-700/50 rounded w-3/4 mb-2" />
        <div className="h-4 bg-slate-700/50 rounded w-full mb-4" />
        <div className="flex gap-2">
          <div className="h-10 bg-slate-700/50 rounded flex-1" />
          <div className="h-10 bg-slate-700/50 rounded flex-1" />
        </div>
      </motion.div>
    ))}
  </div>
);

// Table Skeleton Loader
export const TableSkeleton = ({ rows = 5 }) => (
  <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden animate-pulse">
    <div className="p-4 border-b border-slate-700/50 grid grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-4 bg-slate-700/50 rounded" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="p-4 border-b border-slate-700/50 grid grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, j) => (
          <div key={j} className="h-4 bg-slate-700/30 rounded" />
        ))}
      </div>
    ))}
  </div>
);

// Button Loader
export const ButtonLoader = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-6 h-6 border-3'
  };
  
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      className={`${sizes[size]} border-slate-400 border-t-white rounded-full`}
    />
  );
};

// Inline Text Loader
export const InlineLoader = () => (
  <span className="inline-flex items-center gap-1">
    <motion.span
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className="w-2 h-2 bg-emerald-500 rounded-full"
    />
    <motion.span
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
      className="w-2 h-2 bg-emerald-500 rounded-full"
    />
    <motion.span
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
      className="w-2 h-2 bg-emerald-500 rounded-full"
    />
  </span>
);

export default PageLoader;
