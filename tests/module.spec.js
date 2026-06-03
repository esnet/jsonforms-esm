// ─── Shared fixtures ─────────────────────────────────────────────────────────

const formData = { a_number: 5, another_property: "Some String" };
const emptyFormData = {};
const partialFormData = { a_number: 5 };

const schemaData = {
  properties: {
    a_number: { type: "number", default: 10 },
    another_property: { type: "string", default: "Test" },
  },
  required: ["a_number", "another_property"],
};

const uiSchemaData = {
  type: "VerticalLayout",
  elements: [
    { type: "Control", scope: "#/properties/a_number" },
    { type: "Control", scope: "#/properties/another_property" },
  ],
};

const hyphenSchema = {
  properties: {
    "a-number": { type: "integer", default: 10, maximum: 100 },
    "a-bool": { type: "boolean", default: true },
    another_property: { type: "string", default: "Test" },
  },
  required: ["a-number", "a-bool"],
};

const hyphenUISchema = {
  type: "VerticalLayout",
  elements: [
    { type: "Control", scope: "#/properties/a-number" },
    { type: "Control", scope: "#/properties/a-bool" },
    { type: "Control", scope: "#/properties/another_property" },
  ],
};

const HIGH_RANK = 3;
const LOWEST_RANK = -1;

function customTester(uischema) {
  if (!uischema.scope) return LOWEST_RANK;
  return uischema.scope.endsWith("a_number") ? HIGH_RANK : LOWEST_RANK;
}

function customRenderer(data, handleChange, path) {
  return {
    tag: "dummy-custom-component",
    props: {
      value: data,
      onChange(event) {
        let target = event.target;
        if (event.target.tagName !== "INPUT") {
          target = target.querySelector("input");
        }
        return handleChange(path, parseInt(target.getAttribute("value")));
      },
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Setting attributes BEFORE appendChild makes the initial Vue render synchronous,
// so DOM queries work immediately after this call without waiting for an update event.
function makeForm(attrs = {}) {
  const elem = document.createElement("json-form");
  for (const [k, v] of Object.entries(attrs)) {
    elem.setAttribute(k, v);
  }
  document.body.appendChild(elem);
  return elem;
}

// For custom renderers: append with NO attrs (mounts with no data), call appendRenderer,
// then set attrs to trigger the first meaningful render with the renderer already active.
function makeFormForCustomRenderer() {
  const elem = document.createElement("json-form");
  document.body.appendChild(elem);
  return elem;
}

function removeAll() {
  document.querySelectorAll("json-form").forEach((f) => f.remove());
}

// ─── 1. Element creation & DOM integration ───────────────────────────────────

describe("Element creation", () => {
  afterEach(removeAll);

  it("creates a <json-form> with no attributes", () => {
    const elem = makeForm();
    expect(elem instanceof HTMLElement).toBe(true);
  });

  it("creates a <json-form> with all three data attributes", () => {
    const elem = makeForm({
      "form-data": JSON.stringify(formData),
      "schema-data": JSON.stringify(schemaData),
      "layout-data": JSON.stringify(uiSchemaData),
    });
    expect(elem instanceof HTMLElement).toBe(true);
  });

  it("does NOT use shadow DOM — inputs are queryable from the document", () => {
    makeForm({
      "form-data": JSON.stringify(formData),
      "schema-data": JSON.stringify(schemaData),
      "layout-data": JSON.stringify(uiSchemaData),
    });
    const input = document.querySelector("input");
    expect(input).toBeTruthy();
    expect(input.value).toBeTruthy();
  });

  it("exposes instance property reflecting current form data", () => {
    const elem = makeForm({
      "form-data": JSON.stringify(formData),
      "schema-data": JSON.stringify(schemaData),
      "layout-data": JSON.stringify(uiSchemaData),
    });
    expect(elem.instance).toEqual(formData);
  });
});

// ─── 2. JSON parsing & error handling ────────────────────────────────────────

describe("JSON parsing", () => {
  afterEach(removeAll);

  it("renders inputs for valid form-data", () => {
    makeForm({
      "form-data": JSON.stringify(formData),
      "schema-data": JSON.stringify(schemaData),
      "layout-data": JSON.stringify(uiSchemaData),
    });
    const input = document.querySelector("input");
    expect(input).toBeTruthy();
    expect(input.value).toBeTruthy();
  });

  it("handles invalid form-data gracefully (logs error, renders without data)", (done) => {
    const elem = makeForm({
      "form-data": JSON.stringify(formData),
      "schema-data": JSON.stringify(schemaData),
      "layout-data": JSON.stringify(uiSchemaData),
    });
    elem.setAttribute("form-data", "nonsense");
    elem.addEventListener("update", () => {
      const input = elem.querySelector("input");
      expect(input?.value).toBeFalsy();
      done();
    }, { once: true });
  });

  it("handles invalid schema-data gracefully (element still exists)", () => {
    const elem = makeForm({ "schema-data": "not-json" });
    expect(elem instanceof HTMLElement).toBe(true);
  });

  it("handles invalid layout-data gracefully (element still exists)", () => {
    const elem = makeForm({ "layout-data": "not-json" });
    expect(elem instanceof HTMLElement).toBe(true);
  });

  it("accepts empty/missing attributes without crashing", () => {
    const elem = makeForm({});
    expect(elem instanceof HTMLElement).toBe(true);
  });

  it("recovers when form-data goes from invalid back to valid", (done) => {
    const elem = makeForm({
      "form-data": JSON.stringify(formData),
      "schema-data": JSON.stringify(schemaData),
      "layout-data": JSON.stringify(uiSchemaData),
    });
    elem.setAttribute("form-data", "bad-json");
    elem.addEventListener("update", () => {
      elem.setAttribute("form-data", JSON.stringify({ a_number: 42, another_property: "ok" }));
      elem.addEventListener("update", () => {
        const parsed = JSON.parse(elem.serializeForm());
        expect(parsed.a_number).toEqual(42);
        done();
      }, { once: true });
    }, { once: true });
  });
});

// ─── 3. Default values via AJV ───────────────────────────────────────────────

describe("Default values", () => {
  afterEach(removeAll);

  it("fills in schema defaults when form-data is an empty object", () => {
    const elem = makeForm({
      "form-data": JSON.stringify(emptyFormData),
      "schema-data": JSON.stringify(schemaData),
      "layout-data": JSON.stringify(uiSchemaData),
    });
    const parsed = JSON.parse(elem.serializeForm());
    expect(parsed.a_number).toEqual(10);
    expect(parsed.another_property).toEqual("Test");
  });

  it("preserves provided values and fills in missing defaults for partial data", (done) => {
    const elem = makeForm({
      "form-data": JSON.stringify(emptyFormData),
      "schema-data": JSON.stringify(schemaData),
      "layout-data": JSON.stringify(uiSchemaData),
    });
    elem.setAttribute("form-data", JSON.stringify(partialFormData));
    elem.addEventListener("update", () => {
      const parsed = JSON.parse(elem.serializeForm());
      expect(parsed.a_number).toEqual(5);
      expect(parsed.another_property).toEqual("Test");
      done();
    }, { once: true });
  });

  it("fills in defaults for fields with hyphenated names", () => {
    const elem = makeForm({
      "form-data": JSON.stringify(emptyFormData),
      "schema-data": JSON.stringify(hyphenSchema),
      "layout-data": JSON.stringify(hyphenUISchema),
    });
    const numberInput = elem.querySelector("input[type='number']");
    expect(numberInput.value).toEqual("10");
    const boolInput = elem.querySelector("input[type='checkbox']");
    expect(boolInput.value).toEqual("on");
  });
});

// ─── 4. Dynamic attribute updates ────────────────────────────────────────────

describe("Dynamic attribute updates", () => {
  afterEach(removeAll);

  it("re-parses form-data when the attribute changes", (done) => {
    const elem = makeForm({
      "form-data": JSON.stringify(emptyFormData),
      "schema-data": JSON.stringify(schemaData),
      "layout-data": JSON.stringify(uiSchemaData),
    });
    elem.setAttribute("form-data", JSON.stringify({ a_number: 99, another_property: "hi" }));
    elem.addEventListener("update", () => {
      const parsed = JSON.parse(elem.serializeForm());
      expect(parsed.a_number).toEqual(99);
      done();
    }, { once: true });
  });

  it("fires the update event after the DOM has re-rendered", (done) => {
    const elem = makeForm({
      "form-data": JSON.stringify(emptyFormData),
      "schema-data": JSON.stringify(schemaData),
      "layout-data": JSON.stringify(uiSchemaData),
    });
    elem.addEventListener("update", () => {
      expect(elem.querySelector("input")).toBeTruthy();
      done();
    }, { once: true });
    elem.setAttribute("form-data", JSON.stringify(formData));
  });
});

// ─── 5. Serialization ─────────────────────────────────────────────────────────

describe("serializeForm()", () => {
  afterEach(removeAll);

  it("returns a valid JSON string", () => {
    const elem = makeForm({
      "form-data": JSON.stringify(formData),
      "schema-data": JSON.stringify(schemaData),
      "layout-data": JSON.stringify(uiSchemaData),
    });
    expect(() => JSON.parse(elem.serializeForm())).not.toThrow();
  });

  it("reflects the initial form data values", () => {
    const elem = makeForm({
      "form-data": JSON.stringify(formData),
      "schema-data": JSON.stringify(schemaData),
      "layout-data": JSON.stringify(uiSchemaData),
    });
    const obj = JSON.parse(elem.serializeForm());
    expect(obj.a_number).toEqual(5);
    expect(obj.another_property).toEqual("Some String");
  });

  it("reflects changes after user input", (done) => {
    const elem = makeForm({
      "form-data": JSON.stringify(emptyFormData),
      "schema-data": JSON.stringify(schemaData),
      "layout-data": JSON.stringify(uiSchemaData),
    });
    // The initial render is synchronous (attrs set before appendChild).
    // Directly interact with the rendered input, then listen for the change event.
    const valueBefore = elem.serializeForm();
    const input = elem.querySelector("input");
    input.setAttribute("value", 1000);
    input.value = 1000;

    elem.addEventListener("change", () => {
      const valueAfter = elem.serializeForm();
      if (valueAfter !== valueBefore) {
        expect(valueAfter).not.toEqual(valueBefore);
        done();
      }
    });

    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
});

// ─── 6. Validation & errors ───────────────────────────────────────────────────

describe("validate() and errors()", () => {
  afterEach(removeAll);

  it("validate() is defined on the element", () => {
    const elem = makeForm();
    expect(elem.validate).toBeDefined();
  });

  it("validate() returns true initially (no errors on fresh form)", () => {
    const elem = makeForm({
      "form-data": JSON.stringify(formData),
      "schema-data": JSON.stringify(schemaData),
      "layout-data": JSON.stringify(uiSchemaData),
    });
    expect(elem.validate()).toBe(true);
  });

  it("validate() returns false after an invalid value is entered", (done) => {
    const elem = makeForm({
      "form-data": JSON.stringify(emptyFormData),
      "schema-data": JSON.stringify(hyphenSchema),
      "layout-data": JSON.stringify(hyphenUISchema),
    });
    let called = false;
    elem.addEventListener("change", () => {
      const isValid = elem.validate();
      if (called || isValid) return;
      called = true;
      expect(isValid).toBe(false);
      done();
    });
    const input = elem.querySelector("input");
    input.setAttribute("value", 1000); // violates maximum: 100
    input.value = 1000;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  it("errors() is defined on the element", () => {
    const elem = makeForm();
    expect(elem.errors).toBeDefined();
  });

  it("errors() returns an empty array initially", () => {
    const elem = makeForm({
      "form-data": JSON.stringify(formData),
      "schema-data": JSON.stringify(schemaData),
      "layout-data": JSON.stringify(uiSchemaData),
    });
    expect(elem.errors()).toEqual([]);
  });

  it("errors() returns an array of error objects when validation fails", (done) => {
    const elem = makeForm({
      "form-data": JSON.stringify(emptyFormData),
      "schema-data": JSON.stringify(hyphenSchema),
      "layout-data": JSON.stringify(hyphenUISchema),
    });
    let called = false;
    elem.addEventListener("change", () => {
      const errs = elem.errors();
      if (called || !errs.length) return;
      called = true;
      expect(errs.length).toBeGreaterThan(0);
      done();
    });
    const input = elem.querySelector("input");
    input.setAttribute("value", 1000);
    input.value = 1000;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  it("errors() returns a deep copy — mutations do not affect internal state", (done) => {
    const elem = makeForm({
      "form-data": JSON.stringify(emptyFormData),
      "schema-data": JSON.stringify(hyphenSchema),
      "layout-data": JSON.stringify(hyphenUISchema),
    });
    let called = false;
    elem.addEventListener("change", () => {
      const errs = elem.errors();
      if (called || !errs.length) return;
      called = true;
      errs.splice(0, errs.length); // mutate the returned copy
      expect(elem.errors().length).toBeGreaterThan(0); // internal state unchanged
      done();
    });
    const input = elem.querySelector("input");
    input.setAttribute("value", 1000);
    input.value = 1000;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
});

// ─── 7. Events ───────────────────────────────────────────────────────────────

describe("Events", () => {
  afterEach(removeAll);

  it("fires json-form:beforeMount with target that has appendRenderer", (done) => {
    let called = false;
    const listener = (ev) => {
      if (called) return;
      called = true;
      expect(ev.detail[0].target.appendRenderer).toBeDefined();
      document.removeEventListener("json-form:beforeMount", listener);
      done();
    };
    document.addEventListener("json-form:beforeMount", listener);
    makeForm();
  });

  it("fires json-form:mounted with target that has all public API methods", (done) => {
    let called = false;
    const listener = (ev) => {
      if (called) return;
      called = true;
      const target = ev.detail[0].target;
      expect(target.appendRenderer).toBeDefined();
      expect(target.serializeForm).toBeDefined();
      expect(target.validate).toBeDefined();
      expect(target.errors).toBeDefined();
      document.removeEventListener("json-form:mounted", listener);
      done();
    };
    document.addEventListener("json-form:mounted", listener);
    makeForm();
  });

  it("fires update event after Vue renders", (done) => {
    const elem = makeForm({
      "form-data": JSON.stringify(emptyFormData),
      "schema-data": JSON.stringify(schemaData),
      "layout-data": JSON.stringify(uiSchemaData),
    });
    elem.addEventListener("update", () => {
      expect(elem.querySelector("input")).toBeTruthy();
      done();
    }, { once: true });
    elem.setAttribute("form-data", JSON.stringify(formData));
  });

  it("fires change event when user input changes a value", (done) => {
    const elem = makeForm({
      "form-data": JSON.stringify(emptyFormData),
      "schema-data": JSON.stringify(schemaData),
      "layout-data": JSON.stringify(uiSchemaData),
    });
    const valueBefore = elem.serializeForm();
    elem.addEventListener("change", () => {
      const valueAfter = elem.serializeForm();
      if (valueAfter !== valueBefore) {
        expect(valueAfter).not.toEqual(valueBefore);
        done();
      }
    });
    const input = elem.querySelector("input");
    input.setAttribute("value", 7);
    input.value = 7;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  it("fires json-form:beforeUpdate and json-form:updated around re-renders", (done) => {
    const elem = makeForm({
      "form-data": JSON.stringify(emptyFormData),
      "schema-data": JSON.stringify(schemaData),
      "layout-data": JSON.stringify(uiSchemaData),
    });
    let sawBeforeUpdate = false;
    document.addEventListener("json-form:beforeUpdate", () => { sawBeforeUpdate = true; }, { once: true });
    document.addEventListener("json-form:updated", () => {
      expect(sawBeforeUpdate).toBe(true);
      done();
    }, { once: true });
    elem.setAttribute("form-data", JSON.stringify(formData));
  });
});

// ─── 8. Custom renderers ──────────────────────────────────────────────────────
//
// These tests use makeFormForCustomRenderer() — append with no attrs first,
// then call appendRenderer, then set attrs to trigger the first data-bearing render.
// This ensures the custom renderer is registered before JSONForms first renders.

describe("Custom renderers", () => {
  afterEach(removeAll);

  it("appendRenderer() is callable after the element is connected", () => {
    const elem = makeForm();
    expect(() => elem.appendRenderer({ tester: customTester, renderer: customRenderer })).not.toThrow();
  });

  it("custom renderer replaces the default renderer for matched controls", (done) => {
    const elem = makeFormForCustomRenderer();
    elem.appendRenderer({ tester: customTester, renderer: customRenderer });

    let called = false;
    elem.addEventListener("update", () => {
      if (called) return;
      const custom = elem.querySelectorAll("dummy-custom-component");
      if (!custom.length) return;
      called = true;
      expect(custom.length).toBeGreaterThan(0);
      done();
    });

    elem.setAttribute("form-data", JSON.stringify(emptyFormData));
    elem.setAttribute("schema-data", JSON.stringify(schemaData));
    elem.setAttribute("layout-data", JSON.stringify(uiSchemaData));
  });

  it("custom renderer receives data, handleChange, path, and schema arguments", (done) => {
    const elem = makeFormForCustomRenderer();
    let called = false;
    const renderer = (data, handleChange, path, schema) => {
      if (!called) {
        called = true;
        expect(data).toBeDefined();
        expect(handleChange).toBeDefined();
        expect(path).toBeDefined();
        expect(schema).toBeDefined();
        done();
      }
      return { tag: "dummy-custom-component", props: {} };
    };
    elem.appendRenderer({ tester: customTester, renderer });
    elem.setAttribute("form-data", JSON.stringify(emptyFormData));
    elem.setAttribute("schema-data", JSON.stringify(schemaData));
    elem.setAttribute("layout-data", JSON.stringify(uiSchemaData));
  });

  it("custom renderer values are correctly bound and displayed", (done) => {
    const elem = makeFormForCustomRenderer();
    elem.appendRenderer({ tester: customTester, renderer: customRenderer });

    let called = false;
    elem.addEventListener("update", () => {
      if (called) return;
      const custom = elem.querySelectorAll("dummy-custom-component");
      if (!custom.length) return;
      called = true;
      expect(custom[0].value).toEqual(10);
      expect(custom[0].getAttribute("value")).toEqual("10");
      done();
    });

    elem.setAttribute("form-data", JSON.stringify(emptyFormData));
    elem.setAttribute("schema-data", JSON.stringify(schemaData));
    elem.setAttribute("layout-data", JSON.stringify(uiSchemaData));
  });

  it("handleChange from custom renderer updates the serialized form data", (done) => {
    const elem = makeFormForCustomRenderer();
    elem.appendRenderer({ tester: customTester, renderer: customRenderer });

    let initialRenderComplete = false;
    let valueUpdateRenderComplete = false;

    elem.addEventListener("update", () => {
      if (initialRenderComplete) return;
      const custom = elem.querySelectorAll("dummy-custom-component");
      if (!custom.length) return;
      initialRenderComplete = true;
      expect(custom.length).toBeGreaterThan(0);
      const inputToChange = elem.querySelector("dummy-custom-component > input");
      inputToChange.setAttribute("value", 1000);
      inputToChange.dispatchEvent(new Event("change", { bubbles: true }));
    });

    elem.addEventListener("change", () => {
      if (!initialRenderComplete || valueUpdateRenderComplete) return;
      const parsed = JSON.parse(elem.serializeForm());
      if (parsed.a_number === 1000) {
        valueUpdateRenderComplete = true;
        done();
      }
    });

    elem.setAttribute("form-data", JSON.stringify(emptyFormData));
    elem.setAttribute("schema-data", JSON.stringify(schemaData));
    elem.setAttribute("layout-data", JSON.stringify(uiSchemaData));
  });

  it("custom renderer attached via json-form:beforeMount fires and renders", (done) => {
    let called = false;

    function specialRenderer() {
      return { tag: "dummy-custom-component", props: {} };
    }

    const beforeMountListener = (ev) => {
      expect(ev.detail[0].target.appendRenderer).toBeDefined();
      ev.detail[0].target.appendRenderer({ tester: customTester, renderer: specialRenderer });
      document.removeEventListener("json-form:beforeMount", beforeMountListener);
    };
    document.addEventListener("json-form:beforeMount", beforeMountListener);

    const elem = document.createElement("json-form");

    const updatedListener = () => {
      if (called) return;
      const custom = elem.querySelectorAll("dummy-custom-component");
      if (!custom.length) return;
      called = true;
      expect(custom.length).toBeGreaterThan(0);
      elem.remove();
      document.removeEventListener("json-form:updated", updatedListener);
      done();
    };
    elem.addEventListener("json-form:updated", updatedListener);

    document.body.appendChild(elem);
    elem.setAttribute("form-data", JSON.stringify(emptyFormData));
    elem.setAttribute("schema-data", JSON.stringify(schemaData));
    elem.setAttribute("layout-data", JSON.stringify(uiSchemaData));
  });
});

// ─── 9. Readonly mode ─────────────────────────────────────────────────────────

describe("Readonly mode", () => {
  afterEach(removeAll);

  it("disables inputs when readonly attribute is set", () => {
    const elem = makeForm({
      "form-data": JSON.stringify(emptyFormData),
      "schema-data": JSON.stringify(hyphenSchema),
      "layout-data": JSON.stringify(hyphenUISchema),
      "readonly": "true",
    });
    const input = elem.querySelector("input");
    expect(input.hasAttribute("disabled")).toBe(true);
  });

  it("does not disable inputs when readonly is absent", () => {
    const elem = makeForm({
      "form-data": JSON.stringify(emptyFormData),
      "schema-data": JSON.stringify(hyphenSchema),
      "layout-data": JSON.stringify(hyphenUISchema),
    });
    const input = elem.querySelector("input");
    expect(input.hasAttribute("disabled")).toBe(false);
  });
});

// ─── 10. Custom error messages via x-invalid-message ─────────────────────────

describe("x-invalid-message", () => {
  const isoSchema = {
    properties: {
      slip: {
        type: "string",
        pattern: "^P",
        "x-invalid-message": "'%s' is not a valid ISO 8601 duration.",
        default: "PT5M",
      },
    },
  };

  const isoUISchema = {
    type: "VerticalLayout",
    elements: [{ type: "Control", scope: "#/properties/slip" }],
  };

  afterEach(removeAll);

  it("uses x-invalid-message as the error text when validation fails", (done) => {
    const elem = makeForm({
      "form-data": JSON.stringify({ slip: "PT5M" }),
      "schema-data": JSON.stringify(isoSchema),
      "layout-data": JSON.stringify(isoUISchema),
    });

    let called = false;
    elem.addEventListener("change", () => {
      if (called) return;
      const errs = elem.errors();
      if (!errs.length) return;
      called = true;
      expect(errs[0].message).toEqual("'notAnISO' is not a valid ISO 8601 duration.");
      done();
    });

    const input = elem.querySelector("input");
    input.value = "notAnISO";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  it("supports the standard errorMessage keyword (ajv-errors)", (done) => {
    const schema = {
      properties: {
        slip: {
          type: "string",
          pattern: "^P",
          errorMessage: "'%s' is not a valid ISO 8601 duration.",
          default: "PT5M",
        },
      },
    };
    const uiSchema = {
      type: "VerticalLayout",
      elements: [{ type: "Control", scope: "#/properties/slip" }],
    };
    const elem = makeForm({
      "form-data": JSON.stringify({ slip: "PT5M" }),
      "schema-data": JSON.stringify(schema),
      "layout-data": JSON.stringify(uiSchema),
    });

    let called = false;
    elem.addEventListener("change", () => {
      if (called) return;
      const errs = elem.errors();
      if (!errs.length) return;
      called = true;
      expect(errs[0].message).toEqual("'notAnISO' is not a valid ISO 8601 duration.");
      done();
    });

    const input = elem.querySelector("input");
    input.value = "notAnISO";
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  it("falls back to the default AJV message when x-invalid-message is absent", (done) => {
    const elem = makeForm({
      "form-data": JSON.stringify(emptyFormData),
      "schema-data": JSON.stringify(hyphenSchema),
      "layout-data": JSON.stringify(hyphenUISchema),
    });

    let called = false;
    elem.addEventListener("change", () => {
      const errs = elem.errors();
      if (called || !errs.length) return;
      called = true;
      // AJV default message — does not start with a single-quoted value
      expect(errs[0].message).toContain("must be");
      done();
    });

    const input = elem.querySelector("input");
    input.setAttribute("value", 1000);
    input.value = 1000;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
});
