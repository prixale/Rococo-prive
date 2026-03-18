import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Flame, MessageCircle, Share2 } from 'lucide-react';
import './StoryViewer.css';

const StoryViewer = ({ story, onClose, onNext, onPrev }) => {
  const [progress, setProgress] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  
  const stories = story?.stories ? story.stories : [story];
  const currentStory = stories[currentStoryIndex];
  
  const hasMultipleStories = story?.stories && story.stories.length > 1;

  useEffect(() => {
    if (!currentStory) return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          if (hasMultipleStories && currentStoryIndex < stories.length - 1) {
            setCurrentStoryIndex(prev => prev + 1);
          } else {
            onNext();
          }
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [currentStory, currentStoryIndex, hasMultipleStories, stories.length, onNext]);

  useEffect(() => {
    setCurrentStoryIndex(0);
    setProgress(0);
  }, [story]);

  if (!currentStory) return null;

  const storyImage = currentStory.url || currentStory.image;
  const storyName = story.name;

  return (
    <AnimatePresence>
      <motion.div 
        className="story-viewer-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="story-viewer-content">
          {hasMultipleStories && (
            <div className="story-progress-container">
              {stories.map((_, idx) => (
                <div key={idx} className="story-progress-bar">
                  <motion.div 
                    className="story-progress-fill" 
                    style={{ 
                      width: idx < currentStoryIndex ? '100%' : idx === currentStoryIndex ? `${progress}%` : '0%' 
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          <header className="story-viewer-header">
            <div className="story-user-info">
              <img src={story.image || storyImage} alt={storyName} />
              <span className="story-username">{storyName}</span>
              <span className="story-time">14h</span>
            </div>
            <button className="story-close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </header>

          <div className="story-main-media">
            {currentStory.type === 'video' ? (
              <video 
                src={currentStory.url} 
                autoPlay 
                loop 
                muted 
                playsInline
              />
            ) : (
              <img src={storyImage} alt="Story Content" />
            )}
             <div className="story-media-overlay"></div>
          </div>

          <footer className="story-viewer-footer">
             <div className="story-reply-box">
                <input type="text" placeholder="Envía un mensaje..." />
                <MessageCircle size={20} />
             </div>
             <div className="story-actions">
                <motion.button whileTap={{ scale: 1.5 }} className="story-action-btn"><Heart size={24} color="#FF0055" /></motion.button>
                <motion.button whileTap={{ scale: 1.5 }} className="story-action-btn"><Flame size={24} color="#D4AF37" /></motion.button>
                <button className="story-action-btn"><Share2 size={24} /></button>
             </div>
          </footer>

          <div className="story-nav-areas">
             <div className="story-nav-prev" onClick={() => {
               if (currentStoryIndex > 0) {
                 setCurrentStoryIndex(prev => prev - 1);
               } else {
                 onPrev();
               }
             }}></div>
             <div className="story-nav-next" onClick={() => {
               if (hasMultipleStories && currentStoryIndex < stories.length - 1) {
                 setCurrentStoryIndex(prev => prev + 1);
               } else {
                 onNext();
               }
             }}></div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StoryViewer;
