import { Cloudinary } from '@cloudinary/url-gen'

export const cld = new Cloudinary({
  cloud: {
    cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_NAME,
    apiKey: process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY,
  },
  url: {
    secure: true,
  },
})

export const options = {
  upload_preset: 'uni-event-app',
  tag: 'sample',
  unsigned: true,
}
