import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

const storage = getStorage();

const Upload = async (file, fileType) => {
  const allowedFileTypes = {
    image: ["image/jpeg", "image/png", "image/gif"],
    video: ["video/mp4", "video/webm"],
    audio: ["audio/mpeg", "audio/wav"],
    document: ["application/pdf", "application/docx", "application/doc"],
    contact: ["text/vcard", "application/vnd.ms-contact"],
  };

  if (
    !allowedFileTypes[fileType] ||
    !allowedFileTypes[fileType].includes(file.type)
  ) {
    console.warn(`Unsupported file type for ${file.type}. Storing in 'other'.`);
    fileType = "other";
  }

  const filename = `${Date.now()}-${file.name}`;
  const storageRef = ref(storage, `${fileType}/${filename}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress + "% done");
      },
      (error) => {
        console.error("Erreur lors de l'upload du fichier:", error.code);
        reject(new Error("Upload échoué : " + error.message));
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref)
          .then((downloadURL) => {
            resolve({
              url: downloadURL,
              type: fileType, 
            });
          })
          .catch((error) => {
            console.error(
              "Erreur lors de l'obtention de l'URL de téléchargement :",
              error
            );
            reject(
              new Error("Erreur lors de l'obtention de l'URL de téléchargement")
            );
          });
      }
    );
  });
};

export default Upload;
