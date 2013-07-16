/**************** TEMPLATES ****************/
$.template("bagItem",
  "{{html $item.check_flag(flag, commerceId)}}" +
  "{{if !isHidden}}" +
  "<span class='bagItem{{if inventoryMessage.message.length > 0}} invError{{/if}}'>" +
    "{{if isGWP}}" +
      "<span class='bagItemLink gwpItem' id='bagItem_{{= commerceId}}'>" +
    "{{else isGiftCard}}" +
      "<span class='bagItemLink giftCardItem' id='bagItem_{{= commerceId}}'>" +
    "{{else inventoryMessage.message.length > 0}}" +
      "<span class='bagItemLink' id='bagItem_{{= commerceId}}'>" +
    "{{else}}" +
      "<a class='{{if inventoryMessage.message.length == 0}}editItem js_qvLink{{/if}} bagItemLink' href='{{= editURL}}' id='bagItem_{{= commerceId}}'>" +
    "{{/if}}" +
      "<span class='image'>" +
        "<img src='{{= imageURL}}' alt='{{= name}}'/>" +
        "<span class='quantity {{html $item.qtyCheck(quantity)}}'>x{{= quantity}}</span>" +
      "</span>" +
      "{{if isGWP || discountedPrice == 0}}" +
        "<span class='price'>Free</span>" +
      "{{else}}" +
        "<span class='price'>{{if (orderDiscounted)}}{{html $.toPrice(salePrice, {useSpans: true})}}{{else}}{{html $.toPrice(listPrice, {useSpans: true})}}{{/if}}</span>" +
      "{{/if}}" +
    "{{if isGWP || isGiftCard || inventoryMessage.message.length > 0}}" +
      "</span>" +
    "{{else}}" +
      "</a>" +
    "{{/if}}" +
    "{{if inventoryMessage.message.length > 0}}" +
      "{{tmpl 'bagItemErrorTip'}}" +
    "{{else !isGWP}}" +
      "{{tmpl 'bagItemRolloverTip'}}" +
    "{{/if}}" +
  "</span>" +
  "{{/if}}"
);
$.template("bagItemRolloverTip",
  "<div class='bagItemRolloverTip {{if isGiftCard}}gc_tip{{/if}}' id='bagItemRollover_{{= commerceId}}'>" +
    "<span class='name info'>{{= name}}</span>" +
    "{{if isGiftCard}}" +
      "<span class='size info toField'><span>To: {{= (null != messageTo && messageTo.length > 0) ? messageTo : '-' }}</span></span>" +
    "{{/if}}" +
    "{{if !isGWP}}" +
      "<span class='size info'>Size: {{= $item.parent.toSizeLabel(sizeName1, sizeName2)}}</span>" +
    "{{/if}}" +
    "{{if !isGiftCard && !isGWP}}" +
      "<a class='sm_bttn editItem js_qvLink' href='{{= editURL}}'>Edit</a>" +
    "{{/if}}" +
    "{{if !isGWP}}" +
      "<span class='sm_bttn removeItem js_removeItem'>Remove</span>" +
    "{{/if}}" +
    "{{if !isGiftCard && !isFactory && !isGWP}}" +
      "<span data-cid='{{= commerceId}}' data-sku='{{= skuId}}' data-qty='{{= quantity}}' class='js_favorites moveItem js_moveItem js_requires_login'>Move to Favorites</span>" +
    "{{/if}}" +
  "</div>"
);
$.template("bagItemErrorTip",
  "<div class='bagItemErrorTip' id='bagItemRollover_{{= commerceId}}'>" +
    "<span class='errorShout'>!</span>{{= inventoryMessage.message}}<span class='errorAction resolveBag js_resolveBagError'>{{= inventoryMessage.actionPrompt}}</span>" +
  "</div>"
);
$.template("reviewBagItems",
  "{{html $item.check_flag(flag, commerceId)}}" +
  "{{if !isHidden}}" +
  "<tr class='bagItemRow_{{= ctxRoot}}'>" +
    "<td class='bagItemColItems bagItemColImage'>" +
      "<div><span class='itemBrand'>{{= (ctxRoot == 'factory') ? 'AEO Factory' : (brandName == 'AEO') ? 'AE' : brandName }}</span></div>" +
      "{{if isGWP || isGiftCard}}" +
        "<img src='{{= imageURL}}' alt='{{= name}}' />" +
      "{{else}}" +
        "<a class='js_qvLink' href='{{= editURL}}'>" +
          "<img src='{{= imageURL}}' alt='{{= name}}' />" +
        "</a>" +
      "{{/if}}" +
    "</td>" +
    "<td class='bagItemColItems bagItemColInfo'>" +
      "{{if isGWP || isGiftCard}}" +
        "{{= name}}" +
      "{{else}}" +
        "<a class='js_qvLink' href='{{= editURL}}'>" +
          "{{= name}}" +
        "</a>" +
      "{{/if}}" +
      "<br />" +
      "{{if isGiftCard}}" +
        "<span class='gc_messageTo'>To: {{= (null != messageTo && messageTo.length > 0) ? messageTo : '-' }}</span>" +
        "{{if (null != email && email.length > 0)}}<br /><span class='gc_email'>Email: {{= email}}</span>{{/if}}" +
        "{{if (phoneNumber != phoneNumber && phoneNumber.length > 0)}}<br /><span class='gc_phone'>Phone: {{= phoneNumber}}</span>{{/if}}" +
      "{{else}}" +
        "Style: {{= $item.stripAlphas(classId)}}-{{= $item.stripAlphas(styleId)}}" +
      "{{/if}}" +
      "{{if !shopRunnerAvailable}}" +
        "<br/><div name='sr_catalogProductGridDiv' class='sr_catalogProductGridDiv'></div>" +
      "{{/if}}" +
    "</td>" +
    "<td class='bagItemColColor'>" +
      "{{= color}}" +
    "</td>" +
    "<td class='bagItemColSize'>" +
      "{{= $item.toSizeLabel(sizeName1, sizeName2)}}" +
    "</td>" +
    "<td class='bagItemColQty'>" +
      "{{= quantity}}" +
    "</td>" +
    "<td class='bagItemColPrice'>" +
      "{{if isGWP || listPrice == '$0.00'}}" +
        "FREE" +
      "{{else}}" +
        "{{= $.toPrice(listPrice)}}" +
      "{{/if}}" +
    "</td>" +
    "{{if (orderDiscounted)}}" +
      "<td class='bagItemColDiscountedPrice'>" +
        "{{if discountedPrice == 0}}" +
          "FREE" +
        "{{else}}" +
          "{{= $.toPrice(salePrice)}}" +
        "{{/if}}" +
      "</td>" +
    "{{/if}}" +
    "<td class='bagItemColActions bagItemActions'>" +
      "{{if !isGiftCard && !isGWP}}" +
        "<a class='sm_bttn editItem js_qvLink' href='{{= editURL}}'>Edit</a>" +
      "{{/if}}" +
      "{{if !isGWP}}" +
        "<span class='sm_bttn removeItem js_removeItem'>Remove</span>" +
      "{{/if}}" +
      "{{if !isGiftCard && !isFactory && !isGWP}}" +
        "<span data-cid='{{= commerceId}}' data-sku='{{= skuId}}' data-qty='{{= quantity}}' class='sm_bttn js_moveItem js_requires_login'>Move to Favorites</span>" +
      "{{/if}}" +
    "</td>" +
  "</tr>" +
  "{{/if}}"
);
