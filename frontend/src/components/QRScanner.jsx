import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Camera, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

const QRScanner = ({ onScanSuccess, onClose, showScanner }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cameraPermission, setCameraPermission] = useState('prompt');
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (showScanner) {
      initializeScanner();
    }
    return () => {
      stopScanner();
    };
  }, [showScanner]);

  const initializeScanner = async () => {
    try {
      setScanning(true);
      setError('');
      
      // Check camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission('granted');
      
      // Initialize html5-qrcode
      if (scannerRef.current && !html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader');
        
        await html5QrCodeRef.current.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            // QR Code scanned successfully
            handleScanSuccess(decodedText);
          },
          (errorMessage) => {
            // QR Code scan error (ignored - keep scanning)
            console.log('Scan error:', errorMessage);
          }
        );
      }
      
    } catch (err) {
      console.error('Scanner initialization error:', err);
      if (err.name === 'NotAllowedError') {
        setCameraPermission('denied');
        setError('Camera permission denied. Please allow camera access to scan QR codes.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please ensure your device has a camera.');
      } else {
        setError('Failed to initialize camera: ' + err.message);
      }
      setScanning(false);
    }
  };
  
  const handleScanSuccess = (decodedText) => {
    setSuccess(true);
    setScanning(false);
    
    // Stop scanner
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().then(() => {
        html5QrCodeRef.current = null;
      }).catch(console.error);
    }
    
    // Call success callback
    setTimeout(() => {
      onScanSuccess(decodedText);
    }, 1000);
  };

  const stopScanner = () => {
    setScanning(false);
    
    // Stop html5-qrcode
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().then(() => {
        html5QrCodeRef.current = null;
      }).catch(console.error);
    }
  };

  const handleRetry = () => {
    setError('');
    setSuccess(false);
    initializeScanner();
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {showScanner && (
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
                  <h3 className="text-xl font-bold">Scan QR Code</h3>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-emerald-100 mt-2 text-sm">
                Position the QR code within the frame to scan
              </p>
            </div>

            {/* Scanner Content */}
            <div className="p-6">
              {cameraPermission === 'denied' ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <p className="text-red-400 font-medium mb-4">Camera Access Required</p>
                  <p className="text-slate-400 text-sm mb-6">
                    Please allow camera access in your browser settings to scan QR codes.
                  </p>
                  <button
                    onClick={handleRetry}
                    className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                  <p className="text-orange-400 font-medium mb-4">Coming Soon</p>
                  <p className="text-slate-400 text-sm mb-6">{error}</p>
                  <button
                    onClick={handleClose}
                    className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    Got It
                  </button>
                </div>
              ) : success ? (
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <Check className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  </motion.div>
                  <p className="text-emerald-400 font-medium mb-2">QR Code Scanned!</p>
                  <p className="text-slate-400 text-sm">Kit information loaded successfully</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Camera View Placeholder */}
                  <div className="relative bg-slate-800 rounded-lg overflow-hidden" style={{ height: '300px' }}>
                    <div id="qr-reader" ref={scannerRef} className="w-full h-full" />
                    
                    {/* Scanning Overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-lg">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-lg"></div>
                      </div>
                      
                      {/* Scanning Line Animation */}
                      <motion.div
                        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"
                        animate={{ y: [0, 280, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      />
                    </div>
                  </div>

                  {/* Loading Indicator */}
                  {scanning && (
                    <div className="flex items-center justify-center mt-4">
                      <Loader2 className="w-5 h-5 text-emerald-500 animate-spin mr-2" />
                      <span className="text-slate-400 text-sm">Initializing camera...</span>
                    </div>
                  )}

                  {/* Instructions */}
                  <div className="mt-6 text-center">
                    <p className="text-slate-400 text-sm mb-4">
                      Hold your device steady and ensure good lighting
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-emerald-500" />
                        <span className="text-slate-400 text-xs">Camera Ready</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-800 p-4">
              <div className="flex gap-3">
                <button
                  onClick={handleRetry}
                  className="flex-1 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Retry Scan
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QRScanner;
