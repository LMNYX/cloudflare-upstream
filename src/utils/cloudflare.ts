import axios, { AxiosError } from 'axios';

export async function updateCloudflareDNS(domain: string, upstreamAddr: string, apiKey: string): Promise<void> {
  try {
    // Get zone ID for the domain
    const zoneIdResponse = await axios.get(`https://api.cloudflare.com/client/v4/zones?name=${domain}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const zoneId = zoneIdResponse.data.result[0]?.id;

    if (!zoneId) {
      throw new Error('Zone ID not found for the specified domain');
    }


    // Get DNS records for the domain
    const dnsRecordsResponse = await axios.get(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const dnsRecords = dnsRecordsResponse.data.result;


    // Delete existing records for * and www
    for (const record of dnsRecords) {
      if (record.type == 'A' && (record.name === domain || record.name === `www.${domain}`)) {
        await axios.delete(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${record.id}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
      }
    }

    // Add new records for * and www
    const newRecords = [
      { type: 'A', name: domain, content: upstreamAddr },
      { type: 'A', name: `www.${domain}`, content: upstreamAddr },
    ];

    for (const record of newRecords) {
      await axios.post(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, record, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
    }

    console.log('DNS records updated successfully');
  } catch (error) {
    console.error('Error updating DNS records: ' + JSON.stringify((error as any).response?.data));
  }
}

export async function purgeCloudflareCache(domain: string, apiKey: string): Promise<void> {
    try {
        const zoneIdResponse = await axios.get(`https://api.cloudflare.com/client/v4/zones?name=${domain}`, {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        });

        const zoneId = zoneIdResponse.data.result[0]?.id;

        if (!zoneId) {
        throw new Error('Zone ID not found for the specified domain');
        }
      const response = await axios.post(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, { purge_everything: true }, {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      });
  
      if (response.data.success) {
        console.log('Cache purged successfully');
      } else {
        console.error('Failed to purge cache:', response.data.errors);
      }
    } catch (error) {
      handleCloudflareAPIError(error as any);
    }
  }
  
  function handleCloudflareAPIError(error: AxiosError): void {
    console.error('Error purging cache:', error.response?.data || error.message);
  
    if ((error as any).response?.data.errors) {
      console.error('Cloudflare API Errors:', (error as any).response.data.errors);
    }
  }