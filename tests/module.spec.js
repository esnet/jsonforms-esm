var formData = { a_number: 5, another_property: "Some String" };
var emptyFormData = {};
var partialFormData = { a_number: 5 };
var schemaData = {
  properties: {
    a_number: { type: "number", default: 10 },
    another_property: { type: "string", default: "Test" },
  },
  required: ["a_number", "another_property"],
};
var uiSchemaData = {
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      scope: "#/properties/a_number",
    },
    {
      type: "Control",
      scope: "#/properties/another_property",
    },
  ],
};

describe("Component json-form", () => {
  beforeEach(function () {
    let elem = document.createElement("json-form");
    elem.setAttribute("form-data", JSON.stringify(formData));
    elem.setAttribute("schema-data", JSON.stringify(schemaData));
    elem.setAttribute("layout-data", JSON.stringify(uiSchemaData));
    document.body.appendChild(elem);
  });

  afterEach(function () {
    var forms = document.querySelectorAll("json-form");
    forms.forEach((form) => {
      form.remove();
    });
  });

  it("should append an element, even with no attributes set", () => {
    let elem = document.createElement("json-form");
    document.body.appendChild(elem);
    let isInstance = document.querySelector("json-form") instanceof HTMLElement;
    expect(isInstance).toBeTruthy();
  });

  it("should append a json-form element with attributes set", async () => {
    let isInstance = document.querySelector("json-form") instanceof HTMLElement;
    expect(isInstance).toBeTruthy();
  });

  it("should NOT use the shadow DOM", () => {
    let input = document.querySelector("input");
    expect(input).toBeTruthy();
    expect(input.value).toBeTruthy();
  });

  it("should accept weird values, logging issues to the console", (done) => {
    let elem = document.querySelector("json-form");
    elem.setAttribute("form-data", "nonsense");
    elem.addEventListener("update", () => {
      let input = document.querySelector("input");
      expect(input.value).toBeFalsy();
      done();
    });
  });

  it("should produce valid JSON output", () => {
    let elem = document.querySelector("json-form");
    let obj = JSON.parse(elem.serializeForm());
    expect(obj.a_number).toEqual(5);
    expect(obj.another_property).toEqual("Some String");
  });
});

describe("Component json-form with empty form data", () => {
  beforeEach(function () {
    let elem = document.createElement("json-form");
    elem.setAttribute("form-data", JSON.stringify(emptyFormData));
    elem.setAttribute("schema-data", JSON.stringify(schemaData));
    elem.setAttribute("layout-data", JSON.stringify(uiSchemaData));
    document.body.appendChild(elem);
  });

  afterEach(function () {
    const forms = document.querySelectorAll("json-form");
    forms.forEach((form) => form.remove());
  });

  it("should set default values if an empty object is passed", (done) => {
    let elem = document.querySelector("json-form");
    const formData = JSON.parse(elem.serializeForm());
    expect(formData.a_number).toEqual(10);
    expect(formData.another_property).toEqual("Test");
    done();
  });

  it("should set default values for a partial filled object", (done) => {
    let elem = document.querySelector("json-form");
    elem.setAttribute("form-data", JSON.stringify(partialFormData));
    elem.addEventListener("update", () => {
      const formData = JSON.parse(elem.serializeForm());
      expect(formData.a_number).toEqual(5);
      expect(formData.another_property).toEqual("Test");
      done();
    });
  });

  it("should update the serialized form data when the form changes", (done)=>{
    let elem = document.createElement("json-form");
    document.body.appendChild(elem);
    elem.setAttribute("form-data", JSON.stringify(emptyFormData));
    elem.setAttribute("schema-data", JSON.stringify(schemaData));
    elem.setAttribute("layout-data", JSON.stringify(uiSchemaData));
    let listenerAdded = false;
    elem.addEventListener("update", ()=>{
      let input = elem.querySelector("input");
      let valueBefore = elem.serializeForm();
      input.setAttribute("value", 1000);
      input.value = 1000;
      let calls = 0;
      let removed = false;
      if(!listenerAdded){
        elem.addEventListener("change", ()=>{
          let valueAfter = elem.serializeForm();
          calls++;
          if(!removed){
            document.body.removeChild(elem);
            removed = true;
          }
          if(valueAfter != valueBefore){
            expect(valueBefore).not.toEqual(valueAfter);
            done();
          }
        })
        listenerAdded = true;
      }
      let changeEvent = new Event("change", {bubbles: true});
      input.dispatchEvent(changeEvent);
    })
  })

  it("should support custom renderers for component overrides", (done)=>{
    let newElem = document.createElement("json-form");

    const HIGH_RANK = 3;
    const LOWEST_RANK = -1;

    function customRenderer(data, handleChange, path) {
      // this mechanism is not ideal. It appears that we must create a
      // vue component to bind to the DOM, and we can't do this with a
      // 'normal' webcomponent. As such, we have to create the element
      // within the vue section of the code, and here, we just pass in the
      // tag name and properties. See AbstractSubcomponent.vue to
      // see how the implementation ends up using `h()` (a vue builtin
      // to render "html") to render the actual DOM elements.
      let elemToReturn = { "tag": "dummy-custom-component", "props": {} }
      elemToReturn.props.value = data;
      elemToReturn.props.onChange = function(event){
        let target = event.target
        if(event.target.tagName != "INPUT"){
          target = target.querySelector("input");
        }
        return handleChange(path, parseInt(target.getAttribute("value")));
      };
      return elemToReturn
    }

    function customTester(uischema, schema, context){
      if(!uischema.scope) return LOWEST_RANK;
      if(uischema.scope.endsWith("a_number")){
        return HIGH_RANK;
      }
      return LOWEST_RANK;
    }

    let initialRenderComplete = false;
    let valueUpdateRenderComplete = false;
    newElem.addEventListener("update", () => {
      let customElements = document.querySelectorAll("dummy-custom-component");
      if(!initialRenderComplete){
        expect(customElements.length).toBeGreaterThan(0);
        let inputToChange = document.querySelector("dummy-custom-component > input");
        inputToChange.setAttribute("value", 1000);
        var changeEvent = new Event('change', { bubbles: true });
        inputToChange.dispatchEvent(changeEvent);
        // tick the bool so we don't call 'done' again (or execute this if block)
        initialRenderComplete = true;
      }
    });
    newElem.addEventListener("change", ()=>{
      if(initialRenderComplete && !valueUpdateRenderComplete){
        let formData = JSON.parse(newElem.serializeForm());
        expect(formData.a_number).toEqual(1000);
        valueUpdateRenderComplete = true;
        done();
      }
    });
    document.body.appendChild(newElem);
    newElem.appendRenderer({ tester: customTester, renderer: customRenderer });
    newElem.setAttribute("form-data", JSON.stringify(emptyFormData));
    newElem.setAttribute("schema-data", JSON.stringify(schemaData));
    newElem.setAttribute("layout-data", JSON.stringify(uiSchemaData));
  })
});
