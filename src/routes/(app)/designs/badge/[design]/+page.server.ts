import { fail } from '@sveltejs/kit';
import { customAlphabet } from 'nanoid';
import aws from 'aws-sdk';
import db from "../../../../../../prisma/db.js";


const s3 = new aws.S3({
    accessKeyId: Process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: Process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-south-1'
  });
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const generateUniqueString = customAlphabet(alphabet, 28);

function getFileExtension(fileName) {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
}

async function uploadFileToS3(org, file, fileName) {
    const extension = getFileExtension(fileName);
    let id = generateUniqueString();
    const params = {
        Bucket: 'bucket-netcred-media',
        Key: `${org}/${id}.${extension}`,
        Body: file
    };

    try {
        const stored = await s3.upload(params).promise();
        return { success: true, url: stored.Location };
    } catch (error) {
        return { success: false, error: error.message };
    }
}


export async function load({ params }) {
    let design = null;
    if (params.design != 'create') {
        design = await db.design.findUnique({
            where: {
              id: params.design
            }
        });
    }

    return {
        design: design
    };
}

export const actions = {
	default: async ({ request, locals }) => {
        const formData = Object.fromEntries(await request.formData());
        if (
            !(formData.image as File).name ||
            (formData.image as File).name === 'undefined'
            ) {
                return fail(400, {
                    error: true,
                    message: 'You must provide a file to upload'
                });
            }
        
            const { image, designId } = formData as { image: File, designId: string };

            const result = await uploadFileToS3(locals.user.id, Buffer.from(await image.arrayBuffer()), image.name);

            if (result.success) {
                await db.media.create({
                    data: {
                      url: String(result.url),
                      designId: designId
                    }
                });
                return {
                    url: result.url
                };
            } else {
                return fail(500, {
                    error: true,
                    message: result.error
                });
            }
	}
};