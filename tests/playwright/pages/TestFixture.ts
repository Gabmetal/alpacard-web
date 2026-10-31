// Dynamic test fixture: provisions isolated test accounts, merchants, campaigns, and cards
export interface TestFixtureData {
  ownerEmail: string;
  ownerPassword: string;
  ownerToken: string;
  businessId: string;
  businessName: string;
  campaignId: string;
  campaignTitle: string;
  customerToken: string;
  customerId: string;
  cardId: string;
  validQRToken: string;
  validQRJTI: string;
}

export async function setupCompleteTestEnvironment(request: any, baseUrl: string): Promise<TestFixtureData> {
  const randomSuffix = Math.floor(Math.random() * 1000000);
  const ownerEmail = `qa_owner_${Date.now()}_${randomSuffix}@alpacard.app`;
  const ownerPassword = 'Password123!';

  // 1. Register Owner
  const registerOwnerRes = await request.post(`${baseUrl}/api/v1/auth/register`, {
    data: {
      email: ownerEmail,
      password: ownerPassword,
      name: 'QA Owner Automated',
      role: 'OWNER',
    },
  });
  const ownerAuth = await registerOwnerRes.json();
  const ownerToken = ownerAuth.token;

  // 2. Create Business
  const businessName = `QA Roastery ${randomSuffix}`;
  const bizRes = await request.post(`${baseUrl}/api/v1/businesses`, {
    data: {
      name: businessName,
      brandColor: '#4A3525',
    },
    headers: {
      Authorization: `Bearer ${ownerToken}`,
    },
  });
  const bizData = await bizRes.json();

  // 3. Create Campaign (10 stamps)
  const campaignTitle = `Free Filter Coffee ${randomSuffix}`;
  const campaignRes = await request.post(`${baseUrl}/api/v1/campaigns`, {
    data: {
      businessId: bizData.id,
      name: campaignTitle,
      description: 'Collect 10 stamps for a cup',
      stampsRequired: 10,
      reward: 'Free Filter Coffee',
    },
    headers: {
      Authorization: `Bearer ${ownerToken}`,
    },
  });
  const campaignData = await campaignRes.json();

  // 4. Create Anonymous Customer (Guest Session)
  const guestRes = await request.post(`${baseUrl}/api/v1/auth/guest`);
  const guestAuth = await guestRes.json();
  const customerToken = guestAuth.token;
  const customerId = guestAuth.user.id;

  // 5. Claim Card for Customer
  const claimRes = await request.post(`${baseUrl}/api/v1/cards/claim`, {
    data: {
      campaignId: campaignData.id,
    },
    headers: {
      Authorization: `Bearer ${customerToken}`,
    },
  });
  const cardData = await claimRes.json();

  // 6. Generate Valid Cryptographic Dynamic Stamp QR Token
  const qrRes = await request.get(`${baseUrl}/api/v1/cards/${cardData.id}/qr`, {
    headers: {
      Authorization: `Bearer ${customerToken}`,
    },
  });
  const qrData = await qrRes.json();

  return {
    ownerEmail,
    ownerPassword,
    ownerToken,
    businessId: bizData.id,
    businessName,
    campaignId: campaignData.id,
    campaignTitle,
    customerToken,
    customerId,
    cardId: cardData.id,
    validQRToken: qrData.token,
    validQRJTI: qrData.jti,
  };
}
