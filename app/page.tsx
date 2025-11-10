"use client";
import React, { useState, useRef, useEffect, FormEvent, ChangeEvent } from "react";
import { Paperclip, Send, User, Bot, XCircle, Loader2 } from "lucide-react";

interface Message {
  id: number;
  sender: "user" | "bot";
  text: string;
  images?: string[];
}

interface SelectedImage {
  file: File;
  previewUrl: string;
}

export default function App() {
  const [prompt, setPrompt] = useState<string>("");
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "bot",
      text: `Merhaba! Ben Mutfak Asistanınız. Buzdolabınızın bir veya birden fazla fotoğrafını yükleyin ve size ne yemek yapabileceğinizi söyleyeyim.`,
    },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Cleanup object URLs
    return () => {
      selectedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, [selectedImages]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const files = Array.from(event.target.files);
    const newImages: SelectedImage[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setSelectedImages((prev) => [...prev, ...newImages]);
    setError(null);
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt && selectedImages.length === 0) {
      setError("Lütfen bir metin yazın veya bir resim yükleyin.");
      return;
    }

    setError(null);
    setIsLoading(true);

    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      text: trimmedPrompt,
      images: selectedImages.map((img) => img.previewUrl),
    };
    setMessages((prev) => [...prev, userMessage]);

    const API_URL = "https://ai-gemini-food-back-1.onrender.com/ara";
    const formData = new FormData();
    formData.append("prompt", trimmedPrompt);
    selectedImages.forEach((img) => formData.append("image", img.file));

    try {
      const response = await fetch(API_URL, { method: "POST", body: formData });
      if (!response.ok) throw new Error(`Sunucu hatası: ${response.status} ${response.statusText}`);

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const botMessage: Message = {
        id: Date.now() + 1,
        sender: "bot",
        text: data.result,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: "bot",
        text: `Üzgünüm, bir hata oluştu: ${err.message}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setPrompt("");
      setSelectedImages([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <h1 className="text-xl font-semibold text-gray-800 text-center">
            🤖 Gemini AI Mutfak Asistanı (React + TS)
          </h1>
        </div>
      </header>

      <main ref={chatBoxRef} className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="max-w-3xl mx-auto w-full">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} mb-4`}>
              {msg.sender === "bot" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center mr-3">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl shadow-md ${
                  msg.sender === "user" ? "bg-blue-600 text-white rounded-br-lg" : "bg-white text-gray-800 rounded-bl-lg"
                }`}
                style={{ overflowWrap: "break-word", wordWrap: "break-word", hyphens: "auto" }}
              >
                {msg.images && msg.images.length > 0 && (
                  <div className="flex space-x-2 mb-2">
                    {msg.images.map((imgUrl, i) => (
                      <img key={i} src={imgUrl} alt={`Preview ${i}`} className="h-24 w-24 object-cover rounded-lg shadow-md" />
                    ))}
                  </div>
                )}
                {msg.text.split("\n").map((line, index) => (
                  <span key={index}>
                    {line}
                    <br />
                  </span>
                ))}
              </div>
              {msg.sender === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center ml-3">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-3xl mx-auto w-full">
          {error && <div className="text-red-600 text-sm mb-2 text-center">{error}</div>}

          {selectedImages.length > 0 && (
            <div className="flex space-x-2 mb-2">
              {selectedImages.map((img, i) => (
                <div key={i} className="relative inline-block">
                  <img src={img.previewUrl} alt={`Seçilen resim ${i}`} className="h-20 w-20 object-cover rounded-lg shadow-md" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label="Resmi kaldır"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} multiple className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Paperclip className="w-6 h-6" />
            </button>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Bir metin yazın veya resim yükleyin..."
              rows={2}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <button
              type="submit"
              disabled={isLoading}
              className={`p-3 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed ${
                isLoading ? "animate-pulse" : ""
              }`}
              aria-label="Gönder"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}
