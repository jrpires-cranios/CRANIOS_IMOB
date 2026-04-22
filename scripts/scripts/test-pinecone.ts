import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || '' });
    const index = pc.index(process.env.PINECONE_INDEX_NAME || 'cranios-imob-knowledge');
    try {
        await index.namespace('geral').upsert([{
            id: 'test_1',
            values: new Array(1536).fill(0.1),
            metadata: { teste: '123' }
        }]);
        console.log('Upsert array OK');
    } catch (e) {
        console.error('Error with array:', e.message);
    }
}
test();
