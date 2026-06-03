<script setup>
import { ref, computed, watch, onBeforeMount, onMounted, onBeforeUpdate, onUpdated, nextTick } from 'vue';
import { JsonForms } from '@jsonforms/vue';
import { createAjv, defaultErrorTranslator } from '@jsonforms/core';
import { vanillaRenderers } from '@jsonforms/vue-vanilla';
import { component } from './AbstractSubcomponent.vue';

const handleDefaultsAjv = createAjv({ useDefaults: true });

function translateError(error, t, uischema) {
  const template = error.parentSchema?.['x-invalid-message'];
  if (template) {
    return template.replace('%s', String(error.data ?? ''));
  }
  return defaultErrorTranslator(error, t, uischema);
}

const i18n = { translateError };

const props = defineProps({
  formData: String,
  schemaData: String,
  layoutData: String,
  readonly: Boolean,
});

const emit = defineEmits([
  'update',
  'change',
  'json-form:beforeMount',
  'json-form:mounted',
  'json-form:beforeUpdate',
  'json-form:updated',
]);

function parseJSON(value, label) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (e) {
    console.error(`'${value}' is not valid JSON (supplied for '${label}')`);
    return null;
  }
}

const data = ref(parseJSON(props.formData, 'form-data'));
const schema = ref(parseJSON(props.schemaData, 'schema-data'));
const uischema = ref(parseJSON(props.layoutData, 'layout-data'));
const renderers = ref([...vanillaRenderers]);
const formErrors = ref([]);

watch(() => props.formData, (newVal) => {
  data.value = parseJSON(newVal, 'form-data');
});

watch(() => props.schemaData, (newVal) => {
  schema.value = parseJSON(newVal, 'schema-data');
});

watch(() => props.layoutData, (newVal) => {
  uischema.value = parseJSON(newVal, 'layout-data');
});

function onChange(event) {
  if (!event.data) return;

  formErrors.value = event.errors.map((error) => {
    const template = error.parentSchema?.['x-invalid-message'];
    if (!template) return error;
    return { ...error, message: template.replace('%s', String(error.data ?? '')) };
  });

  let changed = false;
  for (const key of Object.keys(event.data)) {
    if (Object.prototype.hasOwnProperty.call(event.data, key) && data.value[key] !== event.data[key]) {
      data.value[key] = event.data[key];
      changed = true;
    }
  }
  if (changed) {
    emit('change');
  }
}

function appendRenderer(newRenderer) {
  renderers.value.push({
    renderer: component(newRenderer),
    tester: newRenderer.tester,
  });
}

function serializeForm() {
  return JSON.stringify(data.value);
}

function validate() {
  return formErrors.value.length === 0;
}

function errors() {
  return JSON.parse(JSON.stringify(formErrors.value));
}

const instance = computed(() => data.value);

const publicAPI = { appendRenderer, serializeForm, validate, errors };

onBeforeMount(() => {
  emit('json-form:beforeMount', { target: publicAPI, bubbles: true });
});

onMounted(() => {
  emit('json-form:mounted', { target: publicAPI, bubbles: true });
});

onBeforeUpdate(() => {
  emit('json-form:beforeUpdate', { target: publicAPI, bubbles: true });
});

onUpdated(async () => {
  emit('json-form:updated', { target: publicAPI, bubbles: true });
  await nextTick();
  emit('update');
});

defineExpose({ instance, serializeForm, appendRenderer, validate, errors });
</script>

<template>
  <json-forms
    :data="data"
    :schema="schema"
    :uischema="uischema"
    :renderers="renderers"
    :ajv="handleDefaultsAjv"
    :readonly="props.readonly"
    :i18n="i18n"
    @change="onChange"
  />
</template>
