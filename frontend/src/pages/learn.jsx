import { useState, useEffect } from "react";
import "../styles/App.css";
import Sidebar from "./sidebar";
import LearnPage from "./learnpage";
import api from "../api";

const GuideOverlay = ({ steps, currentStep, onNext, onComplete }) => {
  const step = steps[currentStep];

  const handleBtnClick = () => {
    if (currentStep < steps.length - 1) {
      onNext();
    } else {
      onComplete();
    }
  };

  if (!step) return null;

  return (
    <div className="guide-overlay">
      <div className="guide-box">
        <div className="guide-content">
          <p className="guide-text">{step.content}</p>
          <button onClick={handleBtnClick} className="guide-next-button">
            {currentStep < steps.length - 1 ? "Next →" : "Let's Go!"}
          </button>
        </div>
      </div>
    </div>
  );
};

function Learn() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const tutorialSteps = [
    {
      content: "Welcome to Crack Da Box! This is your dedicated environment for mastering cybersecurity. Here you can access learning materials, practice on virtual machines, and track your progress."
    },
    {
      content: "Use this Search Bar to quickly find specific topics, labs, or documentation. It scans through all available modules to get you what you need fast."
    },
    {
      content: "The 'Learn' tab is your home base. It displays all the topics and modules available to you, organized by category."
    },
    {
      content: "Click on any Material Box to open its details. You'll see descriptions, resource links, and a button to 'Start Learning' which launches your private lab environment."
    },
    {
      content: "Finally, the 'Terminal' tab gives you direct access to a generic shell environment for testing commands or managing your sessions manually. You're ready to start cracking!"
    }
  ];
  
  useEffect(() => {
    const showTutorial = localStorage.getItem("showTutorial");
    if (showTutorial === "true") {
      setIsTutorialActive(true);
      localStorage.removeItem("showTutorial"); // Only show once
    }

    api.get("/api/topics-with-materials/")
      .then((res) => setTopics(res.data))
      .catch((err) => console.error("Failed to fetch topics:", err));
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length > 1) {
      setIsLoading(true);
      api.get(`/api/search/?q=${query}`)
        .then((res) => {
          setSearchResults(res.data);
        })
        .catch((err) => {
          console.error("Search failed:", err);
          setSearchResults([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setSearchResults([]);
    }
  };

  return (
    <div className="learn">
      {isTutorialActive && (
        <GuideOverlay 
          steps={tutorialSteps} 
          currentStep={tutorialStep}
          onNext={() => setTutorialStep(prev => prev + 1)}
          onComplete={() => setIsTutorialActive(false)}
        />
      )}

      <Sidebar
        searchQuery={searchQuery}
        onSearch={handleSearch}
        tutorialStep={isTutorialActive ? tutorialStep : -1}
      />
      <LearnPage
        searchQuery={searchQuery}
        searchResults={searchResults}
        isLoading={isLoading}
        topics={topics}
        tutorialStep={isTutorialActive ? tutorialStep : -1}
      />
    </div>
  );
}

export default Learn;