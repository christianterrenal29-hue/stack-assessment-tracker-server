import { UploadApiResponse } from 'cloudinary';
import { cloudinary, assertCloudinaryConfigured } from '../config/cloudinary';
import { config } from '../config/env';

type UploadInput = {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  documentType: string;
};

const toResourceType = (mimeType: string): 'image' | 'raw' => {
  return mimeType === 'application/pdf' ? 'raw' : 'image';
};

const publicIdFromSecureUrl = (secureUrl: string, mimeType: string) => {
  const uploadMarker = '/upload/';
  const uploadIndex = secureUrl.indexOf(uploadMarker);
  if (uploadIndex === -1) return '';

  const pathWithVersion = secureUrl.slice(uploadIndex + uploadMarker.length);
  const pathWithoutVersion = pathWithVersion.replace(/^v\d+\//, '');
  const decodedPath = decodeURIComponent(pathWithoutVersion);

  if (mimeType === 'application/pdf') {
    return decodedPath;
  }

  return decodedPath.replace(/\.[^.]+$/, '');
};

export class CloudinaryService {
  async uploadFile(input: UploadInput): Promise<UploadApiResponse> {
    assertCloudinaryConfigured();

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `${config.CLOUDINARY_FOLDER}/${input.documentType}`,
          resource_type: toResourceType(input.mimeType),
          use_filename: true,
          unique_filename: true,
          filename_override: input.originalName,
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error('Cloudinary upload failed'));
            return;
          }
          resolve(result);
        }
      );

      stream.end(input.buffer);
    });
  }

  async deleteBySecureUrl(secureUrl: string, mimeType: string) {
    assertCloudinaryConfigured();
    const publicId = publicIdFromSecureUrl(secureUrl, mimeType);
    if (!publicId) return;

    await cloudinary.uploader.destroy(publicId, {
      resource_type: toResourceType(mimeType),
    });
  }
}

export default new CloudinaryService();
