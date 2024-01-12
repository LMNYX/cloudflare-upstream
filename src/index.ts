import Output from "@utils/output";
import { updateCloudflareDNS, purgeCloudflareCache } from "@utils/cloudflare";
import checkIfAlive from "@utils/requests";

Output.Log("Starting listening...");

const domain: string = process.env.DOMAIN as string;
const apiToken: string = process.env.CLOUDFLARE_API as string;
const upstreamArecord: string = process.env.UPSTREAM_A_RECORD as string;
const checkInterval: number = parseInt(process.env.CHECK_INTERVAL as string);

var isDead: boolean = false;

(async ()=>
{
    setInterval(async function ()
    {
        let isAlive = await checkIfAlive(domain);

        if (isAlive)
        {
            if (isDead)
                isDead = false;
            Output.Log(`Website came back online alive. Waiting ${checkInterval/1000} seconds.`);
        }
        else
        {
            if(!isDead)
            {
                Output.Log("Website is dead. Changing A record to upstream...");
                await updateCloudflareDNS(domain, upstreamArecord, apiToken);
                await purgeCloudflareCache(domain, apiToken);
            }
            else
            {
                Output.Log("Website is still dead...");
            }
            isDead = true;
        }
    }, 5000);
})().catch(Output.Error);