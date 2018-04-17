import html from "./collection.html";
import axios from "axios";
import PubSub from "../core/pubsub";

const events = new PubSub();

const collection = {
    el: "#workList",
    template: html,
    data () {
        return {
            currentFilter: "All",
            fullUrl: "https://hgor-admin.squarespace.com/work?format=json",
            items: [],
            scrollHeight: 0,
            categories: [],
            disableScroll: false,
            scrollBottom: false,
            pagination: {},
            isLoading: false,
            lifecycle: {
                appLoaded: false
            }
        };
    },
    filters: {

        /**
         * Useful classnames for rendered items.
         * @memberof collectionList
         * @name applyItemClasses
         * @private
         */

        applyItemClasses (item) {
            const slugify = (value) => {
                return value.toString().toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^\w-]+/g, "")
                    .replace(/--+/g, "-")
                    .replace(/^-+/, "")
                    .replace(/-+$/, "");
            };
            const itemClassNames = [];

            if (item.categories && item.categories.length > 0) {
                item.hasCategories = true;
                itemClassNames.push("has-categories");
                itemClassNames.push(item.categories.map((category) => `category-${slugify(category)}`).join(" "));
            }

            if (item.tags && item.tags.length > 0) {
                item.hasTags = true;
                itemClassNames.push("has-tags");
                itemClassNames.push(item.tags.map((tag) => `tag-${slugify(tag)}`).join(" "));
            }

            if (item.colorData) {
                itemClassNames.push("has-image");
            }

            if (itemClassNames.length > 0) {
                itemClassNames.join(" ");
            }

            return itemClassNames;
        },

        /**
         * Formats the image url to the available
         * squarespace resolutions.
         *
         * @param  {Object} width
         * @memberof collectionList
         * @name suggestedColor
         * @returns {String}
         * @private
         */

        suggestedColor (colorData) {
            return {
                backgroundColor: `#${colorData.suggestedBgColor}`
            };
        },
        formatSmall (img) {
            return `${img }?format=300w`;
        }
    },
    computed: {
        isScrolling () {
            let scrolling = false;

            if (this.scrollHeight < this.listTop) {
                scrolling = true;
            }

            return scrolling;
        },
        appLoaded () {
            let className = "";

            if (this.lifecycle.appLoaded) {
                className = "data-loaded";
            }

            return className;
        }
    },
    methods: {
        /**
         * The state of the scroll and items will be
         * stored in the history state for a smoother
         * user experience.
         *
         * @memberof collectionList
         * @name storeListState
         * @private
         */

        storeListState (options) {
            options.scrollRestoration = "auto";
            history.pushState(options, null, location.pathname + location.search);
        },
        bindScrollEvents () {
            window.addEventListener("load", this.executeScrollFunctions);
            window.addEventListener("scroll", this.executeScrollFunctions);
        },
        cleanupScrollEvents () {
            window.removeEventListener("load", this.executeScrollFunctions);
            window.removeEventListener("scroll", this.executeScrollFunctions);
        },

        /**
         * A simple on / off loader. The div has been placed outside the
         * Vue component.
         *
         * @param  {Bool} loaderState
         * @memberof collectionList
         * @name progressLoaderIsActive
         * @private
         */

        progressLoaderIsActive (loaderState) {
            if (loaderState) {
                document.querySelector(".progress-loader").classList.remove("load-complete");
            } else {
                document.querySelector(".progress-loader").classList.add("load-complete");
            }
        },

        /**
         * Tests whether the collection list is at the bottom or not.
         *
         * @memberof collectionList
         * @name executeScrollFunctions
         * @private
         */

        executeScrollFunctions () {
            const grid = this.$el.querySelector(".collection-list");
            const height = window.innerHeight;
            const domRect = grid.getBoundingClientRect();
            const triggerAmount = height - domRect.bottom;
            const body = document.body.getBoundingClientRect();

            this.scrollHeight = body.top;

            //show next page of pagination list
            this.appendItems(triggerAmount);
        },
        scrollTo (scrollY) {
            window.scroll({
                top: scrollY,
                left: 0
            });
        },

        paginate (array) {
            //limit the active items list based on page index to allow for
            //infinite scroll and append
            array = array.splice(0, this.pagination.currentIndex + this.pagination.pageLimit);

            return array;
        },

        /**
         * when the page is scrolled to the bottom of the current items
         * the next set or page of items will be auto appened to the bottom
         *
         * @param  {Number} triggerAmount
         * @memberof collectionList
         * @name appendItems
         * @private
         */

        appendItems (triggerAmount) {
            if (triggerAmount > 0 && !this.scrollBottom && this.pagination) {
                const request = axios.get(this.collectionUrl);

                this.isLoading = true;
                request.then((response) => {
                        console.log(response);
                        if (response.data.pagination && response.data.pagination.nextPage) {
                            this.pagination = response.data.pagination;
                        }

                        this.items = this.items.concat(response.data.items);
                        this.isLoading = false;
                    })
                    .catch((error) => {
                        console.log(error);
                    });

                this.scrollBottom = false;
                this.pagination = false;
            }
        },

        filterByCategory (filter) {
            let url = this.fullUrl;

            this.pagination = false;

            if (filter.filterName !== "All" && filter) {
                url = `${this.fullUrl}&category=${filter.filterName}`;
                console.log({ url });
            }

            const request = axios.get(url);

            request.then((response) => {
                console.log({ navRequest: response });
                this.items = response.data.items;

                if (response.data.pagination) {
                    this.pagination = response.data.pagination;
                    this.scrollBottom = false;
                }
                this.progressLoaderIsActive(false);
            })
            .catch((error) => {
                console.log(error);
            });
        },

        /**
         * A well mannered tale about the history of the browser
         * from page to page that changes categories by the last
         * filter in the state object.
         *
         * @memberof collectionList
         * @name listenToHistoryLesson
         * @private
         */

        listenToHistoryLesson () {
            window.addEventListener("popstate", (e) => {
                if (e.state) {
                    events.emit("filter-set", { filterName: e.state.currentFilter, popstate: true });
                }
            });
        },

        /**
         * Queries the location search for specific parameter.
         *
         * @param  {String} name
         * @memberof collectionList
         * @name getUrlParameter
         * @returns {String}
         * @private
         */

        getUrlParameter (name) {
            name = name.replace(/[[]/, "\\[").replace(/[\]]/, "\\]");

            const regex = new RegExp(`[\\?&]${ name }=([^&#]*)`);
            const results = regex.exec(location.search);

            return results === null ? "" : decodeURIComponent(results[ 1 ].replace(/\+/g, " "));
        },

        /**
         * Looks at the location search params and sets the filter
         * accordingly.
         *
         * @memberof collectionList
         * @name checkUrlForFilter
         * @private
         */

        checkUrlForFilter () {
            const search = this.getUrlParameter("category");

            if (search) {
                this.filterByCategory({ filterName: search });
                events.emit("filter-set", { filterName: search });
            } else {
                events.emit("filter-set", { filterName: "All" });
                this.currentFilter = "All";
                this.storeListState({
                    currentFilter: this.currentFilter
                });
            }
        },

        encodeShareUrl (value) {
            return `${location.pathname}?category=${encodeURIComponent(value)}`;
        },

        setFilter (filter) {
            events.emit("filter-set", { filterName: filter });
        },
        resetFilters () {
            events.emit("filter-set", { filterName: "All" });
        }
    },
    mounted () {
        this.progressLoaderIsActive(true);
        this.checkUrlForFilter();
        this.listenToHistoryLesson();
        events.on("filter-set", (e) => {
            this.currentFilter = e.filterName;
            if (!e.popstate) {
                if (e.filterName === "All") {
                    history.pushState({ currentFilter: "All" }, null, location.pathname);
                } else {
                    history.pushState({ currentFilter: e.filterName }, null, this.encodeShareUrl(e.filterName));
                }
            }
            this.progressLoaderIsActive(true);
            this.items = [];
            setTimeout(() => {
                this.filterByCategory(e);
            }, 600);
        });

        setTimeout(() => {
            this.bindScrollEvents();
            this.progressLoaderIsActive(false);
            this.lifecycle.appLoaded = true;
        }, 1200);

        const request = axios.get(this.fullUrl);

        request.then((response) => {
                console.log({ firstRequest: response });
                this.categories = response.data.collection.categories;
                this.items = response.data.items;
                this.pagination = response.data.pagination;
            })
            .catch((error) => {
                console.log(error);
            });

    }
};

export default collection;