import { useEffect, useState } from "react";
import "../styles/learnpage.css";
import MaterialModal from "./material_modal";

function LearnPage() {
  const [topics, setTopics] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/topics-with-materials/")
      .then((res) => res.json())
      .then((data) => setTopics(data))
      .catch((err) => console.error("Failed to fetch topics:", err));
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
        <h1>Scary Hour 4</h1>
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