import controller from "./core/controller";
import api from "./api/api";

const App = {
    init () {
        this.api = api();
        this.registerControllers();
        console.log({ app: this });
    },

    /**
     * events are bound to the controller when
     * elements are found within the DOM.
     */
    registerControllers () {
        controller.add({
            name: "work",
            el: "#collection-5ad4ffe41ae6cf4206ae568f"
        });
        controller.watch();
    }
};

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded");
    App.init();
});