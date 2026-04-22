import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || '' });
    const index = pc.index(process.env.PINECONE_INDEX_NAME || 'cranios-imob-knowledge');
    const ns = index.namespace('geral');

    console.log('Testing array format...');
    try {
        await ns.upsert([{ id: 'test_1', values: new Array(1536).fill(0.1) }]);
        console.log('✅ Array format works!');
    } catch (e: any) {
        console.log('❌ Array format failed:', e.message);
    }

    console.log('Testing records format...');
    try {
        await (ns as any).upsert({ records: [{ id: 'test_2', values: new Array(1536).fill(0.1) }] });
        console.log('✅ Records format works!');
    } catch (e: any) {
        console.log('❌ Records format failed:', e.message);
    }

    console.log('Testing vectors format...');
    try {
        await (ns as any).upsert({ vectors: [{ id: 'test_3', values: new Array(1536).fill(0.1) }] });
        console.log('✅ Vectors format works!');
    } catch (e: any) {
        console.log('❌ Vectors format failed:', e.message);
    }
}
test();
