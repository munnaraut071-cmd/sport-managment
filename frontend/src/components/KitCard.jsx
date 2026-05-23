import { motion } from 'framer-motion';
import { 
  Package, ArrowUpCircle, QrCode, Eye,
  CheckCircle, AlertCircle, Clock,
  Trophy, Activity, Target, Zap, CircleDot, Dumbbell, Package2
} from 'lucide-react';

// Reusable Kit Card Component - Used in Dashboard, Kits, Issue pages
const KitCard = ({ 
  kit, 
  onIssue, 
  onGenerateQR, 
  onViewDetails,
  showActions = true,
  compact = false,
  className = ''
}) => {
  // Determine availability status
  const getAvailabilityStatus = () => {
    if (kit.available === 0) return { color: 'red', text: 'Out of Stock', icon: AlertCircle };
    if (kit.available < kit.quantity * 0.2) return { color: 'amber', text: 'Low Stock', icon: Clock };
    return { color: 'emerald', text: 'Available', icon: CheckCircle };
  };

  const status = getAvailabilityStatus();
  const StatusIcon = status.icon;

  // Get Lucide Icon for category
  const getCategoryIcon = (category) => {
    const icons = {
      'Cricket': Trophy,
      'Football': Activity,
      'Badminton': Zap,
      'Basketball': CircleDot,
      'Tennis': Target,
      'Hockey': Activity,
      'Volleyball': Activity,
      'Table Tennis': Target,
      'Gym': Dumbbell,
      'Other': Package2
    };
    return icons[category] || icons[category?.charAt(0).toUpperCase() + category?.slice(1).toLowerCase()] || Package2;
  };

  const CategoryIcon = getCategoryIcon(kit.category);

  // Get emoji for category
  const getKitEmoji = (kit) => {
    if (kit.emoji) return kit.emoji;
    const emojis = {
      'Cricket': '🏏', 'Football': '⚽', 'Badminton': '🏸', 'Basketball': '🏀',
      'Tennis': '🎾', 'Hockey': '🏒', 'Volleyball': '🏐', 'Table Tennis': '🏓', 
      'Gym': '🏋️', 'Other': '📦'
    };
    return emojis[kit.category] || emojis[kit.category?.charAt(0).toUpperCase() + kit.category?.slice(1).toLowerCase()] || '📦';
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 ${className}`}
    >
      {/* Card Header with Image/Icon */}
      <div className="relative">
        {/* Status Badge */}
        <div className={`absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5
          ${status.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
            status.color === 'amber' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 
            'bg-red-500/20 text-red-400 border border-red-500/30'}`}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {status.text}
        </div>

        {/* Kit Image/Icon */}
        <div className="h-32 bg-gradient-to-br from-slate-700/50 to-slate-800/50 flex items-center justify-center">
          {kit.image ? (
            <img 
              src={kit.image} 
              alt={kit.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={`flex flex-col items-center justify-center ${kit.image ? 'hidden' : 'flex'}`}
            style={{ display: kit.image ? 'none' : 'flex' }}
          >
            <span className="text-5xl mb-2">{getKitEmoji(kit)}</span>
            <CategoryIcon className="w-8 h-8 text-slate-600" />
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Category */}
        <div className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">
          {kit.category}
        </div>
        
        {/* Title */}
        <h3 className="text-white font-semibold text-lg mb-2 line-clamp-1" title={kit.name}>
          {kit.name}
        </h3>

        {/* Description */}
        {!compact && (
          <p className="text-slate-400 text-sm mb-3 line-clamp-2 h-10">
            {kit.description || 'Sports equipment ready to issue'}
          </p>
        )}

        {/* Stock Info */}
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-slate-400">Available</span>
          <span className={`font-semibold ${
            kit.available > 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {kit.available} / {kit.quantity}
          </span>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2">
            {onViewDetails && (
              <button
                onClick={() => onViewDetails(kit)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors text-sm font-medium"
              >
                <Eye className="w-4 h-4" />
                Details
              </button>
            )}
            
            {onGenerateQR && (
              <button
                onClick={() => onGenerateQR(kit)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors text-sm font-medium"
              >
                <QrCode className="w-4 h-4" />
                QR
              </button>
            )}
            
            {onIssue && (
              <button
                onClick={() => onIssue(kit)}
                disabled={kit.available === 0}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all text-sm font-medium
                  ${kit.available > 0 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/20' 
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
              >
                <ArrowUpCircle className="w-4 h-4" />
                Issue
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default KitCard;
