import { useState, useEffect } from "react";
import "../styles/App.css";
import Sidebar from "./sidebar";
import LearnPage from "./learnpage";
import api from "../api"; // Make sure api is available or use fetch

function Learn() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
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
      <Sidebar
        searchQuery={searchQuery}
        onSearch={handleSearch}
      />
      <LearnPage
        searchQuery={searchQuery}
        searchResults={searchResults}
        isLoading={isLoading}
        topics={topics}
      />
    </div>
  );
}

export default Learn;