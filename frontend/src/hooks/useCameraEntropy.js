import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook to capture real camera sensor noise for entropy generation
 * Uses WebRTC to access camera, captures frame differences as noise
 */
export const useCameraEntropy = () => {
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [entropyData, setEntropyData] = useState(null);
  const [noiseLevel, setNoiseLevel] = useState(0);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const lastFrameRef = useRef(null);
  const intervalRef = useRef(null);

  // Start camera capture
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 64,  // Low res for entropy, not display
          height: 64,
          frameRate: 10
        }
      });
      
      streamRef.current = stream;
      
      // Create hidden video element
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      videoRef.current = video;
      
      // Create canvas for frame capture
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      canvasRef.current = canvas;
      
      await video.play();
      setHasPermission(true);
      setIsActive(true);
      
      // Start capturing frames for entropy
      intervalRef.current = setInterval(() => {
        captureNoiseEntropy();
      }, 200); // Capture 5 times per second
      
    } catch (error) {
      console.error('Camera access denied:', error);
      setHasPermission(false);
      setIsActive(false);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsActive(false);
  }, []);

  // Capture frame and extract noise entropy
  const captureNoiseEntropy = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Draw current frame
    ctx.drawImage(video, 0, 0, 64, 64);
    const currentFrame = ctx.getImageData(0, 0, 64, 64);
    const currentData = currentFrame.data;
    
    if (lastFrameRef.current) {
      // Calculate pixel differences (sensor noise)
      const lastData = lastFrameRef.current;
      let noiseSum = 0;
      const noiseBytes = [];
      
      for (let i = 0; i < currentData.length; i += 4) {
        // Calculate difference for R, G, B channels
        const diffR = Math.abs(currentData[i] - lastData[i]);
        const diffG = Math.abs(currentData[i + 1] - lastData[i + 1]);
        const diffB = Math.abs(currentData[i + 2] - lastData[i + 2]);
        
        // Accumulate noise
        noiseSum += diffR + diffG + diffB;
        
        // Use LSBs of differences as entropy
        noiseBytes.push((diffR ^ diffG ^ diffB) & 0xFF);
      }
      
      // Calculate noise level (0-100)
      const avgNoise = noiseSum / (currentData.length / 4 * 3);
      setNoiseLevel(Math.min(100, avgNoise * 10));
      
      // Convert noise bytes to hex string (take first 32 bytes = 64 hex chars)
      const entropyHex = noiseBytes.slice(0, 32)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      setEntropyData({
        hex: entropyHex,
        bytes: noiseBytes.slice(0, 32),
        timestamp: Date.now(),
        noiseLevel: avgNoise
      });
    }
    
    // Store current frame for next comparison
    lastFrameRef.current = new Uint8ClampedArray(currentData);
  }, []);

  // Get current entropy for API submission
  const getEntropy = useCallback(() => {
    if (!entropyData) return null;
    return {
      camera_entropy: entropyData.hex,
      noise_level: noiseLevel,
      timestamp: entropyData.timestamp
    };
  }, [entropyData, noiseLevel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    isActive,
    hasPermission,
    noiseLevel,
    entropyData,
    startCamera,
    stopCamera,
    getEntropy
  };
};

export default useCameraEntropy;
