import { createApp } from "vue"
import "./style.css"
import App from "./App.vue"
import router from "./router"
import vuetify from "./plugins/vuetify"
// Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css'
// Bootstrap JS
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

createApp(App).use(vuetify).use(router).mount("#app")
