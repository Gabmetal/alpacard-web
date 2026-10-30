// Seed helper to provision test business and campaign
export async function setupTestMerchantAndCampaign(request: any, baseUrl: string) {
  const randomSuffix = Math.floor(Math.random() * 100000);
  const email = `qa_owner_${Date.now()}_${randomSuffix}@alpacard.app`;
  const password = 'Password123!';

  // 1. Register Owner
  const registerRes = await request.post(`${baseUrl}/api/v1/auth/register`, {
    data: {
      email,
      password,
      name: 'QA Test Owner',
      role: 'OWNER',
    },
  });

  const authData = await registerRes.json();
  const token = authData.token;

  // 2. Create Business
  const bizRes = await request.post(`${baseUrl}/api/v1/businesses`, {
    data: {
      name: `QA Coffee Lab ${randomSuffix}`,
      brandColor: '#4A3525',
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const bizData = await bizRes.json();

  // 3. Create Campaign
  const campaignRes = await request.post(`${baseUrl}/api/v1/campaigns`, {
    data: {
      businessId: bizData.id,
      name: 'Free Artisan Scone',
      description: 'One Free Scone',
      stampsRequired: 10,
      reward: 'One Free Scone',
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const campaignData = await campaignRes.json();

  return {
    email,
    password,
    token,
    businessId: bizData.id,
    campaignId: campaignData.id,
  };
}
