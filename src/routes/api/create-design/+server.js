import { json } from '@sveltejs/kit';
import db from "../../../../prisma/db.js";
import PDFDocument, { image } from 'pdfkit';
import aws from 'aws-sdk';
import { fromBuffer } from "pdf2pic";
import { fromBuffer as fromBufferBadge } from "pdf2pic-badge";
import axios from 'axios';
import QRCode from 'qrcode';
// import { jsPDF } from "jspdf";
import { writeFile } from 'fs/promises';
import { log } from 'console';
// import { create } from '@web3-storage/w3up-client'
import SVGtoPDF from 'svg-to-pdfkit';



const s3 = new aws.S3({
	accessKeyId: Process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: Process.env.AWS_SECRET_ACCESS_KEY,
	region: 'ap-south-1'
  });

function pixelsToPoints(pixels, basePixelSize) {
	return (pixels * basePixelSize) * (72 / 96);
}

async function fetchImage(url) {
	const response = await axios.get(url, { responseType: 'arraybuffer' });
	const imageBuffer = Buffer.from(response.data, 'binary');
	return imageBuffer;
}

function lightenColorVertical(color, factor) {
    let r = parseInt(color.slice(1, 3), 16);
    let g = parseInt(color.slice(3, 5), 16);
    let b = parseInt(color.slice(5, 7), 16);

    // Adjust RGB values based on the lightness factor
    r = Math.min(255, r + factor * 255);
    g = Math.min(255, g + factor * 255);
    b = Math.min(255, b + factor * 255);

    // Convert back to hex color
    const lightenedColor = `#${Math.round(r).toString(16)}${Math.round(g).toString(16)}${Math.round(b).toString(16)}`;
    return lightenedColor;
}

function lightenColorHorizontal(color, factor) {
    // Convert hex color to RGB
    let r = parseInt(color.slice(1, 3), 16);
    let g = parseInt(color.slice(3, 5), 16);
    let b = parseInt(color.slice(5, 7), 16);

    // Adjust RGB values based on the lightness factor
    r = Math.min(255, r + factor * 255);
    g = Math.min(255, g + factor * 255);
    b = Math.min(255, b + factor * 255);

    // Convert back to hex color
    const lightenedColor = `#${Math.round(r).toString(16)}${Math.round(g).toString(16)}${Math.round(b).toString(16)}`;
    return lightenedColor;
}


export async function POST({ request, locals }) {
	const { type, designId, designName, canvas, items, attributes } = await request.json();
	const pageWidth = canvas.width;
	const pageHeight = canvas.height;

	const doc = new PDFDocument({ size: [pageHeight, pageWidth], layout: 'landscape', margin: 0 });
	let buffers = [];
	
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', async () => {
        let pdfBuffer = Buffer.concat(buffers);

		// try {
		// 	const pdfFileName = 'output.pdf';
		// 	await writeFile(pdfFileName, pdfBuffer);

		// 	// Save pdf to IPFS
		// 	// const client = await create();
		// 	// const space = await client.createSpace('my-awesome-space');
		// 	// const myAccount = await client.login('deshbandhu@alhansat.com'); //process.env.IPFS_EMAIL
		// 	// // wait for payment plan to be selected
		// 	// while (true) {
		// 	// 	const res = await myAccount.plan.get();
		// 	// 	if (res.ok) break;
		// 	// 	console.log('Waiting for payment plan to be selected...');
		// 	// 	await new Promise(resolve => setTimeout(resolve, 1000));
		// 	// }
		// 	// await myAccount.provision(space.did());
		// 	// await space.save();
		// 	// const recovery = await space.createRecovery(myAccount.did());
		// 	// await client.capability.access.delegate({
		// 	// 	space: space.did(),
		// 	// 	delegations: [recovery],
		// 	// });
		// 	// const files = [
		// 	// 	// new File(['some-file-content'], 'readme.md'),
		// 	// 	// new File(['import foo'], 'src/main.py'),
		// 	// 	new File([pdfBuffer], pdfFileName)
		// 	//   ]
			   
		// 	// const directoryCid = await client.uploadDirectory(files)

		// } catch (err) {
		// 	console.log(`There is a error in saving the pdf file ${err}`);
		// }

		try {
			const pdfFileName = 'output.pdf';
			await writeFile(pdfFileName, pdfBuffer);

			// Save pdf to IPFS
			// const client = await create();
			// const space = await client.createSpace('my-awesome-space');
			// const myAccount = await client.login('deshbandhu@alhansat.com'); //process.env.IPFS_EMAIL
			// // wait for payment plan to be selected
			// while (true) {
			// 	const res = await myAccount.plan.get();
			// 	if (res.ok) break;
			// 	console.log('Waiting for payment plan to be selected...');
			// 	await new Promise(resolve => setTimeout(resolve, 1000));
			// }
			// await myAccount.provision(space.did());
			// await space.save();
			// const recovery = await space.createRecovery(myAccount.did());
			// await client.capability.access.delegate({
			// 	space: space.did(),
			// 	delegations: [recovery],
			// });
			// const files = [
			// 	// new File(['some-file-content'], 'readme.md'),
			// 	// new File(['import foo'], 'src/main.py'),
			// 	new File([pdfBuffer], pdfFileName)
			//   ]
			   
			// const directoryCid = await client.uploadDirectory(files)

		} catch (err) {
			console.log(`There is a error in saving the pdf file ${err}`);
		}
		
        // Convert PDF buffer to image
        const options = {
            density: 92,
            format: "png",
            width: pageWidth,
            height: pageHeight
        };

		let convert = null;

		if (type == 'badge') {
			convert = fromBufferBadge(pdfBuffer, options);
		} else {
			convert = fromBuffer(pdfBuffer, options);
		}

		convert(1, { responseType: "buffer" }).then((images) => {
			const imageBuffer = images.buffer;
            
            // Upload to S3
            const uploadParams = {
				Bucket: 'bucket-netcred-media',
				Key: `${locals.user.id}/${designId}.png`,
				Body: imageBuffer,
				ContentType: 'image/png'
			};

            s3.upload(uploadParams, async function(err, data) {
                if (err) {
                    console.error("Error uploading:", err);
                } else {
					await db.design.upsert({
						where: { id: designId },
						update: {
							name: designName,
							canvas: canvas,
							items: items,
							attributes: Object.keys(attributes).filter(key => attributes[key]),
							preview: data.Location
						},
						create: {
							id: designId,
							type: type,
							org_id: locals.user.id,
							name: designName,
							status: 'Modern',
							canvas: canvas,
							items: items,
							attributes: Object.keys(attributes).filter(key => attributes[key]),
							preview: data.Location
						}
					});
                }
            });
		});
    });

	if (canvas.background) {
		let imageBuffer = await fetchImage(canvas.background);
		doc.image(imageBuffer, 0, 0, { width: pageWidth, height: pageHeight });
	}

	// const basePixelSize = 1; // Adjust this value as needed
	for (const item of items) {
		if (item.type == "text" || item.type == "heading" || item.type == "attribute") {
			let xPos = (parseFloat(item.pos.left.replace('%','')) / 100) * pageWidth;
			let yPos = ((parseFloat(item.pos.top.replace('%','')) + 0.5) / 100) * pageHeight;
			let textWidth = (parseFloat(item.size.width.replace('%','')) / 100) * pageWidth;

			let textContent = item.content;
			if (item?.prop?.uppercase === true) {
				textContent = textContent.toUpperCase();
			} 
			let linespace = item.prop.lineSpacing * 8;
			let transparency = parseFloat(100 - item.prop.opacity) / 100; // Ensure opacity is a valid number
			if (isNaN(transparency) || transparency < 0 || transparency > 1) {
				// Handle invalid opacity value, for example set it to 1 (fully opaque)
				transparency = 1;
			}
			doc.fillColor(item.prop.color).opacity(transparency).font(`static/fonts/${item.prop.font}${item.prop.bold?'-Bold':'-Regular'}.ttf`).fontSize(item.prop.size).text(textContent, xPos, yPos, { width: textWidth, align: item.prop.textAlign, underline: item.prop.underline, oblique: item.prop.italic, characterSpacing: item.prop.letterSpacing, lineGap: linespace });
		} else if (item.type == "image") {
			let xPos = (parseFloat(item.pos.left.replace('%','')) / 100) * pageWidth;
			let yPos = ((parseFloat(item.pos.top.replace('%',''))) / 100) * pageHeight;
			let width = (parseFloat(item.size.width.replace('%','')) / 100) * pageWidth;
			let imageBuffer = await fetchImage(item.content);
			doc.image(imageBuffer, xPos, yPos, { width: width });
		} else if (item.type == "template") {
			let xPos = (parseFloat(item.pos.left.replace('%','')) / 100) * pageWidth;
			let yPos = ((parseFloat(item.pos.top.replace('%',''))) / 100) * pageHeight;
			let width = (parseFloat(item.size.width.replace('%','')) / 100) * pageWidth;
			SVGtoPDF(doc, item.content, xPos, yPos, { width: width, height: width });
		} else if (item.type == "ribbon" || item.type == "bases" || item.type == "icons") {
			let xPos = (parseFloat(item.pos.left.replace('%','')) / 100) * pageWidth;
			let yPos = ((parseFloat(item.pos.top.replace('%',''))) / 100) * pageHeight;
			let width = (parseFloat(item.size.width.replace('%','')) / 100) * pageWidth;
			let height = (parseFloat(item.size.height.replace('%','')) / 100) * pageHeight;
			SVGtoPDF(doc, item.content, xPos, yPos, { width: width, height: height });
		} else if (item.type == "line-horizontal") {
			let xPos = (parseFloat(item.pos.left.replace('%','')) / 100) * pageWidth;
			let yPos = ((parseFloat(item.pos.top.replace('%',''))) / 100) * pageHeight;
			let width = (parseFloat(item.size.width.replace('%','')) / 100) * pageWidth;
			// doc.rect(xPos, yPos, width, item.prop.size).fill(item.prop.color);
			switch (item.prop.type) {
				case 'solid':
					doc.rect(xPos, yPos, width, item.prop.size).fill(item.prop.color);
					break;
				case 'dashed':
					doc.lineWidth(item.prop.size);
					doc.fill(item.prop.color);
					var _space = 0;
					_space = item.prop.size + 2;
					doc.moveTo(xPos, yPos).lineTo(xPos + width, yPos).dash(5, { space: _space }).stroke(item.prop.color);
					// doc.rect(xPos, yPos, width, item.prop.size).dash(5, { space: 5 }).fillAndStroke("blue", "red");
					break;
				case 'dotted':
					doc.lineWidth(item.prop.size);
					doc.fill(item.prop.color);
					var _space = 0;
					_space = item.prop.size + 2;
					doc.lineCap('round');
					doc.moveTo(xPos, yPos).lineTo(xPos + width, yPos).dash(1, { space: _space }).stroke(item.prop.color);
					// doc.moveTo(xPos, yPos).lineTo(xPos + width, yPos).dash(1, { space: 3 }).stroke(item.prop.color);
					// doc.rect(xPos, yPos, width, item.prop.size).lineTo(xPos + width, yPos).dash(1, { space: 3 }).stroke();
					// doc.rect(xPos, yPos, width, item.prop.size).fill(item.prop.color).dash(1, { space: 3 }).stroke();
					break;
				case 'double':
					doc.lineWidth(item.prop.size);
					doc.fill(item.prop.color);
					var _space = 0;
					_space = item.prop.size + 2;
					doc.rect(xPos, yPos, width, item.prop.size).fill(item.prop.color);
    				doc.rect(xPos, yPos + _space, width, item.prop.size).fill(item.prop.color);
					// doc.rect(xPos, yPos, width, item.prop.size).fill(item.prop.color).rect(xPos, yPos+2, width, item.prop.size).fill(item.prop.color);
					break;
				case 'groove':
					const grooveColor = item.prop.color;
					const lightColor = lightenColorHorizontal(grooveColor, .3); // You can adjust the lightness factor
					// doc.lineWidth(item.prop.size);
					doc.rect(xPos, yPos, width, parseFloat(item.prop.size/2)).fill(item.prop.color);
					doc.rect(xPos, yPos + parseFloat(item.prop.size/2), width, parseFloat(item.prop.size/2)).fill(lightColor);
					// doc.rect(xPos, yPos + 4, width, item.prop.size).fill(item.prop.color);
					// doc.rect(xPos, yPos, width, item.prop.size).fill(item.prop.color).rect(xPos, yPos+2, width, item.prop.size).fill('#fff').rect(xPos, yPos+4, width, item.prop.size).fill(item.prop.color);
					break;
			}
		} else if (item.type == "line-vertical") {
			let xPos = (parseFloat(item.pos.left.replace('%','')) / 100) * pageWidth;
			let yPos = ((parseFloat(item.pos.top.replace('%',''))) / 100) * pageHeight;
			let height = (parseFloat(item.size.height.replace('%','')) / 100) * pageHeight;
			// doc.rect(xPos, yPos, item.prop.size, height).fill(item.prop.color);
			switch (item.prop.type) {
				case 'solid':
					doc.rect(xPos, yPos, item.prop.size, height).fill(item.prop.color);
					break;
				case 'dashed':
					var _space = 0;
					_space = item.prop.size + 2;
					doc.fill(item.prop.color);
					doc.moveTo(xPos, yPos).lineTo(xPos, yPos + height).dash(5, { space: _space }).stroke(item.prop.color);
					break;
				case 'dotted':
					var _space = 0;
					_space = item.prop.size + 2;
					doc.lineWidth(item.prop.size);
					doc.lineCap('round');
					doc.fill(item.prop.color);
					doc.moveTo(xPos, yPos).lineTo(xPos, yPos + height).dash(1, { space: _space }).stroke(item.prop.color);
					break;
				case 'double':
					var _space = 0;
					_space = item.prop.size + 2;
					doc.rect(xPos, yPos, item.prop.size, height).fill(item.prop.color);
					doc.rect(xPos + _space, yPos, item.prop.size, height).fill(item.prop.color);
					break;
				case 'groove':
					const grooveColor = item.prop.color;
					const lightColor = lightenColorVertical(grooveColor, .3); // You can adjust the lightness factor

					doc.rect(xPos, yPos, parseFloat(item.prop.size/2), height).fill(item.prop.color);
					doc.rect(xPos + parseFloat(item.prop.size/2), yPos, parseFloat(item.prop.size/2), height).fill(lightColor);

					// console.log("-- Groove -- vertical line--");
					// doc.rect(xPos, yPos, item.prop.size, height).fill(item.prop.color);
					// doc.rect(xPos + 2, yPos, item.prop.size, height).fill('#fff');
					// doc.rect(xPos + 4, yPos, item.prop.size, height).fill(item.prop.color);
					break;
			}

		} else if (item.type == 'qr') {
			let xPos = (parseFloat(item.pos.left.replace('%','')) / 100) * pageWidth;
			let yPos = ((parseFloat(item.pos.top.replace('%',''))) / 100) * pageHeight;
			let width = (parseFloat(item.size.width.replace('%','')) / 100) * pageWidth;
			let imageBuffer = await QRCode.toDataURL('Demo', {type:'png', width: width, margin: 0, color: {dark:item.prop.foreground+'ff', light:'#FFFFFF00'}});
			doc.image(imageBuffer, xPos, yPos, { width: width });
		}
	}

	doc.end();
	return json({ message: 'Success' }, { status: 200 });
}