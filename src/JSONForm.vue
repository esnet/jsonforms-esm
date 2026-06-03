<script setup>
import { ref, computed, watch, onBeforeMount, onMounted, onBeforeUpdate, onUpdated, nextTick } from 'vue';
import { JsonForms } from '@jsonforms/vue';
import { createAjv, defaultErrorTranslator, Resolve } from '@jsonforms/core';
import { vanillaRenderers } from '@jsonforms/vue-vanilla';
import { component } from './AbstractSubcomponent.vue';
import ajvErrors from 'ajv-errors';

const handleDefaultsAjv = createAjv({ useDefaults: true });
ajvErrors(handleDefaultsAjv);

// Resolve a custom message template for an error, checking x-invalid-message
// (our vendor extension) and errorMessage (ajv-errors standard keyword).
// Replaces %s with the current field value. Returns null if neither is set.
function customMessage(error) {
  const template = error.parentSchema?.['x-invalid-message']
    ?? (error.message?.includes('%s') ? error.message : null);
  if (!template) return null;
  return template.replace('%s', String(error.data ?? ''));
}

function translateError(error, t, uischema) {
  return customMessage(error) ?? defaultErrorTranslator(error, t, uischema);
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

// Walk a uischema tree and inject x-placeholder from the JSON schema into
// each control's options, so the vanilla renderers pick it up via appliedOptions.
function injectPlaceholders(uischemaNode, jsonSchema) {
  if (!uischemaNode || !jsonSchema) return uischemaNode;
  if (uischemaNode.scope) {
    const fieldSchema = Resolve.schema(jsonSchema, uischemaNode.scope, jsonSchema);
    const placeholder = fieldSchema?.['x-placeholder'];
    if (placeholder) {
      return { ...uischemaNode, options: { placeholder, ...uischemaNode.options } };
    }
  }
  if (Array.isArray(uischemaNode.elements)) {
    const elements = uischemaNode.elements.map((el) => injectPlaceholders(el, jsonSchema));
    return { ...uischemaNode, elements };
  }
  return uischemaNode;
}

const data = ref(parseJSON(props.formData, 'form-data'));
const schema = ref(parseJSON(props.schemaData, 'schema-data'));
const uischema = computed(() => injectPlaceholders(parseJSON(props.layoutData, 'layout-data'), schema.value));
const renderers = ref([...vanillaRenderers]);
const formErrors = ref([]);

watch(() => props.formData, (newVal) => {
  data.value = parseJSON(newVal, 'form-data');
});

watch(() => props.schemaData, (newVal) => {
  schema.value = parseJSON(newVal, 'schema-data');
});

function onChange(event) {
  if (!event.data) return;

  formErrors.value = event.errors.map((error) => {
    const msg = customMessage(error);
    return msg ? { ...error, message: msg } : error;
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
