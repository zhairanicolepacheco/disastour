import storage from '@react-native-firebase/storage';

export const storageService = {
  // Upload profile picture
  async uploadProfilePicture(userId: string, imageUri: string) {
    try {
      const filename = `profile_${Date.now()}.jpg`;
      const uploadPath = `profile-pictures/${userId}/${filename}`;

      const reference = storage().ref(uploadPath);
      await reference.putFile(imageUri);

      const downloadURL = await reference.getDownloadURL();
      return { success: true, url: downloadURL };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Delete profile picture
  async deleteProfilePicture(userId: string, fileUrl: string) {
    try {
      const reference = storage().refFromURL(fileUrl);
      await reference.delete();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};