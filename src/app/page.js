"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Upload,
  X,
  Loader2,
  ZoomIn,
  ArrowDownToLine,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import JSZip from "jszip";

export default function Home() {
  const [images, setImages] = useState([]);
  const [maxSize, setMaxSize] = useState(1);
  const [quality, setQuality] = useState(90);
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [outputFormat, setOutputFormat] = useState("image/jpeg");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({});
  const fileInputRef = useRef(null);

  const handleImageUpload = (event) => {
    const files = event.target.files;
    if (files) {
      const newImages = Array.from(files).map((file) => ({
        file,
        resized: null,
        originalSize: file.size,
        newSize: 0,
        progress: 0,
      }));
      setImages((prev) => [...prev, ...newImages]);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files) {
      const newImages = Array.from(files).map((file) => ({
        file,
        resized: null,
        originalSize: file.size,
        newSize: 0,
        progress: 0,
      }));
      setImages((prev) => [...prev, ...newImages]);
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const resizeImages = useCallback(() => {
    setIsProcessing(true);
    const processImages = async () => {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = async () => {
            const canvas = document.createElement("canvas");
            let { width, height } = img;
            let newWidth = width;
            let newHeight = height;

            if (keepAspectRatio) {
              const aspectRatio = width / height;
              if (width > height) {
                newWidth = Math.min(width, 1920);
                newHeight = newWidth / aspectRatio;
              } else {
                newHeight = Math.min(height, 1920);
                newWidth = newHeight * aspectRatio;
              }
            } else {
              newWidth = Math.min(width, 1920);
              newHeight = Math.min(height, 1920);
            }

            canvas.width = newWidth;
            canvas.height = newHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            canvas.toBlob(
              (blob) => {
                if (!blob) return resolve();

                setImages((prev) =>
                  prev.map((item, index) =>
                    index === i
                      ? {
                        ...item,
                        resized: blob,
                        newSize: blob.size,
                        progress: 100,
                      }
                      : item
                  )
                );
                setProgress((prev) => ({ ...prev, [i]: 100 }));
                resolve();
              },
              outputFormat,
              quality / 100
            );
          };
          img.src = URL.createObjectURL(image.file);
        });
      }
      setIsProcessing(false);
    };
    processImages();
  }, [images, maxSize, quality, keepAspectRatio, outputFormat]);

  const handleDownload = (blob, fileName) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName.split(".")[0]}.${outputFormat.split("/")[1]}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBatchDownload = async () => {
    const zip = new JSZip();
    images.forEach((image, index) => {
      if (image.resized) {
        zip.file(
          `resized-${index + 1}.${outputFormat.split("/")[1]}`,
          image.resized
        );
      }
    });
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = "resized-images.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    else return (bytes / 1048576).toFixed(2) + " MB";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl mx-auto space-y-12 bg-white shadow-2xl rounded-3xl p-8"
      >
        <h1 className="text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
          Multi-Image Resizer
        </h1>
        <div className="space-y-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-[2px] border-dashed border-indigo-300 rounded-2xl p-12 text-center cursor-pointer bg-indigo-50 transition-colors hover:bg-indigo-100"
            onClick={() => fileInputRef.current.click()}
          >
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              multiple
              className="hidden"
            />
            <Upload className="mx-auto h-16 w-16 text-indigo-400" />
            <p className="mt-4 text-lg text-indigo-600">
              Drag and drop or click to upload images
            </p>
          </motion.div>
          <AnimatePresence>
            {images.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-wrap gap-4"
              >
                {images.map((image, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="relative"
                  >
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="w-[80px] h-[80px] overflow-hidden rounded-lg cursor-pointer shadow-md hover:shadow-lg transition-shadow">
                          <img
                            src={URL.createObjectURL(image.file)}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity">
                            <ZoomIn className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Image Preview</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h3 className="font-semibold mb-2">Original</h3>
                            <img
                              src={URL.createObjectURL(image.file)}
                              alt={`Original ${index + 1}`}
                              className="max-w-full h-auto rounded-lg shadow-md"
                            />
                            <p className="mt-2">
                              Size: {formatFileSize(image.originalSize)}
                            </p>
                          </div>
                          {image.resized && (
                            <div>
                              <h3 className="font-semibold mb-2">Resized</h3>
                              <img
                                src={URL.createObjectURL(image.resized)}
                                alt={`Resized ${index + 1}`}
                                className="max-w-full h-auto rounded-lg shadow-md"
                              />
                              <p className="mt-2">
                                Size: {formatFileSize(image.newSize)}
                              </p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                    {image.progress > 0 && image.progress < 100 && (
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500"
                          style={{ width: `${image.progress}%` }}
                        ></div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl shadow-inner">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="max-size"
                  className="text-lg font-medium text-gray-700"
                >
                  Max Size (MB):
                </Label>
                <Input
                  id="max-size"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={maxSize}
                  onChange={(e) => setMaxSize(parseFloat(e.target.value))}
                  className="w-24 text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="quality"
                  className="text-lg font-medium text-gray-700"
                >
                  Quality:
                </Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    id="quality"
                    min={1}
                    max={100}
                    step={1}
                    value={[quality]}
                    onValueChange={(value) => setQuality(value[0])}
                    className="flex-grow"
                  />
                  <span className="w-12 text-center font-medium text-indigo-600">
                    {quality}%
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="keep-aspect-ratio"
                  checked={keepAspectRatio}
                  onCheckedChange={setKeepAspectRatio}
                />
                <Label
                  htmlFor="keep-aspect-ratio"
                  className="text-lg font-medium text-gray-700"
                >
                  Keep Aspect Ratio
                </Label>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="output-format"
                  className="text-lg font-medium text-gray-700"
                >
                  Output Format:
                </Label>
                <Select value={outputFormat} onValueChange={setOutputFormat}>
                  <SelectTrigger id="output-format" className="w-full">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image/jpeg">JPEG</SelectItem>
                    <SelectItem value="image/png">PNG</SelectItem>
                    <SelectItem value="image/webp">WebP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-center space-x-4">
            <Button
              onClick={resizeImages}
              disabled={images.length === 0 || isProcessing}
              className="w-full max-w-md py-6 text-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl  shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                "Resize Images"
              )}
            </Button>
            {images.some((img) => img.resized) && (
              <Button
                onClick={handleBatchDownload}
                className="w-full max-w-md py-6 text-xl bg-white text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-50 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <ArrowDownToLine className="mr-2 h-5 w-5" />
                Download All
              </Button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {images.some((img) => img.resized) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <Separator className="my-8" />
              <div className="space-y-8">
                <h2 className="text-2xl font-semibold text-indigo-600">
                  Results
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {images.map(
                    (image, index) =>
                      image.resized && (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4 p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                        >
                          <img
                            src={URL.createObjectURL(image.resized)}
                            alt={`Resized ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg shadow-md"
                          />
                          <p className="text-lg text-gray-600">
                            Original Size: {formatFileSize(image.originalSize)}
                          </p>
                          <p className="text-lg text-gray-600">
                            New Size: {formatFileSize(image.newSize)}
                          </p>
                          <p className="text-lg font-semibold text-indigo-600">
                            Reduction:{" "}
                            {(
                              ((image.originalSize - image.newSize) /
                                image.originalSize) *
                              100
                            ).toFixed(2)}
                            %
                          </p>
                          <Button
                            onClick={() =>
                              handleDownload(image.resized, image.file.name)
                            }
                            className="w-full py-4 text-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 rounded-xl transition-colors duration-200"
                          >
                            <Download className="w-5 h-5 mr-2" /> Download
                            Resized
                          </Button>
                        </motion.div>
                      )
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {images.length > 0 && !images.some((img) => img.resized) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center text-lg text-gray-500"
          >
            Upload images and click "Resize Images" to see the results here.
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
