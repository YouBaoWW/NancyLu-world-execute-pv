import {startServer} from '../export/server.mjs';
const {url}=await startServer({port:5191});
console.log(`NancyLu review: ${url}/nancy-preview.html`);
