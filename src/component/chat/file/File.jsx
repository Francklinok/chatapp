import "./file.css";
import { useRef, useState, useCallback } from "react";
import TakePhoto from "./camera/Camera";
import PropTypes from "prop-types";

const File = ({ onSend }) => {
  // State variables to track the file upload process
  const [uploadError, setUploadError] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isIconVisible, setIsIconVisible] = useState(true);
  const [showTakePhoto, setShowTakePhoto] = useState(false);
  const fileInputRef = useRef(null);

  // Map of file types to valid extensions
  const extensionToTypeMap = {
    image: ["jpeg", "jpg", "png", "gif", "bmp", "webp"],
    video: ["mp4", "avi", "mov", "mkv", "webm"],
    audio: ["mp3", "wav", "ogg", "flac", "aac"],
    document: ["pdf", "doc", "docx", "txt"],
    contact: ["vcf"],
  };


  // Handle icon click (either open the camera or trigger the file input)
  const handleIconClick = (fileType) => {
    if (fileType === "camera") {
      setShowTakePhoto(true); // Show camera if camera is clicked
      setIsIconVisible(false); // Hide the icon after camera selection
    } else {
      fileInputRef.current.value = ""; // Reset file input
      fileInputRef.current.click(); // Trigger file selection
    }
  };

  // Determine the file type based on its extension
  const determineFileType = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();
    for (const [type, extensions] of Object.entries(extensionToTypeMap)) {
      if (extensions.includes(extension)) return type; // Return type if extension matches
    }
    return null; // Return null if the file type is unsupported
  };

  // Handle file selection
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);

    if (!files.length) return;

    // Filter out files that exceed the size limit (5MB)
    const validFiles = files.filter((file) => file.size <= 5 * 1024 * 1024);
    if (validFiles.length !== files.length) {
      setUploadError(
        "Some files exceed the maximum allowed size (5MB)."
      );
      return;
    }

    // Map the files to their types and generate preview URLs
    const filesWithType = validFiles
      .map((file) => {
        const type = determineFileType(file.name);
        if (!type) {
          setUploadError(
            `The file "${file.name}" has an unsupported type.`
          );
          return null;
        }
        return {
          file,
          type,
          preview: URL.createObjectURL(file),
        };
      })
      .filter(Boolean); // Remove invalid files

    setSelectedFiles((prev) => [...prev, ...filesWithType]); // Add valid files to the selected files state
    setUploadError(null); // Reset error state
  };

  // Clear selected files and reset the state
  const handleClearFiles = useCallback(() => {
    selectedFiles.forEach((fileObj) => URL.revokeObjectURL(fileObj.preview)); // Revoke object URLs
    setSelectedFiles([]); // Clear selected files
    setUploadError(null); // Reset error
    setIsIconVisible(true); // Show the upload icon again
  }, [selectedFiles]);

  // Handle sending selected files
  const handleSendFiles = () => {
    if (!selectedFiles.length) {
      setUploadError("No files to send.");
      return;
    }

    onSend({ files: selectedFiles }); // Call the onSend function passed as prop
    setSelectedFiles([]); // Clear selected files after sending
  };

  // Render previews of the selected files
  const renderFilePreviews = () => {
    return (
      <div className="file-preview">
        {selectedFiles.map((fileObj, index) => (
          <div key={`${fileObj.type}-${index}`} className="file-item">
            {fileObj.type === "image" && (
              <img
                src={fileObj.preview}
                alt={`image ${index + 1}`}
                style={{ maxWidth: "100px" }}
              />
            )}
            {fileObj.type === "video" && (
              <video
                src={fileObj.preview}
                controls
                style={{ maxWidth: "100px" }}
              />
            )}
            {fileObj.type === "audio" && (
              <audio src={fileObj.preview} controls />
            )}
            {fileObj.type === "document" && (
              <a
                href={fileObj.preview}
                target="_blank"
                rel="noopener noreferrer"
              >
                Document {index + 1}
              </a>
            )}
            {fileObj.type === "contact" && (
              <p>Contact {index + 1} selected.</p>
            )}
          </div>
        ))}
      </div>
    );
  };
  

  return (
    <div className="content">
      {showTakePhoto ? (
        <TakePhoto onPhotoSent={handleSendFiles} />
      ) : (
        <div>
          {isIconVisible && (
            <div className="file">
              {Object.keys(extensionToTypeMap).map((type) => (
                <div
                  key={type}
                  className="myfile"
                  onClick={() => handleIconClick(type)}
                >
                  <img src={`./${type}.png`} alt={`Upload ${type}`} />
                </div>
              ))}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
                multiple
              />
            </div>
          )}
        </div>
      )}

      {!showTakePhoto && renderFilePreviews()}

      <div className="file-action">
        <button onClick={handleClearFiles}>Effacer</button>
        <button onClick={handleSendFiles} disabled={!selectedFiles.length}>
          Envoyer {selectedFiles.length}
        </button>
      </div>

      {uploadError && <p className="error">{uploadError}</p>}
    </div>
  );
};

File.propTypes = {
  onSend: PropTypes.func.isRequired,
};

export default File;
