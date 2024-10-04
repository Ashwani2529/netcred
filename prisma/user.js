import { JWT_ACCESS_SECRET } from "$env/static/private";
import db from "./db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { customAlphabet } from 'nanoid';
import axios from 'axios';
import FormData from 'form-data';
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.errors({ stack: true }),
      format.splat(),
      format.json()
  ),
  defaultMeta: { service: 'sveltekit-service' },
  transports: [
      new transports.File({ filename: 'errors.log', level: 'error' }),
      new transports.File({ filename: 'combined.log' })
  ]
});


const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function createJWT(user) {
  return  jwt.sign({id: user.id, email: user.email}, JWT_ACCESS_SECRET, {
    expiresIn: '1d'
  });
}

export async function createUser(organization, email, password, userAgent, ip) {
  try {
    const userExists = await db.organization.findUnique({
      where: {
        email
      }
    });

    if (userExists) {
      return {error: 'User already exists'};
    }

    const generateUniqueString = customAlphabet(alphabet, 28);
    
    let pricing = 5;
    let currency = 'INR';
    let country = 'India';
    let geolocation = {};

    if (ip) {
      try {
        let response = await axios.request({
          method: 'get',
          maxBodyLength: Infinity,
          url: 'https://api.ipbase.com/v2/info?ip='+ip,
          headers: { 
            'apikey': 'ipb_live_pcSJyP2MZzJbeemAmLk70W3KX4ZRgg7wMYkdHslO'
          }
        });
        geolocation = {
          latitude: response.data.location?.latitude ?? null,
          longitude: response.data.location?.longitude ?? null,
          zip: response.data.location?.zip ?? null,
          countryName: response.data.location?.country?.name ?? null,
          cityName: response.data.location?.city?.name ?? null,
          regionName: response.data.location?.region?.name ?? null,
          timezone: response.data?.timezone?.id ?? null,
          currencyCode: response.data.location?.country?.currencies?.[0]?.code ?? null
        };
        country = geolocation.countryName;
        if (geolocation.countryName != 'India') {
          pricing = 0.08;
          currency = 'USD';
        }
      } catch (error) {
        console.error('Error:', error);
        return {error: "Something went wrong"};
      }
    }

    const newOrganization = {
      id: generateUniqueString(),
      name: organization,
      email,
      password: await bcrypt.hash(password, 12),
      email_verified: false,
      hash: generateUniqueString(),
      date_joined: new Date(),
      last_login: new Date(),
      credits: 100,
      pricing: pricing,
      currency: currency,
      country: country,
      plan: 'pay-as-you-go',
      user_agent: userAgent,
      user_ip: ip,
      geolocation: geolocation
    };

    logger.info('Info:', newOrganization);

    const newBilling = {
      amount: 0,
      credits: 100,
      type: 'Joining Bonus',
      org_id: newOrganization.id,
      status: 'Success', // OPTIONS: Success, Failed, Pending
      currency: newOrganization.currency,
      discount: 0,
      tax_amount: 0,
      order_id: '',
      payment_id: '',
      signature: '',
      timestamp: new Date(),
      name: newOrganization.name,
      country: newOrganization.country
    };

    const [user] = await db.$transaction([
      db.organization.create({ data: newOrganization }),
      db.billing.create({ data: newBilling })
    ]);
    
    // Send email
    let recipient_variables = {};
    recipient_variables[newOrganization.email] = {
      "name": newOrganization.name.split(" ")[0],
      "uid": newOrganization.id,
      "hash": newOrganization.hash
    }
    
    let data = new FormData();
    data.append('from', 'NetCredential <noreply@mail.netcredential.com>');
    data.append('to', `${newOrganization.name} <${newOrganization.email}>`)
    data.append('recipient-variables', JSON.stringify(recipient_variables));
    data.append('subject', '🚀 Welcome to NetCredential');
    data.append('template', 'welcome-email');
    data.append('o:tag', newOrganization.name);
    data.append('h:Reply-To', 'NetCredential <contact@netcredential.com>');

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.mailgun.net/v3/mail.netcredential.com/messages',
      headers: { 
        'Authorization': 'Basic YXBpOjdhOGYzM2YyMmQ5ZDQ3ODg1Zjk1YjU3NDgzN2EyY2E5LTlkZmJlZWNkLTJmNmRmNjk1', 
        ...data.getHeaders()
      },
      data: data
    };

    try {
      const response = await axios.request(config);
      console.log(response.data);
    } catch (error) {
      console.error('Error:', error);
      return {error: "Something went wrong"};
    }

    const token = createJWT(user);

    return {token};
  } catch (error) {
    logger.info('Info:', error);
    return error;
  }
}

export async function loginUser(email, password) {
  try {
    const user = await db.organization.findUnique({
      where: {
        email
      }
    });

    if (!user) {
      return {error: 'User not found'};
    }

    const valid = await bcrypt.compare(password, user.password);

    // const valid = true;

    if (!valid) {
      return {error: 'Invalid password'};
    }

    // Update last_login in database
    await db.organization.update({
      where: {
          email: email
      },
      data: {
          last_login: new Date()
      }
    });

    const token = createJWT(user);

    return {token};
  } catch (error) {
    console.log(error);
    return error;
  }
}