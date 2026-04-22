import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || '' });
    const index = pc.index(process.env.PINECONE_INDEX_NAME || 'cranios-imob-knowledge');
    const ns = index.namespace('geral');

    console.log('Testing array format with 1024...');
    try {
        await ns.upsert([{ id: 'test1', values: Array.from({ length: 1024 }, () => 0.1) }]);
        console.log('✅ Array format works!');
    } catch (e: any) {
        console.log('❌ Array format failed:', e.message);
    }
}
test();
