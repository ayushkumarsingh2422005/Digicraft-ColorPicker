'use client'
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface ColorInfo {
  hex: string;
  rgb: string;
  hsl: string;
}

const DEFAULT_IMAGE = '/color-picker-demo.png';

const GradientBlob = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    <div className="absolute -inset-[10px] opacity-50">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-blob" />
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-pink-500 rounded-full blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-blue-500 rounded-full blur-3xl animate-blob animation-delay-4000" />
    </div>
  </div>
)

const FloatingParticles = () => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    opacity: number;
    scale: number;
  }>>([]);

  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const particlesArray = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      opacity: 0.2 + Math.random() * 0.5,
      scale: 0.2 + Math.random() * 0.8,
    }));
    
    setParticles(particlesArray);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 bg-white rounded-full"
          initial={{
            x: particle.x,
            y: particle.y,
            opacity: particle.opacity,
            scale: particle.scale,
          }}
          animate={{
            y: [particle.y, particle.y - 1000],
            opacity: [particle.opacity, 0],
          }}
          transition={{
            duration: 5 + Math.random() * 10,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
};

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string>(DEFAULT_IMAGE);
  const [selectedColor, setSelectedColor] = useState<ColorInfo | null>(null);
  const [colorPalette, setColorPalette] = useState<ColorInfo[]>([]);
  const [showCopied, setShowCopied] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverColor, setHoverColor] = useState<ColorInfo | null>(null);

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    handleFile(file);
  };

  const handleFile = (file?: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setColorPalette([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const getColorAtPoint = (canvas: HTMLCanvasElement, clientX: number, clientY: number): ColorInfo | null => {
    const context = canvas.getContext('2d');
    if (!context) return null;

    const rect = canvas.getBoundingClientRect();
    
    // Get click coordinates relative to canvas
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;

    // Get the actual image dimensions and position within the canvas
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const imageWidth = imageData.width;
    const imageHeight = imageData.height;

    // Calculate the displayed image dimensions and position
    const displayRatio = Math.min(
      rect.width / imageWidth,
      rect.height / imageHeight
    );
    
    const displayWidth = imageWidth * displayRatio;
    const displayHeight = imageHeight * displayRatio;

    // Calculate image position (centered in canvas)
    const imageLeft = (rect.width - displayWidth) / 2;
    const imageTop = (rect.height - displayHeight) / 2;

    // Check if click is within image bounds
    if (
      canvasX < imageLeft ||
      canvasX > imageLeft + displayWidth ||
      canvasY < imageTop ||
      canvasY > imageTop + displayHeight
    ) {
      return null;
    }

    // Convert click position to image coordinates
    const imageX = Math.floor(((canvasX - imageLeft) / displayWidth) * imageWidth);
    const imageY = Math.floor(((canvasY - imageTop) / displayHeight) * imageHeight);

    // Get pixel data
    const pixelData = context.getImageData(imageX, imageY, 1, 1).data;
    const [r, g, b] = pixelData;
    const rgb = `rgb(${r}, ${g}, ${b})`;
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    const hsl = rgbToHsl(r, g, b);
    
    return { hex, rgb, hsl };
  };

  const getColorFromPoint = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const color = getColorAtPoint(canvas, event.clientX, event.clientY);
    if (color) {
      setSelectedColor(color);
      if (!colorPalette.some(c => c.hex === color.hex)) {
        setColorPalette(prev => [...prev.slice(-11), color]);
      }
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const color = getColorAtPoint(canvas, event.clientX, event.clientY);
    if (color) {
      setHoverColor(color);
    }
  };

  useEffect(() => {
    const imgElement = new window.Image() as HTMLImageElement;
    imgElement.src = selectedImage;
    imgElement.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      const container = canvas.parentElement;
      if (!container) return;

      // Set canvas size to match container
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;

      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate scaling to fit image while maintaining aspect ratio
      const scale = Math.min(
        canvas.width / imgElement.width,
        canvas.height / imgElement.height
      );

      const x = (canvas.width - imgElement.width * scale) / 2;
      const y = (canvas.height - imgElement.height * scale) / 2;

      // Draw image centered and scaled
      context.drawImage(
        imgElement,
        x,
        y,
        imgElement.width * scale,
        imgElement.height * scale
      );
    };
  }, [selectedImage]);

  useEffect(() => {
    const handleResize = () => {
      const imgElement = new window.Image() as HTMLImageElement;
      imgElement.src = selectedImage;
      imgElement.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        const container = canvas.parentElement;
        if (!container) return;

        // Update canvas size
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Recalculate scaling and position
        const scale = Math.min(
          canvas.width / imgElement.width,
          canvas.height / imgElement.height
        );

        const x = (canvas.width - imgElement.width * scale) / 2;
        const y = (canvas.height - imgElement.height * scale) / 2;

        // Redraw image
        context.drawImage(
          imgElement,
          x,
          y,
          imgElement.width * scale,
          imgElement.height * scale
        );
      };
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedImage]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a15] text-white relative overflow-hidden">
      <GradientBlob />
      <FloatingParticles />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(123,49,255,0.1)_0%,transparent_100%)]" />
      
      {/* Modern Header */}
      <header className="border-b border-purple-500/10 backdrop-blur-xl bg-[#0a0a15]/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl shadow-lg shadow-purple-500/20 p-2 group-hover:shadow-purple-500/40 transition-all">
                  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    DigiCraft
                  </h1>
                  <p className="text-xs text-purple-300/60">Color Picker</p>
                </div>
              </Link>
              
              <div className="hidden md:flex items-center gap-6 text-sm">
                <Link href="https://digicraft.one" className="text-purple-300/80 hover:text-purple-300 transition-colors">
                  Main Site
                </Link>
                <div className="relative group">
                  <button className="text-purple-300/80 hover:text-purple-300 transition-colors flex items-center gap-1">
                    Products
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute top-full left-0 mt-2 w-48 py-2 bg-[#1a1a2e] rounded-lg shadow-xl border border-purple-500/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link 
                      href="https://colorpicker.digicraft.one" 
                      className="block px-4 py-2 text-purple-300/80 hover:text-purple-300 hover:bg-purple-500/10"
                    >
                      Color Picker
                    </Link>
                    <Link 
                      href="https://digicraft.one/services" 
                      className="block px-4 py-2 text-purple-300/80 hover:text-purple-300 hover:bg-purple-500/10"
                    >
                      Web Development
                    </Link>
                    <Link 
                      href="https://digicraft.one/services" 
                      className="block px-4 py-2 text-purple-300/80 hover:text-purple-300 hover:bg-purple-500/10"
                    >
                      Mobile Apps
                    </Link>
                  </div>
                </div>
                <Link href="#features" className="text-purple-300/80 hover:text-purple-300 transition-colors">
                  Features
                </Link>
                <Link href="https://digicraft.one/contact" className="text-purple-300/80 hover:text-purple-300 transition-colors">
                  Contact
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => document.getElementById('imageInput')?.click()}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 group"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Upload Image
                <input
                  id="imageInput"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Color Picker Section */}
        <div className="grid md:grid-cols-[1fr,320px] gap-8 mb-32">
          {/* Canvas Section */}
          <div className="bg-[#1a1a2e] rounded-xl shadow-lg border border-purple-500/10 p-4">
            <div 
              className={`relative rounded-lg overflow-hidden transition-all aspect-video ${dragOver ? 'scale-98 border-2 border-dashed border-purple-500' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='%23ffffff10' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='20' height='20' fill='url(%23grid)' /%3E%3C/svg%3E")` 
              }}
            >
              <canvas
                ref={canvasRef}
                onClick={getColorFromPoint}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoverColor(null)}
                className="w-full h-full object-contain cursor-crosshair"
              />
            </div>
          </div>

          {/* Color Info Section */}
          <div className="space-y-6">
            {/* Color Preview Panel */}
            <div className="bg-[#1a1a2e] rounded-xl shadow-lg border border-purple-500/10 p-6">
              <h2 className="text-lg font-medium mb-4 text-purple-300">Colors</h2>
              <div className="space-y-6">
                {/* Colors Preview Row */}
                <div className="flex gap-4">
                  {/* Live Color Preview */}
                  <div className="w-20">
                    <div
                      className="h-20 rounded-lg shadow-inner transition-colors duration-200"
                      style={{ backgroundColor: hoverColor?.hex || 'transparent' }}
                    />
                    <div className="mt-2 text-center">
                      <p className="text-sm text-purple-300/60">Live</p>
                    </div>
                  </div>

                  {/* Selected Color Preview */}
                  <div className="flex-1">
                    <div
                      className="h-20 rounded-lg shadow-inner"
                      style={{ backgroundColor: selectedColor?.hex || 'transparent' }}
                    />
                    <div className="mt-2 text-center">
                      <p className="text-sm text-purple-300/60">Selected</p>
                    </div>
                  </div>
                </div>

                {/* Selected Color Details */}
                {selectedColor && (
                  <div className="space-y-2">
                    <button
                      onClick={() => copyToClipboard(selectedColor.hex)}
                      className="w-full px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 rounded-md text-sm font-medium transition-colors"
                    >
                      {selectedColor.hex}
                    </button>
                    <button
                      onClick={() => copyToClipboard(selectedColor.rgb)}
                      className="w-full px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 rounded-md text-sm font-medium transition-colors"
                    >
                      {selectedColor.rgb}
                    </button>
                    <button
                      onClick={() => copyToClipboard(selectedColor.hsl)}
                      className="w-full px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 rounded-md text-sm font-medium transition-colors"
                    >
                      {selectedColor.hsl}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Color Palette */}
            <div className="bg-[#1a1a2e] rounded-xl shadow-lg border border-purple-500/10 p-6">
              <h2 className="text-lg font-medium mb-4 text-purple-300">Color Palette</h2>
              <div className="grid grid-cols-4 gap-3">
                {colorPalette.map((color, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg cursor-pointer hover:scale-105 transition-transform shadow-lg"
                    style={{ backgroundColor: color.hex }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Features Section with Enhanced Design and increased top margin */}
        <div className="relative mt-32" id="features">
          {/* Section Title */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
              Powerful Features
            </h2>
            <p className="text-purple-300/60 max-w-2xl mx-auto">
              Everything you need to extract and analyze colors from your images
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: Color Picker */}
            <div className="group relative bg-gradient-to-br from-purple-500/5 to-blue-500/5 p-8 rounded-2xl border border-purple-500/10 hover:border-purple-500/20 transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              <div className="relative">
                <div className="bg-purple-500/20 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-purple-300 mb-3">Precision Color Picker</h3>
                <p className="text-purple-300/60">
                  Click anywhere on your image to instantly extract precise color values.
                </p>
              </div>
            </div>

            {/* Feature 2: Multiple Formats */}
            <div className="group relative bg-gradient-to-br from-purple-500/5 to-blue-500/5 p-8 rounded-2xl border border-purple-500/10 hover:border-purple-500/20 transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              <div className="relative">
                <div className="bg-purple-500/20 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-purple-300 mb-3">Multiple Color Formats</h3>
                <p className="text-purple-300/60">
                  Get instant access to HEX, RGB, and HSL color codes with one-click copying.
                </p>
              </div>
            </div>

            {/* Feature 3: Color Palette */}
            <div className="group relative bg-gradient-to-br from-purple-500/5 to-blue-500/5 p-8 rounded-2xl border border-purple-500/10 hover:border-purple-500/20 transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              <div className="relative">
                <div className="bg-purple-500/20 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-purple-300 mb-3">Smart Color Palette</h3>
                <p className="text-purple-300/60">
                  Automatically build and save color palettes as you pick colors from your images.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modern Footer */}
      <footer className="relative z-10 pt-24 pb-12">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a15] to-purple-900/20 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(123,49,255,0.05)_0%,transparent_100%)]" />

        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
            {/* Company Info */}
            <div>
              <Link href="/" className="flex items-center gap-2 mb-6">
                <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl shadow-lg shadow-purple-500/20 p-2">
                  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    DigiCraft
                  </h3>
                  <p className="text-xs text-purple-300/60">Color Picker</p>
                </div>
              </Link>
              <p className="text-gray-400 mb-6">
                Extract and analyze colors from any image with precision and ease.
              </p>
              <div className="flex space-x-4">
                <motion.a
                  href="https://github.com/ayushkumarsingh2422005"
          target="_blank"
          rel="noopener noreferrer"
                  whileHover={{ y: -3 }}
                  className="text-gray-400 hover:text-purple-500 transition-colors"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" clipRule="evenodd" />
                  </svg>
                </motion.a>
                <motion.a
                  href="mailto:ayush.mauraya.dev@gmail.com"
          target="_blank"
          rel="noopener noreferrer"
                  whileHover={{ y: -3 }}
                  className="text-gray-400 hover:text-purple-500 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </motion.a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold text-purple-300 mb-6">Features</h3>
              <ul className="space-y-4">
                <li>
                  <Link href="#features" className="text-gray-400 hover:text-purple-500 transition-colors">
                    Color Extraction
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="text-gray-400 hover:text-purple-500 transition-colors">
                    Multiple Formats
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="text-gray-400 hover:text-purple-500 transition-colors">
                    Color Palette
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="text-gray-400 hover:text-purple-500 transition-colors">
                    Drag & Drop
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-lg font-semibold text-purple-300 mb-6">Resources</h3>
              <ul className="space-y-4">
                <li>
                  <Link 
                    href="https://digicraft.one" 
                    className="text-gray-400 hover:text-purple-500 transition-colors"
                  >
                    Main Website
                  </Link>
                </li>
                <li>
                  <Link 
                    href="https://digicraft.one/contact" 
                    className="text-gray-400 hover:text-purple-500 transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link 
                    href="https://digicraft.one/services" 
                    className="text-gray-400 hover:text-purple-500 transition-colors"
                  >
                    Our Services
                  </Link>
                </li>
                <li>
                  <Link 
                    href="https://github.com/ayushkumarsingh2422005" 
                    className="text-gray-400 hover:text-purple-500 transition-colors"
                  >
                    GitHub
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent mb-8" />

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
            <p>© 2024 DigiCraft Color Picker. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link 
                href="https://digicraft.one/privacy-policy" 
                className="hover:text-purple-500 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link 
                href="https://digicraft.one/terms" 
                className="hover:text-purple-500 transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Keep existing copied notification */}
      {showCopied && (
        <div className="fixed bottom-8 right-8 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg shadow-purple-500/20">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}
