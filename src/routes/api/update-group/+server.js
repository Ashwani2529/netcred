import { json } from '@sveltejs/kit';
import db from "../../../../prisma/db.js";
import aws from 'aws-sdk';


const s3 = new aws.S3({
	accessKeyId: Process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: Process.env.AWS_SECRET_ACCESS_KEY,
	region: 'ap-south-1'
  });


export async function POST({ request, cookies, locals }) {
	const { group, designId,pdfUrl } = await request.json();
	const base64Data = pdfUrl.split(',')[1];
    const binaryData = Buffer.from(base64Data, 'base64');
	const uploadParams2 = {
		Bucket: 'bucket-netcred-media',
		Key: `${group.name}/${designId}/secondary.pdf`,
		Body: binaryData,
		ContentType: 'application/pdf'
	};	
	let groupname=await db.group.findUnique({
		where: {
		  id: group.id
		},
		select:{
			name:true
		}
	});
	s3.deleteObject({
		Bucket: 'bucket-netcred-media',
		Key: `${groupname}/${designId}/secondary.pdf`
	}, function(err, data) {
		if (err) console.log(err, err.stack);
		else console.log(data);
	});
	const result = await s3.upload(uploadParams2).promise();
	await db.group.update({
		where: {
		  id: group.id
		},
		data: {
			name: group.name,
			description: group.description,
			skills: group.skills,
			expiry: group.expiry,
			template: designId,
			secondaryPage: result.Location,
			updated_at: new Date()
		}
	});

	return json({ message: 'Success'}, { status: 200 });
}