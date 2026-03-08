import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// Suppress Firefox-specific Leaflet deprecation warnings.
// mozPressure and mozInputSource are used internally by Leaflet for
// pointer event fallbacks; the browser warns but there is no API impact.
if (typeof MouseEvent !== 'undefined') {
  const noop = () => 0
  if (!Object.getOwnPropertyDescriptor(MouseEvent.prototype, 'mozPressure')) {
    Object.defineProperty(MouseEvent.prototype, 'mozPressure', { get: noop, configurable: true })
  }
  if (!Object.getOwnPropertyDescriptor(MouseEvent.prototype, 'mozInputSource')) {
    Object.defineProperty(MouseEvent.prototype, 'mozInputSource', { get: noop, configurable: true })
  }
}

console.log(
  '%c' +
  '\n  ███████╗██╗     ███████╗███████╗████████╗██████╗ ██╗   ██╗██╗      ███████╗███████╗\n' +
  '  ██╔════╝██║     ██╔════╝██╔════╝╚══██╔══╝██╔══██╗██║   ██║██║      ██╔════╝██╔════╝\n' +
  '  █████╗  ██║     █████╗  █████╗     ██║   ██████╔╝██║   ██║██║      ███████╗█████╗  \n' +
  '  ██╔══╝  ██║     ██╔══╝  ██╔══╝     ██║   ██╔═══╝ ██║   ██║██║      ╚════██║██╔══╝  \n' +
  '  ██║     ███████╗███████╗███████╗   ██║   ██║     ╚██████╔╝███████╗ ███████║███████╗\n' +
  '  ╚═╝     ╚══════╝╚══════╝╚══════╝   ╚═╝   ╚═╝      ╚═════╝ ╚══════╝ ╚══════╝╚══════╝\n' +
  '\n  Built by David Novak\n  Fleet Intelligence Dashboard — GPS Dozor API\n',
  'color: #3B82F6; font-family: monospace; font-size: 10px; line-height: 1.4;'
)

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
