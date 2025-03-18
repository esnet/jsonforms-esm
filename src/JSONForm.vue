<script>
import { JsonForms } from '@jsonforms/vue';
import { vanillaRenderers } from '@jsonforms/vue-vanilla';
import { defineComponent } from 'vue';

const renderers = [
  ...vanillaRenderers,
];

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
      renderers: Object.freeze(renderers),
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
      this.data = event.data;
    },
    onUpdated(event){
      console.log("updated.", event);
    }
  },
});

</script>
<script setup>
// set up a JS signal that we'll emit on update
// we can listen for this outside the element
// with element.addEventListener("update", ()=>{ /* code here */ })
import { onUpdated, nextTick } from 'vue';
const emit = defineEmits(['update'])
onUpdated(async ()=>{
  await nextTick();
  emit("update");
})
</script>

<template>
  <json-forms
    :data="data"
    :schema="schema"
    :uischema="uischema"
    :renderers="renderers"
    @change="onChange"
  />
</template>