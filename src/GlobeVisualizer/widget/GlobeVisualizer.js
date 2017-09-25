/*global logger*/
/*
    GlobeVisualizer
    ========================

    @file      : GlobeVisualizer.js
    @version   : 1.0.0
    @author    : Gerhard Richard Edens
    @date      : Thu, 07 Sep 2017 13:31:31 GMT
    @copyright : TimeSeries
    @license   : Apache 2

    Documentation
    ========================
    Describe your widget here.
*/

// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",

    "mxui/dom",
    "dojo/dom",
    "dojo/dom-prop",
    "dojo/dom-geometry",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/text",
    "dojo/html",
    "dojo/_base/event",

    "dojo/text!GlobeVisualizer/widget/template/GlobeVisualizer.html"
], function (declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, dojoProp, dojoGeometry, dojoClass, dojoStyle, dojoConstruct, dojoArray, lang, dojoText, dojoHtml, dojoEvent, widgetTemplate) {
    "use strict";

    /**
     * @author Gerhard Richard Edens
     * @company TimeSeries
     */
        
    // Declare widget's prototype.
    return declare("GlobeVisualizer.widget.GlobeVisualizer", [ _WidgetBase, _TemplatedMixin ], {
        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,

        // DOM elements
        inputNodes: null,
        colorSelectNode: null,
        colorInputNode: null,
        infoTextNode: null,
        
        rendered: false,

        // Parameters configured in the Modeler.
        mfToExecute: "",
        messageString: "",
        backgroundColor: "",

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _handles: null,
        _contextObj: null,
        _alertDiv: null,
        _readOnly: false,

        // dojo.declare.constructor is called to construct the widget instance. Implement to initialize non-primitive properties.
        constructor: function () {
            logger.debug(this.id + ".constructor");
            this._handles = [];
        },

        // dijit._WidgetBase.postCreate is called after constructing the widget. Implement to do extra setup work.
        postCreate: function () {
            logger.debug(this.id + ".postCreate");
            this._updateRendering();
        },

        // mxui.widget._WidgetBase.update is called when context is changed or initialized. Implement to re-render and / or fetch data.
        update: function (obj, callback) {
            logger.debug(this.id + ".update");
            this._updateRendering(callback); // We're passing the callback to updateRendering to be called after DOM-manipulation
        },

        // mxui.widget._WidgetBase.enable is called when the widget should enable editing. Implement to enable editing if widget is input widget.
        enable: function () {
          logger.debug(this.id + ".enable");
        },

        // mxui.widget._WidgetBase.enable is called when the widget should disable editing. Implement to disable editing if widget is input widget.
        disable: function () {
          logger.debug(this.id + ".disable");
        },

        // mxui.widget._WidgetBase.resize is called when the page's layout is recalculated. Implement to do sizing calculations. Prefer using CSS instead.
        resize: function (box) {
          logger.debug(this.id + ".resize");
        },

        // mxui.widget._WidgetBase.uninitialize is called when the widget is destroyed. Implement to do special tear-down work.
        uninitialize: function () {
          logger.debug(this.id + ".uninitialize");
            // Clean up listeners, helper objects, etc. There is no need to remove listeners added with this.connect / this.subscribe / this.own.
        },

        _execMf: function (mf, guid, cb) {
            logger.debug(this.id + "._execMf");
            if (mf && guid) {
                mx.ui.action(mf, {
                    params: {
                        applyto: "selection",
                        guids: [guid]
                    },
                    callback: lang.hitch(this, function (objs) {
                        if (cb && typeof cb === "function") {
                            cb(objs);
                        }
                    }),
                    error: function (error) {
                        console.debug(error.description);
                    }
                }, this);
            }
        },

        // Rerender the interface.
        _updateRendering: function (callback) {
            logger.debug(this.id + "._updateRendering");
           
            if (this.rendered === false) {
                this.rendered = true;
                
                // Detector..
                if (Detector.webgl) {
                
                    var scene = new THREE.Scene();
                    var camera = new THREE.PerspectiveCamera( 75, (window.innerWidth - 20) / window.innerHeight, 0.1, 50 );
                    camera.position.z = 30;

                    var renderer = new THREE.WebGLRenderer( { antialias: true } );
                    renderer.setPixelRatio( window.devicePixelRatio );
                    renderer.setSize( (window.innerWidth - 20), window.innerHeight );
                    renderer.setClearColor( 0xFFFFFF, 1 );
                    this.containerToRender.appendChild( renderer.domElement );

                    var orbit = new THREE.OrbitControls( camera, renderer.domElement );
                    orbit.enableZoom = false;

                    var lights = [];
                    lights[ 0 ] = new THREE.PointLight( 0xffffff, 1, 0 );
                    lights[ 1 ] = new THREE.PointLight( 0xffffff, 1, 0 );
                    lights[ 2 ] = new THREE.PointLight( 0xffffff, 1, 0 );

                    lights[ 0 ].position.set( 0, 200, 0 );
                    lights[ 1 ].position.set( 100, 200, 100 );
                    lights[ 2 ].position.set( - 100, - 200, - 100 );

                    scene.add( lights[ 0 ] );
                    scene.add( lights[ 1 ] );
                    scene.add( lights[ 2 ] );

                    // instantiate a loader
                    var loader = new THREE.TextureLoader();

                    var sphere = null;

                    var self = this;

                    // load a resource
                    loader.load(
                        // resource URL
                        'textures/world.jpg',
                        // Function when resource is loaded
                        function ( texture ) {
                            // do something with the texture
                            var material = new THREE.MeshBasicMaterial( {
                                map: texture
                             } );
                            var geometry = new THREE.SphereGeometry( 15, 43, 43 );
                            var sphere = new THREE.Mesh( geometry, material );
                            scene.add( sphere );

                            function animate() {
                                requestAnimationFrame( animate );

                                sphere.rotation.x += 0.003;
                                sphere.rotation.y += 0.003;

                                renderer.render( scene, camera );
                            }
                            animate();

                            // Remove not visible
                            dojoClass.remove(self.containerToRender, 'globevisualizer-hidden');
                        },
                        // Function called when download progresses
                        function ( xhr ) {
                            console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
                        },
                        // Function called when download errors
                        function ( xhr ) {
                            console.log( 'An error happened' );
                        }
                    );


                    // Resize.
                    window.addEventListener( 'resize', function () {

                        camera.aspect = (window.innerWidth - 20) / window.innerHeight;
                        camera.updateProjectionMatrix();

                        renderer.setSize( (window.innerWidth - 20), window.innerHeight );

                    }, false );
                    
                
                }
            }
            
            // The callback, coming from update, needs to be executed, to let the page know it finished rendering
            this._executeCallback(callback, "_updateRendering");
        },

        _executeCallback: function (cb, from) {
            logger.debug(this.id + "._executeCallback" + (from ? " from " + from : ""));
            if (cb && typeof cb === "function") {
                cb();
            }
        }
    });
});

require(["GlobeVisualizer/widget/GlobeVisualizer"]);
