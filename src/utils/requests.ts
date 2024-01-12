import axios from 'axios';

export default async function checkIfAlive(domain: string): Promise<boolean>
{
    try
    {
        let result = await axios.get(`https://${domain}/`);
        if (result.status != 200)
            return false;
    }
    catch {
        return false;
    }
    return true;
}