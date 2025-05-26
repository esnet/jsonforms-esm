<script>
import { JsonForms } from '@jsonforms/vue';
import { createAjv } from "@jsonforms/core";
import { vanillaRenderers } from '@jsonforms/vue-vanilla';
import { defineComponent } from 'vue';

const renderers = [
  ...vanillaRenderers,
];

const handleDefaultsAjv = createAjv({ useDefaults: true });

export default defineComponent({
  props: {
    "formData": String,
    "schemaData": String,
    "layoutData": String,
  },
  ref: ['test'],
  components: {
    JsonForms,
  },
  data() {
    return {
      handleDefaultsAjv,
      renderers: Object.freeze(renderers),
      data: {},
      schema: null,
      uischema: null,
    };
  },
  watch: {
    "formData": function(newVal){
      try {
        this.data = JSON.parse(newVal);
        if (this.schema) {
          this.data = this.applyDefaults(this.data, this.schema);
        }
      } catch(e) {
        console.error(`'${newVal}' is not valid JSON (supplied for 'form-data')`);
        this.data = null;
      }
    },
    "schemaData": function(newVal){
      try {
        this.schema = JSON.parse(newVal);
        if (this.data) {
          this.data = this.applyDefaults(this.data, this.schema);
        }
      } catch(e) {
        console.error(`'${newVal}' is not valid JSON (supplied for 'schema-data')`);
        this.schema = null;
      }
    },
    "layoutData": function(newVal){
      try {
        this.uischema = JSON.parse(newVal);
      } catch(e) {
        console.error(`'${newVal}' is not valid JSON (supplied for 'layout-data')`);
        this.uischema = null;
      }
    }
  },
  methods: {
    onChange(event) {
      console.log("onChange ", event);
      this.data = event.data;
    },
    applyDefaults(data, schema) {
      if (schema) {
        console.log("=== APPLYING DEFAULTS ===");
        console.log("Schema:", schema);
        console.log("Input data:", data);

        // Compile the schema with AJV
        const validate = this.handleDefaultsAjv.compile(schema);

        // Validate the data, AJV modifies the data in place
        const isValid = validate(data);

        if (!isValid) {
          console.warn("Validation errors:", validate.errors);
        }

        console.log("Output data:", data);
        return data; // Return the modified data
      }
      return data;
    }
  }
});

</script>
<script setup>
import { onUpdated, nextTick, defineExpose, ref, computed } from 'vue';
const elem = ref(null);
const emit = defineEmits(['update', 'change'])

// set up a JS signal that we'll emit on update
// we can listen for this outside the element
// with element.addEventListener("update", ()=>{ /* code here */ })
onUpdated(async ()=>{
  await nextTick();
  emit("update");
})

// expose e.g. document.querySelector("json-form").instance
const instance = computed(()=>{ return elem?.value?.data })
// expose e.g. document.querySelector("json-form").
const serializeForm = computed(()=>{
  return ()=>{ return JSON.stringify(elem.value?.data); }
})
defineExpose({instance, serializeForm})
</script>

<template>
  <json-forms
    ref="elem"
    :data="data"
    :schema="schema"
    :uischema="uischema"
    :renderers="renderers"
    :ajv="handleDefaultsAjv"
    @change="onChange"
  />
</template>