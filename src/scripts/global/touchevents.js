const TouchEvents = function TouchEvents(element, options) {
    this.axis;
    this.checkEvents = [];
    this.eventHandlers = {};
    this.eventModel = {};
    this.events = [
        ['touchstart', 'touchmove', 'touchend', 'touchcancel'],
        ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'],
        ['mousedown', 'mousemove', 'mouseup']
    ];
    this.eventType;
    this.difference = {};
    this.direction;
    this.start = {};

    this.element = element;
    this.options = Object.assign(
        {},
        {
            dragThreshold: 10,
            start: function () {
            }, // eslint-disable-line
            move: function () {
            }, // eslint-disable-line
            end: function () {
            } // eslint-disable-line
        },
        options
    );

    this.checkEvents = this._getCheckEvents();
    this.eventModel = this._getEventModel();

    this._setupEventHandlers();
};

TouchEvents.prototype = Object.assign({}, theme.TouchEvents.prototype, {
    destroy: function () {
        this.element.removeEventListener(
            'dragstart',
            this.eventHandlers.preventDefault
        );

        this.element.removeEventListener(
            this.events[this.eventModel][0],
            this.eventHandlers.touchStart
        );

        if (!this.eventModel) {
            this.element.removeEventListener(
                this.events[2][0],
                this.eventHandlers.touchStart
            );
        }

        this.element.removeEventListener('click', this.eventHandlers.preventClick);
    },

    _setupEventHandlers: function () {
        this.eventHandlers.preventDefault = this._preventDefault.bind(this);
        this.eventHandlers.preventClick = this._preventClick.bind(this);
        this.eventHandlers.touchStart = this._touchStart.bind(this);
        this.eventHandlers.touchMove = this._touchMove.bind(this);
        this.eventHandlers.touchEnd = this._touchEnd.bind(this);

        // Prevent element from dragging when using mouse
        this.element.addEventListener(
            'dragstart',
            this.eventHandlers.preventDefault
        );

        // Bind the touchstart/pointerdown event
        this.element.addEventListener(
            this.events[this.eventModel][0],
            this.eventHandlers.touchStart
        );

        // Bind mousedown if necessary
        if (!this.eventModel) {
            this.element.addEventListener(
                this.events[2][0],
                this.eventHandlers.touchStart
            );
        }

        // No clicking during touch
        this.element.addEventListener('click', this.eventHandlers.preventClick);
    },

    _touchStart: function (event) {
        this.eventType = this.eventModel;

        if (event.type === 'mousedown' && !this.eventModel) {
            this.eventType = 2;
        }

        if (this.checkEvents[this.eventType](event)) return;
        if (this.eventType) this._preventDefault(event);

        document.addEventListener(
            this.events[this.eventType][1],
            this.eventHandlers.touchMove
        );

        document.addEventListener(
            this.events[this.eventType][2],
            this.eventHandlers.touchEnd
        );

        if (this.eventType < 2) {
            document.addEventListener(
                this.events[this.eventType][3],
                this.eventHandlers.touchEnd
            );
        }

        this.start = {
            xPosition: this.eventType ? event.clientX : event.touches[0].clientX,
            yPosition: this.eventType ? event.clientY : event.touches[0].clientY,
            time: new Date().getTime()
        };

        // Ensure we empty out the this.difference object
        Object.keys(this.difference).forEach(
            function (key) {
                delete this.difference[key];
            }.bind(this)
        );

        this.options.start(event);
    },

    _touchMove: function (event) {
        this.difference = this._getDifference(event);

        // Prevent document from scrolling during swipe gesture
        document['on' + this.events[this.eventType][1]] = function (event) {
            this._preventDefault(event);
        }.bind(this);

        // Get the direction user is dragging
        if (!this.axis) {
            if (this.options.dragThreshold < Math.abs(this.difference.xPosition)) {
                this.axis = 'xPosition';
            } else if (
                this.options.dragThreshold < Math.abs(this.difference.yPosition)
            ) {
                this.axis = 'yPosition';
            } else {
                this.axis = false;
            }
        } else if (this.axis === 'xPosition') {
            this.direction = this.difference.xPosition < 0 ? 'left' : 'right';
        } else if (this.axis === 'yPosition') {
            this.direction = this.difference.yPosition < 0 ? 'up' : 'down';
        }

        this.options.move(event, this.direction, this.difference);
    },

    _touchEnd: function (event) {
        document.removeEventListener(
            this.events[this.eventType][1],
            this.eventHandlers.touchMove
        );

        document.removeEventListener(
            this.events[this.eventType][2],
            this.eventHandlers.touchEnd
        );

        if (this.eventType < 2) {
            document.removeEventListener(
                this.events[this.eventType][3],
                this.eventHandlers.touchEnd
            );
        }

        // Re-enable document scrolling
        document['on' + this.events[this.eventType][1]] = function () {
            return true;
        };

        this.options.end(event, this.direction, this.difference);
        this.axis = false;
    },

    _getDifference: function (event) {
        return {
            xPosition:
                (this.eventType ? event.clientX : event.touches[0].clientX) -
                this.start.xPosition,
            yPosition:
                (this.eventType ? event.clientY : event.touches[0].clientY) -
                this.start.yPosition,
            time: new Date().getTime() - this.start.time
        };
    },

    _getCheckEvents: function () {
        return [
            // Touch events
            function (event) {
                // Skip the event if it's a multi-touch or pinch move
                return (
                    (event.touches && event.touches.length > 1) ||
                    (event.scale && event.scale !== 1)
                );
            },
            // Pointer events
            function (event) {
                // Skip it, if:
                // 1. The event is not primary (other pointers during multi-touch),
                // 2. Left mouse button is not pressed,
                // 3. Event is not a touch event
                return (
                    !event.isPrimary ||
                    (event.buttons && event.buttons !== 1) ||
                    (event.pointerType !== 'touch' && event.pointerType !== 'pen')
                );
            },
            // Mouse events
            function (event) {
                // Skip the event if left mouse button is not pressed
                return event.buttons && event.buttons !== 1;
            }
        ];
    },

    _getEventModel: function () {
        return window.navigator.pointerEnabled ? 1 : 0;
    },

    _preventDefault: function (event) {
        event.preventDefault ? event.preventDefault() : (event.returnValue = false);
    },

    _preventClick: function (event) {
        if (Math.abs(this.difference.xPosition) > this.options.dragThreshold) {
            this._preventDefault(event);
        }
    }
});

export default TouchEvents;