import PubSub from "./pubsub";

const events = new PubSub();

class Controller {
    constructor () {
        this.topics = {};
        this.on = events.on;
        this.emit = events.emit;
        this.events = [];
        this.add = this.add;
    }

    add (config) {
        this.events.push(config);
    }

    /**
     * Tests whether the node is active in the DOM
     * @param  {String} query query selector
     * @returns {Object}       DOM Node
     */

    elementIsActive (query) {
        const el = document.querySelector(query);

        if (!el) {
            return false;
        }
        return el;
    }

    watch () {
        this.events.forEach((event) => {
            const el = this.elementIsActive(event.el);

            this.emit(event.name, el);
        });
    }
}

const instance = new Controller();

export default instance;