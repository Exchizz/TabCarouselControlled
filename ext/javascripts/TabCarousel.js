/*
TabCarousel
===========


A Chrome extension to automatically cycle through tabs.

Licensed under the GPL v2.  Source code is available at https://github.com/benjaminoakes/TabCarousel

@seealso http://code.google.com/chrome/extensions/background_pages.html
@author Benjamin Oakes <hello@benjaminoakes.com>, @benjaminoakes
*/

(function() {
  'use strict';
  if ("WebSocket" in window) {

	function wsconnect(){
               // Let us open a web socket
               var ws = new WebSocket("ws://localhost:1337");

               ws.onopen = function() {
                   console.log("Websocket open..");
               };

               ws.onmessage = function (evt) {
                  var received_msg = evt.data;

                  var obj = JSON.parse(received_msg);
                  if(obj.cmd == "stop"){
                        console.log("Stopping carousel...");
                        carousel.stop();
                  }

                  if(obj.cmd == "start"){
                        console.log("Starting carousel...");
                        carousel.start();
                  }


                 if(obj.cmd == "next"){
                        console.log("Next tab..");

                        chrome.tabs.getAllInWindow(carousel.windowId, function(tabs) {
                                var tab = tabs[(carousel.count + 2) % tabs.length];
                                carousel.count = carousel.count +1;
                                chrome.tabs.update(tab.id, {
                                  selected: true
                                });
                        });
                 }

                 if(obj.cmd == "prev"){
                        console.log("Prev tab..");

                        chrome.tabs.getAllInWindow(carousel.windowId, function(tabs) {
                                var tab = tabs[(carousel.count) % tabs.length];
                                carousel.count = carousel.count - 1;
                                chrome.tabs.update(tab.id, {
                                  selected: true
                                });
                        });
                 }

               };

 		ws.onclose = function(e) {
 		   console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
 		   setTimeout(function() {
 		     wsconnect();
 		   }, 1000);
 	        };
    }
    wsconnect();
} else {

   // The browser doesn't support WebSocket
   alert("WebSocket NOT supported by your Browser!");
};
  var BackgroundController, Carousel, Options, OptionsController, TabCarousel, carousel, localStorage, ns, options, root,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  if (typeof require !== "undefined" && require !== null) {
    localStorage = require('localStorage');
  } else {
    localStorage = window.localStorage;
  }

  TabCarousel = {};

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  root.TabCarousel = TabCarousel;

  ns = TabCarousel;

  Options = (function() {

    function Options() {}

    Options.prototype.firstRun = function(value) {
      if (value) {
        return localStorage.firstRun = value;
      } else {
        return !localStorage.firstRun;
      }
    };

    Options.prototype.flipWait_ms = function(ms) {
      if (ms) {
        return localStorage.flipWait_ms = ms;
      } else {
        return localStorage.flipWait_ms || Options.defaults.flipWait_ms;
      }
    };

    Options.prototype.automaticStart = function(value) {
      if (1 === arguments.length) {
        return localStorage.automaticStart = !!value;
      } else {
        if (localStorage.automaticStart) {
          return JSON.parse(localStorage.automaticStart);
        }
      }
    };

    return Options;

  })();

  Options.defaults = {
    flipWait_ms: 15 * 1000,
    reloadWait_ms: 5 * 60 * 1000
  };

  root.Options = Options;

  options = new Options;

  OptionsController = (function() {

    function OptionsController(form) {
      this.form = form;
      this.form.flipWait_ms.value = options.flipWait_ms();
      this.form.automaticStart.checked = options.automaticStart();
      this.form.onsubmit = this.onsubmit;
    }

    OptionsController.prototype.onsubmit = function() {
      var status;
      status = document.getElementById('status');
      status.innerHTML = '';
      options.flipWait_ms(this.flipWait_ms.value);
      options.automaticStart(this.automaticStart.value);
      setTimeout(function() {
        status.innerHTML = 'Saved';
        return status.style.color = 'green';
      }, 100);
      return false;
    };

    return OptionsController;

  })();

  ns.OptionsController = OptionsController;

  Carousel = (function() {

    function Carousel() {
      this.lastReloads_ms = {};
      this.count = 0;
    }

    Carousel.prototype.reload = function(tabId) {
      var lastReload_ms, now_ms,
        _this = this;
      now_ms = Date.now();
      lastReload_ms = this.lastReloads_ms[tabId];
      if (!lastReload_ms || (now_ms - lastReload_ms >= Options.defaults.reloadWait_ms)) {
        chrome.tabs.get(tabId, function(t) {
          return chrome.tabs.update(tabId, {
            url: t.url
          });
        });
        return this.lastReloads_ms[tabId] = now_ms;
      }
    };

    Carousel.prototype.select = function(windowId, count) {
      var _this = this;
      return chrome.tabs.getAllInWindow(windowId, function(tabs) {
        var nextTab, tab;
        tab = tabs[count % tabs.length];
        nextTab = tabs[(count + 1) % tabs.length];
        chrome.tabs.update(tab.id, {
          selected: true
        });
        return _this.reload(nextTab.id);
      });
    };

    Carousel.prototype.start = function(ms) {
      var continuation, windowId,
        _this = this;
      this.count = 0;
      windowId = void 0;
      if (!ms) ms = options.flipWait_ms();
      chrome.windows.getCurrent(function(w) {
        return windowId = w.id;
      });
      chrome.browserAction.setIcon({
        path: 'images/icon_32_exp_1.75_stop_emblem.png'
      });
      chrome.browserAction.setTitle({
        title: 'Stop Carousel'
      });
      continuation = function() {
        _this.select(windowId, _this.count);
        _this.count += 1;
        return _this.lastTimeout = setTimeout(continuation, ms);
      };
      return continuation();
    };

    Carousel.prototype.running = function() {
      return !!this.lastTimeout;
    };

    Carousel.prototype.stop = function() {
      clearTimeout(this.lastTimeout);
      this.lastTimeout = void 0;
      chrome.browserAction.setIcon({
        path: 'images/icon_32.png'
      });
      return chrome.browserAction.setTitle({
        title: 'Start Carousel'
      });
    };

    return Carousel;

  })();

  carousel = new Carousel;

  BackgroundController = (function() {

    function BackgroundController() {
      this.click = __bind(this.click, this);
    }

    BackgroundController.prototype.tutorialText = "  First-Use Tutorial\n\n  TabCarousel is simple:  open tabs you want to monitor throughout the day, then click the toolbar icon.  To stop, click the icon again.\n\n  By default, TabCarousel will flip through your tabs every " + (String(Options.defaults.flipWait_ms / 1000)) + " s, reloading them every " + (String(Options.defaults.reloadWait_ms / 1000 / 60)) + " min.  It's great on a unused display or TV.  Put Chrome in full-screen mode (F11, or cmd-shift-f on the Mac) and let it go.\n\n  If you want to change how often TabCarousel flips through your tabs, right click on the toolbar icon and choose \"Options\".";

    BackgroundController.prototype.tutorial = function() {
      window.alert(this.tutorialText);
      return options.firstRun(Date.now());
    };

    BackgroundController.prototype.click = function() {
      if (options.firstRun()) this.tutorial();
      if (!carousel.running()) {
        return carousel.start();
      } else {
        return carousel.stop();
      }
    };

    BackgroundController.prototype.load = function() {
      chrome.browserAction.onClicked.addListener(this.click);
      chrome.browserAction.setTitle({
        title: 'Start Carousel'
      });
      if (options.automaticStart()) return carousel.start();
    };

    return BackgroundController;

  })();

  ns.BackgroundController = BackgroundController;

}).call(this);
