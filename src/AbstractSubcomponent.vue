<script>
import { defineComponent, h } from 'vue';
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue';
import { useVanillaControl } from "@jsonforms/vue-vanilla";
export function component(newRenderer){
    return defineComponent({
      props: { ...rendererProps() },
      setup: (props)=>{
        let controlProps = useVanillaControl(useJsonFormsControl(props));
        let p = props;
        return  () => {
          const {tag, props} = newRenderer.renderer(
                controlProps?.value,
                controlProps?.handleChange,
                controlProps?.control?.value?.path
            );
          let output = h(tag, props, []);
          return output
        }
      },
    })
}
</script>