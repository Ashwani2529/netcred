import Queue from 'bee-queue';
import db from "../../prisma/db.js";
import FormData from 'form-data';
import axios from 'axios';

const queue = new Queue('email-queue', {
    redis: {
        host: 'usw2-next-ferret-30379.upstash.io',
        password: 'e587ebb4b2654870a2b084d0a118f5a1',
        port: 30379,
    },
    isWorker: true,
    getEvents: true,
    storeJobs: true,
    removeOnSuccess: true
});

queue.process(async (job, done) => {
    console.log("<<<<---Job Process Started--->>>>");
    try {
        const credential = await db.credential.findUnique({
            where: { id: job.data.credential },
            include: { group: { include: { organization: true } } },
        });
    
        const recipientName = credential.recipient_name.split(" ")[0];
        const fromEmail = credential.group.organization.whitelabel?.active
            ? `${credential.group.organization.name} <noreply@${credential.group.organization.whitelabel.email}>`
            : `${credential.group.organization.name} via NetCredential <noreply@mail.netcredential.com>`;
        const subject = credential.group.organization.whitelabel?.active
            ? credential.group.name
            : `${credential.group.name} from ${credential.group.organization.name}`;
    
        const recipientVariables = {
            [credential.recipient_email]: {
                name: recipientName,
                company: credential.group.organization.name,
                credid: credential.id,
                group: credential.group.name,
            },
        };
    
        const data = new FormData();
        data.append('from', fromEmail);
        data.append('to', `${credential.recipient_name} <${credential.recipient_email}>`);
        data.append('recipient-variables', JSON.stringify(recipientVariables));
        data.append('subject', subject);
        data.append('template', 'credential');
        data.append('o:tag', credential.group.organization.name);
        data.append('v:credid', '%recipient.credid%');
        data.append('h:Reply-To', `${credential.group.organization.name} <${credential.group.organization.email}>`);
    
        const url = credential.group.organization.whitelabel?.active
            ? `https://api.mailgun.net/v3/${credential.group.organization.whitelabel.email}/messages`
            : 'https://api.mailgun.net/v3/mail.netcredential.com/messages';
    
        const config = {
            method: 'post',
            maxBodyLength: Infinity,
            url,
            headers: {
                Authorization: 'Basic YXBpOjdhOGYzM2YyMmQ5ZDQ3ODg1Zjk1YjU3NDgzN2EyY2E5LTlkZmJlZWNkLTJmNmRmNjk1',
                ...data.getHeaders(),
            },
            data,
        };
    
        try {
            const response = await axios.request(config);
            done();
        } catch (error) {
            console.error('Error:', error);
        }
    } catch (err) {
        console.log('Error:', err);
    }
});

console.log("<<<<<<<---Queue Started----->>>>>");
export default queue;