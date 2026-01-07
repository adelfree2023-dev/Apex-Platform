import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// List of known temporary/disposable email domains
const BLOCKED_DOMAINS = [
    // Popular temp mail services
    'mailinator.com',
    'guerrillamail.com',
    'guerrillamail.org',
    'guerrillamail.net',
    'tempmail.com',
    'temp-mail.org',
    '10minutemail.com',
    '10minutemail.net',
    'throwaway.email',
    'fakemailgenerator.com',
    'getnada.com',
    'mohmal.com',
    'tempr.email',
    'discard.email',
    'mailnesia.com',
    'mailcatch.com',
    'trbvm.com',
    'tempinbox.com',
    'yopmail.com',
    'yopmail.fr',
    'sharklasers.com',
    'grr.la',
    'pokemail.net',
    'emailsensei.com',
    'maildrop.cc',
    'mailinator.net',
    'trashmail.com',
    'trashmail.net',
    'getairmail.com',
    'mintemail.com',
    'spamgourmet.com',
    'spam4.me',
    'mytrashmail.com',
    'mt2009.com',
    'tmpmail.org',
    'tmpmail.net',
    'bjedu.tech', // temp mail
];

async function seedBlockedDomains() {
    console.log('🚫 Seeding blocked email domains...');

    for (const domain of BLOCKED_DOMAINS) {
        await prisma.blockedEmailDomain.upsert({
            where: { domain },
            update: {},
            create: {
                domain,
                reason: 'Disposable/temporary email service',
                isGlobal: true,
            },
        });
    }

    console.log(`✅ Seeded ${BLOCKED_DOMAINS.length} blocked domains`);
}

async function main() {
    try {
        await seedBlockedDomains();
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
