<script>
import { JsonForms } from '@jsonforms/vue';
import { createAjv } from "@jsonforms/core";
import { vanillaRenderers } from '@jsonforms/vue-vanilla';
import { defineComponent } from 'vue';
import { component } from "./AbstractSubcomponent.vue";

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
  components: {
    JsonForms,
  },
  data() {
    return {
      handleDefaultsAjv,
      renderers: renderers,
      data: this.formData ? JSON.parse(this.formData) : null,
      schema: this.schemaData ? JSON.parse(this.schemaData) : null,
      uischema: this.layoutData ? JSON.parse(this.layoutData) : null,
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
        if(event.data.hasOwnProperty(key) && this.data[key] != event.data[key]){
          this.data[key] = event.data[key];
          changed = true;
        }
        if(changed){
          this.$emit("change")
        }
      })
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
// expose e.g. document.querySelector("json-form").serializeForm()
const serializeForm = ()=>{ return JSON.stringify(elem.value?.data); }
// expose a function to allow users to alter the renderer chain
const appendRenderer = (newRenderer)=>{
  if(elem?.value?.renderers){
    let renderer = {
      renderer: component(newRenderer),
      tester: newRenderer.tester
    }
    elem.value.renderers.push(renderer);
  }
}

defineExpose({instance, serializeForm, appendRenderer})
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