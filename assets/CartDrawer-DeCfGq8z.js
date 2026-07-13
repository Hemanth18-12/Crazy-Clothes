const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index.esm-DAkVgagw.js","assets/jsx-runtime-CdD58A1P.js","assets/config-DlcurdR8.js"])))=>i.map(i=>d[i]);
import{c as e,d as t,m as n,t as r,u as i}from"./jsx-runtime-CdD58A1P.js";import{a,o,s}from"./index-B-Hlw85A.js";var c=n(t(),1);function l(){let e=()=>`CC-${Date.now()}-${Math.floor(1e3+Math.random()*9e3)}`,t=(e,t,n)=>{let r=(s.whatsappNumber||`919505700178`).replace(/[^0-9]/g,``),i=new Date().toLocaleDateString(`en-IN`,{day:`2-digit`,month:`2-digit`,year:`numeric`,hour:`2-digit`,minute:`2-digit`,hour12:!0}),a=e.cloudinaryUrl?e.cloudinaryUrl:`No custom design`,o=`🛍️ *NEW ORDER — ${s.storeName}*
━━━━━━━━━━━━━━━━━━━━━━━━━
*Order ID   :* #${t}
*Date       :* ${i}

👕 *PRODUCT DETAILS*
*T-Shirt    :* ${e.productName||e.color+` T-Shirt`}
*Color      :* ${e.color?e.color.charAt(0).toUpperCase()+e.color.slice(1):``}
*Size       :* ${e.size}
*Quantity   :* ${e.quantity}
*Price      :* ${n}
*Custom Design :* ${a}

👤 *CUSTOMER DETAILS*
*Name       :* ${e.customerName}
*Email      :* ${e.customerEmail||`Not provided`}
*Phone      :* ${e.customerPhone}
*Address    :* ${e.customerAddress}

📝 *Notes:* ${e.specialInstructions||`None`}
━━━━━━━━━━━━━━━━━━━━━━━━━`,c=`https://wa.me/${r}?text=${encodeURIComponent(o)}`;window.open(c,`_blank`)},n=(e,t,n)=>{let r=(e.customerPhone||``).replace(/[^0-9]/g,``);if(!r)return;let i=`Hey ${e.customerName}! 👋
Your order has been placed with *Crazy Cloths!* 🎉

*Order ID   :* #${t}
*Product    :* ${e.productName||e.color+` T-Shirt`}
*Size       :* ${e.size}
*Color      :* ${e.color?e.color.charAt(0).toUpperCase()+e.color.slice(1):``}
*Total      :* ${n}

We'll confirm and dispatch within *24 hours*.
Questions? Reply to this chat anytime.

— Team Crazy Cloths 🖤`,a=`https://wa.me/${r}?text=${encodeURIComponent(i)}`;window.open(a,`_blank`)};return{generateOrderId:e,sendOwnerNotification:t,sendCustomerNotification:n,sendOrderNotification:(e,r,i)=>{t(e,r,i),setTimeout(()=>{n(e,r,i)},400)}}}var u=r();function d(){let{items:t,removeItem:n,updateQuantity:r,subtotal:d,isOpen:f,closeCart:p,clearCart:m}=a(),{currentUser:h}=o(),g=e(),{generateOrderId:_}=l(),[v,y]=(0,c.useState)(``),[b,x]=(0,c.useState)(``),[S,C]=(0,c.useState)(``),[w,T]=(0,c.useState)(``),[E,D]=(0,c.useState)(``),[O,k]=(0,c.useState)({}),[A,j]=(0,c.useState)(!1);if((0,c.useEffect)(()=>{h&&(y(h.displayName||``),x(h.email||``),(async()=>{try{let{doc:e,getDoc:t}=await i(async()=>{let{doc:e,getDoc:t}=await import(`./index.esm-DAkVgagw.js`).then(e=>e.t);return{doc:e,getDoc:t}},__vite__mapDeps([0,1])),{db:n}=await i(async()=>{let{db:e}=await import(`./config-DlcurdR8.js`).then(e=>e.n);return{db:e}},__vite__mapDeps([2,1,0])),r=await t(e(n,`users`,h.uid));if(r.exists()){let e=r.data();e.name&&y(e.name),e.phone&&C(e.phone),e.address&&T(e.address)}}catch(e){console.error(`Error prefilling cart details from profile:`,e)}})())},[h]),!f)return null;let M=()=>{let e={};return v.trim()||(e.name=`Full Name is required.`),S.trim()||(e.phone=`WhatsApp Number is required.`),w.trim()||(e.address=`Delivery Address is required.`),k(e),Object.keys(e).length===0};return(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(`div`,{style:{position:`fixed`,inset:0,background:`rgba(0, 0, 0, 0.75)`,backdropFilter:`blur(8px)`,zIndex:9999,opacity:1,transition:`opacity 0.3s ease`},onClick:p}),(0,u.jsxs)(`div`,{style:{position:`fixed`,top:0,right:0,bottom:0,width:`100%`,maxWidth:`480px`,background:`var(--color-surface)`,borderLeft:`1px solid var(--color-border)`,zIndex:1e4,display:`flex`,flexDirection:`column`,boxShadow:`-8px 0 24px rgba(0, 0, 0, 0.4)`,overflowY:`auto`},children:[(0,u.jsxs)(`div`,{style:{padding:`1.5rem`,borderBottom:`1px solid var(--color-border)`,display:`flex`,alignItems:`center`,justifyContent:`space-between`},children:[(0,u.jsx)(`h2`,{style:{fontFamily:`var(--font-display)`,fontSize:`1.8rem`,textTransform:`uppercase`,margin:0},children:`Your Cart`}),(0,u.jsx)(`button`,{onClick:p,style:{background:`none`,border:`none`,color:`var(--color-text-secondary)`,fontSize:`2rem`,cursor:`pointer`,lineHeight:1},children:`×`})]}),(0,u.jsx)(`div`,{style:{flex:1,padding:`1.5rem`,display:`flex`,flexDirection:`column`,gap:`1.5rem`},children:t.length===0?(0,u.jsxs)(`div`,{style:{textAlign:`center`,padding:`4rem 1rem`,margin:`auto`},children:[(0,u.jsx)(`h3`,{style:{fontFamily:`var(--font-display)`,fontSize:`1.5rem`,color:`var(--color-text-secondary)`,marginBottom:`1rem`},children:`Your cart is empty`}),(0,u.jsx)(`button`,{onClick:p,className:`btn btn-accent`,style:{padding:`0.8rem 2rem`},children:`Browse Collection`})]}):(0,u.jsxs)(u.Fragment,{children:[(0,u.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`1rem`},children:t.map((e,t)=>(0,u.jsxs)(`div`,{style:{display:`flex`,gap:`1rem`,alignItems:`center`,background:`var(--color-surface-2)`,padding:`1rem`,borderRadius:`8px`,border:`1px solid var(--color-border)`},children:[(0,u.jsx)(`img`,{src:e.cloudinaryUrl||e.imageUrl||`/assets/images/white-t-shirt.png`,alt:e.name,style:{width:`60px`,height:`60px`,borderRadius:`4px`,objectFit:`cover`,background:`var(--color-bg-2)`,border:`1px solid var(--color-border)`}}),(0,u.jsxs)(`div`,{style:{flex:1},children:[(0,u.jsx)(`h4`,{style:{margin:`0 0 0.25rem 0`,fontSize:`1rem`,textTransform:`uppercase`},children:e.name}),(0,u.jsxs)(`p`,{style:{margin:0,fontSize:`0.8rem`,color:`var(--color-text-secondary)`,fontFamily:`var(--font-mono)`},children:[`Size: `,e.size,` · Color: `,e.color]}),(0,u.jsxs)(`p`,{style:{margin:`0.25rem 0 0 0`,fontWeight:`bold`,color:`var(--color-accent)`},children:[`₹`,e.price*e.quantity]})]}),(0,u.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,alignItems:`flex-end`,gap:`0.5rem`},children:[(0,u.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,border:`1px solid var(--color-border)`,borderRadius:`4px`},children:[(0,u.jsx)(`button`,{onClick:()=>r(e.id,e.color,e.size,e.quantity-1),style:{background:`none`,border:`none`,color:`var(--color-text-primary)`,padding:`0.25rem 0.5rem`,cursor:`pointer`},children:`-`}),(0,u.jsx)(`span`,{style:{padding:`0 0.5rem`,fontFamily:`var(--font-mono)`},children:e.quantity}),(0,u.jsx)(`button`,{onClick:()=>r(e.id,e.color,e.size,e.quantity+1),style:{background:`none`,border:`none`,color:`var(--color-text-primary)`,padding:`0.25rem 0.5rem`,cursor:`pointer`},children:`+`})]}),(0,u.jsx)(`button`,{onClick:()=>n(e.id,e.color,e.size),style:{background:`none`,border:`none`,color:`var(--color-accent)`,fontSize:`0.75rem`,cursor:`pointer`,textDecoration:`underline`},children:`Remove`})]})]},`${e.id}-${e.color}-${e.size}-${t}`))}),(0,u.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`,borderTop:`1px solid var(--color-border)`,paddingTop:`1rem`,fontFamily:`var(--font-display)`},children:[(0,u.jsx)(`span`,{style:{fontSize:`1.2rem`},children:`Subtotal`}),(0,u.jsxs)(`span`,{style:{fontSize:`1.5rem`,color:`var(--color-accent)`},children:[`₹`,d]})]}),(0,u.jsxs)(`form`,{onSubmit:async e=>{if(e.preventDefault(),M()){if(!h){sessionStorage.setItem(`cc_redirect_after_login`,window.location.pathname+window.location.search),p(),g(`/login`);return}j(!0);try{let e=_(),n=new Date().toLocaleDateString(`en-IN`,{day:`2-digit`,month:`2-digit`,year:`numeric`,hour:`2-digit`,minute:`2-digit`,hour12:!0}),r=``;t.forEach((e,t)=>{let n=e.cloudinaryUrl||`No custom design`;r+=`
${t+1}. *${e.name}*
   *Color      :* ${e.color?e.color.charAt(0).toUpperCase()+e.color.slice(1):``}
   *Size       :* ${e.size||`Free Size`}
   *Quantity   :* ${e.quantity}
   *Price      :* ₹${e.price*e.quantity}
   *Design     :* ${n}
`});let a=`₹${d}`,o=`🛍️ *NEW CART ORDER — ${s.storeName}*
━━━━━━━━━━━━━━━━━━━━━━━━━
*Order ID   :* #${e}
*Date       :* ${n}

👕 *CART ITEMS*${r}
━━━━━━━━━━━━━━━━━━━━━━━━━
*Total Amount :* ${a}

👤 *CUSTOMER DETAILS*
*Name       :* ${v}
*Email      :* ${b||`Not provided`}
*Phone      :* ${S}
*Address    :* ${w}

📝 *Notes:* ${E||`None`}
━━━━━━━━━━━━━━━━━━━━━━━━━`,c=`Hey ${v}! 👋
Your cart order of ${t.length} items has been placed with *Crazy Cloths!* 🎉

*Order ID   :* #${e}
*Total      :* ${a}

We'll confirm details and dispatch within *24 hours*.
Questions? Reply to this chat anytime.

— Team Crazy Cloths 🖤`,l=`https://wa.me/${(s.whatsappNumber||`919505700178`).replace(/[^0-9]/g,``)}?text=${encodeURIComponent(o)}`,u=S.replace(/[^0-9]/g,``),f=`https://wa.me/${u}?text=${encodeURIComponent(c)}`;if(s.firebaseEnabled){let n=await i(()=>import(`./config-DlcurdR8.js`).then(e=>e.n),__vite__mapDeps([2,1,0])),{collection:r,addDoc:a}=await i(async()=>{let{collection:e,addDoc:t}=await import(`./index.esm-DAkVgagw.js`).then(e=>e.t);return{collection:e,addDoc:t}},__vite__mapDeps([0,1]));await a(r(n.db,`orders`),{orderId:e,items:t.map(e=>({id:e.id,name:e.name,price:e.price,color:e.color,size:e.size,quantity:e.quantity,cloudinaryUrl:e.cloudinaryUrl||null})),price:d,customerName:v,customerEmail:b,customerPhone:S,customerAddress:w,specialInstructions:E,status:`Pending`,createdAt:new Date().toISOString()})}localStorage.setItem(`crazy_cloths_last_order`,JSON.stringify({orderId:e,total:a,productName:`${t.length} Items`,color:t[0]?.color,size:t[0]?.size,quantity:t.reduce((e,t)=>e+t.quantity,0)})),window.open(l,`_blank`),setTimeout(()=>{u&&window.open(f,`_blank`)},400),m(),p(),j(!1),g(`/success`)}catch(e){console.error(`Checkout failed:`,e),j(!1)}}},style:{display:`flex`,flexDirection:`column`,gap:`1rem`,borderTop:`1px solid var(--color-border)`,paddingTop:`1.5rem`},children:[(0,u.jsx)(`h3`,{style:{margin:`0 0 0.5rem 0`,fontFamily:`var(--font-display)`,fontSize:`1.2rem`,textTransform:`uppercase`},children:`Delivery Details`}),(0,u.jsxs)(`div`,{className:`form-group`,children:[(0,u.jsx)(`input`,{type:`text`,className:`form-input ${O.name?`input-invalid`:``}`,placeholder:` `,value:v,onChange:e=>{y(e.target.value),k(e=>({...e,name:null}))}}),(0,u.jsx)(`label`,{className:`form-label`,children:`Full Name *`}),O.name&&(0,u.jsx)(`div`,{className:`form-input-error`,style:{display:`block`},children:O.name})]}),(0,u.jsxs)(`div`,{className:`form-group`,children:[(0,u.jsx)(`input`,{type:`email`,className:`form-input`,placeholder:` `,value:b,onChange:e=>x(e.target.value)}),(0,u.jsx)(`label`,{className:`form-label`,children:`Email Address`})]}),(0,u.jsxs)(`div`,{className:`form-group`,children:[(0,u.jsx)(`input`,{type:`tel`,className:`form-input ${O.phone?`input-invalid`:``}`,placeholder:` `,value:S,onChange:e=>{C(e.target.value),k(e=>({...e,phone:null}))}}),(0,u.jsx)(`label`,{className:`form-label`,children:`WhatsApp Number *`}),O.phone&&(0,u.jsx)(`div`,{className:`form-input-error`,style:{display:`block`},children:O.phone})]}),(0,u.jsxs)(`div`,{className:`form-group`,children:[(0,u.jsx)(`textarea`,{className:`form-input ${O.address?`input-invalid`:``}`,rows:`2`,style:{resize:`vertical`},placeholder:` `,value:w,onChange:e=>{T(e.target.value),k(e=>({...e,address:null}))}}),(0,u.jsx)(`label`,{className:`form-label`,children:`Delivery Address *`}),O.address&&(0,u.jsx)(`div`,{className:`form-input-error`,style:{display:`block`},children:O.address})]}),(0,u.jsxs)(`div`,{className:`form-group`,children:[(0,u.jsx)(`textarea`,{className:`form-input`,rows:`2`,style:{resize:`vertical`},placeholder:` `,value:E,onChange:e=>D(e.target.value)}),(0,u.jsx)(`label`,{className:`form-label`,children:`Special Instructions (Optional)`})]}),(0,u.jsx)(`button`,{type:`submit`,disabled:A,className:`btn btn-accent btn-premium`,style:{width:`100%`,marginTop:`1rem`},children:A?`Processing...`:`Place Order via WhatsApp`})]})]})})]})]})}export{l as n,d as t};