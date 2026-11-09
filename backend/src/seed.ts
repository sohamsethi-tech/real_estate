import argon2 from "argon2";
import { readFileSync } from "node:fs";
import { db } from "./db.js";
import { config } from "./config.js";

const pages: { key: string; title: string; body: string }[] = [
  {
    key: "about",
    title: "About V Group",
    body: "V Group Real Estate works with people buying, renting, selling and leasing property in Melbourne and Victoria.\n\nThe practice is independent and locally connected. The work is specific to the property and the person in front of us.\n\nPeople on the public team page appear only after a profile, photograph and biography have been added by the business. This site does not publish unnamed or invented agents.",
  },
  {
    key: "services",
    title: "Our services",
    body: "Buying\nA clear search, a careful reading of a property, and someone with you through the questions that follow.\n\nSelling\nPreparation, presentation and a straight account of the interest a property receives.\n\nLeasing\nFor owners placing a home or a premises on the rental market, and for people looking for somewhere to live.\n\nCommercial and land\nPremises and sites are handled with the same care as a home. The commercial and land pages are the place to start.",
  },
  {
    key: "why",
    title: "Why V Group",
    body: "Advice before volume\nA short list you can trust is more useful than a long one you cannot.\n\nLocal attention\nMelbourne and Victoria are not one market. The street, the building and the timing all matter.\n\nThe whole journey\nFrom the first question to the result, the same practice stays with the brief.",
  },
  {
    key: "sell",
    title: "Sell with us",
    body: "Tell us about the property and how you would like to be contacted. A member of the team will come back to you. Sending this form does not appoint V Group and does not put a property on the market.",
  },
  {
    key: "lease",
    title: "Lease with us",
    body: "If you have a home or a commercial premises to lease, send a few details. We will confirm what we need next. This request is not a signed management authority.",
  },
  {
    key: "privacy",
    title: "Privacy",
    body: "Draft notice. Have a qualified adviser review this before the site is treated as a legal policy.\n\nV Group Real Estate collects the name, email, phone number and message you submit on an enquiry or booking form, plus the property or location you mention. Staff use that information to respond to you. It is stored in the business database.\n\nThe public site does not set an analytics cookie. A sign-in cookie is stored only after a staff member logs in to the admin desk. It is httpOnly and is used to keep that session.\n\nEmail is sent only when an email provider has been configured. If it has not, the enquiry is still saved and the site says so.\n\nTo ask for access or correction, use the contact form and mention privacy.",
  },
  {
    key: "terms",
    title: "Terms",
    body: "Draft notice. Have a qualified adviser review this before the site is treated as legal terms.\n\nProperty information on this website is published by V Group from its own records. It can change, be withdrawn, or already be under offer. A price label is the label supplied for that listing. It is not an appraisal and not an offer.\n\nAn inspection or consultation request stays pending until a person at V Group approves it. Submitting a form does not create a contract to buy, sell or lease.\n\nPhotographs in the editorial sections of the site are brand photography. A photograph attached to a listing belongs to that listing.",
  },
  {
    key: "cookies",
    title: "Cookies",
    body: "The public pages do not set a tracking cookie and do not run an advertising tag.\n\nStaff who sign in receive one cookie, vg_session. It remembers the admin session, is httpOnly, and is removed on sign-out. It is not used to follow visitors around the public site.\n\nIf that changes, this page will be updated first.",
  },
  {
    key: "ai",
    title: "AI assistant disclosure",
    body: "This website does not currently include a customer-facing AI assistant. Enquiry and booking forms are stored for people at V Group to read.\n\nNothing on this site presents generated text as a licensed appraisal, a legal opinion or a confirmed appointment.\n\nIf an assistant is added later, this page will describe what it can see, what it must not do, and that a person remains responsible for advice.",
  },
];

const faqs = [
  { key: "inspection", question: "Is an inspection confirmed when I send the form?", answer: "No. The request is saved as pending. It becomes a booking only after someone at V Group approves the time.", position: 1 },
  { key: "price", question: "What does the price on a listing mean?", answer: "It is the price label entered for that property, such as a guide or ‘Contact agent’. It is not calculated by this website.", position: 2 },
  { key: "enquiries", question: "What happens after I enquire?", answer: "You receive a reference number on screen. The enquiry appears in the staff desk. An email is sent only when an email provider is configured, and the confirmation tells you which of those happened.", position: 3 },
];

export async function seed() {
  for (const page of pages) {
    await db.websiteContent.upsert({
      where: { key: page.key },
      create: { ...page, published: true },
      update: {},
    });
  }
  for (const faq of faqs) {
    await db.faq.upsert({
      where: { key: faq.key },
      create: { ...faq, published: true },
      update: {},
    });
  }
  if (config.ADMIN_EMAIL && config.ADMIN_PASSWORD) {
    if (config.ADMIN_PASSWORD.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters");
    const email = config.ADMIN_EMAIL.toLowerCase();
    const passwordHash = await argon2.hash(config.ADMIN_PASSWORD);
    const user = await db.user.upsert({
      where: { email },
      create: { email, passwordHash, name: config.ADMIN_NAME, role: "ADMIN", active: true },
      update: { passwordHash, name: config.ADMIN_NAME, role: "ADMIN", active: true },
    });
    await db.staff.upsert({
      where: { userId: user.id },
      create: { userId: user.id, position: "Administrator" },
      update: {},
    });
  }
  if (config.SEED_FIXTURES) {
    const fixtures = JSON.parse(readFileSync(new URL("./fixtures/listings.dev.json", import.meta.url), "utf8")) as Array<{
      vaultreId: string; status: "ACTIVE"; listingType: "SALE" | "RENT"; category: "HOUSE" | "APARTMENT";
      priceLabel: string; addressLine: string; suburb: string; postcode: string;
      beds?: number; baths?: number; parking?: number; headline: string; description: string;
    }>;
    for (const item of fixtures) {
      await db.listing.upsert({
        where: { vaultreId: item.vaultreId },
        create: {
          reference: item.vaultreId,
          vaultreId: item.vaultreId,
          source: "FIXTURE",
          status: item.status,
          listingType: item.listingType,
          category: item.category,
          priceLabel: item.priceLabel,
          addressLine: item.addressLine,
          suburb: item.suburb,
          postcode: item.postcode,
          beds: item.beds,
          baths: item.baths,
          parking: item.parking,
          headline: item.headline,
          description: item.description,
          slug: item.vaultreId.toLowerCase(),
        },
        update: {},
      });
    }
  }
}

const invoked = process.argv[1]?.includes("seed");
if (invoked) {
  seed().then(async () => {
    console.log("Seed complete");
    await db.$disconnect();
  }).catch(async (error) => {
    console.error(error instanceof Error ? error.message : error);
    await db.$disconnect();
    process.exit(1);
  });
}
