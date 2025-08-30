export const uploadToCloudinary = async (uri: string): Promise<string> => {
  const formData = new FormData()

  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: 'upload.jpg',
  } as any)

  formData.append('upload_preset', process.env.EXPO_PUBLIC_CLOUDINARY_PRESET!)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.EXPO_PUBLIC_CLOUDINARY_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  )

  const data = await res.json()

  if (data.secure_url) {
    return data.secure_url
  } else {
    throw new Error('Cloudinary upload failed: ' + JSON.stringify(data))
  }
}
