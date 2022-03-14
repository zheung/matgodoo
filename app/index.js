import { createApp } from 'vue';

import App from './index.vue';


const app = createApp(App);
app.provide('app', app);


window.addEventListener('load', async () => {
	(await import('./lib/plugin/Bus.js')).install(app);
	(await import('./lib/plugin/Brop.js')).install(app);
	(await import('./lib/plugin/CSSVar.js')).install(app);


	app.mount('#app');
});