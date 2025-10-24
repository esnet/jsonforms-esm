<script>
import { JsonForms } from '@jsonforms/vue';
import { createAjv } from "@jsonforms/core";
import { vanillaRenderers } from '@jsonforms/vue-vanilla';
import { defineComponent } from 'vue';
import { component } from "./AbstractSubcomponent.vue";

const handleDefaultsAjv = createAjv({ useDefaults: true });

export default defineComponent({
  props: {
    "formData": String,
    "schemaData": String,
    "layoutData": String,
    "readonly": Boolean,
  },
  components: {
    JsonForms,
  },
  data() {
    return {
      handleDefaultsAjv,
      renderers: [...vanillaRenderers],
      data: this.formData ? JSON.parse(this.formData) : null,
      schema: this.schemaData ? JSON.parse(this.schemaData) : null,
      uischema: this.layoutData ? JSON.parse(this.layoutData) : null,
      readonly: this.readonly ? true : false,
      formErrors: []
    };
  },
  watch: {
    "formData": function(newVal){
      try {
        this.data = JSON.parse(newVal);
      } catch(e) {
        console.error(`'${newVal}' is not valid JSON (supplied for 'form-data')`);
        this.data = null;
      }
    },
    "schemaData": function(newVal){
      try {
        this.schema = JSON.parse(newVal);
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
      if(!event.data) return
      Object.keys(event?.data).forEach((key)=>{
        let changed = false;
        // clear array
        this.formErrors.splice(0, this.formErrors.length);
        // enqueue the errors so we can validate
        event.errors.forEach((error)=>{
          this.formErrors.push(error);
        });
        if(event.data.hasOwnProperty(key) && this.data[key] != event.data[key]){
          this.data[key] = event.data[key];
          changed = true;
        }
        if(changed){
          this.$emit("change")
        }
      })
    },
    appendRenderer(newRenderer){
        if(this.renderers){
          let renderer = {
            renderer: component(newRenderer),
            tester: newRenderer.tester
          }
          this.renderers.push(renderer);
        }
    },
    serializeForm(){
      return JSON.stringify(this.data);
    },
    validate(){
      return this.formErrors.length == 0;
    }
  },
  beforeMount(){
    this.$emit("json-form:beforeMount", { target: this, bubbles: true });
  },
  mounted(){
    this.$emit("json-form:mounted", { target: this, bubbles: true });
  },
  beforeUpdate(){
    this.$emit("json-form:beforeUpdate", { target: this, bubbles: true });
  },
  updated(){
    this.$emit("json-form:updated", { target: this, bubbles: true });
  },
  expose: ['serializeForm', 'appendRenderer', 'validate']
});

</script>
<script setup>
import { onUpdated, nextTick, defineExpose, ref, computed } from 'vue';
const elem = ref(null);
const emit = defineEmits([
  'update',
  'change',
  'json-form:beforeMount',
  'json-form:mounted',
  'json-form:beforeUpdate',
  'json-form:updated'])

// set up a JS signal that we'll emit on update
// we can listen for this outside the element
// with element.addEventListener("update", ()=>{ /* code here */ })
onUpdated(async ()=>{
  await nextTick();
  emit("update");
})

// expose e.g. document.querySelector("json-form").instance
const instance = computed(()=>{ return elem?.value?.data })
// expose e.g. document.querySelector("json-form").serializeForm()
const serializeForm = ()=>{ 
  return elem?.value?.serializeForm();
}
// expose a validation function
const validate = ()=>{
  return elem?.value?.validate();
}
// expose a function to allow users to alter the renderer chain
const appendRenderer = (newRenderer)=>{
  elem.value.appendRenderer(newRenderer);
}

defineExpose({instance, serializeForm, appendRenderer, validate })
</script>

<template>
  <json-forms
    ref="elem"
    :data="data"
    :schema="schema"
    :uischema="uischema"
    :renderers="renderers"
    :ajv="handleDefaultsAjv"
    :readonly="readonly"
    @change="onChange"
  />
</template>