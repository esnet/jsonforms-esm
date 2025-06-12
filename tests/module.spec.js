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
});
