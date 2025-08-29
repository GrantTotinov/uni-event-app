export const uploadToCloudinary = async (uri: string): Promise<string> => {
  const formData = new FormData()

  // Cloudinary очаква ключове: file, upload_preset и облака ти
  formData.append('file', {
    uri,
    type: 'image/jpeg', // или image/png според нуждите
    name: 'upload.jpg',
  } as any)

  formData.append('upload_preset', process.env.EXPO_PUBLIC_CLOUDINARY_PRESET!)
  formData.append('cloud_name', process.env.EXPO_PUBLIC_CLOUDINARY_CLOUDNAME!)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.EXPO_PUBLIC_CLOUDINARY_CLOUDNAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  )

  const data = await res.json()

  if (data.secure_url) {
    return data.secure_url // Това е URL-то, което искаш
  } else {
    throw new Error('Cloudinary upload failed: ' + JSON.stringify(data))
  }
}
