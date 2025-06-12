import "../styles/materialmodal.css";
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import React, { useState } from "react";
import { startLabSession } from "../api";

function MaterialModal({ material, onClose }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!material) {
    return null;
  }

  const handleStartLearning = async () => {
    if (!material || !material.id) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await startLabSession(material.id);
      if (response.status === 201 && response.data.session_id) {
          const sessionId = response.data.session_id;
          console.log("Lab session started:", sessionId);
          navigate(`/shell/${sessionId}`);
      }
    } catch (err) {
      console.error("Failed to start lab session:", err);
      setError("Failed to start lab. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenMaterialLink = () => {
    if (material.link) {
      window.open(material.link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{material.name}</h2>
          <button className="modal-close-button" onClick={onClose}>
            <CloseIcon fontSize="large" />
          </button>
        </div>
        <div className="modal-content">
          <p className="modal-description">
            {material.description || "No description available."}
          </p>
        </div>
        <div className="modal-buttons">
          <button
            className={`material-action-button ${!material.link ? 'disabled-button' : ''}`}
            onClick={handleOpenMaterialLink}
            disabled={!material.link}
          >
            Materials
          </button>
          <button 
            className="material-action-button start-learning-button" 
            onClick={handleStartLearning}
            disabled={isLoading}
          >
            {isLoading ? "Starting Lab..." : "Start Learning"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MaterialModal;