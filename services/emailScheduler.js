const cron = require('node-cron');
const Product = require('../models/Product');
const Subcribe = require('../models/Subcribe');
const User = require('../models/User');
const DailyEmailHistory = require('../models/DailyEmailHistory');
const { sendMail, buildProductEmail } = require('../utils/mailer');
const mongoose = require('mongoose');

const ENABLE_SCHEDULER = process.env.MAIL_SEND_ENABLED !== 'false';
const EMAIL_BATCH_SIZE = parseInt(process.env.EMAIL_BATCH_SIZE || '80', 10);

async function pickProductNoRepeat() {
    const allProducts = await Product.find({}, '_id name salePrice price productImageUrl description').lean();
    if (!allProducts || allProducts.length === 0) return null;
    const allIds = allProducts.map(p => String(p._id));
    const sentDocs = await DailyEmailHistory.find().select('product').lean();
    const sentIdsSet = new Set(sentDocs.map(s => String(s.product)));
    const remaining = allIds.filter(id => !sentIdsSet.has(id));
    let pickId;
    if (remaining.length === 0) {
        await DailyEmailHistory.deleteMany({});
        const idx = Math.floor(Math.random() * allProducts.length);
        pickId = String(allProducts[idx]._id);
    } else {
        const idx = Math.floor(Math.random() * remaining.length);
        pickId = remaining[idx];
    }

    const picked = await Product.findById(pickId)
        .populate('category', 'name')
        .populate('need', 'name')
        .lean();

    return picked;
}

async function gatherRecipients() {
    const subs = await Subcribe.find({}, 'subscribeEmail').lean();
    const users = await User.find({}, 'email').lean();

    const emails = [
        ...subs.map(s => s.subscribeEmail),
        ...users.map(u => u.email)
    ].filter(Boolean);

    const unique = Array.from(new Set(emails.map(e => e.toLowerCase().trim())));
    return unique;
}

async function sendDailyProductEmail() {
    try {
        if (!ENABLE_SCHEDULER) {
            console.log('[emailScheduler] Scheduler disabled (MAIL_SEND_ENABLED=false)');
            return;
        }

        console.log('[emailScheduler] Starting sendDailyProductEmail job at', new Date().toISOString());

        const product = await pickProductNoRepeat();
        if (!product) {
            console.warn('[emailScheduler] No product found to send.');
            return;
        }

        const recipients = await gatherRecipients();
        if (!recipients || recipients.length === 0) {
            console.warn('[emailScheduler] No recipients found.');
            await DailyEmailHistory.create({ product: product._id, sentAt: new Date() });
            return;
        }

        const html = buildProductEmail(product);
        const batches = [];
        for (let i = 0; i < recipients.length; i += EMAIL_BATCH_SIZE) {
            batches.push(recipients.slice(i, i + EMAIL_BATCH_SIZE));
        }

        console.log(`[emailScheduler] Will send product ${product._id} to ${recipients.length} recipients in ${batches.length} batch(es)`);

        for (const batch of batches) {
            const mailOptions = {
                to: process.env.MAIL_USER,
                bcc: batch,
                subject: `🧙‍♀️ Sản phẩm mới tại Nina Witch: ${product.name?.vi || product.name?.en || 'Sản phẩm mới'}`,
                html
            };

            try {
                await sendMail(mailOptions);
                console.log(`[emailScheduler] Batch of ${batch.length} emails sent.`);
            } catch (err) {
                console.error('[emailScheduler] Error sending batch:', err);
            }
        }
        await DailyEmailHistory.create({ product: product._id, sentAt: new Date() });
        console.log('[emailScheduler] Email job finished, history saved.');

    } catch (err) {
        console.error('[emailScheduler] Unexpected error:', err);
    }
}

function startScheduler() {
    cron.schedule('0 20 * * *', () => {
        console.log('[emailScheduler] Cron triggered at', new Date().toISOString());
        sendDailyProductEmail();
    }, {
        timezone: 'Asia/Bangkok'
    });

    console.log('[emailScheduler] Scheduler started (20:00 Asia/Bangkok).');
}

module.exports = { startScheduler, sendDailyProductEmail, pickProductNoRepeat };
