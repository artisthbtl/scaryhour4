import React from "react";
import "../styles/materialmodal.css"; // Ensure this path is correct
import CloseIcon from '@mui/icons-material/Close';

function MaterialModal({ material, onClose }) {
  if (!material) {
    return null;
  }

  const handleStartLearning = () => {
    console.log(`Start learning: ${material.name} (ID: ${material.id})`);
    alert(`Starting learning environment for: ${material.name}`);
    onClose(); // Close modal after clicking start
  };

  const handleOpenMaterialLink = () => {
    // This check is still good, but the button will be disabled if no link
    if (material.link) {
      window.open(material.link, '_blank', 'noopener,noreferrer');
    }
    // No need for an else alert here if the button is visibly disabled
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
            disabled={!material.link} // Add disabled attribute
          >
            Materials
          </button>
          <button
            className="material-action-button start-learning-button"
            onClick={handleStartLearning}
          >
            Start Learning
          </button>
        </div>
      </div>
    </div>
  );
}

export default MaterialModal;