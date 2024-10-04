import { json } from '@sveltejs/kit';
import { validatePaymentVerification } from 'razorpay/dist/utils/razorpay-utils';
import db from "../../../../prisma/db.js";
const key_secret = 'otDFxHKyZDsXRaEuzX1nrLZ3';

export async function POST({ request, cookies, locals }) {
	const { amount, credits, currency, order_id, payment_id, signature } = await request.json();
	let validation = validatePaymentVerification({"order_id": order_id, "payment_id": payment_id }, signature, key_secret)
	if (validation) {
		let billingData = {
			amount,
			credits,
			order_id,
			payment_id,
			signature,
			type: "Credits Purchase",
			org_id: locals.user.id,
			status: "Success",
			currency,
			discount: 0,
			tax_amount: 0,
			timestamp: new Date()
		};

		const organization = await db.organization.findUnique({
			where: {
				id: locals.user.id
			}
		});

		billingData.name = organization.name;
		billingData.legal_name = organization.legal_name;
		billingData.tax_id = organization.tax_id;
		billingData.country = organization.country;
		billingData.state = organization.state;
		
		const updateOrganizationCredits = db.organization.update({
			where: { id: locals.user.id },
			data: { credits: { increment: credits } },
		});
		
		await db.$transaction([
			db.billing.create({ data: billingData }),
			updateOrganizationCredits
		]);
		return json({status: 'success', message: 'Payment verified'});
	} else {
		return json({status: 'error', message: 'Invalid payment verification'});
	}
}