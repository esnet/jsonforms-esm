describe( "Component json-form", () => {
    beforeEach(function(){
        var elem = document.createElement("json-form");
        let formData = {"a_number": 5, "another_property": "Some String"};
        let schemaData = { 
            "properties": {
              "a_number": { "type": "number" },
              "another_property": { "type": "string" }
            }
        }
        let uiSchemaData = {
            "type": "VerticalLayout",
            "elements": [{
                "type": "Control",
                "scope": "#/properties/a_number"
            },
            {
                "type": "Control",
                "scope": "#/properties/another_property"
            }]
        }
        elem.setAttribute("form-data", JSON.stringify(formData));
        elem.setAttribute("schema-json", JSON.stringify(formData));
        elem.setAttribute("ui-schema-json", JSON.stringify(formData));
        document.body.appendChild(elem);
    });

    afterEach(function(){
        var forms = document.querySelectorAll("json-form");
        forms.forEach((form)=>{
          form.remove();
        })
    })

    it("should append an element, even with no attributes set", ()=>{
        let elem = document.createElement("json-form");
        document.body.appendChild(elem);
        let isInstance = document.querySelector("json-form") instanceof HTMLElement;
        expect(isInstance).toBeTruthy();
    })

    it( "should append a json-form element with attributes set", async () => {
      let isInstance = document.querySelector("json-form") instanceof HTMLElement;
      expect(isInstance).toBeTruthy();
    } );

    it("should NOT use the shadow DOM", ()=>{
        let input = document.querySelector("input");
        expect(input).toBeTruthy();
        expect(input.value).toBeTruthy();
    })

    it("should accept weird values, logging issues to the console", (done)=>{
        let elem = document.querySelector("json-form");
        elem.setAttribute("form-data", "nonsense");
        elem.addEventListener("update", ()=>{
            let input = document.querySelector("input");
            expect(input.value).toBeFalsy();
            done();
        })
    })
});