const CLOUD_NAME = 'tfgg2wce';
const UPLOAD_PRESET = 'konekta_premium';

export const uploadImageToCloudinary = async (uri) => {
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: 'upload.jpg',
  });
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('cloud_name', CLOUD_NAME);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url;
    }
    throw new Error('Error al subir la imagen');
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    throw error;
  }
};
