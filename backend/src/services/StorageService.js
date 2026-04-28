const path = require('path');
const fs = require('fs');

/**
 * Storage Service Abstraction
 * Currently handles local storage, but designed to be swapped with 
 * Cloudinary, AWS S3, or Firebase Storage easily.
 */
class StorageService {
  /**
   * Upload a file and return the public URL
   * @param {Object} file - Multer file object
   * @returns {Promise<string>} - Public URL of the uploaded image
   */
  static async uploadImage(file) {
    // Check if Cloudinary/S3 keys are present in env
    if (process.env.CLOUDINARY_URL) {
      // Integration with Cloudinary would go here:
      // const result = await cloudinary.uploader.upload(file.path);
      // return result.secure_url;
      console.log('Cloudinary detected (Mocked upload)');
    }

    // Default: Local Storage (fallback)
    // In a real production environment, you should use a cloud provider.
    // This local fallback is for development/demo purposes.
    return `/uploads/${file.filename}`;
  }

  /**
   * Delete an image by URL
   * @param {string} url 
   */
  static async deleteImage(url) {
    if (!url || !url.startsWith('/uploads/')) return;

    const filename = url.replace('/uploads/', '');
    const filepath = path.join(__dirname, '../../public/uploads', filename);

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }
}

module.exports = StorageService;
