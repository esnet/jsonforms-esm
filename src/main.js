import { defineCustomElement } from 'vue';
import "@jsonforms/vue-vanilla/vanilla.css";

import JSONForm from './JSONForm.vue';

const JSONFormComponent = defineCustomElement(JSONForm, {shadowRoot: false});

window.customElements.define("json-form", JSONFormComponent);
