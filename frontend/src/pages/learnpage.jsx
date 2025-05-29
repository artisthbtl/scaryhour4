import { useEffect, useState } from "react";
import "../styles/learnpage.css";
import MaterialModal from "./material_modal";
import { ACCESS_TOKEN } from "../constant";

function LearnPage() {
  const [topics, setTopics] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [username, setUsername] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/api/topics-with-materials/")
      .then((res) => res.json())
      .then((data) => setTopics(data))
      .catch((err) => console.error("Failed to fetch topics:", err));

    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) {
          console.log("No token found, user might not be logged in.");
          setUsername("Guest");
          return;
        }

        const response = await fetch("http://localhost:8000/api/user/me/", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const userData = await response.json();
        if (userData && userData.username) {
          setUsername(userData.username);
        } else {
          setUsername("User");
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setUsername("User");
      }
    };

    fetchCurrentUser();
  }, []);

  const handleMaterialClick = (material) => {
    setSelectedMaterial(material);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedMaterial(null);
  };

  return (
    <div className="learnpage">
      <div className="title">
        <h1>hi, {username || "Loading..."}</h1> 
      </div>
      <div className="topic-box">
        {topics.map((topic) => (
          <div key={topic.id} className="topic-section">
            <div className="topic-name">
              <h1>{topic.name}</h1>
            </div>
            <div className="grid-container">
              {topic.materials.map((material) => (
                <div
                  className="material-box"
                  key={material.id}
                  onClick={() => handleMaterialClick(material)}
                >
                  {material.name}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showModal && selectedMaterial && (
        <MaterialModal
          material={selectedMaterial}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default LearnPage;