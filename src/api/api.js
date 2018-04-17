import controller from "../core/controller";
import collection from "../components/collection";
import Vue from "vue";

const api = () => {
	controller.on("work", () => {
		return new Vue(collection);
	});
};

export default api;