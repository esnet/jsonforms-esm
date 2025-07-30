export class DummyCustomComponent extends HTMLElement {

    static observedAttributes = ["value"];

    attributeChangedCallback(name, oldValue, newValue){
        console.log(`Attribute has changed. '${name}' is now: '${newValue}'`);
        this[name] = newValue;
        this.render();
    }

    connectedCallback(){
        this.render();
    }

    render(){
        this.innerHTML = `<input type='text' id='dummy-component' ${ this.value ? "value='" + this.value + "'" : "" }></input>`;
    }
}

customElements.define('dummy-custom-component', DummyCustomComponent);