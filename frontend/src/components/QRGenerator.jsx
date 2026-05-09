import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Download, Share2, X, Copy, Check } from 'lucide-react';

const QRGenerator = ({ kit, onClose, showGenerator }) => {
  const [copied, setCopied] = useState(false);
  const [shareMode, setShareMode] = useState(false);

  // Generate QR code data
  const qrData = JSON.stringify({
    type: 'kit',
    id: kit._id,
    name: kit.name,
    category: kit.category,
    timestamp: new Date().toISOString()
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const link = document.createElement('a');
      link.download = `${kit.name.replace(/\s+/g, '_')}_QR.png`;
      link.href = canvas.toDataURL();
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${kit.name} QR Code`,
          text: `QR code for ${kit.name} (${kit.category})`,
          url: qrData
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      setShareMode(true);
    }
  };

  if (!showGenerator) return null;

  return (
    <AnimatePresence>
      {showGenerator && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <QrCode className="w-6 h-6" />
                  <h3 className="text-xl font-bold">Kit QR Code</h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-emerald-100 mt-2 text-sm">
                QR code for quick kit identification
              </p>
            </div>

            {/* QR Code Display */}
            <div className="p-6">
              {/* Kit Info */}
              <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{kit.emoji || '📦'}</span>
                  <div>
                    <h4 className="text-white font-semibold">{kit.name}</h4>
                    <p className="text-slate-400 text-sm">{kit.category}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Available:</span>
                  <span className="text-emerald-400 font-medium">{kit.available}/{kit.quantity}</span>
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-white rounded-lg p-4 mb-6">
                <div className="flex justify-center">
                  <QRCodeSVG
                    id="qr-code-svg"
                    value={qrData}
                    size={200}
                    level="H"
                    includeMargin={true}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>
              </div>

              {/* QR Code Info */}
              <div className="text-center mb-6">
                <p className="text-slate-400 text-sm mb-2">
                  Scan this QR code to quickly access this kit
                </p>
                <div className="bg-slate-800/50 rounded p-2">
                  <p className="text-xs text-slate-500 font-mono break-all">
                    Kit ID: {kit._id}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-500">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Data</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>

                <button
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QRGenerator;
