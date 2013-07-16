/*global
  bagBar_jsonData: false,
  BagBarValidatorOpts: false,
  allTooltips: false,
  aeoModals: false,
  bagBarTips: false,
  showQuickView: false,
  mboxDefine: false,
  mboxUpdate: false,
  currencyCode: false
*/
//     BagBarEvented.js 0.2.0
//     (c) 2011 Sam Tsai, American Eagle Outfitters Inc.
// Setup Variables
// ---------------
// Improvements
// - use _.templates vs html (which is faster?)
// - abstract api (silent hero?)
// - separate bag bar specific code with document actions
// - use CSS transitions?
//
asap("framework").then(function() {
  // Look for the bag bar element on the page
  var bagBar = $("#bagBar");

  var html = $("html"),
  myBagLink = $(".tl_myBag"),
  doc = $(document),
  reviewOrderCheckoutLink = $("#reviewOrder_checkoutLink"),
  bagBarItemSummary = $("#bagBarItemSummary"),
  bagBarData,
  discountData,
  emptyBagMessage = "<tr><td colspan='3' class='emptyBagMessage'>Time to get shopping! Your bag is empty!</td></tr>",
  bagBarValidator = new Validator(new BagBarValidatorOpts()),
  itemHelpers = {
    "qtyCheck": function( qty ) {
      if (qty > 1) {
        return "showQuantity";
      }
      return "";
    },
    "stripAlphas": function( val ) {
      return val.replace(/[a-zA-Z]/g, "");
    },
    "toSizeLabel": function( sizeName1, sizeName2 ) {
      var divider = "";
      if (sizeName2 != null && sizeName2.length > 0) {
        if (!isNaN(sizeName1) && !isNaN(sizeName2)) {
          divider = " x ";
        }
        else {
          divider = " ";
        }
      }
      return sizeName1 + divider + sizeName2;
    },
    "check_flag": function( flag_obj, comId ) {
      if (!!flag_obj && comId && !!flag_obj.action) {
        removeResolve(comId, flag_obj.action, true);
      }
      return "";
    }
  },
  bagBarHeights = {
    "closed": "30px",
    "condensed": "126px",
    "expanded": "100%"
  },
  cartPage = bagBar.hasClass("cart"),
  storageElement = null,
  touch_device_and_legacy_browser = Modernizr.touch,
  mbox_loaded = true; // when this is ready, default to false

  // #### Functions
  function omnitureTag( state ) {
    asap("one_tag").then(function() {
      if (typeof state === 'undefined') state = "";

      var stateNormalized = one_tag.normalize(state);
      utag.track("link", {
        linkType: "interaction",
        linkText: stateNormalized,
        bagState: stateNormalized
      });
    });
  }

  // stores the bag state to the sessionStorage or IE's proprietary #userData
  function setBagState( state ) {
    if (state == null) { state = "closed"; }

    bagBar.data("currentState", state);
    if (Modernizr.sessionstorage) {
      // window.localStorage is available!
      try {
        sessionStorage.setItem("bagState", state);
      } catch (e) {}
    } else {
      try {
        if(storageElement != null) {
          storageElement.setAttribute("bagState", state);
          storageElement.save("bagXML");
        }
      } catch (e) {}
    }
  }

  // grabs the bag state from the sessionStorage or IE's proprietary #userData
  function getBagState() {
    if (Modernizr.sessionstorage) {
      // window.sessionStorage is available!
      return sessionStorage.getItem("bagState");
    } else {
      storageElement = document.createElement("link");
      try {
        if (storageElement.addBehavior) {
          storageElement.style.behavior = "url(#default#userData)";
          document.getElementsByTagName("head")[0].appendChild(storageElement);
          storageElement.load("bagXML");
          return storageElement.getAttribute("bagState");
        }
      } catch (e) { return null; }
    }
  }

  function checkCarousel() {
    var bagItemSet = $(".bagItemSet"),
    bagItemClip = $(".bagItemClip"),
    bagItemsArea = $("#bagItemsArea");

    if (bagItemClip.width() < bagItemSet.outerWidth()) {
      bagItemsArea.addClass("needsCarousel");
    }
    else {
      bagItemSet.css("right", "0");
      bagItemsArea.removeClass("needsCarousel");
    }
  }

  function drawBagBarItemSummary() {
    var bagSelector = "bagBarItemSummary",
      bagItemSet = bagBar.find(".bagItemSet");

    if (bagBarData.bagItems != null && bagBarData.bagItems.length > 0) {
      bagItemSet.empty().append($.tmpl("bagItem", bagBarData.bagItems, itemHelpers));
    } else {
      bagItemSet.empty();
    }

    bagBar.triggerHandler(bagSelector + "DrawComplete");
  }

  function drawBagHeader() {
    var bagSelector = "bagHeader",
      orderTotal = 0;

    if (bagBarData.orderSummary.bagCount > 0) {
      orderTotal = bagBarData.orderSummary.orderTotal;
    }
    bagBar.find(".fsThreshold").html(bagBarData.bagBarMessaging.freeShipping.htmlFragment);
    bagBar.find(".bagCount").html(bagBarData.orderSummary.bagCount);
    bagBar.find(".bagOrderTotal").html($.toPrice(orderTotal));
    doc.triggerHandler("updateHeaderBagCount", bagBarData.orderSummary.bagCount);

    bagBar.triggerHandler(bagSelector + "DrawComplete");
  }

  function drawReviewBagItems() {
    var bagSelector = "reviewBagItems",
      reviewBagItems = $("#" + bagSelector),
      bagReviewHeaders = $("<tr>" +
        "<th colspan='2' class='bagItemColItems'>Items</th>" +
        "<th class='bagItemColColor'>Color</th>" +
        "<th class='bagItemColSize'>Size</th>" +
        "<th class='bagItemColQuantity'>Qty</th>" +
        "<th class='bagItemColPrice'>Price</th>" +
        "<th class='bagItemColActions'>Actions</th>" +
      "</tr>");

    if (bagBarData.orderSummary.itemTotalDiscountAmount != '$0.00' || !!bagBarData.orderSummary.discounted) {
      bagReviewHeaders.find(".bagItemColPrice").after("<th class='bagItemColDiscountPrice'>Discounted Price</th>");
    }

    if (bagBarData.bagItems != null && bagBarData.bagItems.length > 0) {
      reviewBagItems.empty().append(bagReviewHeaders).append($.tmpl("reviewBagItems", bagBarData.bagItems, itemHelpers));
    }
    else {
      reviewBagItems.empty().append(emptyBagMessage);
    }

    if (bagBarData.orderSummary.bagCount !== 0) {
      //ShopRunner
      bagBar.find(".srWrapper").html(bagBarData.bagBarMessaging.shopRunner.htmlFragment);
    }

    bagBar.triggerHandler(bagSelector + "DrawComplete");
  }

  function drawBagOrderSummaryBody() {
    var bagSelector = "orderSummaryTable";

    $("#bagBarOrderSummary").find(".orderSummaryTable").empty().replaceWith(bagBarData.orderSummary.htmlFragment);

    bagBar.triggerHandler(bagSelector + "DrawComplete");
  }

  function drawReviewOrderSummaryBody() {
    var bagSelector = "orderSummaryTable";

    $("#reviewOrderSummary").find(".orderSummaryTable").empty().replaceWith(bagBarData.reviewOrderSummary.htmlFragment);
    $("#reviewOrderXsells").empty().html(bagBarData.crossSells.htmlFragment);

    bagBar.triggerHandler(bagSelector + "DrawComplete");
  }

  function drawDiscountCodesArea() {
    var bagSelector = "discountCodes";

    bagBar.find("." + bagSelector).empty().append(discountData);

    bagBar.triggerHandler(bagSelector + "DrawComplete");
  }

  function drawDiscountModal() {
    var bagSelector = "modalContent";

    $("#discountModal").find("." + bagSelector).empty().append(discountData);

    bagBar.triggerHandler("DiscountModalDrawComplete");
  }

  function drawCartBanner() {
    var bagSelector = ".promoArea",
      promoArea = $(bagSelector);

    if (promoArea.html().length === 0) {
      promoArea.html(bagBarData.cartBanner.htmlFragment);
    }
  }

  // Tagging
  // TODO: see if this can call can be used sparingly or only when needed, and also if the omnitureData can be lazy loaded
  function cartTag() {
    asap("omniture").then(function() {
    var s = s_gi(utag_data.report_suite),
    addEvent = "scAdd,event7,event9",
    removeEvent = "scRemove,event8,event10",
    addedItems = false,
    removedItems = false;

    s.events = "scView";
    s.products = "";

    if (bagBarData.omnitureData != null) {

      if ("addedProducts" in bagBarData.omnitureData) {
        addedItems = true;
        $.each(bagBarData.omnitureData.addedProducts, function( key, val ) {
          s.products += ";" + val[0] + ";;;event7=" + val[2] + "|event9=" + $.forceFloat(val[1]).toFixed(2).toString();
        });
      }
      if ("removedProducts" in bagBarData.omnitureData) {
        removedItems = true;
        $.each(bagBarData.omnitureData.removedProducts, function( key, val ) {
          s.products += ";" + val[0] + ";;;event8=" + val[2] + "|event10=" + $.forceFloat(val[1]).toFixed(2).toString();
        });
      }

      if (addedItems && removedItems) {
        s.events = addEvent + "," + removeEvent;
      }
      else if (addedItems){
        s.events = addEvent;
      }
      else if (removedItems) {
        s.events = removeEvent;
      }
      else {
        s.events = "scView";
      }

      $.extend(s, bagBarData.omnitureData);
      s.t();
    }
    });
  }

  // Modals
  function discountModal(){
    (new Modal({
      id: 'discountModal',
      useAjax: true,
      ajaxData: {
        page: 'bagBar',
        modal: true
      },
      url: '/' + jsContextRoot + '/bagBar/discountModal.jsp',
      width: 390,
      closeSelector: '#discountModalOverlay'
    })).open();
  }

  function sendCartLink( source ){
    try {
      asap("omniture").then(function() {
        var linkType = "checkoutLink";
        var linkText = "checkout_link";

        if (typeof source !== 'undefined' && source == 'confirmation') linkType = "confirmationCheckoutLink";

        utag.track("link", {
          linkType: linkType,
          link_text: linkText
        });
      });
    } catch (e) {

    }
  }

  function checkMarkers( data ) {
    var marker, idType, prodData = {};

    if (null != data && null != data.orderInfo) {
      if (null != data.orderInfo.marker) {
        marker = data.orderInfo.marker;
        if ("atg.gwp" === marker.key) {
          // If shipTo country is set to international, do not bother with checking the rest of this code
          if (sessionShipCountry == 'US' || sessionShipCountry == 'CA' || sessionShipCountry == 'APOFPO') {
            // marker.data - class_style
            // marker.giftType - commerce item type (ie:product)
            // marker.giftDetail - commerce item id
            idType = (marker.giftType.indexOf("cat") >= 0) ? "bundleCatId" : "productId";
            prodData[idType] = marker.giftDetail;
            prodData["gwp"] = true;

            var modal_instance = $(".modal");
            // if Quick View is either non-existent or closed then show a new Quick View
            if ((modal_instance.length <= 0 || !modal_instance.get(0).modalRef.isOpen())) {
              // Close out of View Larger before opening quick view
              showQuickView(prodData, jsContextRoot, true);
            }
          }
        }
      }
    }
  }

  function removeResolve(comId, action, passthrough) {
    $.getJSON("/" + jsContextRoot + "/bagBar/get_bagBar_results.jsp", {"comId": comId, "action": action, "passthrough": passthrough}, function(response) {
      if (!!response && !passthrough) {
        if (cartPage) {
          cartTag();
          doc.triggerHandler("redrawReviewOrder", response);
        }
        else {
          doc.triggerHandler("redrawBag", response);
        }
      }
    });
  }

  // TODO: leverage silent_hero or abstract mbox from the bag bar
  function load_mbox() {
    asap("mbox").then(function() {
      try {
        if (currencyCode == 'USD') {
          var mbox_name = jsContextRoot + "_recs_shoppingBag_bottom",
            mbox_path = "path="+window.location.pathname;

          // Load in mbox after the page has loaded
          // Define and update only after the bag is expanded
          mboxDefine("bag_cross_sells", mbox_name, mbox_path);
          mboxUpdate(mbox_name, mbox_path);

          // Update markup to reflect a price
          var priceSpans = bagBar.find(".crossSellInfo .js_toPrice");
          priceSpans.each(function(i, val) {
            var price = $(val).text();
            $(val).html($.toPrice(price, {useSpans: true}));
          });
        }

        // Switch the mbox_loaded flag to true so we don't continue to run this
        mbox_loaded = true;
      } catch (e) {

      }
    });
  }

  bagBar.on("expandBag", function( evt ) {
    if (!mbox_loaded) {
      load_mbox();
    }
  });

  // What will the "My Bag" link in the top nav do?
  if (!touch_device_and_legacy_browser) {
    myBagLink.on("click", function( evt ) {
      evt.preventDefault();
      if (!bagBar.data("drawing") && bagBar.length > 0 && !html.hasClass("checkoutPage")) {
        if (bagBar.data("currentState") == "closed") {
          bagBar.triggerHandler("condenseBag", { callingRef: $(this) });
          omnitureTag('Bag expanded from top');
        }
        else if (bagBarData.orderSummary.bagCount > 0) {
          bagBar.triggerHandler("expandBag", { callingRef: $(this) });
          omnitureTag('Review Order/Fully Expanded');
        }
      }
    });
  }

  // This is a global event that can be used to update the bag count in the top nav header
  doc.on("updateHeaderBagCount", function( evt, data ) {
    try {
      myBagLink.find(".count").html(data);
    }
    catch (e){

    }
  });

  doc.on("itemAddedToBag", function( evt, data ) {
    var powerUpBar = bagBar.find(".addToBagPowerUp"),
    confirmation_bar = $(".add_to_bag_confirmation"),
    editing = (data.editing == null) ? false : data.editing,
    bagState = bagBar.data("currentState"),
    itemAction = ((editing) ? "itemEditedInBag" : "itemAddedToBag"),
    qty = data.orderSummary.lastQuantityAdded || data.lastQuantityAdded || "Updated",
    add_to_bag_data,
    free_shipping_text,
    shipping_message,
    power_up_text,
    favorites_app = window.location.pathname.split('/')[1] == 'favorites';

    clearTimeout(window.bagNotificationTimeout);

    // Update Bag Bar Data
    if (null != data) {
      bagBarData = data;
    }

    cartTag();

    if (cartPage) {
      doc.triggerHandler("redrawReviewOrder", data);
    }
    else {
      $.extend(data, { "item_added_redraw": true });

      doc.triggerHandler("redrawBag", data);
    }

    // Show confirmation message
    // Except when in edited mode, in this case, show "Updated" text on bag bar
    // Completely exclude this message if viewing Quick View over top
    // of expanded bag view or if this is a GWP
    if ((bagState != "expanded" && (qty != null || editing)) && !data.isGWP) {
      // Two routes for add to bag animations
      // If in the favorites app or in quick view editing/updating mode
      // Show the classic bag open/close animation with the power up bar
      // notification with either quantity or text "Updated"
      // Otherwise, normal flow is the new confirmation message
      // that will appear and reflect the shipping message from the bag bar
      // and provide a button for checkout
      if (!!favorites_app || !!editing) {
        if (bagState == "closed") {
          bagBar.triggerHandler("condenseBag");
        }

        power_up_text = editing ? "Updated" : "+" + qty;
        powerUpBar.find(".powerUpLevel").html(power_up_text);

        if (!bagBar.hasClass(itemAction)) {
          bagBar.addClass(itemAction);
        }

        window.bagNotificationTimeout = setTimeout((function( bagState, itemAction, isGWP, isQuickView ) {
          return function() {
            bagBar.removeClass(itemAction);
            if (bagState == "closed") {
              allTooltips.close();
              bagBar.triggerHandler("closeBag");
            }

            // Check the order for markers
            // (eg GWP markers, but not when it's currently a GWP)
            if (!isGWP && !isQuickView) {
              checkMarkers(data);
            }
          };
        })(bagState, itemAction, data.isGWP, data.isQuickView), 3000);
      } else {
        free_shipping_text = data.bagBarMessaging.freeShipping.htmlFragment;

        add_to_bag_data = {
          "quantity" : qty,
          "shipping_message" : free_shipping_text,
          "logged_in" : (loggedIn) ? loggedIn : false
        };

        confirmation_bar.html(addToBagConfirmationTemplate(add_to_bag_data));

        window.bagNotificationTimeout = setTimeout((function( bagState, itemAction, isGWP, isQuickView ) {
          return function() {
            // Check the order for markers
            // (eg GWP markers, but not when it's currently a GWP)
            if (!isGWP && !isQuickView) {
              checkMarkers(data);
            }
          };
        })(bagState, itemAction, data.isGWP, data.isQuickView), 1000);
      }
    }
  });

  var addToBagConfirmationTemplate = _.template(
    "<span class='confirmation_message'>" +
      "<span class='bag_icon is_icon_font'>&#x2752;</span>" +
      "<span class='quantity_added'>+ {{quantity}} Item{( if (quantity > 1) { )}s{( } )} Added to Bag</span>" +
      "<a href='" + securePrepend + jsContextRoot + "/checkout/checkout.jsp' class='strong_bttn checkoutLink confirmation_checkout_link " +
      "{( if (!logged_in) { )}js_checkoutLink{( } )}" +
      "' title='Begin Checkout'>&#9656; Checkout</a></span>" +
      "{( if (shipping_message.length > 0) { )}<span class='shipping_message'>{[shipping_message]}</span>{( } )}" +
    "</span>"
    );

  doc.on("redrawReviewOrder", function( evt, data ) {
    bagBarData = data;
    drawReviewBagItems();
    drawReviewOrderSummaryBody();

    // update bag count
    doc.triggerHandler("updateHeaderBagCount", bagBarData.orderSummary.bagCount);

    doc.triggerHandler("redrawReviewOrderComplete");
  });

  doc.on("redrawDiscountModal", function( evt, data ) {
    discountData = data.discountCodes.htmlFragment;

    drawDiscountModal();

    doc.triggerHandler("redrawDiscountModalComplete");
  });

  doc.on("removeResolveBag", function( evt, data ) {
    removeResolve(data.comId, data.action, data.passthrough);
  });

  // Window or Global Functions
  // Returns a copy of the bag bar json data
  window.getBagBarData = function() {
    return bagBarData;
  };

  // Window or Global Functions
  // Give access to only update marker data
  window.updateMarkerData = function( data ) {
    if (null != data) {
      bagBarData.orderInfo = data;
    }
  };

  window.checkOrderMarkers = function( data ) {
    checkMarkers(data);
  };

  // Do not load in this code if there is no bag bar to interact with
  if (bagBar.length > 0) {
    // Navigation
    bagBar.lazyData("headerBar", function() {
      return $(this).find(".headerBar");
    }).lazyData("bagPanel", function() {
      return $(this).find(".bagPanel");
    });

    // Begin Non-Cart Page Relevant Code
    if (!cartPage) {
      bagBar.on("condenseBag", function( evt, data ) {
        if (bagBar.data("currentState") != "condensed" && !bagBar.data("drawing")) {
          bagBar.data("drawing", true);
          bagBar.find(".wrapper").removeClass("scrollOn");
          bagBar.animate({"height": bagBarHeights.condensed}, 600, function() {
            bagBar.removeClass("closed expanded").addClass("condensed");
            html.removeClass("scrollOff");
            setBagState("condensed");
          });
          bagBar.data("drawing", false);
        }
      });

      bagBar.on("expandBag", function( evt, data ) {
        if (bagBar.data("currentState") != "expanded" && !bagBar.data("drawing")) {
          bagBar.data("drawing", true);
          bagBar.animate({"height": bagBarHeights.expanded}, 600, function() {
            bagBar.find(".wrapper").addClass("scrollOn");
            bagBar.removeClass("closed condensed").addClass("expanded");
            html.addClass("scrollOff");
            setBagState("expanded");
            cartTag();
          });

          if (bagBarData.errors.errorList.length > 0) {
            bagBarValidator.report(bagBarData.errors);
          }
          bagBar.data("drawing", false);
        }
      });

      bagBar.on("closeBag", function( evt, data ) {
        if (bagBar.data("currentState") != "closed" && !bagBar.data("drawing")) {
          bagBar.data("drawing", true);
          bagBar.find(".wrapper").removeClass("scrollOn");
          bagBar.animate({"height": bagBarHeights.closed}, 600, function() {
            bagBar.removeClass("condensed expanded").addClass("closed");
            html.removeClass("scrollOff");
            setBagState("closed");
          });
          bagBar.data("drawing", false);
        }
      });

      bagBar.on("click", ".continueShoppingLink", function( evt ) {
        evt.preventDefault();
        if (!bagBar.data("drawing")) {
          if (bagBar.data("currentState") == "closed") {
            bagBar.triggerHandler("condenseBag", { callingRef: $(this) });
            omnitureTag('Bag expanded from bottom');
          }
           else if (bagBar.data("currentState") == "expanded") {
            bagBar.triggerHandler("condenseBag", { callingRef: $(this) });
            omnitureTag('Bag contracted from top');
          }
          else {
            bagBar.triggerHandler("closeBag", { callingRef: $(this) });
            omnitureTag('Bag contracted from bottom');
          }
        }
      });

      bagBar.on("click", ".reviewOrderLink", function( evt ) {
        evt.preventDefault();
        bagBar.triggerHandler("expandBag", { callingRef: $(this) });
        omnitureTag('Review Order/Fully Expanded');
      });

      bagBar.lazyData("headerBar").on("click", function( evt ) {
        evt.preventDefault();

        if (!bagBar.data("drawing") && !doc.data("drawing")) {
          if (bagBar.data("currentState") == "condensed") {
            bagBar.triggerHandler("closeBag", { callingRef: $(this) });
            omnitureTag('Bag contracted from bottom');
          }
          else if (bagBar.data("currentState") == "expanded") {
            bagBar.triggerHandler("condenseBag", { callingRef: $(this) });
            omnitureTag('Bag contracted from top');
          }
          else {
            bagBar.triggerHandler("condenseBag", { callingRef: $(this) });
            omnitureTag('Bag expanded from bottom');
          }
        }
      });

      bagBar.find(".internationalModalLink").on("click", function( evt ) {
        evt.preventDefault();
        evt.stopPropagation();

        (new Modal({
          id: 'InternationalSplashModal',
          useAjax: true,
          url: '/' + jsContextRoot + '/modals/international.jsp',
          ajaxData: {
            name: "InternationalSplash",
            openerPage: location.href
          },
          height: 515,
          width: 977,
          closeSelector: '#checkoutModalCloseLink, #international_splash_cancel'
        })).open();
      });

      bagBar.on("click", function( evt ) {
        if (evt.target != null && evt.target.id == "bagBar" && evt.target.className.indexOf("expanded") > -1 && !bagBar.data("drawing")) {
          bagBar.triggerHandler("condenseBag", { callingRef: $(this) });
        }
      });

      $(window).resize(_.debounce(checkCarousel, 300));

      var bagItemAdjust = 80;
      bagBarItemSummary.on("click", ".prevItem, .nextItem", function( evt ) {
        // TODO: optimization/performance, perform outerWidth with element off the dom
        var bagItemAction = $(this),
          bicWidth = $(".bagItemClip").width(),
          bisWidth = $(".bagItemSet").outerWidth(),
          currentRight = parseInt($(".bagItemSet").css("right"), 10),
          newRight = currentRight;

        if ($(this).hasClass("prevItem") && ((bisWidth + currentRight) > bicWidth)) {
          newRight = currentRight - bagItemAdjust;
        }
        else if ($(this).hasClass("nextItem") && currentRight < 0) {
          newRight = currentRight + bagItemAdjust;
        }

        $(".bagItemSet").css("right", (newRight > 0) ? 0 : newRight);
      });

      bagBar.lazyData("bagPanel").on("click", ".jsFreeShippingModalLink", function( evt ) {
        evt.preventDefault();
        evt.stopPropagation();
        var jsBagBarMsgLink = $(".jsFreeShippingModalLink");
        try {
          if (!!jsBagBarMsgLink.attr("country")){
            // New International Shipping Msg and Modal based on shipToCountry and currency
            var intlCountry = jsBagBarMsgLink.attr("country"), intnlCurrency = jsBagBarMsgLink.attr("currency");
            (new Modal({
              id: 'intnlShippingModal',
              useAjax: true,
              ajaxData: {
                page: 'intnlShippingModal',
                modal: true
              },
              url: '/' + jsContextRoot + '/modals/international_shipping.jsp?country='+intlCountry+'&currency='+intnlCurrency,
              closeSelector: '#intnlShippingModalOverlay'
            })).open();
          }
          else {
            asap("webset_modals").then(function() {
              aeoModals["shipping"]["fs100"].open();
            });
          }
        } catch (e) {}

      });
    }
    // End Non-Cart Page Code

    // BAG DRAWING
    // Let's create the initial state of the bag bar
    bagBar.on("initBag", function( evt, bagData ) {
      var bagState,
        emptyBag = !!!bagData.orderSummary.bagCount;
        // please excuse the third !, but I want to cast to boolean and if bagCount is 0 (false) then I want emptyBag to be true (ie third !)

      // set review order data as stale
      //bagBar.data("reviewOrderState", "stale");

      if (bagData != null) {
        bagBarData = bagData;
        discountData = bagData.discountCodes.htmlFragment;

        if (cartPage) {
          cartTag();

          if (!mbox_loaded) {
            load_mbox();
          }
        }
        else {
          // get the current bag state
          bagState = getBagState();
          // configure the bag to an appropriate initial bag state, we would not want to load the page with expanded unless the URL contains the hash bag below
          bagState = (bagState === null || bagState === "" || bagState === "expanded") ? "closed" : bagState;
          // remove any previous bag state classes and add the new bag state
          bagBar.removeClass("closed condensed expanded").addClass(bagState);
          // store the bag state for future calls
          setBagState(bagState);

          if (!emptyBag) {
            drawBagBarItemSummary();
          }

          if (window.location.hash == "#bag") {
            bagBar.triggerHandler("expandBag");
          }
        }

        bagBar.triggerHandler("initBagComplete");
      }
    });

    doc.on("redrawBag", function( evt, bagData ) {
      bagBarData = bagData;
      discountData = bagData.discountCodes.htmlFragment;

      var emptyBag = !!!bagData.orderSummary.bagCount;

      if (emptyBag) {
        bagBar.addClass("emptyBag");
        //Remove ShopRunner Messaging if no items in bag
        bagBar.find(".srWrapper").empty();
      } else {
        bagBar.removeClass("emptyBag");
      }

      drawBagBarItemSummary();
      drawBagOrderSummaryBody();
      drawBagHeader();
      drawReviewBagItems();
      drawReviewOrderSummaryBody();
      drawDiscountCodesArea();
      drawCartBanner();

      if (bagBar.data("currentState") == 'expanded') {
        cartTag();
      }

      asap("shoprunner").then(function() {
      if (!emptyBag && window.sr_$ != null) {
        //Refresh ShopRunner Messaging
        sr_refreshMessages();
      }
      });

      bagBar.triggerHandler("redrawBagComplete");
    });

    // DRAWING FUNCTIONS
    bagBar.on("bagBarItemSummaryDrawComplete", function( evt, data ) {
      var bagItemSet = $(".bagItemSet"),
      bagItemClip = $(".bagItemClip");

      bagItemSet.css("right", "0");
      checkCarousel();
      bagItemSet.find(".bagItem").each(function() {
        var bagItem = $(this),
        bagItemLinkId = bagItem.find(".bagItemLink").attr("id"),
        error = false,
        tipType = ".bagItemRolloverTip",
        tooltip;

        if (bagItem.find('.gwpItem').length === 0) {
          if (bagItem.hasClass("invError")) {
            error = true;
            tipType = ".bagItemErrorTip";
          }
          tooltip = bagItem.find(tipType);
          if (tooltip.length > 0) {
            bagBarTips.create("#" + bagItemLinkId, error);
            $("#bagBarTip_" + bagItemLinkId).empty().append(tooltip.detach());
          }
        }
      });
    });

    // ERROR REPORTING
    doc.on("checkBagErrors", function( evt ) {
      if (bagBarData.errors.errorList.length > 0) {
        bagBarValidator.report(bagBarData.errors);
      }
    });

    // DELEGATE ACTIONS (off, on)
    doc.off("click.remove").on("click.remove", ".js_removeItem, .js_resolveBagError", function( evt ) {
      evt.preventDefault();
      if (!bagBar.data("drawing")) {
        var action = "",
          comId;

        // TODO: make this less relient on hard-coded values, but maybe go off selector
        if ($(this).hasClass("removeItem")) {
          action = "removeItem";
        }
        else if ($(this).hasClass("resolveBag")) {
          action = "resolveBag";
        }

        if (action.length > 0) {
          comId = $(this).tmplItem().data.commerceId || $(this).data("cid");

          if (comId.length > 0) {
            removeResolve(comId, action);
          }
        }
      }
    });

    asap('framework', 'setup_fav_user').then(function(results) {
      var callLaunchFavModal = function( el ){
        //using attr fn instead of data fn because jQuery is silly and removes leading zeros.
        var sku = $(el).attr("data-sku").replace(/\D+/, ""),
            quantity = $(el).data("qty"),
            //using attr fn instead of data fn because jQuery is silly and removes leading zeros.
            comId = $(el).attr("data-cid");

        if (!bagBar.data("drawing")) {
          AEHelper.launch_fav_modal(sku, quantity, comId, "bagbar");
        }
      };

      var checkUserStatus = function( evt ){
        evt.preventDefault();
        results.setup_fav_user(callLaunchFavModal, this);
      };

      doc.off("click.move").on("click.move", ".js_moveItem", checkUserStatus);
    });

    doc.on("click", ".js_checkoutLink", function( evt ){
      evt.preventDefault();

      var opts, closeCb, source;

      if ($(this).hasClass("confirmation_checkout_link")) {
        source = "confirmation";
        closeCb = function () {

        };
      }
      opts = {
        'modal_url': '/' + jsContextRoot + '/modals/checkout_login.jsp',
        'page_title': 'Checkout',
        'show_facebook_option': false,
        'modal_class': 'checkout_login_modal',
        'modal_width': 681,
        'closeCb': closeCb
      };

      AEFB.loadSecureLoginModal(opts);

      sendCartLink(source);
    });

    bagBar.find(".orderSummary").on("click", ".js_enterCode", function( evt ) {
      evt.preventDefault();
      if (!bagBar.data("drawing")) {
        discountModal();
      }
    });

    // INIT
    bagBar.triggerHandler("initBag", bagBar_jsonData);
  }
});
