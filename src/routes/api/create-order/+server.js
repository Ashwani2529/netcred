import { json } from '@sveltejs/kit';
import Razorpay from 'razorpay';
var instance = new Razorpay({ key_id: 'rzp_live_PnUXISqkE0UKm1', key_secret: 'otDFxHKyZDsXRaEuzX1nrLZ3' })

export async function POST({ request, cookies }) {
	const { amount, currency } = await request.json();
	const order = await instance.orders.create({
		amount: amount * 100,
		currency: currency
	});
	return json(order);
}